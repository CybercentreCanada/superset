from superset.advanced_data_type.plugins import translate_filter_func
from superset.advanced_data_type.plugins.operator_sets import EQUAL_NULLABLE_OPERATOR_SET, PATTERN_MATCHING_OPERATOR_SET
from superset.advanced_data_type.types import AdvancedDataType, AdvancedDataTypeRequest, AdvancedDataTypeResponse
import re

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
