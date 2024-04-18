from decimal import Decimal
from marshmallow.validate import ValidationError
import pandas as pd
import traceback
import jwt
import os
from superset.utils import core as utils
from superset.exceptions import SupersetException


from trino.dbapi import connect
from trino.auth import JWTAuthentication
from flask import request, make_response, current_app, current_app

from hogwarts.auth.vault.vault_client import VaultClient

# This will by default restrict this function to users with ALPR.
# You can customize this by providing an azure group ID to the wrapper.

import datetime

from trino.types import NamedRowTuple

from alfred_client import AlfredService
from alfred_client.instance import InstanceUtil
from alfred_client import RetentionInstance
from alfred_client.model.retention import DataSetMapper
from alfred_client.instance.AbstractInstance import AbstractInstance
from alfred_client.model.retention.DTOContractData import DataSetEntry

import logging
import os.path
from datetime import datetime
from datetime import timedelta
from typing import List, Optional, Union
import json
from numpy import datetime64, ndarray

JS_MAX_SAFE_INTEGER = 9007199254740991

JS_MIN_SAFE_INTEGER = -9007199254740991


logger = logging.getLogger(__name__)

# limit to 100 emls retained at a time
limit = 100

def validate_json(value: Union[bytes, bytearray, str]) -> None:
    try:
        utils.validate_json(value)
    except SupersetException as ex:
        raise ValidationError("JSON not valid") from ex

class TokenOAuthInstance(AbstractInstance):
    """
    Alfred Instance with OAuth with on-behalf-of authentication instance only supported from Hogwarts.
    """

    def __init__(self, url: str, token: str):
        """
        Constructor.

        Args:
            url:
                The url to alfred service.
        """
        super(TokenOAuthInstance, self).__init__(url)
        self.__access_token: str = token
        self.__oath_token_expiry: Optional[datetime] = None
        self.__oath_token: Optional[str] = None

    def _add_header(self):
        expiry_buffer = timedelta(minutes=30)
        if (
            self.__oath_token_expiry is None
            or self.__oath_token_expiry - datetime.now() < expiry_buffer
        ):
            logger.info("Authenticating via hogwarts vault...")
            api = InstanceUtil.build_scope(self.url)
            vault_client = VaultClient()
            alfred_app = vault_client.get_oauth_client("alfred")
            obo_access_token, obo_ctx_refresh_token = vault_client.on_behalf_of(
                f"{alfred_app.audience}/{alfred_app.scope}",
                self.__access_token,
                token_client_name="superset",
            )

            refreshed_obo_access_token = vault_client.refresh(obo_ctx_refresh_token)
            self.__oath_token = refreshed_obo_access_token[0]
            decoded = jwt.decode(
                str.encode(self.__oath_token),
                options={"verify_signature": False, "verify_aud": False},
            )
            self.__oath_token_expiry = datetime.fromtimestamp(decoded["exp"])

            logger.info("Authenticated.")

        self.session.headers["Authorization"] = f"Bearer {self.__oath_token}"

def create_retention(
    data_set,
    alfred_instance,
    metadata_system="Analytical Platform",
    token: str = None,
) -> list:
    """
    This method takes a list of JSON objects and sends it to the Alfred Retention UI.

    input:
        data_set: Input logs from the original datasource
        alfred_instance: The Alfred instance to which to retain. Specified in alfred_client.instance.InstanceUtil (ALFRED_STG_PB, ALFRED_PRD_PB, ALFRED_REPORTS_PB)
        metadata_system: The system the metadata was retrieved from.
        markup: Defaults to PB//CND,
    output:
        retention_id
    """
    logger = current_app.logger
    logger.info(f"Connecting to Alfred {alfred_instance}...")
    alfred = AlfredService.for_instance(
        TokenOAuthInstance(InstanceUtil.build_url(alfred_instance), token)
    )
    logger.info(
        f"Connected to Alfred {alfred_instance} version {alfred.fetch_version()}."
    )

    # Create Retention and Stage it
    logger.info("Creating Retention...")

    # These lines were copied from the stage function in the RetentionInstance
    # class in the alfred_client library, but does not block and wait for the
    # retention to be in the 'ready' state.
    out_data_set: List[DataSetEntry] = DataSetMapper().map_data_set(data_set)
    retention = alfred.create_retention(
            f"Retention initiated from Superset - {datetime.now()}"
        )
    retention = alfred.add_retention_dataset(
            retention.uri,
            out_data_set,
            metadata_system,
            mapping_name="hogwarts.harmonized.eml_metadata"
        )

    # Return the URL
    retention_url = (
        InstanceUtil.build_url(alfred_instance)
        .replace(":9488", "")
        .replace("/rest", f"/ui/{retention.uri}")
    )

    return retention_url

