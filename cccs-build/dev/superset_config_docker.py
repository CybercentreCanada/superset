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
#
# This file is included in the final Docker image and SHOULD be overridden when
# deploying the image to prod. Settings configured here are intended for use in local
# development environments. Also note that superset_config_docker.py is imported
# as a final step as a means to override "defaults" configured here
#


import logging
import ipaddress
import re
from typing import Any, List, Dict

from sqlalchemy import Column
from superset.advanced_data_type.types import (
    AdvancedDataType,
    AdvancedDataTypeRequest,
    AdvancedDataTypeResponse,
)
from superset.utils.core import FilterOperator, FilterStringOperators
from superset.advanced_data_type.plugins.internet_port import internet_port

logger = logging.getLogger()

# The SQLAlchemy connection string.
SQLALCHEMY_DATABASE_URI = "postgresql://superset:superset@localhost:5432/superset"

SQLALCHEMY_EXAMPLES_URI = "postgresql://superset:superset@localhost:5432/examples"

SECRET_KEY = "superset"

DEFAULT_VIZ_TYPE = 'cccs_table'

# Use midnight coming (tonight) as the anchor to calculate relative time
# for the start and end dates
DEFAULT_RELATIVE_START_TIME = "tomorrow"
DEFAULT_RELATIVE_END_TIME = "tomorrow"

DEFAULT_TIME_FILTER = "Today : Tomorrow"

# Adjust the SQLAlchemy connection pool to avoid QueuePool limit errors / timeouts.
SQLALCHEMY_POOL_SIZE = 100
SQLALCHEMY_MAX_OVERFLOW = 50
SQLALCHEMY_POOL_TIMEOUT = 30

TALISMAN_ENABLED = False


ENABLE_ADVANCED_DATA_TYPES = True

FEATURE_FLAGS = {
    "ENABLE_TEMPLATE_PROCESSING": True,
    "DASHBOARD_NATIVE_FILTERS": True,
    "DASHBOARD_CROSS_FILTERS": True,
    "DASHBOARD_NATIVE_FILTERS_SET": False,
    "DASHBOARD_RBAC": True,
    "ENABLE_EXPLORE_DRAG_AND_DROP": False,
    "ENABLE_TEMPLATE_REMOVE_FILTERS": True,
    "GENERIC_CHART_AXES": True,
    "ENABLE_ADVANCED_DATA_TYPES": True,
    "HORIZONTAL_FILTER_BAR": True,
}

# Operator Sets
CIDR_OPERATOR_SET = [
    FilterStringOperators.EQUALS,
    FilterStringOperators.GREATER_THAN_OR_EQUAL,
    FilterStringOperators.GREATER_THAN,
    FilterStringOperators.IN,
    FilterStringOperators.LESS_THAN,
    FilterStringOperators.LESS_THAN_OR_EQUAL,
]
EQUAL_NULLABLE_OPERATOR_SET = [
    FilterStringOperators.EQUALS,
    FilterStringOperators.NOT_EQUALS,
    FilterStringOperators.IN,
    FilterStringOperators.NOT_IN,
    FilterStringOperators.IS_NOT_NULL,
    FilterStringOperators.IS_NULL,
]
PATTERN_MATCHING_OPERATOR_SET = [
    FilterStringOperators.LIKE,
    FilterStringOperators.ILIKE,
]


