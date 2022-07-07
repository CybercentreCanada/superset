# Licensed to the Apache Software Foundation (ASF) under one
# or more contributor license agreements.  See the NOTICE file
# distributed with this work for additional information
# regarding copyright ownership.  The ASF licenses this file
# to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance
# with the License.  You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing,
# software distributed under the License is distributed on an
# "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
# KIND, either express or implied.  See the License for the
# specific language governing permissions and limitations
# under the License.
from flask import g, request, Response
from flask_appbuilder.api import BaseApi, expose, protect, safe
from flask_jwt_extended.exceptions import NoAuthorizationError
from marshmallow import fields, Schema, ValidationError
from sqlalchemy.exc import SQLAlchemyError

from superset import event_logger
from superset.extensions import db
from superset.models.tour import UserTour
from superset.views.base_api import (
    requires_json,
    statsd_metrics,
)

from .schemas import UserResponseSchema

user_response_schema = UserResponseSchema()


class CurrentUserRestApi(BaseApi):
    """An api to get information about the current user"""

    resource_name = "me"
    openapi_spec_tag = "Current User"
    openapi_spec_component_schemas = (UserResponseSchema,)

    @expose("/", methods=["GET"])
    @safe
    def get_me(self) -> Response:
        """Get the user object corresponding to the agent making the request
        ---
        get:
          description: >-
            Returns the user object corresponding to the agent making the request,
            or returns a 401 error if the user is unauthenticated.
          responses:
            200:
              description: The current user
              content:
                application/json:
                  schema:
                    type: object
                    properties:
                      result:
                        $ref: '#/components/schemas/UserResponseSchema'
            401:
              $ref: '#/components/responses/401'
        """
        try:
            if g.user is None or g.user.is_anonymous:
                return self.response_401()
        except NoAuthorizationError:
            return self.response_401()

        return self.response(200, result=user_response_schema.dump(g.user))


class TourSchema(Schema):
    last_tour = fields.Dict(allow_none=True)


class TourRestApi(BaseApi):
    """An api to get information about the current user's tour status"""

    resource_name = "tour"
    allow_browser_login = True
    openapi_spec_tag = "Tour"

    openapi_spec_component_schemas = (TourSchema,)

    @expose("/", methods=["GET"])
    @protect()
    @safe
    def get(self) -> Response:
        """Gets Tour Data
        ---
        get:
          description: >-
            Get tour data
          responses:
            200:
              content:
                application/json:
                  schema:
                    type: object
                    properties:
                      result:
                        $ref: '#/components/schemas/TourSchema'
            400:
              $ref: '#/components/responses/400'
            401:
              $ref: '#/components/responses/401'
            422:
              $ref: '#/components/responses/422'
            500:
              $ref: '#/components/responses/500'
        """
        attrib = (
            db.session.query(UserTour)
            .filter(UserTour.user_id == g.user.id)
            .one_or_none()
        )
        return self.response(200, result={'last_tour': attrib.last_tour})

    @expose("/", methods=["PUT"])
    @protect()
    @safe
    @requires_json
    def put(self) -> Response:
        """Edits Tour Data
        ---
        put:
          description: >-
            Edit tour data
          requestBody:
            description: Tour schema
            required: true
            content:
              application/json:
                schema:
                  $ref: '#/components/schemas/TourSchema'
          responses:
            200:
              description: Tour data edited
              content:
                application/json:
                  schema:
                    type: object
                    properties:
                      result:
                        $ref: '#/components/schemas/TourSchema'
            400:
              $ref: '#/components/responses/400'
            401:
              $ref: '#/components/responses/401'
            422:
              $ref: '#/components/responses/422'
            500:
              $ref: '#/components/responses/500'
        """
        try:
            item = TourSchema().load(request.json)
        # This validates custom Schema with custom validations
        except ValidationError as error:
            return self.response_400(message=error.messages)

        attrib = (
            db.session.query(UserTour)
            .filter(UserTour.user_id == g.user.id)
            .one_or_none()
        )
        try:
            if attrib == None:
                a = UserTour()
                setattr(a, "user_id", g.user.id)
                setattr(a, "last_tour", item.get("last_tour"))
                db.session.add(a)
            else:
                setattr(attrib, "last_tour", item.get("last_tour"))
                db.session.merge(attrib)
            db.session.commit()
        except SQLAlchemyError as ex:
            db.session.rollback()
            return self.response_422(message=str(ex))

        return self.response(200, result=item)
