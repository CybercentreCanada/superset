"""
API For Business Type REST requests
"""
from typing import Any
from flask.wrappers import Response
from flask_appbuilder.api import rison, expose
from flask_appbuilder.models.sqla.interface import SQLAInterface
from superset import app
from superset.extensions import event_logger
from superset.connectors.sqla.models import SqlaTable
from superset.views.base_api import BaseSupersetModelRestApi
from flask import session
import urllib
import json
import requests
import os 

from requests.structures import CaseInsensitiveDict

class ProxyRestAPI(BaseSupersetModelRestApi):
    """
    Placeholder until we work out everything this class is going to do.
    """
    datamodel = SQLAInterface(SqlaTable)

    include_route_methods = {"get"}
    resource_name = "proxy"

    openapi_spec_tag = "Proxy"

    @expose("/alfred/user_id/<string:id>", methods=["GET"])
    @event_logger.log_this_with_context(
        action=lambda self, *args, **kwargs: f"{self.__class__.__name__}.get",
        log_to_statsd=False, # pylint: disable-arguments-renamed
    )
    def get(self, id : str, **kwargs: Any) -> Response:


        alfred_client_id = os.getenv('ALFRED_CLIENT_ID') 
        alfred_token = ''

        client_id = os.getenv('SUPERSET_CLIENT_ID') 
        tenant_id = os.getenv('SUPERSET_TENANT_ID') 
        client_secret = os.getenv('SUPERSET_CLIENT_SECRET')  

        url = 'https://login.microsoftonline.com/{0}/oauth2/v2.0/token'.format(tenant_id)
        
        refresh_token = session['oauth_refresh']
        if refresh_token:
            refresh_params = {
                "client_id": client_id,
                "client_secret": urllib.parse.quote(client_secret),
                "grant_type": "refresh_token",
                "refresh_token": refresh_token
            }

            # URL encoding: client secret must be URL encoded, but grant_type and scope must not be encoded
            refresh_data = '&'.join(["{}={}".format(k, v) for k, v in refresh_params.items()])
            try:
                refresh_resp = requests.post(url, data = refresh_data)
            except Exception as e:
                print("Error obtaining fresh access token: %s" % e)

            refresh_resp_json = json.loads(refresh_resp.content.decode('utf8', 'replace'))
            current_access_token = refresh_resp_json['access_token']

            alfred_obo_params = {
                "client_id": client_id,
                "client_secret": client_secret,
                "grant_type": "urn:ietf:params:oauth:grant-type:jwt-bearer",
                "assertion": current_access_token,
                "requested_token_use": "on_behalf_of",
                "scope": '{0}/Alfred.ALL'.format(alfred_client_id)
            }

            alfred_obo_data = '&'.join(["{}={}".format(k, v) for k, v in alfred_obo_params.items()])

            try:
                alfred_obo_resp = requests.post(url, data = alfred_obo_data)
            except Exception as e:
                print("Error obtaining on-behalf-of Fission token: %s" % e)

            alfred_obo_resp_json = json.loads(alfred_obo_resp.content.decode('utf8', 'replace'))
            alfred_token = alfred_obo_resp_json["access_token"]

            headers = CaseInsensitiveDict()
            headers["Accept"] = "application/json"
            headers["Authorization"] = f"Bearer { alfred_token }"
            url = "https://alfred-tst.u.chimera.azure.cyber.gc.ca:9488/rest/search/cypher?expression=MATCH%20(email:EMAIL_ADDRESS)%20WHERE%20email.value%20in%20[%22" + id + "%22]%20return%20email.value,%20email.maliciousness,%20email.uri"
            alfred_resp = ""
            try:
                alfred_resp = requests.get(url, headers=headers)
            except Exception as e:
                print("Error obtaining on-behalf-of Fission token: %s" % e)
            refresh_resp_json = json.loads(alfred_resp.content.decode('utf8', 'replace'))
            print(refresh_resp_json)
        return self.response(200,payload=refresh_resp_json)