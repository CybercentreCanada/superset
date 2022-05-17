"""
API For Alfred REST requests
"""
import json
import logging
import os
from typing import Any

import requests
from flask.wrappers import Response
from flask_appbuilder.api import expose
from flask_appbuilder.models.sqla.interface import SQLAInterface
from flask_login import current_user
from requests.structures import CaseInsensitiveDict

from superset import security_manager
from superset.connectors.sqla.models import SqlaTable
from superset.extensions import event_logger
from superset.views.base_api import BaseSupersetModelRestApi

logger = logging.getLogger(__name__)


class ProxyRestAPI(BaseSupersetModelRestApi):
    """
    Contains the functions which will act as the proxy to other applications,
    as well as the helper functions for dealing with caught exceptions
    """

    datamodel = SQLAInterface(SqlaTable)

    include_route_methods = {"get_userid", "get_ipstring"}
    resource_name = "proxy"

    openapi_spec_tag = "Proxy"

    def __init__(self):
        """
        This is the init function for the ProxyRestAPI class
        """
        super().__init__()
        self.user = current_user
        self.ASSEMBLY_LINE_URL = 'https://malware.cyber.gc.ca/search'

    def attach_url(
        self, response_code: int, app_url: str, err: bool, payload
    ) -> Response:
        """
        This is a function that will attach the app URL with the response that is
        being sent to the front-end (this will allow us to avoid hard coded URL's in
        both the back-end and the front-end)
        """
        prep_payload = {"data": payload, "url": app_url, "err": err}

        return self.response(response_code, payload=prep_payload)


    @expose("/assemblyline/ip_string/<string:ip_string>", methods=["GET"])
    @event_logger.log_this_with_context(
        action=lambda self, *args, **_kwargs: f"{self.__class__.__name__}.get",
        log_to_statsd=False,  # pylint: disable-arguments-renamed
    )
    def get_ipstring(self, ip_string: str, **_kwargs: Any) -> Response:
        """
        This function will send a request to Assembly Line to search
        if the passed in ip_string has been included in any reports/incidents

        call: /api/v4/search/result/?rows=100&deep_paging_id=*&query=result.sections.tags.network.static.ip:
        """
        resp = '{\n' \
            f'"num_incedents": 42,\n' \
            f'"ip_str": "{ip_string}"\n' \
            '}'
        print(resp)
        refresh_resp_json = json.loads(
            resp
        )
        print(refresh_resp_json)
        return self.attach_url(200, self.ASSEMBLY_LINE_URL, False, refresh_resp_json)
