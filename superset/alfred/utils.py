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

from trino.client import NamedRowTuple

from alfred_client import AlfredService
from alfred_client.instance import InstanceUtil
from alfred_client import RetentionInstance

import logging
import os.path
from datetime import datetime
from datetime import timedelta
from typing import Optional, Union
import json

from alfred_client.instance import InstanceUtil
from alfred_client.instance.AbstractInstance import AbstractInstance

# Determine if we are in JupyHub Hogwarts environment by the presence of the hogwarts library.

import jwt

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
    Alfred Instance with OAuth with on-behalf-of authentication instance only supported from Hogwarts. This
    implementation will fail if the hogwarts library is not present. This is a fair indication that the user is not in
    the JH environment.
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
    rationale=None,
    event_type="GENERIC_EVENT",
    markup="PB//CND",
    cccs_formatting=True,
    token: str = None,
) -> list:
    """
    This method takes a list of JSON objects and sends it to the Alfred Retention UI.

    input:
        data_set: Input logs from the original datasource
        alfred_instance: What Alfred to retain to. Speficied in alfred_client.instance.InstanceUtil (ALFRED_STG_PB, ALFRED_PRD_PB, ALFRED_REPORTS_PB)
        metadata_system: The system the metadata was retrieved from.
        rationale: One of Malicious Activity, Situational Awareness, Capability Development
        event_type: One of BEACON, BROWSER_BASED_EXPLOITATION, DOS, EMAIL, EXFILTRATION, GENERIC_EVENT, IMPROPER_USAGE, MALWARE_ARTIFACTS,
                        MALWARE_DOWNLOAD, PHISHING, REMOTE_ACCESS, REMOTE_EXPLOITATION, SCAN, SCRAPING, TRAFFIC_INTERCEPTION
        markup: Defaults to PB//CND,
        cccs_formatting: Perform additional event splitting and formatting to match CCCS expected incident/event format. Default- True

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

    # Variables
    dept_map = {}
    info_map = {}
    event_count = 1

    # Add in the extra values, plus do department splitting
    for log in data_set:
        # Add Constants if not already set
        if "event type" not in log:
            log["event type"] = event_type
        if "new incident id" not in log:
            log["new incident id"] = "LS-<INCIDENT_1>"
        if "rationale" not in log:
            log["rationale"] = rationale

        # Preform org/comm grouping
        if cccs_formatting:
            if "new event id" not in log and "event description" not in log:
                # Group Comms by the department
                dept = (
                    log["Event Organization"]
                    if "Event Organization" in log
                    else "Unknown Department"
                )
                if dept not in dept_map:
                    dept_map[dept] = event_count
                    event_count += 1

                # Set the description per event.
                # If logs supply 'Event Info' it will be grabbed from all the logs, uniqued and sorted into the description
                if dept not in info_map:
                    info_map[dept] = "\n".join(
                        sorted(
                            list(
                                set(
                                    [
                                        d["Event Info"]
                                        for d in data_set
                                        if "Event Info" in d
                                        and (
                                            (
                                                dept != "Unknown Department"
                                                and "Event Organization" in d
                                                and dept == d["Event Organization"]
                                            )
                                            or (
                                                dept == "Unknown Department"
                                                and "Event Organization" not in d
                                            )
                                        )
                                    ]
                                )
                            )
                        )
                    )
                    log["event description"] = (
                        "{" + markup + "}" + f"{dept}\n{info_map[dept]}".strip()
                    )
                elif dept in info_map:
                    log["event description"] = (
                        "{" + markup + "}" + f"{dept}\n{info_map[dept]}".strip()
                    )
                else:
                    log["event description"] = "{" + markup + "}" + f"{dept}".strip()

                # Set the Event ID
                log["new event id"] = f"LS-<{event_type}_{dept_map[dept]}>"

        else:
            if "new event id" not in log:
                log["new event id"] = f"LS-<{event_type}_1>"

    # Create Retention and Stage it
    logger.info(f"Creating Retention...")
    retention = RetentionInstance(
        alfred,
        f"Fission Retention - {datetime.now()}",
        data_set,
        metadata_system,
        server_side_mapping_name="hogwarts.harmonized.eml_metadata",
    )
    ready = retention.stage()

    # logger.info the result
    logger.info(f"Retention Ready: {ready}.")
    logger.info(f"Retention Messages: {retention.retention.message_summary}.")

    # Return the URL
    retention_url = (
        InstanceUtil.build_url(alfred_instance)
        .replace(":9488", "")
        .replace("/rest", f"/ui/{retention.retention.uri}")
    )

    return retention_url


def sanitize_results(data):
    result = dict()
    if isinstance(data, list):
        json_array = []
        for v in data:
            json_array.append(sanitize_results(v))
        return json_array
    elif isinstance(data, NamedRowTuple):
        for key, value in zip(data._names, data):
            result[key] = sanitize_results(value)
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
            logger.info(f'Found dates: "{ids_string}" in arguments')
            for date in dates:
                try:
                    datetimes.append(datetime.strptime(date, "%m-%d-%Y"))
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

        trino_host = "trino-stg.hogwarts.pb.azure.chimera.cyber.gc.ca"
        logger.info(f"Establishing connection to trino at {trino_host}...")
        conn = connect(
            auth=JWTAuthentication(trino_acces_token),
            http_scheme="https",
            host=trino_host,
            port=443,
            catalog="hogwarts_pb",
        )

        sql = f"""
    SELECT id, urls, "from", to, message_id, reply_to, stream_id, subject, eml_path, bcc, cc, ministerial_authorization, classification, time
    FROM  hogwarts_pb.harmonized.eml_metadata
    WHERE id in ('{ids_string}')
    """
        if dates:
            sql += " AND "
            for i in range(len(dates)):
                if i > 0:
                    sql += " OR "
                sql += f"(time > TIMESTAMP '{datetimes[i].strftime('%Y-%m-%d')}' AND time < TIMESTAMP '{(datetimes[i] + timedelta(days=1)).strftime('%Y-%m-%d')}')"
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
            orient="records"
        )
        data_to_map = json.loads(json_rows)

        rationale = "Malicious Activity"
        classification = "PB//CND"

        logger.info("Creating Retention...")
        retention_url = create_retention(
            data_to_map,
            alfred_env,
            rationale=rationale,
            markup=classification,
            token=access_token,
        )
        logger.info("Completed Retention.")

        return 200, retention_url

    except Exception as e:
        logger.error(e)
        logger.error(str(traceback.format_exc()))
        return 400, str(traceback.format_exc())
