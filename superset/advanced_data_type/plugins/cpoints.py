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
        item_regex = r'^"?[0-9]{2}:[a-fA-F0-9]{2}(?::[0-9]{1,4})?"?$'
        array_regex = r'^\[\s*.*\s*\]$'
        for val in req["values"]:
            string_value = str(val)
            if re.search(array_regex, string_value):
                items = string_value[1:-1].split(',')
                for item in items:
                    item = item.strip()
                    if re.search(item_regex, item):
                        resp["values"].append(item)
                    else:
                        resp["error_message"] = f"'{item}' is not a valid format:\nSingle CPOINT '{item_regex}'."
                        return resp
            elif re.search(item_regex, string_value):
                resp["values"].append(string_value)
            else:
                resp["error_message"] = f"'{string_value}' is not a valid format:\nSingle CPOINT '{item_regex}' \nor Array '{array_regex}'."
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
