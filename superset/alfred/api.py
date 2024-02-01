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
import logging
import os
from typing import Any

from flask import current_app as app, request, Response
from flask.wrappers import Response
from flask_appbuilder.api import BaseApi, expose, permission_name, protect, safe
from flask_babel import lazy_gettext as _
from flask_login import current_user
from marshmallow import ValidationError


from superset.advanced_data_type.schemas import (
    AdvancedDataTypeSchema,
)
from superset.alfred.schemas import RetainToAlfredSchema
from superset.constants import RouteMethod
from superset.extensions import event_logger, security_manager
from superset.alfred.utils import retain_eml_to_alfred

logger = logging.getLogger(__name__)

config = app.config

class AlfredRestApi(BaseApi):
    """
    Rest API for creating alfred retentions
    """

    allow_browser_login = True
    include_route_methods = {RouteMethod.POST}
    resource_name = "alfred"
    class_permission_name = "AdvancedDataType"

    openapi_spec_tag = "Alfred"
    openapi_spec_component_schemas = (AdvancedDataTypeSchema,)
    
    add_model_schema = RetainToAlfredSchema()


    @protect()
    @safe
    @expose("/retain-eml-record", methods=["POST"])
    @permission_name("read")
    @event_logger.log_this_with_context(
        action=lambda self, *args, **kwargs: f"{self.__class__.__name__}.post",
        log_to_statsd=False,  # pylint: disable-arguments-renamed
    )
    def post(self, **kwargs: Any) -> Response:
        """
        Fetch the email metadata associated with the email IDs sent in the 
        request and send the data to alfred to create a staged retention

        Returns:
            Response: 
                200 Success, { result: "<alfred-url-for-staged-retention>"}
        """
        try:
            request_payload = self.add_model_schema.load(request.json)
        # This validates custom Schema with custom validations
        except ValidationError as error:
            return self.response_400(message=error.messages)

        if not request_payload:
            logger.error("no JSON payload in request")
            return self.response_400('No JSON payload in request')
        if 'email_ids' not in request_payload:
            return self.response_400('No field named "email_ids" found in the JSON body of the request')

        logger.info("Payload is %s", request_payload)
        email_ids = request_payload['email_ids']
        dates = None
        if 'dates' in request_payload:
            dates = request_payload['dates']

        alfred_env = os.environ.get("ALFRED_ENV")
        if not alfred_env:
            logger.error("ALFRED_ENV environment variable not set")
            return self.response_400('ALFRED_ENV environment variable not set')
        user = current_user
        token = security_manager.get_on_behalf_of_access_token_with_cache(
            user.username,
            os.environ.get("SUPERSET_SCOPE"),
            "superset",
            cache_result=True,
        )
        status, result = retain_eml_to_alfred(email_ids, alfred_env, token, dates)
        return self.response(status, result=result)