# Make this return a single clause
def cidr_translate_filter_func(
    col: Column, operator: FilterOperator, values: List[Any]
) -> Any:
    """
    Convert a passed in column, FilterOperator and
    list of values into an sqlalchemy expression
    """
    return_expression: Any
    if operator in (FilterOperator.IN, FilterOperator.NOT_IN):
        dict_items = [val for val in values if isinstance(val, dict)]
        single_values = [val for val in values if not isinstance(val, dict)]
        if operator == FilterOperator.IN.value:
            cond = col.in_(single_values)
            for dictionary in dict_items:
                cond = cond | (col <= dictionary["end"]) & (col >= dictionary["start"])
        elif operator == FilterOperator.NOT_IN.value:
            cond = ~(col.in_(single_values))
            for dictionary in dict_items:
                cond = cond & (col > dictionary["end"]) & (col < dictionary["start"])
        return_expression = cond
    if len(values) == 1:
        value = values[0]
        if operator == FilterOperator.EQUALS.value:
            return_expression = (
                col == value
                if not isinstance(value, dict)
                else (col <= value["end"]) & (col >= value["start"])
            )
        if operator == FilterOperator.GREATER_THAN_OR_EQUALS.value:
            return_expression = (
                col >= value if not isinstance(value, dict) else col >= value["end"]
            )
        if operator == FilterOperator.GREATER_THAN.value:
            return_expression = (
                col > value if not isinstance(value, dict) else col > value["end"]
            )
        if operator == FilterOperator.LESS_THAN.value:
            return_expression = (
                col < value if not isinstance(value, dict) else col < value["start"]
            )
        if operator == FilterOperator.LESS_THAN_OR_EQUALS.value:
            return_expression = (
                col <= value if not isinstance(value, dict) else col <= value["start"]
            )
        if operator == FilterOperator.NOT_EQUALS.value:
            return_expression = (
                col != value
                if not isinstance(value, dict)
                else (col > value["end"]) | (col < value["start"])
            )
    return return_expression


def cidr_func(req: AdvancedDataTypeRequest) -> AdvancedDataTypeResponse:
    """
    Convert a passed in AdvancedDataTypeRequest to an AdvancedDataTypeResponse
    """
    resp: AdvancedDataTypeResponse = {
        "values": [],
        "error_message": "",
        "display_value": "",
        "valid_filter_operators": CIDR_OPERATOR_SET,
    }
    if req["values"] == [""]:
        resp["error_message"] = "IPv4 address or CIDR must not be empty"
        return resp
    for val in req["values"]:
        string_value = str(val)
        try:
            ip_range = (
                ipaddress.ip_network(int(string_value), strict=False)
                if string_value.isnumeric()
                else ipaddress.ip_network(string_value, strict=False)
            )

            if ip_range.version != 4:
                raise TypeError(f"'{ val }' is not a valid IPv4 address or CIDR")

            resp["values"].append(
                {"start": int(ip_range[0]), "end": int(ip_range[-1])}
                if ip_range[0] != ip_range[-1]
                else int(ip_range[0])
            )
        except ValueError as ex:
            resp["error_message"] = f"'{ val }' is not a valid IPv4 address or CIDR"
            break
        except TypeError as ex:
            resp["error_message"] = str(ex)
            break
        else:
            resp["display_value"] = ", ".join(
                map(
                    lambda x: (
                        f"{x['start']} - {x['end']}" if isinstance(x, dict) else str(x)
                    ),
                    resp["values"],
                )
            )
    return resp


ipv4_address: AdvancedDataType = AdvancedDataType(
    verbose_name="IPv4",
    description="represents both an IPv4 and CIDR range",
    valid_data_types=["int"],
    translate_filter=cidr_translate_filter_func,
    translate_type=cidr_func,
)


def translate_filter_func(
    col: Column, operator: FilterOperator, values: List[Any]
) -> Any:
    """
    Convert a passed in column, FilterOperator and
    list of values into an sqlalchemy expression
    """
    return_expression: Any
    if operator == FilterOperator.IN.value:
        return_expression = col.in_(values)
    elif operator == FilterOperator.NOT_IN.value:
        return_expression = ~(col.in_(values))
    elif operator == FilterOperator.IS_NULL.value:
        return_expression = col == None
    elif operator == FilterOperator.IS_NOT_NULL.value:
        return_expression = col != None
    elif len(values) == 1:
        value = values[0]
        if operator == FilterOperator.EQUALS.value:
            return_expression = col == value
        if operator == FilterOperator.NOT_EQUALS.value:
            return_expression = col != value
        if operator == FilterOperator.LIKE.value:
            return_expression = col.like(value)
        if operator == FilterOperator.ILIKE.value:
            return_expression = col.ilike(value)
    return return_expression