def sanitize_results(data, warnings=None, safe_js_ints=False):
    result = dict()

    if isinstance(data, dict):
        for key, value in data.items():
            result[key] = sanitize_results(value, warnings, safe_js_ints)
    elif isinstance(data, (list, ndarray)):
        json_array = []
        for v in data:
            json_array.append(sanitize_results(v, warnings, safe_js_ints))
        return json_array
    elif isinstance(data, datetime64):
        return pd.Timestamp(data)
    elif isinstance(data, (bytearray, bytes)):
        return data.hex(" ").upper().split().__str__()
    elif safe_js_ints and isinstance(data, (int, Decimal)):
        if data <= JS_MAX_SAFE_INTEGER and data >= JS_MIN_SAFE_INTEGER:
            return data
        else:
            warnings.append(f"int {data} was cast to string to avoid loss of precision.")
            return str(data)
    elif isinstance(data, NamedRowTuple):
        for key, value in zip(data._names, data):
            result[key] = sanitize_results(value, warnings, safe_js_ints)
    else:
        return data
    return result

def retain_eml_to_alfred(ids, alfred_env, access_token, dates=None):
    try:
        client = VaultClient()

        ids_string = ""
        datetimes = []
        if ids:
            logger.info(f'Found eml_ids: "{ids_string}" in arguments')
            ids_string = "','".join(ids)
        else:
            raise Exception("No field 'email_ids' found in request")
        if dates:
            logger.info(f'Found dates: "{dates}" in arguments')
            for date in dates:
                try:
                    datetimes.append(datetime.strptime(date, "%Y-%m-%d"))
                except ValueError as ve:
                    logger.info(ve)
                    continue
        if alfred_env:
            logger.info(f'Found Alfred-env: "{alfred_env}" in arguments')
        else:
            raise Exception("No field 'alfred_env' found in request")

        logger.info("Generating access token for trino...")
        trino_app = client.get_oauth_client("trino")

        trino_acces_token, trino_ctx = client.on_behalf_of(
            f"{trino_app.audience}/{trino_app.scope}",
            access_token,
            token_client_name="superset",
        )

        trino_host = os.environ.get('TRINO_HOST')
        if not trino_host:
            logger.error("TRINO_HOST environment variable not set")
            raise Exception('TRINO_HOST environment variable not set')
        logger.info(f"Establishing connection to trino at {trino_host}...")
        conn = connect(
            auth=JWTAuthentication(trino_acces_token),
            http_scheme="https",
            host=trino_host,
            port=443,
            catalog="hogwarts_pb",
        )

        # strict list of columns to avoid unforseen errors with new columns added
        columns = ['bcc', 'body', 'cc', 'classification', 'content_type', 'cpoints', 'department', 'direction', 'eml_path', 'files', '"from"', 'id', 'length', 'md5', 'message_id', 'ministerial_authorization', 'parent_id', 'reply_to', 'root_id', 'sensor', 'sha1', 'sha256', 'source_id', 'stream_id', 'subject', 'subparts', 'tag', 'time', 'to', 'urls', 'timeperiod_loadedby', 'raw_source', 'stream_name', 'stream_description', 'src_port', 'dst_port', 'src_ip_asn', 'dst_ip_asn', 'src_ip_country_code', 'dst_ip_local', 'src_ip_local', 'dst_ip_department', 'src_ip_department', 'zone', 'helo', 'mail_from', 'rcpt_to', 'in_reply_to', 'references', 'xmailer', 'received', 'dest_ip_country_code', 'zone_str', 'xoriginating_ip_v4', 'xoriginating_ip_department', 'xoriginating_ip_country_code', 'last_received_ip_v4', 'last_received_ip_department', 'last_received_ip_country_code', 'src_ip_v4', 'dst_ip_v4']
        columns_string = ', '.join(columns)
        sql = f'''
        SELECT {columns_string}
        FROM  hogwarts_pb.harmonized.eml_metadata
        WHERE id in ('{ids_string}')
        '''
        # Adding this where clause is intended to optimize the query. It is assumed that all the EMLs will be under the same date or close to the 
        # same date so they are added in a separate where clause
        if datetimes:
            sql += " AND ("
            for i in range(len(datetimes)):
                if i > 0:
                    sql += " OR "
                sql += f"(time > TIMESTAMP '{datetimes[i].strftime('%Y-%m-%d')}' AND time < TIMESTAMP '{(datetimes[i] + timedelta(days=1)).strftime('%Y-%m-%d')}')"
            sql += ")"
        logger.info(f"Querying EML Data from trino at {trino_host}...")
        cur = conn.cursor()
        logger.info(f"Created Connection {cur.query_id}")
        cur.execute(sql)
        logger.info(f"executed query {cur.query_id}")
        columns = list(map(lambda d: d[0], cur.description))
        results = cur.fetchmany(limit + 1)
        logger.info("Received response...")
        processed_rows = []
        for row in results:

            processed_rows.append(sanitize_results(row))

        json_rows = pd.DataFrame.from_records(processed_rows, columns=columns).to_json(
            orient="records", date_unit="us"
        )
        data_to_map = json.loads(json_rows)

        logger.info("Creating Retention...")
        retention_url = create_retention(
            data_to_map,
            alfred_env,
            token=access_token,
        )
        logger.info("Completed Retention.")

        return 200, retention_url

    except Exception as e:
        logger.error(e)
        logger.error(str(traceback.format_exc()))
        return 400, str(traceback.format_exc())
