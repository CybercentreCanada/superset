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

import requests  # pip package requests
from flask import current_app, current_app as app, request, Response
from flask.wrappers import Response
from flask_appbuilder.api import BaseApi, expose, permission_name, protect, rison, safe
from flask_babel import lazy_gettext as _
from flask_login import current_user

from superset.advanced_data_type.schemas import (
    advanced_data_type_convert_schema,
    AdvancedDataTypeSchema,
)
from superset.advanced_data_type.types import AdvancedDataTypeResponse
from superset.constants import RouteMethod
from superset.extensions import event_logger, security_manager
from superset.fission.utils import retain_eml_to_alfred

logger = logging.getLogger(__name__)

config = app.config
API_HOST = os.environ.get("FISSION_PROXY_URL")


class FissionRestApi(BaseApi):
    """
    Fission rest endpoint to proxy hogwarts fission
    """

    allow_browser_login = True
    include_route_methods = {RouteMethod.GET, RouteMethod.POST}
    resource_name = "fission"
    class_permission_name = "AdvancedDataType"

    openapi_spec_tag = "Fission"
    openapi_spec_component_schemas = (AdvancedDataTypeSchema,)

    @protect()
    @safe
    @expose("/<path>", methods=["GET"])
    @permission_name("read")
    @event_logger.log_this_with_context(
        action=lambda self, *args, **kwargs: f"{self.__class__.__name__}.get",
        log_to_statsd=False,  # pylint: disable-arguments-renamed
    )
    def get(self, path, **kwargs: Any) -> Response:
        """Proxy to hogwarts fission"""
        user = current_user
        token = security_manager.get_on_behalf_of_access_token_with_cache(
            user.username,
            os.environ.get("FISSION_SCOPE"),
            "superset",
            cache_result=True,
        )
        alfred_instance = os.environ.get("ALFRED_ENV")
        if alfred_instance:
            request_url = request.url + f"&alfred_instance={alfred_instance}"
            logger.info(f"ALFRED_ENV: {request_url}")
        else:
            logger.info("ALFRED_ENV environment variable not set")

        logger.info("Args is %s", request.args)
        headers = {
            "Authorization": f"Bearer {token}",
            "X-Auth-Request-Access-Token": token,
        }

        url = request_url.replace(f"{request.host_url}api/v1/fission/", f"{API_HOST}/")
        res = requests.request(  # ref. https://stackoverflow.com/a/36601467/248616
            method=request.method,
            url=url,
            data=request.get_data(),
            allow_redirects=False,
            headers=headers,
            timeout=180,
        )
        try:
            result = res.json()
        except:
            result = str(res.text)
        return self.response(res.status_code, result=result)

    @protect()
    @safe
    @expose("/retain-eml-record", methods=["POST"])
    @permission_name("read")
    @event_logger.log_this_with_context(
        action=lambda self, *args, **kwargs: f"{self.__class__.__name__}.post",
        log_to_statsd=False,  # pylint: disable-arguments-renamed
    )
    def post(self, path, **kwargs: Any) -> Response:
        """Instead of proxying to fission, we are going to handle the request here"""
        request_payload = request.json
        if not request_payload:
            logger.info("no JSON payload in request")
            return self.response_400('no JSON payload in request')
        if 'email_ids' not in request_payload:
          return self.response_400('No field email_ids found in json body of request')
        alfred_env = os.environ.get("ALFRED_ENV")
        if not alfred_env:
            logger.info("ALFRED_ENV environment variable not set")
            return self.response_400('ALFRED_ENV environment variable not set')        
        logger.info("Payload is %s", request_payload)
        email_ids = request_payload['email_ids']
        dates = None
        if 'dates' in request_payload:
          dates = request_payload['dates']
        user = current_user
        token = security_manager.get_on_behalf_of_access_token_with_cache(
            user.username,
            os.environ.get("SUPERSET_SCOPE"),
            "superset",
            cache_result=True,
        )
        return retain_eml_to_alfred(email_ids, alfred_env, token, dates)
