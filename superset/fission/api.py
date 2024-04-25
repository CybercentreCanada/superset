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

import base64
import requests  # pip package requests
from flask import current_app as app, request, Response
from flask.wrappers import Response
from flask_appbuilder.api import BaseApi, expose, permission_name, protect, safe
from flask_babel import lazy_gettext as _
from flask_login import current_user

from superset.advanced_data_type.schemas import (
    AdvancedDataTypeSchema,
)
from superset.constants import RouteMethod
from superset.extensions import event_logger, security_manager

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

        logger.info("Args is %s", request.args)
        headers = {
            "Authorization": f"Bearer {token}",
            "X-Auth-Request-Access-Token": token,
        }

        url = request.url.replace(f"{request.host_url}api/v1/fission/", f"{API_HOST}/") 

        res = requests.request(  # ref. https://stackoverflow.com/a/36601467/248616
            method          = request.method,
            url             = url,
            data            = request.get_data(),
            allow_redirects = False,
            headers         = headers,
            timeout         = 180 # extending timeout for fission loading times
        )
        
        content_type = res.headers.get("Content-Type", "")

        # Handling binary data for non-JSON responses
        if content_type in ["application/octet-stream", "message/rfc822", "image/png"]:
            encoded_content = base64.b64encode(res.content).decode('utf-8')
            data_type = "image" if content_type == "image/png" else "content"
            result = {data_type: f'data:{content_type};base64,{encoded_content}'}
        else:
            # Attempt to return as JSON, fallback to plain text
            try:
                result = res.json()
            except:
                result = {'Error': str(res.text)}
                
        return self.response(res.status_code, result=result)
