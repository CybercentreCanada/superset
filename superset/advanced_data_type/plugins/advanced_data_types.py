#WIP, planning to split into separate files

# Licensed to the Apache Software Foundation (ASF) under one
# or more contributor license agreements.  See the NOTICE file
# distributed with this work for additional information
# regarding coperatoryright ownership.  The ASF licenses this file
# to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance
# with the License.  You may obtain a coperatory of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing,
# software distributed under the License is distributed on an
# "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
# KIND, either express or implied.  See the License for the
# specific language governing permissions and limitations
# under the License.
import ipaddress
import re
from typing import Any, List
import json
from sqlalchemy import Column
from superset.advanced_data_type.types import (
    AdvancedDataType,
    AdvancedDataTypeRequest,
    AdvancedDataTypeResponse,
)
from superset.utils.core import FilterOperator, FilterStringOperators


#Constants
MIN_ASN_16B = 1
MAX_ASN_16B = 65534
MIN_ASN_32B = 131072
MAX_ASN_32B = 4294967294

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

STREAM_DICT = {11: 'IIS_EXT',
 73: 'SCED_EPS_EXT',
 35: 'GCSN_EXT',
 28: 'HOC_EXT_89',
 63: 'HOC_EXT_BELL_ROG',
 54: 'ELC_LOGS_HQ',
 7: 'SMS_INT',
 13: 'NRC_INT',
 2: 'NRC_EXT',
 59: 'SMNET_EXT',
 24: 'CSE_EXT',
 37: 'DND_EXT',
 39: 'DND_DMZ',
 20: 'GAC_DMZ',
 8: 'HOC_EXT_504',
 9: 'GAC_INT',
 27: 'MapleTap-RCMP-PB-PROD',
 52: 'MT-TBS-PROD',
 149: 'SMS_External',
 50: 'SMS_DMZ',
 172: 'GAC_EXT',
 6: 'MapleTap - ETS-EIO-INTERNET - PB - Prod',
 23: 'GCSN_EXT_DECRYPT',
 161: 'SCNL_EXT_PROD',
 29: 'MapleTap - SSC SCED-STATS-VCAP - PB - Prod',
 45: 'ELC_EXT_DECRYPT_CEHOM',
 166: 'MapleTap - SSC GcPc-NSS-IRCCvCAP - PB - Prod',
 61: 'MapleTap-OCOL-PB-PROD',
 136: 'HOC_EXT_81',
 144: 'DND_Passive',
 40: 'MapleTap - ETS-EIO-INTERNET - U - Prod',
 55: 'ELC_EXT_CEHOM',
 185: 'HOC_EXT_83',
 3: 'ATL_EXT',
 51: 'MapleTap - RCMP - U - CloudDev',
 4: 'MapleTap - SSC SCED-CRA-VCAP - PB - Prod',
 134: 'MT-ETS-PROD',
 60: 'CSE_DMZ',
 18: 'MEDUSA_EXT',
 155: 'CSE_INT',
 142: 'SMNET_LOGS',
 167: 'MapleTap-BigDigEvents-U-Dev',
 74: 'HOC_EXT_87',
 25: 'IIS_EXT_STG',
 179: 'SCED_Passive-only_EXT',
 168: 'ATL_INT',
 158: 'MapleTap - FINTRAC - PB - PROD',
 159: 'MapleTap - FINTRAC - PB - CloudDev',
 140: 'MT-CBS-STAGING',
 129: 'MT-ASSEMBLYLINE-U-PROD'}


# Make this return a single clause
def cidr_translate_filter_func(col: Column, operator: FilterOperator, values: List[Any]) -> Any:
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
                col == value if not isinstance(value, dict) else (col <= value["end"]) & (col >= value["start"])
            )
        if operator == FilterOperator.GREATER_THAN_OR_EQUALS.value:
            return_expression = col >= value if not isinstance(value, dict) else col >= value["end"]
        if operator == FilterOperator.GREATER_THAN.value:
            return_expression = col > value if not isinstance(value, dict) else col > value["end"]
        if operator == FilterOperator.LESS_THAN.value:
            return_expression = col < value if not isinstance(value, dict) else col < value["start"]
        if operator == FilterOperator.LESS_THAN_OR_EQUALS.value:
            return_expression = col <= value if not isinstance(value, dict) else col <= value["start"]
        if operator == FilterOperator.NOT_EQUALS.value:
            return_expression = (
                col != value if not isinstance(value, dict) else (col > value["end"]) | (col < value["start"])
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
                    lambda x: f"{x['start']} - {x['end']}" if isinstance(x, dict) else str(x),
                    resp["values"],
                )
            )
    return resp


ipv4_address: AdvancedDataType = AdvancedDataType(
    verbose_name="IPv4",
    description="Represents both an IPv4 and CIDR range",
    valid_data_types=["int"],
    translate_filter=cidr_translate_filter_func,
    translate_type=cidr_func,
)


def translate_filter_func(col: Column, operator: FilterOperator, values: List[Any]) -> Any:
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
        "valid_filter_operators": EQUAL_NULLABLE_OPERATOR_SET + PATTERN_MATCHING_OPERATOR_SET,
    }

    if req["operator"] in ['IS NULL', 'IS NOT NULL']:
        return resp
    elif req["values"] == [""]:
        resp["error_message"] = "Agent ID must not be empty"
        return resp
    elif req["operator"] in ['LIKE', 'ILIKE']:
        for val in req["values"]:
            resp["values"].append(str(val))
        return resp
    else:
        for val in req["values"]:
            string_value = str(val)
            if re.search("^[a-zA-Z0-9]{2}.[a-zA-Z0-9]{2}.[a-zA-Z0-9]{2,}.[a-zA-Z0-9]{2}$", string_value):
                resp["values"].append(string_value)
            else:
                resp["error_message"] = f"'{ val }' is not a valid Agent ID. Must be four strings separated by periods, and of lengths 2.2.*.2"
                return resp

        resp["display_value"] = ", ".join(resp["values"])
        return resp


agent_id: AdvancedDataType = AdvancedDataType(
    verbose_name="Agent ID",
    description="Represents an Agent ID",
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
        "valid_filter_operators": EQUAL_NULLABLE_OPERATOR_SET + PATTERN_MATCHING_OPERATOR_SET,
    }

    if req["operator"] in ['IS NULL', 'IS NOT NULL']:
        return resp
    elif req["values"] == [""]:
        resp["error_message"] = "OID Tag must not be empty"
        return resp
    elif req["operator"] in ['LIKE', 'ILIKE']:
        for val in req["values"]:
            resp["values"].append(str(val))
        return resp
    else:
        resp["display_value"] = ", ".join(resp["values"])
        return resp