def agent_id_func(req: AdvancedDataTypeRequest) -> AdvancedDataTypeResponse:
    """
    Convert a passed in AdvancedDataTypeRequest to an AdvancedDataTypeResponse
    """
    resp: AdvancedDataTypeResponse = {
        "values": [],
        "error_message": "",
        "display_value": "",
        "valid_filter_operators": EQUAL_NULLABLE_OPERATOR_SET
        + PATTERN_MATCHING_OPERATOR_SET,
    }

    if req["operator"] in ["IS NULL", "IS NOT NULL"]:
        return resp
    elif req["values"] == [""]:
        resp["error_message"] = "Agent ID must not be empty"
        return resp
    else:
        for val in req["values"]:
            resp["values"].append(str(val))

        resp["display_value"] = ", ".join(resp["values"])
        return resp


agent_id: AdvancedDataType = AdvancedDataType(
    verbose_name="Agent ID",
    description="represents an Agent ID",
    valid_data_types=["str"],
    translate_filter=translate_filter_func,
    translate_type=agent_id_func,
)


def oid_tag_func(req: AdvancedDataTypeRequest) -> AdvancedDataTypeResponse:
    """
    Convert a passed in AdvancedDataTypeRequest to an AdvancedDataTypeResponse
    """
    resp: AdvancedDataTypeResponse = {
        "values": [],
        "error_message": "",
        "display_value": "",
        "valid_filter_operators": EQUAL_NULLABLE_OPERATOR_SET
        + PATTERN_MATCHING_OPERATOR_SET,
    }

    if req["operator"] in ["IS NULL", "IS NOT NULL"]:
        return resp
    elif req["values"] == [""]:
        resp["error_message"] = "OID Tag must not be empty"
        return resp
    else:
        for val in req["values"]:
            resp["values"].append(str(val))

        resp["display_value"] = ", ".join(resp["values"])
        return resp


oid_tag: AdvancedDataType = AdvancedDataType(
    verbose_name="OID Tag",
    description="represents an OID Tag",
    valid_data_types=["str"],
    translate_filter=translate_filter_func,
    translate_type=oid_tag_func,
)


def cbs_id_func(req: AdvancedDataTypeRequest) -> AdvancedDataTypeResponse:
    """
    Convert a passed in AdvancedDataTypeRequest to an AdvancedDataTypeResponse
    """
    resp: AdvancedDataTypeResponse = {
        "values": [],
        "error_message": "",
        "display_value": "",
        "valid_filter_operators": EQUAL_NULLABLE_OPERATOR_SET,
    }
    if req["operator"] in ["IS NULL", "IS NOT NULL"]:
        return resp
    elif req["values"] == [""]:
        resp["error_message"] = "CBS ID must not be empty"
        return resp
    else:
        for val in req["values"]:
            string_value = str(val)
            if re.search(
                "^[A-Fa-f0-9]{8}\-[A-Fa-f0-9]{4}\-[A-Fa-f0-9]{4}\-[A-Fa-f0-9]{4}\-[A-Fa-f0-9]{12}$",
                string_value,
            ):
                resp["values"].append(string_value)
            else:
                character_blocks = [len(x) for x in string_value.split("-")]

                if len(string_value) != 36:
                    resp["error_message"] = (
                        f"'{ val }' is not a valid CBS ID. Expected 36 characters. Received {len(string_value)}."
                    )
                    return resp
                elif character_blocks != [8, 4, 4, 4, 12]:
                    resp["error_message"] = (
                        f"'{ val }' is not a valid CBS ID. Invalid format."
                    )
                    return resp
                else:
                    resp["error_message"] = (
                        f"'{ val }' is not a valid CBS ID. Invalid characters. Accepted characters: a-f, A-F, 0-9, -"
                    )
                    return resp

        resp["display_value"] = ", ".join(resp["values"])
        return resp


cbs_id: AdvancedDataType = AdvancedDataType(
    verbose_name="CBS ID",
    description="represents a CBS ID",
    valid_data_types=["str"],
    translate_filter=translate_filter_func,
    translate_type=cbs_id_func,
)


