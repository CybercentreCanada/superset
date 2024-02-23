import json
import re
from superset.advanced_data_type.plugins.operator_sets import EQUAL_NULLABLE_OPERATOR_SET

from superset.advanced_data_type.types import AdvancedDataTypeRequest, AdvancedDataTypeResponse


def is_json(string_value) -> bool:
    try:
        json.loads(string_value)
    except ValueError as e:
        return False
    return True

def safely_get_int_value(string_number):
    try:
        return int(string_number)
    except ValueError:
        return -1

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
