"""
API For Alfred REST requests
"""
import json
import logging
import os
import pickle
import urllib
from typing import Any

import requests
from flask import session
from flask.wrappers import Response
from flask_appbuilder.api import expose, rison
from flask_appbuilder.models.sqla.interface import SQLAInterface
from flask_login import current_user
from requests.structures import CaseInsensitiveDict

from superset import app, security_manager
from superset.connectors.sqla.models import SqlaTable
from superset.extensions import event_logger
from superset.views.base_api import BaseSupersetModelRestApi

logger = logging.getLogger(__name__)


class ProxyRestAPI(BaseSupersetModelRestApi):
    """
    Contains the functions which will act as the proxy to the Alfred API
    """

    datamodel = SQLAInterface(SqlaTable)

    include_route_methods = {"get_userid", "get_ipstring"}
    resource_name = "proxy"

    openapi_spec_tag = "Proxy"

    ALFRED_SCOPE = "api://alfred.u.dev/Alfred.ALL"

    def error_obtaining_token(self, token_name: str, raised_exception: Exception) -> Response:
        """
        This is a function that returns an http response based on a passed in application name
        and exception that was caught when trying to get an OBO token for an application
        """
        logger.error("Error obtaining on-behalf-of %s token: %s", token_name, raised_exception)
        return self.response(
            400,
            payload=f"Error obtaining on-behalf-of {token_name} token: {raised_exception}"
            )

    def error_obtaining_response(self, token_name: str, raised_exception: Exception) -> Response:
        """
        This is a function that returns an http response based on a passed in application name
        and exception that was caught when trying to get a response from an application
        """
        logger.error("Error obtaining %s response: %s", token_name, raised_exception)
        return self.response(
            400,
            payload=f"Error obtaining {token_name} response: {raised_exception}"
            )


    @expose("/alfred/user_id/<string:user_id>", methods=["GET"])
    @event_logger.log_this_with_context(
        action=lambda self, *args, **kwargs: f"{self.__class__.__name__}.get",
        log_to_statsd=False,  # pylint: disable-arguments-renamed
    )
    def get_userid(self, user_id: str, **kwargs: Any) -> Response:
        """
        Placeholder until we work out everything this function is going to do.
        """

        try:
            alfred_token = security_manager.get_on_behalf_of_access_token(
                scope=self.ALFRED_SCOPE
            )
            if not alfred_token:
                raise Exception("Unable to fetch Alfred token")
        except requests.exceptions.HTTPError as err:
            return self.error_obtaining_token("Alfred", err)
        except Exception as err:
            return self.error_obtaining_token("Alfred", err)
        else:
            headers = CaseInsensitiveDict()
            headers["Accept"] = "application/json"
            headers["Authorization"] = f"Bearer { alfred_token }"
            url = (
                "https://alfred-tst.u.chimera.azure.cyber.gc.ca:9488/rest/search/cypher?expression=MATCH%20(email:EMAIL_ADDRESS)%20WHERE%20email.value%20in%20[%22"
                + user_id
                + "%22]%20return%20email.value,%20email.maliciousness,%20email.uri"
            )
            alfred_resp = ""

            try:
                alfred_resp = requests.get(url, headers=headers)
            except requests.exceptions.ConnectionError as err:
                return self.error_obtaining_response("Alfred", err)

            # refresh_resp_json = json.loads(alfred_resp.content.decode('utf8', 'replace'))
            print(alfred_resp)
            return self.response(200, payload=alfred_resp)

    @expose("/alfred/ip_string/<string:ip_string>", methods=["GET"])
    @event_logger.log_this_with_context(
        action=lambda self, *args, **kwargs: f"{self.__class__.__name__}.get",
        log_to_statsd=False,  # pylint: disable-arguments-renamed
    )
    def get_ipstring(self, ip_string: str, **kwargs: Any) -> Response:
        """
        Placeholder until we work out everything this function is going to do.
        """

        # alfred_client_id = os.getenv('ALFRED_CLIENT_ID')
        # alfred_token = ''

        # client_id = os.getenv('SUPERSET_CLIENT_ID')
        # tenant_id = os.getenv('SUPERSET_TENANT_ID')
        # client_secret = os.getenv('SUPERSET_CLIENT_SECRET')

        # url = 'https://login.microsoftonline.com/{0}/oauth2/v2.0/token'.format(tenant_id)
        # refresh_token = ""

        # with open('refresh_token.pkl', 'rb') as f:
        #     refresh_token = pickle.load(f)

        # if refresh_token:
        #     refresh_params = {
        #         "client_id": client_id,
        #         "client_secret": urllib.parse.quote(client_secret),
        #         "grant_type": "refresh_token",
        #         "refresh_token": refresh_token
        #     }

        #     # URL encoding: client secret must be URL encoded, but
        #     # grant_type and scope must not be encoded
        #     refresh_data = '&'.join(["{}={}".format(k, v) for k, v in refresh_params.items()])
        #     try:
        #         refresh_resp = requests.post(url, data = refresh_data)
        #     except Exception as e:
        #         print("Error obtaining fresh access token: %s" % e)

        #     refresh_resp_json = json.loads(refresh_resp.content.decode('utf8', 'replace'))
        #     current_access_token = refresh_resp_json['access_token']

        #     alfred_obo_params = {
        #         "client_id": client_id,
        #         "client_secret": client_secret,
        #         "grant_type": "urn:ietf:params:oauth:grant-type:jwt-bearer",
        #         "assertion": current_access_token,
        #         "requested_token_use": "on_behalf_of",
        #         "scope": '{0}/Alfred.ALL'.format(alfred_client_id)
        #     }

        #     alfred_obo_data = '&'.join(["{}={}".format(k, v) for k, v in alfred_obo_params.items()])

        #     try:
        #         alfred_obo_resp = requests.post(url, data = alfred_obo_data)
        #     except Exception as e:
        #         print("Error obtaining on-behalf-of Fission token: %s" % e)

        #     alfred_obo_resp_json = json.loads(alfred_obo_resp.content.decode('utf8', 'replace'))
        #     alfred_token = alfred_obo_resp_json["access_token"]

        #     headers = CaseInsensitiveDict()
        #     headers["Accept"] = "application/json"
        #     headers["Authorization"] = f"Bearer { alfred_token }"
        #     url = "https://alfred-tst.u.chimera.azure.cyber.gc.ca:9488/rest/search/cypher?expression=MATCH%20(ip%3AIP_ADDRESS)%20WHERE%20ip.value%20IN%20%5B%22" + ip_string + "%22%5D%20RETURN%20ip.value%2C%20ip.maliciousness%2C%20ip.creation_date%2C%20ip.created_by%2C%20ip.uri%2C%20ip.report_uri"
        #     alfred_resp = ""
        #     try:
        #         alfred_resp = requests.get(url, headers=headers)
        #     except Exception as e:
        #         print("Error obtaining on-behalf-of Fission token: %s" % e)
        #     refresh_resp_json = json.loads(alfred_resp.content.decode('utf8', 'replace'))
        #     print(refresh_resp_json)
        # return self.response(200,payload=refresh_resp_json)

        test_JSON = {"data": ["A", "B", ip_string]}
        return self.response(200, payload=test_JSON)