def harmonized_email_id_func(req: AdvancedDataTypeRequest) -> AdvancedDataTypeResponse:
    """
    Convert a passed in AdvancedDataTypeRequest to an AdvancedDataTypeResponse
    """
    resp: AdvancedDataTypeResponse = {
        "values": [],
        "error_message": "",
        "display_value": "",
        "valid_filter_operators": EQUAL_NULLABLE_OPERATOR_SET,
    }

    if req["operator"] in ["IS NULL", "IS NOT NULL"]:
        return resp
    elif req["values"] == [""]:
        resp["error_message"] = "Harmonized Email ID must not be empty"
        return resp
    else:
        for val in req["values"]:
            string_value = str(val)
            if re.search("^(CBS|NBS)_EMAIL_[a-fA-F0-9]+$", string_value):
                resp["values"].append(string_value)
            else:
                character_blocks = string_value.split("_")

                if len(character_blocks) != 3:
                    resp["error_message"] = (
                        f"'{ val }' is not a valid Harmonized Email ID. Invalid format. Accepted format: <SENSOR>_EMAIL_<hex_string>"
                    )
                    return resp
                elif character_blocks[0] != "CBS" and character_blocks[0] != "NBS":
                    resp["error_message"] = (
                        f"'{ val }' is not a valid Harmonized Email ID. Invalid sensor type. Accepted types: CBS, NBS"
                    )
                    return resp
                elif character_blocks[1] != "EMAIL":
                    resp["error_message"] = (
                        f"'{ val }' is not a valid Harmonized Email ID. Invalid second block. Accepted format: <SENSOR>_EMAIL_<hex_string>"
                    )
                    return resp
                else:
                    resp["error_message"] = (
                        f"'{ val }' is not a valid Harmonized Email ID. Invalid hex string characters. Accepted characters: a-f, A-F, 0-9"
                    )
                    return resp

        resp["display_value"] = ", ".join(resp["values"])
        return resp


harmonized_email_id: AdvancedDataType = AdvancedDataType(
    verbose_name="Harmonized Email ID",
    description="represents a Harmonized Email ID",
    valid_data_types=["str"],
    translate_filter=translate_filter_func,
    translate_type=harmonized_email_id_func,
)


def aws_account_id_func(req: AdvancedDataTypeRequest) -> AdvancedDataTypeResponse:
    """
    Convert a passed in AdvancedDataTypeRequest to an AdvancedDataTypeResponse
    """
    resp: AdvancedDataTypeResponse = {
        "values": [],
        "error_message": "",
        "display_value": "",
        "valid_filter_operators": EQUAL_NULLABLE_OPERATOR_SET,
    }

    if req["operator"] in ["IS NULL", "IS NOT NULL"]:
        return resp
    elif req["values"] == [""]:
        resp["error_message"] = "AWS Account ID must not be empty"
        return resp
    else:
        for val in req["values"]:
            string_value = str(val)
            if re.search("^[0-9]{12}$", string_value):
                resp["values"].append(string_value)
            else:
                resp["error_message"] = (
                    f"'{ val }' is not a valid AWS Account ID. Invalid format. Accepted format: ^[0-9]{12}$"
                )
                return resp

        resp["display_value"] = ", ".join(resp["values"])
        return resp


aws_account_id: AdvancedDataType = AdvancedDataType(
    verbose_name="AWS Account ID",
    description="represents an AWS Account ID",
    valid_data_types=["int"],
    translate_filter=translate_filter_func,
    translate_type=aws_account_id_func,
)


def user_agent_func(req: AdvancedDataTypeRequest) -> AdvancedDataTypeResponse:
    """
    Convert a passed in AdvancedDataTypeRequest to an AdvancedDataTypeResponse
    """
    resp: AdvancedDataTypeResponse = {
        "values": [],
        "error_message": "",
        "display_value": "",
        "valid_filter_operators": EQUAL_NULLABLE_OPERATOR_SET
        + PATTERN_MATCHING_OPERATOR_SET,
    }

    if req["operator"] in ["IS NULL", "IS NOT NULL"]:
        return resp
    elif req["values"] == [""]:
        resp["error_message"] = "User Agent must not be empty"
        return resp
    else:
        for val in req["values"]:
            resp["values"].append(str(val))

        resp["display_value"] = ", ".join(resp["values"])
        return resp


