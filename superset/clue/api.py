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
import requests

from flask import current_app as app, Response
from flask.wrappers import Response
from flask_appbuilder.api import BaseApi, expose, permission_name, protect, safe
from flask_babel import lazy_gettext as _
from flask_login import current_user

from superset.extensions import event_logger, security_manager
from superset.views.base_api import BaseSupersetApi

logger = logging.getLogger(__name__)

config = app.config

class ClueRestApi(BaseSupersetApi):
    """
    Rest API for getting EML previews/downloads
    """

    allow_browser_login = True
    resource_name = "clue"
    openapi_spec_tag = "Clue"

    @expose("/preview-eml/<path:eml_path>", methods=("GET",))
    @protect()
    @safe
    @permission_name("read")
    @event_logger.log_this_with_context(
        action=lambda self, *args, **kwargs: f"{self.__class__.__name__}.preview_eml",
        log_to_statsd=False,
    )
    def preview_eml(self, eml_path: str) -> Response:
        user = current_user
        token = security_manager.get_on_behalf_of_access_token_with_cache(
            user.username,
            config["CLUE_SCOPE"],
            "azure"
        )
        url = f'{config["CLUE_URL"]}api/v1/fetchers/email-preview/preview'
        headers = {
            "Authorization": f"Bearer {token}",
        }
        data = {
            "classification": "PROTECTED B",
            "type": "email_path",
            "value": eml_path
        }
        res = requests.post(url=url, headers=headers, json=data)
        res_json = res.json()
        api_status_code = res_json.get("api_status_code", 500)

        logger.warning("Response body: %s", res_json)

        if (api_status_code == 200):
            api_response = res_json.get("api_response", {})
            api_response_format = api_response.get("format", "error")
            if (api_response_format != "image"):
                return self.response_400(api_response.get("error", "Error fetching EML preview from Clue, response wasn't image type"))
            
            api_response_data = api_response["data"]
            image_data = api_response_data["image"]

            return self.response(200, result={'image': image_data})
        
        logger.error("Error fetching EML download from Clue: %s", res_json)

        return self.response_500("Error fetching EML preview from Clue")
    
    @expose("/download-eml/<path:eml_path>", methods=("GET",))
    @protect()
    @safe
    @permission_name("read")
    @event_logger.log_this_with_context(
        action=lambda self, *args, **kwargs: f"{self.__class__.__name__}.download_eml",
        log_to_statsd=False,
    )
    def download_eml(self, eml_path: str) -> Response:
        user = current_user
        token = security_manager.get_on_behalf_of_access_token_with_cache(
            user.username,
            config["CLUE_SCOPE"],
            "azure"
        )
        url =  f'{config["CLUE_URL"]}api/v1/fetchers/email-preview/download'
        headers = {
            "Authorization": f"Bearer {token}",
        }
        data = {
            "classification": "PROTECTED B",
            "type": "email_path",
            "value": eml_path
        }

        res = requests.post(url=url, headers=headers, json=data)
        res_json = res.json()
        api_status_code = res_json.get("api_status_code", 500)

        if (api_status_code == 200):
            api_response = res_json.get("api_response", {})
            api_response_format = api_response.get("format", "error")
            if (api_response_format != "file"):
                return self.response_400(api_response.get("error", "Error fetching EML download from Clue, response wasn't file type"))
            
            api_response_data = api_response["data"]
            file_type = api_response_data["mime_type"]
            file_data = api_response_data["data"]

            return self.response(200, result={'content': f"data:{file_type};base64,{file_data}"})
        
        logger.error("Error fetching EML download from Clue: %s", res_json)

        return self.response_500("Error fetching EML download from Clue")