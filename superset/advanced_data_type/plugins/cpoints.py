import re
from superset.advanced_data_type.plugins import translate_filter_func
from superset.advanced_data_type.plugins.operator_sets import EQUAL_NULLABLE_OPERATOR_SET, PATTERN_MATCHING_OPERATOR_SET
from superset.advanced_data_type.types import AdvancedDataType, AdvancedDataTypeRequest, AdvancedDataTypeResponse


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
        resp["error_message"] = "CPOINTs must not be empty"
        return resp
    else:
        item_regex = '^"?[0-9]{2}:[a-fA-F0-9]{2}(?::[0-9]{1,4})?"?$'
        array_regex = r'^\[\s*"[0-9]{2}:[a-fA-F0-9]{2}(?::[0-9]{1,4})?"(\s*,\s*"[0-9]{2}:[a-fA-F0-9]{2}(?::[0-9]{1,4})?")*\s*\]$'
        for val in req["values"]:
            if re.search(array_regex, str(val)):
                resp["values"].append(val)
            elif re.search(item_regex, str(val)):
                resp["values"].append(val)
            else:
                resp["error_message"] = f"'{val}' is not a valid format:\nSinge CPOINT '{item_regex}' \nor Array '{array_regex}'."
                return resp

    resp["display_value"] = ", ".join(resp["values"])
    return resp


cpoints: AdvancedDataType = AdvancedDataType(
    verbose_name="CPOINTs",
    description="Represents an array of CPOINTs",
    valid_data_types=["array"],
    translate_filter=translate_filter_func,
    translate_type=cpoints_func,
)