user_agent: AdvancedDataType = AdvancedDataType(
    verbose_name="User Agent",
    description="represents a User Agent",
    valid_data_types=["str"],
    translate_filter=translate_filter_func,
    translate_type=user_agent_func,
)


def email_address_func(req: AdvancedDataTypeRequest) -> AdvancedDataTypeResponse:
    """
    Convert a passed in AdvancedDataTypeRequest to an AdvancedDataTypeResponse
    """
    resp: AdvancedDataTypeResponse = {
        "values": [],
        "error_message": "",
        "display_value": "",
        "valid_filter_operators": EQUAL_NULLABLE_OPERATOR_SET
        + PATTERN_MATCHING_OPERATOR_SET,
    }

    if req["operator"] in ["IS NULL", "IS NOT NULL"]:
        return resp
    elif req["values"] == [""]:
        resp["error_message"] = "Email Address must not be empty"
        return resp
    elif req["operator"] in ["LIKE", "ILIKE"]:
        for val in req["values"]:
            resp["values"].append(str(val))
        return resp
    else:
        for val in req["values"]:
            string_value = str(val)
            if re.search("^.*@.*$", string_value):
                resp["values"].append(string_value)
            else:
                resp["error_message"] = (
                    f"'{ val }' is not a valid Email Address. Invalid format. Address must contain a '@' symbol"
                )
                return resp

        resp["display_value"] = ", ".join(resp["values"])
        return resp


email_address: AdvancedDataType = AdvancedDataType(
    verbose_name="Email Address",
    description="represents an Email Address",
    valid_data_types=["str"],
    translate_filter=translate_filter_func,
    translate_type=email_address_func,
)


def department_func(req: AdvancedDataTypeRequest) -> AdvancedDataTypeResponse:
    """
    Convert a passed in AdvancedDataTypeRequest to an AdvancedDataTypeResponse
    """
    resp: AdvancedDataTypeResponse = {
        "values": [],
        "error_message": "",
        "display_value": "",
        "valid_filter_operators": EQUAL_NULLABLE_OPERATOR_SET
        + PATTERN_MATCHING_OPERATOR_SET,
    }

    if req["operator"] in ["IS NULL", "IS NOT NULL"]:
        return resp
    elif req["values"] == [""]:
        resp["error_message"] = "Department must not be empty"
        return resp
    else:
        for val in req["values"]:
            resp["values"].append(str(val))

        resp["display_value"] = ", ".join(resp["values"])
        return resp


department: AdvancedDataType = AdvancedDataType(
    verbose_name="Department",
    description="represents a Department",
    valid_data_types=["str"],
    translate_filter=translate_filter_func,
    translate_type=department_func,
)


def aws_arn_func(req: AdvancedDataTypeRequest) -> AdvancedDataTypeResponse:
    """
    Convert a passed in AdvancedDataTypeRequest to an AdvancedDataTypeResponse
    """
    resp: AdvancedDataTypeResponse = {
        "values": [],
        "error_message": "",
        "display_value": "",
        "valid_filter_operators": EQUAL_NULLABLE_OPERATOR_SET
        + PATTERN_MATCHING_OPERATOR_SET,
    }

    if req["operator"] in ["IS NULL", "IS NOT NULL"]:
        return resp
    elif req["values"] == [""]:
        resp["error_message"] = "AWS ARN must not be empty"
        return resp
    elif req["operator"] in ["LIKE", "ILIKE"]:
        for val in req["values"]:
            resp["values"].append(str(val))
        return resp
    else:
        for val in req["values"]:
            string_value = str(val)
            if re.search(
                "^arn:(?P<Partition>[^:\n]*):(?P<Service>[^:\n]*):(?P<Region>[^:\n]*):(?P<AccountID>[^:\n]*):(?P<Ignore>(?P<ResourceType>[^:\/\n]*)[:\/])?(?P<Resource>.*)$",
                string_value,
            ):
                resp["values"].append(string_value)
            else:
                resp["error_message"] = (
                    f"'{ val }' is not a valid AWS ARN. Invalid format."
                )
                return resp

        resp["display_value"] = ", ".join(resp["values"])
        return resp