oid_tag: AdvancedDataType = AdvancedDataType(
    verbose_name="OID Tag",
    description="Represents an OID Tag",
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
    if req["operator"] in ['IS NULL', 'IS NOT NULL']:
        return resp
    elif req["values"] == [""]:
        resp["error_message"] = "CBS ID must not be empty"
        return resp
    else:
        for val in req["values"]:
            string_value = str(val)
            if re.search("^[A-Fa-f0-9]{8}\-[A-Fa-f0-9]{4}\-[A-Fa-f0-9]{4}\-[A-Fa-f0-9]{4}\-[A-Fa-f0-9]{12}$", string_value):
                resp["values"].append(string_value)
            else:
                character_blocks = [len(x) for x in string_value.split("-")]

                if (len(string_value) != 36):
                    resp["error_message"] = f"'{ val }' is not a valid CBS ID. Expected 36 characters. Received {len(string_value)}."
                    return resp
                elif (character_blocks != [8,4,4,4,12]):
                    resp["error_message"] = f"'{ val }' is not a valid CBS ID. Invalid format."
                    return resp
                else:
                    resp["error_message"] = f"'{ val }' is not a valid CBS ID. Invalid characters. Accepted characters: a-f, A-F, 0-9, -"
                    return resp

        resp["display_value"] = ", ".join(resp["values"])
        return resp


cbs_id: AdvancedDataType = AdvancedDataType(
    verbose_name="CBS ID",
    description="Represents a CBS ID",
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

    if req["operator"] in ['IS NULL', 'IS NOT NULL']:
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

                if (len(character_blocks) != 3):
                    resp["error_message"] = f"'{ val }' is not a valid Harmonized Email ID. Invalid format. Accepted format: <SENSOR>_EMAIL_<hex_string>"
                    return resp
                elif (character_blocks[0] != 'CBS' and character_blocks[0] != 'NBS'):
                    resp["error_message"] = f"'{ val }' is not a valid Harmonized Email ID. Invalid sensor type. Accepted types: CBS, NBS"
                    return resp
                elif (character_blocks[1] != 'EMAIL'):
                    resp["error_message"] = f"'{ val }' is not a valid Harmonized Email ID. Invalid second block. Accepted format: <SENSOR>_EMAIL_<hex_string>"
                    return resp
                else:
                    resp["error_message"] = f"'{ val }' is not a valid Harmonized Email ID. Invalid hex string characters. Accepted characters: a-f, A-F, 0-9"
                    return resp

        resp["display_value"] = ", ".join(resp["values"])
        return resp


harmonized_email_id: AdvancedDataType = AdvancedDataType(
    verbose_name="Harmonized Email ID",
    description="Represents a Harmonized Email ID",
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

    if req["operator"] in ['IS NULL', 'IS NOT NULL']:
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
                resp["error_message"] = f"'{ val }' is not a valid AWS Account ID. Invalid format. Accepted format: ^[0-9]{12}$"
                return resp

        resp["display_value"] = ", ".join(resp["values"])
        return resp


aws_account_id: AdvancedDataType = AdvancedDataType(
    verbose_name="AWS Account ID",
    description="Represents an AWS Account ID",
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
        "valid_filter_operators": EQUAL_NULLABLE_OPERATOR_SET + PATTERN_MATCHING_OPERATOR_SET,
    }

    if req["operator"] in ['IS NULL', 'IS NOT NULL']:
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
    description="Represents a User Agent",
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
        "valid_filter_operators": EQUAL_NULLABLE_OPERATOR_SET + PATTERN_MATCHING_OPERATOR_SET,
    }

    if req["operator"] in ['IS NULL', 'IS NOT NULL']:
        return resp
    elif req["values"] == [""]:
        resp["error_message"] = "Email Address must not be empty"
        return resp
    elif req["operator"] in ['LIKE', 'ILIKE']:
        for val in req["values"]:
            resp["values"].append(str(val))
        return resp
    else:
        for val in req["values"]:
            string_value = str(val)
            if re.search("^.*@.*$", string_value):
                resp["values"].append(string_value)
            else:
                resp["error_message"] = f"'{ val }' is not a valid Email Address. Invalid format. Address must contain a '@' symbol"
                return resp

        resp["display_value"] = ", ".join(resp["values"])
        return resp


email_address: AdvancedDataType = AdvancedDataType(
    verbose_name="Email Address",
    description="Represents an Email Address",
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
        "valid_filter_operators": EQUAL_NULLABLE_OPERATOR_SET + PATTERN_MATCHING_OPERATOR_SET,
    }

    if req["operator"] in ['IS NULL', 'IS NOT NULL']:
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
    description="Represents a Department",
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
        "valid_filter_operators": EQUAL_NULLABLE_OPERATOR_SET + PATTERN_MATCHING_OPERATOR_SET,
    }

    if req["operator"] in ['IS NULL', 'IS NOT NULL']:
        return resp
    elif req["values"] == [""]:
        resp["error_message"] = "AWS ARN must not be empty"
        return resp
    elif req["operator"] in ['LIKE', 'ILIKE']:
        for val in req["values"]:
            resp["values"].append(str(val))
        return resp
    else:
        for val in req["values"]:
            string_value = str(val)
            if re.search("^arn:(?P<Partition>[^:\n]*):(?P<Service>[^:\n]*):(?P<Region>[^:\n]*):(?P<AccountID>[^:\n]*):(?P<Ignore>(?P<ResourceType>[^:\/\n]*)[:\/])?(?P<Resource>.*)$", string_value):
                resp["values"].append(string_value)
            else:
                resp["error_message"] = f"'{ val }' is not a valid AWS ARN. Invalid format."
                return resp

        resp["display_value"] = ", ".join(resp["values"])
        return resp


aws_arn: AdvancedDataType = AdvancedDataType(
    verbose_name="AWS ARN",
    description="Represents an AWS ARN",
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
            if (len(string_value) != 64):
                resp["error_message"] = f"'{ val }' is not a valid FileSHA256. Expected 64 characters. Received {len(string_value)}."
                return resp
            else:
                resp["error_message"] = f"'{ val }' is not a valid FileSHA256. Invalid hex string characters. Accepted characters: a-f, A-F, 0-9"
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

def cpoints_func(req: AdvancedDataTypeRequest) -> AdvancedDataTypeResponse:
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
        resp["error_message"] = "CPOINTS must not be empty"
        return resp
    else:
        for val in req["values"]:
            string_value = str(val)
            if req["operator"] in ['IN', 'NOT_IN']:
                    if re.search('"[0-9]{2}:[a-f0-9]{2}(?::[0-9]{1,4})?"', string_value):
                        resp["values"].append(string_value)
                    else:
                        resp["error_message"] = f"'{ val }' was not found in any CPOINT array."
                        return resp

            elif re.search('^\["[0-9]{2}:[a-f0-9]{2}(?::[0-9]{1,4})?"(, "[0-9]{2}:[a-f0-9]{2}(?::[0-9]{1,4})?")*\]$', string_value):
                resp["values"].append(string_value)
            else:
                resp["error_message"] = f"'{ val }' is not a valid CPOINTS array. Expected format: r"'^\["[0-9]{2}:[a-f0-9]{2}(?::[0-9]{1,4})?"(, "[0-9]{2}:[a-f0-9]{2}(?::[0-9]{1,4})?")*\]$'""
                return resp

    resp["display_value"] = ", ".join(resp["values"])
    return resp


cpoints: AdvancedDataType = AdvancedDataType(
    verbose_name="CPOINTS",
    description="Represents an array of CPOINTS",
    valid_data_types=["array"],
    translate_filter=translate_filter_func,
    translate_type=cpoints_func,
)

def cbs_workload_func(req: AdvancedDataTypeRequest) -> AdvancedDataTypeResponse:
    """
    Convert a passed in AdvancedDataTypeRequest to an AdvancedDataTypeResponse
    """
    resp: AdvancedDataTypeResponse = {
        "values": [],
        "error_message": "",
        "display_value": "",
        "valid_filter_operators": EQUAL_NULLABLE_OPERATOR_SET + PATTERN_MATCHING_OPERATOR_SET,
    }
    if req["values"] == [""]:
        resp["error_message"] = "CBS workload must not be empty"
        return resp
    elif req["operator"] in ['LIKE', 'ILIKE']:
        for val in req["values"]:
            resp["values"].append(str(val))
        return resp
    else:
        for val in req["values"]:
            string_value = str(val)
            if re.search("^[a-zA-Z]*\.[a-zA-Z]*?(\.[a-zA-Z0-9]+)*$", string_value):
                resp["values"].append(string_value)
            else:
                resp["error_message"] = f"'{ val }' is not a valid CBS workload. Must contain at least three strings separated by periods."
                return resp

        resp["display_value"] = ", ".join(resp["values"])
        return resp


cbs_workload: AdvancedDataType = AdvancedDataType(
    verbose_name="CBS Workload",
    description="Represents a CBS workload",
    valid_data_types=["str"],
    translate_filter=translate_filter_func,
    translate_type=cbs_workload_func,
)

def domain_func(req: AdvancedDataTypeRequest) -> AdvancedDataTypeResponse:
    """
    Convert a passed in AdvancedDataTypeRequest to an AdvancedDataTypeResponse
    """
    resp: AdvancedDataTypeResponse = {
        "values": [],
        "error_message": "",
        "display_value": "",
        "valid_filter_operators": EQUAL_NULLABLE_OPERATOR_SET + PATTERN_MATCHING_OPERATOR_SET,
    }
    if req["operator"] in ['IS NULL', 'IS NOT NULL']:
        return resp
    elif req["values"] == [""]:
        resp["error_message"] = "Domain must not be empty"
        return resp
    elif req["operator"] in ['LIKE', 'ILIKE']:
        for val in req["values"]:
            resp["values"].append(str(val))
        return resp
    else:
        for val in req["values"]:
            resp["values"].append(str(val))

    resp["display_value"] = ", ".join(resp["values"])
    return resp


domain: AdvancedDataType = AdvancedDataType(
    verbose_name="Domain",
    description="Represents an internet domain",
    valid_data_types=["str"],
    translate_filter=translate_filter_func,
    translate_type=domain_func,
)

def ipv6_func(req: AdvancedDataTypeRequest) -> AdvancedDataTypeResponse:
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
        resp["error_message"] = "IPv6 address must not be empty"
        return resp
    for val in req["values"]:
        string_value = str(val)
        try:
            ip_range = (
                ipaddress.ip_network(int(string_value), strict=False)
                if string_value.isnumeric()
                else ipaddress.ip_network(string_value, strict=False)
            )

            if ip_range.version != 6:
                raise TypeError(f"'{ val }' is not a valid IPv6 address.")

            resp["values"].append(
                {"start": int(ip_range[0]), "end": int(ip_range[-1])}
                if ip_range[0] != ip_range[-1]
                else int(ip_range[0])
            )
        except ValueError as ex:
            resp["error_message"] = f"'{ val }' is not a valid IPv6 address."
            break
        except TypeError as ex:
            resp["error_message"] = str(ex)
            break
        else:
            resp["display_value"] = ", ".join(
                map(
                    lambda x: f"{x['start']} - {x['end']}" if isinstance(x, dict) else str(x),
                    resp["values"],
                )
            )
    return resp

ipv6_address: AdvancedDataType = AdvancedDataType(
    verbose_name="IPv6",
    description="Represents an IPv6 address",
    valid_data_types=["int"],
    translate_filter=cidr_translate_filter_func,
    translate_type=ipv6_func,
)

def ip_protocol_func(req: AdvancedDataTypeRequest) -> AdvancedDataTypeResponse:
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
        resp["error_message"] = "IP protocol must not be empty"
        return resp
    for val in req["values"]:
        if (0 <= val <= 255):
            string_value = str(val)
            resp["values"].append(string_value)
        else:
            resp["error_message"] = f"'{ val }' is not a valid IP protocol. Must be 0-3 digits."
            return resp

    resp["display_value"] = ", ".join(resp["values"])
    return resp

ip_protocol: AdvancedDataType = AdvancedDataType(
    verbose_name="IP Protocol",
    description="Represents an IP protocol number",
    valid_data_types=["int"],
    translate_filter=translate_filter_func,
    translate_type=ip_protocol_func,
)

def stream_id_func(req: AdvancedDataTypeRequest) -> AdvancedDataTypeResponse:
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
        resp["error_message"] = "Stream ID must not be empty"
        return resp
    for val in req["values"]:
        if (val in STREAM_DICT):
            resp["values"].append(val)
        else:
            try:
                key = list(STREAM_DICT.keys())[list(STREAM_DICT.values()).index(val)]
                resp["values"].append(key)
            except ValueError:
                resp["error_message"] = f"'{ val }' is not a valid Stream ID. Did not match a known Stream ID or name."
                return resp

    resp["display_value"] = ", ".join(str(resp["values"]))
    return resp

stream_id: AdvancedDataType = AdvancedDataType(
    verbose_name="Stream ID",
    description="Represents a Stream ID",
    valid_data_types=["str", "int"],
    translate_filter=translate_filter_func,
    translate_type=stream_id_func,
)

def tcp_sequence_func(req: AdvancedDataTypeRequest) -> AdvancedDataTypeResponse:
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
        resp["error_message"] = "TCP sequence must not be empty"
        return resp
    else:
        for val in req["values"]:
            string_value = str(val)
            if re.search("^[a-zA-Z]*.[a-zA-Z]*?(.[a-zA-Z0-9]+)*$", string_value):
                resp["values"].append(string_value)
            else:
                resp["error_message"] = f"'{ val }' is not a valid TCP sequence. Must be a 32-bit signed integer."
                return resp

        resp["display_value"] = ", ".join(resp["values"])
        return resp

tcp_sequence: AdvancedDataType = AdvancedDataType(
    verbose_name="TCP Sequence",
    description="Represents a TCP sequence",
    valid_data_types=["int"],
    translate_filter=translate_filter_func,
    translate_type=tcp_sequence_func,
)

def zone_func(req: AdvancedDataTypeRequest) -> AdvancedDataTypeResponse:
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
        resp["error_message"] = "Zone must not be empty"
        return resp
    for val in req["values"]:
        string_value = str(val)
        if re.search("^EXT$|^DMZ$|^INT$|^[0-9]{2}$", string_value, re.IGNORECASE):
            resp["values"].append(string_value)
        else:
            resp["error_message"] = f"'{ val }' is not a valid zone. Must be either EXT, DMZ, INT, or a two-digit number."
            return resp

    resp["display_value"] = ", ".join(resp["values"])
    return resp


zone: AdvancedDataType = AdvancedDataType(
    verbose_name="Zone",
    description="Represents a zone",
    valid_data_types=["str"],
    translate_filter=translate_filter_func,
    translate_type=zone_func,
)

def uri_func(req: AdvancedDataTypeRequest) -> AdvancedDataTypeResponse:
    """
    Convert a passed in AdvancedDataTypeRequest to an AdvancedDataTypeResponse
    """
    resp: AdvancedDataTypeResponse = {
        "values": [],
        "error_message": "",
        "display_value": "",
        "valid_filter_operators": EQUAL_NULLABLE_OPERATOR_SET + PATTERN_MATCHING_OPERATOR_SET,
    }
    if req["operator"] in ['IS NULL', 'IS NOT NULL']:
        return resp
    elif req["values"] == [""]:
        resp["error_message"] = "URI must not be empty"
        return resp
    elif req["operator"] in ['LIKE', 'ILIKE']:
        for val in req["values"]:
            resp["values"].append(str(val))
        return resp
    else:
        for val in req["values"]:
            resp["values"].append(str(val))

        resp["display_value"] = ", ".join(resp["values"])
        return resp


uri: AdvancedDataType = AdvancedDataType(
    verbose_name="URI",
    description="Represents a URI",
    valid_data_types=["str"],
    translate_filter=translate_filter_func,
    translate_type=uri_func
)

def url_func(req: AdvancedDataTypeRequest) -> AdvancedDataTypeResponse:
    """
    Convert a passed in AdvancedDataTypeRequest to an AdvancedDataTypeResponse
    """
    resp: AdvancedDataTypeResponse = {
        "values": [],
        "error_message": "",
        "display_value": "",
        "valid_filter_operators": EQUAL_NULLABLE_OPERATOR_SET + PATTERN_MATCHING_OPERATOR_SET,
    }
    if req["operator"] in ['IS NULL', 'IS NOT NULL']:
        return resp
    elif req["values"] == [""]:
        resp["error_message"] = "URL must not be empty"
        return resp
    elif req["operator"] in ['LIKE', 'ILIKE']:
        for val in req["values"]:
            resp["values"].append(str(val))
        return resp
    else:
        for val in req["values"]:
            resp["values"].append(str(val))
        resp["display_value"] = ", ".join(resp["values"])
        return resp


url: AdvancedDataType = AdvancedDataType(
    verbose_name="URL",
    description="Represents a URL",
    valid_data_types=["str"],
    translate_filter=translate_filter_func,
    translate_type=url_func
)

def file_md5_func(req: AdvancedDataTypeRequest) -> AdvancedDataTypeResponse:
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
        resp["error_message"] = "FileMD5 must not be empty"
        return resp
    for val in req["values"]:
        string_value = str(val)
        if re.search("^[a-fA-F0-9]{32}$", string_value):
            resp["values"].append(string_value)
        else:
            if (len(string_value) != 32):
                resp["error_message"] = f"'{ val }' is not a valid FileMD5. Expected 32 characters. Received {len(string_value)}."
                return resp
            else:
                resp["error_message"] = f"'{ val }' is not a valid FileMD5. Invalid hex string characters. Accepted characters: a-f, A-F, 0-9"
                return resp

    resp["display_value"] = ", ".join(resp["values"])
    return resp


file_md5: AdvancedDataType = AdvancedDataType(
    verbose_name="FileMD5",
    description="Represents an MD5 hash of a file",
    valid_data_types=["str"],
    translate_filter=translate_filter_func,
    translate_type=file_md5_func,
)

def safely_get_int_value(string_number):
    try:
        return int(string_number)
    except ValueError:
        return 0

def asn_func(req: AdvancedDataTypeRequest) -> AdvancedDataTypeResponse:
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
        resp["error_message"] = "ASN must not be empty"
        return resp
    for val in req["values"]:
        string_value = str(val)
        """
        Seemed easier to just check the range given it can only be between certain values.
        https://www.cloudflare.com/learning/network-layer/what-is-an-autonomous-system/#What%20Is%20An%20Autonomous%20System%20Number%20(ASN)?
        Note that sometimes they are presented as AS(num), but existing ASNs on Superset are just numbers
        so we will keep it that way for consistency.
        """
        int_value = safely_get_int_value(string_value)
        if (MIN_ASN_16B <= int_value <= MAX_ASN_16B ) or (MIN_ASN_32B <= int_value <= MAX_ASN_32B):
            resp["values"].append(string_value)
        else:
            resp["error_message"] = f"'{ val }' is not a valid ASN. Expected a value between 1 and 65534, or between 131072 and 4294967294. Received {string_value}."
            return resp

    resp["display_value"] = ", ".join(resp["values"])
    return resp


asn: AdvancedDataType = AdvancedDataType(
    verbose_name="ASN (Autonomous System Number)",
    description="Represents an ASN (Autonomous System Number)",
    valid_data_types=["int"],
    translate_filter=translate_filter_func,
    translate_type=asn_func
)

def validate_azure_id(name: str, req: AdvancedDataTypeRequest) -> AdvancedDataTypeResponse:
    """
    Validates given UUID and converts passed in AdvancedDataTypeRequest to an AdvancedDataTypeResponse
    """
    resp: AdvancedDataTypeResponse = {
        "values": [],
        "error_message": "",
        "display_value": "",
        "valid_filter_operators": EQUAL_NULLABLE_OPERATOR_SET,
    }
    if req["values"] == [""]:
        resp["error_message"] = "{name} must not be empty"
        return resp
    for val in req["values"]:
        string_value = str(val)
        if re.search("^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$", string_value):
            resp["values"].append(string_value)
        else:
            if (len(string_value) != 36):
                resp["error_message"] = f"'{ val }' is not a valid '{name}'. Expected 36 characters. Received {len(string_value)}."
                return resp
            else:
                resp["error_message"] = f"'{ val }' is not a valid '{name}'. Must be letters and numbers separated by dashes, of format 8-4-4-4-12, where each digit represents the length of that section."
                return resp

    resp["display_value"] = ", ".join(resp["values"])
    return resp

def azure_object_id_func(req: AdvancedDataTypeRequest) -> AdvancedDataTypeResponse:
    return validate_azure_id("Azure Object ID", req)

azure_object_id: AdvancedDataType = AdvancedDataType(
    verbose_name="Azure Object ID",
    description="Represents an Azure Object ID",
    valid_data_types=["str"],
    translate_filter=translate_filter_func,
    translate_type=azure_object_id_func,
)

def azure_application_id_func(req: AdvancedDataTypeRequest) -> AdvancedDataTypeResponse:
    return validate_azure_id("Azure Application ID", req)

azure_application_id: AdvancedDataType = AdvancedDataType(
    verbose_name="Azure Application ID",
    description="Represents an Azure Application ID",
    valid_data_types=["str"],
    translate_filter=translate_filter_func,
    translate_type=azure_application_id_func,
)

def country_code_func(req: AdvancedDataTypeRequest) -> AdvancedDataTypeResponse:
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
        resp["error_message"] = "Country code must not be empty"
        return resp
    for val in req["values"]:
        string_value = str(val)
        #Can match the three ISO-3166-1 country codes (2/3 Letters or 3 Numbers)
        #https://en.wikipedia.org/wiki/List_of_ISO_3166_country_codes
        if re.search("^[A-Z]{2,3}$|^[0-9]{3}$", string_value):
            resp["values"].append(string_value)
        else:
            if (len(string_value) < 2 or len(string_value) > 3):
                resp["error_message"] = f"'{ val }' is not a valid country code. Expected 2-3 uppercase letters or 3 numbers. Received {len(string_value)}."
                return resp
            else:
                resp["error_message"] = f"'{ val }' is not a valid country code. Must be 2-3 uppercase letters or 3 numbers."
                return resp

    resp["display_value"] = ", ".join(resp["values"])
    return resp


country_code: AdvancedDataType = AdvancedDataType(
    verbose_name="Country code",
    description="Represents a country code",
    valid_data_types=["str"],
    translate_filter=translate_filter_func,
    translate_type=country_code_func,
)

def is_json(string_value) -> bool:
    try:
        json.loads(string_value)
    except ValueError as e:
        return False
    return True

def aws_principal_id_func(req: AdvancedDataTypeRequest) -> AdvancedDataTypeResponse:
    """
    Convert a passed in AdvancedDataTypeRequest to an AdvancedDataTypeResponse
    """
    resp: AdvancedDataTypeResponse = {
        "values": [],
        "error_message": "",
        "display_value": "",
        "valid_filter_operators": EQUAL_NULLABLE_OPERATOR_SET,
    }

    if req["operator"] in ['IS NULL', 'IS NOT NULL']:
        return resp
    elif req["values"] == [""]:
        resp["error_message"] = "AWS Principal ID must not be empty"
        return resp
    else:
        for val in req["values"]:
            string_value = str(val)
            """
            Intentionally very broad because the principal ID can take various forms as long as it follows
            the "Principal" : {} structure.
            https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_elements_principal.html#Principal_specifying
            """
            if re.search("^\"Principal\"\s*:\s*\{.*\}", string_value, re.DOTALL):
                if (is_json("{" + string_value + "}")):
                    resp["values"].append(string_value)
                else:
                    resp["error_message"] = f"The value after \"Principal\": must be valid JSON. Received '{ val }'."
                    return resp

            else:
                resp["error_message"] = f"'{ val }' is not a valid AWS Principal ID. Must be of format \"Principal\": JSON"
                return resp

        resp["display_value"] = ", ".join(resp["values"])
        return resp


aws_principal_id: AdvancedDataType = AdvancedDataType(
    verbose_name="AWS Principal ID",
    description="Represents an AWS Principal ID",
    valid_data_types=["str"],
    translate_filter=translate_filter_func,
    translate_type=aws_principal_id_func,
)

def cpoints_func(req: AdvancedDataTypeRequest) -> AdvancedDataTypeResponse:
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
        resp["error_message"] = "CPOINTS must not be empty"
        return resp
    else:
        for val in req["values"]:
            string_value = str(val)
            if req["operator"] in ['IN', 'NOT_IN']:
                    if re.search('"[0-9]{2}:[a-f0-9]{2}(?::[0-9]{1,4})?"', string_value):
                        resp["values"].append(string_value)
                    else:
                        resp["error_message"] = f"'{ val }' was not found in any CPOINT array."
                        return resp

            elif re.search('^\["[0-9]{2}:[a-f0-9]{2}(?::[0-9]{1,4})?"(, "[0-9]{2}:[a-f0-9]{2}(?::[0-9]{1,4})?")*\]$', string_value):
                resp["values"].append(string_value)
            else:
                resp["error_message"] = f"'{ val }' is not a valid CPOINTS array. Expected format: r"'^\["[0-9]{2}:[a-f0-9]{2}(?::[0-9]{1,4})?"(, "[0-9]{2}:[a-f0-9]{2}(?::[0-9]{1,4})?")*\]$'""
                return resp

    resp["display_value"] = ", ".join(resp["values"])
    return resp


cpoints: AdvancedDataType = AdvancedDataType(
    verbose_name="CPOINTS",
    description="Represents an array of CPOINTS",
    valid_data_types=["array"],
    translate_filter=translate_filter_func,
    translate_type=cpoints_func,
)

def cbs_workload_func(req: AdvancedDataTypeRequest) -> AdvancedDataTypeResponse:
    """
    Convert a passed in AdvancedDataTypeRequest to an AdvancedDataTypeResponse
    """
    resp: AdvancedDataTypeResponse = {
        "values": [],
        "error_message": "",
        "display_value": "",
        "valid_filter_operators": EQUAL_NULLABLE_OPERATOR_SET + PATTERN_MATCHING_OPERATOR_SET,
    }
    if req["values"] == [""]:
        resp["error_message"] = "CBS workload must not be empty"
        return resp
    elif req["operator"] in ['LIKE', 'ILIKE']:
        for val in req["values"]:
            resp["values"].append(str(val))
        return resp
    else:
        for val in req["values"]:
            string_value = str(val)
            if re.search("^[a-zA-Z]*\.[a-zA-Z]*?(\.[a-zA-Z0-9]+)*$", string_value):
                resp["values"].append(string_value)
            else:
                resp["error_message"] = f"'{ val }' is not a valid CBS workload. Must contain at least three strings separated by periods."
                return resp

        resp["display_value"] = ", ".join(resp["values"])
        return resp


cbs_workload: AdvancedDataType = AdvancedDataType(
    verbose_name="CBS Workload",
    description="Represents a CBS workload",
    valid_data_types=["str"],
    translate_filter=translate_filter_func,
    translate_type=cbs_workload_func,
)

def domain_func(req: AdvancedDataTypeRequest) -> AdvancedDataTypeResponse:
    """
    Convert a passed in AdvancedDataTypeRequest to an AdvancedDataTypeResponse
    """
    resp: AdvancedDataTypeResponse = {
        "values": [],
        "error_message": "",
        "display_value": "",
        "valid_filter_operators": EQUAL_NULLABLE_OPERATOR_SET + PATTERN_MATCHING_OPERATOR_SET,
    }
    if req["operator"] in ['IS NULL', 'IS NOT NULL']:
        return resp
    elif req["values"] == [""]:
        resp["error_message"] = "Domain must not be empty"
        return resp
    elif req["operator"] in ['LIKE', 'ILIKE']:
        for val in req["values"]:
            resp["values"].append(str(val))
        return resp
    else:
        for val in req["values"]:
            resp["values"].append(str(val))

    resp["display_value"] = ", ".join(resp["values"])
    return resp


domain: AdvancedDataType = AdvancedDataType(
    verbose_name="Domain",
    description="Represents an internet domain",
    valid_data_types=["str"],
    translate_filter=translate_filter_func,
    translate_type=domain_func,
)

def ipv6_func(req: AdvancedDataTypeRequest) -> AdvancedDataTypeResponse:
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
        resp["error_message"] = "IPv6 address must not be empty"
        return resp
    for val in req["values"]:
        string_value = str(val)
        try:
            ip_range = (
                ipaddress.ip_network(int(string_value), strict=False)
                if string_value.isnumeric()
                else ipaddress.ip_network(string_value, strict=False)
            )

            if ip_range.version != 6:
                raise TypeError(f"'{ val }' is not a valid IPv6 address.")

            resp["values"].append(
                {"start": int(ip_range[0]), "end": int(ip_range[-1])}
                if ip_range[0] != ip_range[-1]
                else int(ip_range[0])
            )
        except ValueError as ex:
            resp["error_message"] = f"'{ val }' is not a valid IPv6 address."
            break
        except TypeError as ex:
            resp["error_message"] = str(ex)
            break
        else:
            resp["display_value"] = ", ".join(
                map(
                    lambda x: f"{x['start']} - {x['end']}" if isinstance(x, dict) else str(x),
                    resp["values"],
                )
            )
    return resp

ipv6_address: AdvancedDataType = AdvancedDataType(
    verbose_name="IPv6",
    description="Represents an IPv6 address",
    valid_data_types=["int"],
    translate_filter=cidr_translate_filter_func,
    translate_type=ipv6_func,
)

def ip_protocol_func(req: AdvancedDataTypeRequest) -> AdvancedDataTypeResponse:
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
        resp["error_message"] = "IP protocol must not be empty"
        return resp
    for val in req["values"]:
        if (0 <= val <= 255):
            string_value = str(val)
            resp["values"].append(string_value)
        else:
            resp["error_message"] = f"'{ val }' is not a valid IP protocol. Must be 0-3 digits."
            return resp

    resp["display_value"] = ", ".join(resp["values"])
    return resp

ip_protocol: AdvancedDataType = AdvancedDataType(
    verbose_name="IP Protocol",
    description="Represents an IP protocol number",
    valid_data_types=["int"],
    translate_filter=translate_filter_func,
    translate_type=ip_protocol_func,
)

def stream_id_func(req: AdvancedDataTypeRequest) -> AdvancedDataTypeResponse:
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
        resp["error_message"] = "Stream ID must not be empty"
        return resp
    for val in req["values"]:
        if (val in STREAM_DICT):
            resp["values"].append(val)
        else:
            try:
                key = list(STREAM_DICT.keys())[list(STREAM_DICT.values()).index(val)]
                resp["values"].append(key)
            except ValueError:
                resp["error_message"] = f"'{ val }' is not a valid Stream ID. Did not match a known Stream ID or name."
                return resp

    resp["display_value"] = ", ".join(str(resp["values"]))
    return resp

stream_id: AdvancedDataType = AdvancedDataType(
    verbose_name="Stream ID",
    description="Represents a Stream ID",
    valid_data_types=["str", "int"],
    translate_filter=translate_filter_func,
    translate_type=stream_id_func,
)

def tcp_sequence_func(req: AdvancedDataTypeRequest) -> AdvancedDataTypeResponse:
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
        resp["error_message"] = "TCP sequence must not be empty"
        return resp
    else:
        for val in req["values"]:
            string_value = str(val)
            if re.search("^[a-zA-Z]*.[a-zA-Z]*?(.[a-zA-Z0-9]+)*$", string_value):
                resp["values"].append(string_value)
            else:
                resp["error_message"] = f"'{ val }' is not a valid TCP sequence. Must be a 32-bit signed integer."
                return resp

        resp["display_value"] = ", ".join(resp["values"])
        return resp

tcp_sequence: AdvancedDataType = AdvancedDataType(
    verbose_name="TCP Sequence",
    description="Represents a TCP sequence",
    valid_data_types=["int"],
    translate_filter=translate_filter_func,
    translate_type=tcp_sequence_func,
)

def zone_func(req: AdvancedDataTypeRequest) -> AdvancedDataTypeResponse:
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
        resp["error_message"] = "Zone must not be empty"
        return resp
    for val in req["values"]:
        string_value = str(val)
        if re.search("^EXT$|^DMZ$|^INT$|^[0-9]{2}$", string_value, re.IGNORECASE):
            resp["values"].append(string_value)
        else:
            resp["error_message"] = f"'{ val }' is not a valid zone. Must be either EXT, DMZ, INT, or a two-digit number."
            return resp

    resp["display_value"] = ", ".join(resp["values"])
    return resp


zone: AdvancedDataType = AdvancedDataType(
    verbose_name="Zone",
    description="Represents a zone",
    valid_data_types=["str"],
    translate_filter=translate_filter_func,
    translate_type=zone_func,
)

def uri_func(req: AdvancedDataTypeRequest) -> AdvancedDataTypeResponse:
    """
    Convert a passed in AdvancedDataTypeRequest to an AdvancedDataTypeResponse
    """
    resp: AdvancedDataTypeResponse = {
        "values": [],
        "error_message": "",
        "display_value": "",
        "valid_filter_operators": EQUAL_NULLABLE_OPERATOR_SET + PATTERN_MATCHING_OPERATOR_SET,
    }
    if req["operator"] in ['IS NULL', 'IS NOT NULL']:
        return resp
    elif req["values"] == [""]:
        resp["error_message"] = "URI must not be empty"
        return resp
    elif req["operator"] in ['LIKE', 'ILIKE']:
        for val in req["values"]:
            resp["values"].append(str(val))
        return resp
    else:
        for val in req["values"]:
            resp["values"].append(str(val))

        resp["display_value"] = ", ".join(resp["values"])
        return resp


uri: AdvancedDataType = AdvancedDataType(
    verbose_name="URI",
    description="Represents a URI",
    valid_data_types=["str"],
    translate_filter=translate_filter_func,
    translate_type=uri_func
)

def url_func(req: AdvancedDataTypeRequest) -> AdvancedDataTypeResponse:
    """
    Convert a passed in AdvancedDataTypeRequest to an AdvancedDataTypeResponse
    """
    resp: AdvancedDataTypeResponse = {
        "values": [],
        "error_message": "",
        "display_value": "",
        "valid_filter_operators": EQUAL_NULLABLE_OPERATOR_SET + PATTERN_MATCHING_OPERATOR_SET,
    }
    if req["operator"] in ['IS NULL', 'IS NOT NULL']:
        return resp
    elif req["values"] == [""]:
        resp["error_message"] = "URL must not be empty"
        return resp
    elif req["operator"] in ['LIKE', 'ILIKE']:
        for val in req["values"]:
            resp["values"].append(str(val))
        return resp
    else:
        for val in req["values"]:
            resp["values"].append(str(val))
        resp["display_value"] = ", ".join(resp["values"])
        return resp


url: AdvancedDataType = AdvancedDataType(
    verbose_name="URL",
    description="Represents a URL",
    valid_data_types=["str"],
    translate_filter=translate_filter_func,
    translate_type=url_func
)

def file_md5_func(req: AdvancedDataTypeRequest) -> AdvancedDataTypeResponse:
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
        resp["error_message"] = "FileMD5 must not be empty"
        return resp
    for val in req["values"]:
        string_value = str(val)
        if re.search("^[a-fA-F0-9]{32}$", string_value):
            resp["values"].append(string_value)
        else:
            if (len(string_value) != 32):
                resp["error_message"] = f"'{ val }' is not a valid FileMD5. Expected 32 characters. Received {len(string_value)}."
                return resp
            else:
                resp["error_message"] = f"'{ val }' is not a valid FileMD5. Invalid hex string characters. Accepted characters: a-f, A-F, 0-9"
                return resp

    resp["display_value"] = ", ".join(resp["values"])
    return resp


file_md5: AdvancedDataType = AdvancedDataType(
    verbose_name="FileMD5",
    description="Represents an MD5 hash of a file",
    valid_data_types=["str"],
    translate_filter=translate_filter_func,
    translate_type=file_md5_func,
)

def safely_get_int_value(string_number):
    try:
        return int(string_number)
    except ValueError:
        return 0

def asn_func(req: AdvancedDataTypeRequest) -> AdvancedDataTypeResponse:
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
        resp["error_message"] = "ASN must not be empty"
        return resp
    for val in req["values"]:
        string_value = str(val)
        """
        Seemed easier to just check the range given it can only be between certain values.
        https://www.cloudflare.com/learning/network-layer/what-is-an-autonomous-system/#What%20Is%20An%20Autonomous%20System%20Number%20(ASN)?
        Note that sometimes they are presented as AS(num), but existing ASNs on Superset are just numbers
        so we will keep it that way for consistency.
        """
        int_value = safely_get_int_value(string_value)
        if (MIN_ASN_16B <= int_value <= MAX_ASN_16B ) or (MIN_ASN_32B <= int_value <= MAX_ASN_32B):
            resp["values"].append(string_value)
        else:
            resp["error_message"] = f"'{ val }' is not a valid ASN. Expected a value between 1 and 65534, or between 131072 and 4294967294. Received {string_value}."
            return resp

    resp["display_value"] = ", ".join(resp["values"])
    return resp


asn: AdvancedDataType = AdvancedDataType(
    verbose_name="ASN (Autonomous System Number)",
    description="Represents an ASN (Autonomous System Number)",
    valid_data_types=["int"],
    translate_filter=translate_filter_func,
    translate_type=asn_func
)

def validate_azure_id(name: str, req: AdvancedDataTypeRequest) -> AdvancedDataTypeResponse:
    """
    Validates given UUID and converts passed in AdvancedDataTypeRequest to an AdvancedDataTypeResponse
    """
    resp: AdvancedDataTypeResponse = {
        "values": [],
        "error_message": "",
        "display_value": "",
        "valid_filter_operators": EQUAL_NULLABLE_OPERATOR_SET,
    }
    if req["values"] == [""]:
        resp["error_message"] = "{name} must not be empty"
        return resp
    for val in req["values"]:
        string_value = str(val)
        if re.search("^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$", string_value):
            resp["values"].append(string_value)
        else:
            if (len(string_value) != 36):
                resp["error_message"] = f"'{ val }' is not a valid '{name}'. Expected 36 characters. Received {len(string_value)}."
                return resp
            else:
                resp["error_message"] = f"'{ val }' is not a valid '{name}'. Must be letters and numbers separated by dashes, of format 8-4-4-4-12, where each digit represents the length of that section."
                return resp

    resp["display_value"] = ", ".join(resp["values"])
    return resp

def azure_object_id_func(req: AdvancedDataTypeRequest) -> AdvancedDataTypeResponse:
    return validate_azure_id("Azure Object ID", req)

azure_object_id: AdvancedDataType = AdvancedDataType(
    verbose_name="Azure Object ID",
    description="Represents an Azure Object ID",
    valid_data_types=["str"],
    translate_filter=translate_filter_func,
    translate_type=azure_object_id_func,
)

def azure_application_id_func(req: AdvancedDataTypeRequest) -> AdvancedDataTypeResponse:
    return validate_azure_id("Azure Application ID", req)

azure_application_id: AdvancedDataType = AdvancedDataType(
    verbose_name="Azure Application ID",
    description="Represents an Azure Application ID",
    valid_data_types=["str"],
    translate_filter=translate_filter_func,
    translate_type=azure_application_id_func,
)

def country_code_func(req: AdvancedDataTypeRequest) -> AdvancedDataTypeResponse:
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
        resp["error_message"] = "Country code must not be empty"
        return resp
    for val in req["values"]:
        string_value = str(val)
        #Can match the three ISO-3166-1 country codes (2/3 Letters or 3 Numbers)
        #https://en.wikipedia.org/wiki/List_of_ISO_3166_country_codes
        if re.search("^[A-Z]{2,3}$|^[0-9]{3}$", string_value):
            resp["values"].append(string_value)
        else:
            if (len(string_value) < 2 or len(string_value) > 3):
                resp["error_message"] = f"'{ val }' is not a valid country code. Expected 2-3 uppercase letters or 3 numbers. Received {len(string_value)}."
                return resp
            else:
                resp["error_message"] = f"'{ val }' is not a valid country code. Must be 2-3 uppercase letters or 3 numbers."
                return resp

    resp["display_value"] = ", ".join(resp["values"])
    return resp


country_code: AdvancedDataType = AdvancedDataType(
    verbose_name="Country code",
    description="Represents a country code",
    valid_data_types=["str"],
    translate_filter=translate_filter_func,
    translate_type=country_code_func,
)

def is_json(string_value) -> bool:
    try:
        json.loads(string_value)
    except ValueError as e:
        return False
    return True

def aws_principal_id_func(req: AdvancedDataTypeRequest) -> AdvancedDataTypeResponse:
    """
    Convert a passed in AdvancedDataTypeRequest to an AdvancedDataTypeResponse
    """
    resp: AdvancedDataTypeResponse = {
        "values": [],
        "error_message": "",
        "display_value": "",
        "valid_filter_operators": EQUAL_NULLABLE_OPERATOR_SET,
    }

    if req["operator"] in ['IS NULL', 'IS NOT NULL']:
        return resp
    elif req["values"] == [""]:
        resp["error_message"] = "AWS Principal ID must not be empty"
        return resp
    else:
        for val in req["values"]:
            string_value = str(val)
            """
            Intentionally very broad because the principal ID can take various forms as long as it follows
            the "Principal" : {} structure.
            https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_elements_principal.html#Principal_specifying
            """
            if re.search("^\"Principal\"\s*:\s*\{.*\}", string_value, re.DOTALL):
                if (is_json("{" + string_value + "}")):
                    resp["values"].append(string_value)
                else:
                    resp["error_message"] = f"The value after \"Principal\": must be valid JSON. Received '{ val }'."
                    return resp

            else:
                resp["error_message"] = f"'{ val }' is not a valid AWS Principal ID. Must be of format \"Principal\": JSON"
                return resp

        resp["display_value"] = ", ".join(resp["values"])
        return resp


aws_principal_id: AdvancedDataType = AdvancedDataType(
    verbose_name="AWS Principal ID",
    description="Represents an AWS Principal ID",
    valid_data_types=["str"],
    translate_filter=translate_filter_func,
    translate_type=aws_principal_id_func,
)

def aws_organization_id_func(req: AdvancedDataTypeRequest) -> AdvancedDataTypeResponse:
    """
    Convert a passed in AdvancedDataTypeRequest to an AdvancedDataTypeResponse
    """
    resp: AdvancedDataTypeResponse = {
        "values": [],
        "error_message": "",
        "display_value": "",
        "valid_filter_operators": EQUAL_NULLABLE_OPERATOR_SET,
    }

    if req["operator"] in ['IS NULL', 'IS NOT NULL']:
        return resp
    elif req["values"] == [""]:
        resp["error_message"] = "AWS Organization ID must not be empty"
        return resp
    else:
        for val in req["values"]:
            string_value = str(val)
            #based on information from https://docs.aws.amazon.com/organizations/latest/APIReference/API_Organization.html
            if re.search("^o-[a-z0-9]{10,32}$", string_value):
                resp["values"].append(string_value)
            else:
                if (len(string_value) > 32 or len(string_value) < 10):
                    resp["error_message"] = f"'{ val }' is not a valid AWS Organization ID. Expected 10-32 characters. Received {len(string_value)}."
                elif (string_value[0] != "o" and string_value[1] != "-"):
                    resp["error_message"] = f"'{val}' is not a valid AWS Organization ID. Must begin with 'o-'."
                else:
                    resp["error_message"] = f"'{ val }' is not a valid AWS Organization ID. Invalid format."
                return resp

        resp["display_value"] = ", ".join(resp["values"])
        return resp


aws_organization_id: AdvancedDataType = AdvancedDataType(
    verbose_name="AWS Organization ID",
    description="represents an AWS Organization ID",
    valid_data_types=["str"],
    translate_filter=translate_filter_func,
    translate_type=aws_organization_id_func,
)

def aws_access_key_id_func(req: AdvancedDataTypeRequest) -> AdvancedDataTypeResponse:
    """
    Convert a passed in AdvancedDataTypeRequest to an AdvancedDataTypeResponse
    """
    resp: AdvancedDataTypeResponse = {
        "values": [],
        "error_message": "",
        "display_value": "",
        "valid_filter_operators": EQUAL_NULLABLE_OPERATOR_SET,
    }

    if req["operator"] in ['IS NULL', 'IS NOT NULL']:
        return resp
    elif req["values"] == [""]:
        resp["error_message"] = "AWS Access Key ID must not be empty"
        return resp
    else:
        for val in req["values"]:
            string_value = str(val)
            #based on information from https://docs.aws.amazon.com/IAM/latest/APIReference/API_AccessKey.html
            if re.search("^[a-zA-Z0-9]{16,128}$", string_value):
                resp["values"].append(string_value)
            else:
                if (len(string_value) > 128 or len(string_value) < 16):
                    resp["error_message"] = f"'{ val }' is not a valid AWS Access Key ID. Expected 16-128 characters. Received {len(string_value)}."
                else:
                    resp["error_message"] = f"'{ val }' is not a valid AWS Access Key ID. Invalid format."
                return resp

        resp["display_value"] = ", ".join(resp["values"])
        return resp


aws_access_key_id: AdvancedDataType = AdvancedDataType(
    verbose_name="AWS Access Key ID",
    description="represents an AWS Access Key ID",
    valid_data_types=["str"],
    translate_filter=translate_filter_func,
    translate_type=aws_access_key_id_func,
)
