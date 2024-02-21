import re
from superset.advanced_data_type.plugins import translate_filter_func
from superset.advanced_data_type.plugins.operator_sets import EQUAL_NULLABLE_OPERATOR_SET
from superset.advanced_data_type.types import AdvancedDataType, AdvancedDataTypeRequest, AdvancedDataTypeResponse

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