aws_arn: AdvancedDataType = AdvancedDataType(
    verbose_name="AWS ARN",
    description="represents an AWS ARN",
    valid_data_types=["str"],
    translate_filter=translate_filter_func,
    translate_type=aws_arn_func,
)


def file_sha256_func(req: AdvancedDataTypeRequest) -> AdvancedDataTypeResponse:
    """
    Convert a passed in AdvancedDataTypeRequest to an AdvancedDataTypeResponse
    """
    resp: AdvancedDataTypeResponse = {
        "values": [],
        "error_message": "",
        "display_value": "",
        "valid_filter_operators": EQUAL_NULLABLE_OPERATOR_SET,
    }
    if req["values"] == [""]:
        resp["error_message"] = "FileSHA256 must not be empty"
        return resp
    for val in req["values"]:
        string_value = str(val)
        if re.search("^[a-fA-F0-9]{64}$", string_value):
            resp["values"].append(string_value)
        else:
            if len(string_value) != 64:
                resp["error_message"] = (
                    f"'{ val }' is not a valid FileSHA256. Expected 64 characters. Received {len(string_value)}."
                )
                return resp
            else:
                resp["error_message"] = (
                    f"'{ val }' is not a valid FileSHA256. Invalid hex string characters. Accepted characters: a-f, A-F, 0-9"
                )
                return resp

    resp["display_value"] = ", ".join(resp["values"])
    return resp


file_sha256: AdvancedDataType = AdvancedDataType(
    verbose_name="FileSHA256",
    description="Represents a SHA256 hash of a file",
    valid_data_types=["str"],
    translate_filter=translate_filter_func,
    translate_type=file_sha256_func,
)

EML_SEARCH_STRING = "^((C|N)BS_EMAIL:\/\/)([0-9]{4}\/[0-9]{2}\/[0-9]{2}\/eml\/(c|n)bs\/).*(\.eml\.cart)$"


def eml_path_func(req: AdvancedDataTypeRequest) -> AdvancedDataTypeResponse:
    """
    Convert a passed in AdvancedDataTypeRequest to an AdvancedDataTypeResponse
    """
    resp: AdvancedDataTypeResponse = {
        "values": [],
        "error_message": "",
        "display_value": "",
        "valid_filter_operators": EQUAL_NULLABLE_OPERATOR_SET,
    }
    if req["values"] == [""]:
        resp["error_message"] = f"{eml_path.verbose_name} must not be empty"
        return resp
    for val in req["values"]:
        string_value = str(val)
        if re.search(EML_SEARCH_STRING, string_value):
            resp["values"].append(string_value)
        else:
            resp["error_message"] = (
                f"'{ val }' is not a valid {eml_path.verbose_name}. EML_paths are in the format {EML_SEARCH_STRING}"
            )
            return resp

    resp["display_value"] = ", ".join(resp["values"])
    return resp


eml_path: AdvancedDataType = AdvancedDataType(
    verbose_name="EMLPath",
    description="Represents a the EML path of an email",
    valid_data_types=["str"],
    translate_filter=translate_filter_func,
    translate_type=eml_path_func,
)


ADVANCED_DATA_TYPES: Dict[str, AdvancedDataType] = {
    "agent_id": agent_id,
    "aws_account_id": aws_account_id,
    "aws_arn": aws_arn,
    "cbs_id": cbs_id,
    "department": department,
    "email_address": email_address,
    "file_sha256": file_sha256,
    "harmonized_email_id": harmonized_email_id,
    "ipv4": ipv4_address,
    "oid_tag": oid_tag,
    "port": internet_port,
    "user_agent": user_agent,
    "eml_path": eml_path,
}