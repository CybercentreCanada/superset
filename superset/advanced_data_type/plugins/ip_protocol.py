from superset.advanced_data_type.plugins import translate_filter_func
from superset.advanced_data_type.plugins.operator_sets import EQUAL_NULLABLE_OPERATOR_SET
from superset.advanced_data_type.types import AdvancedDataType, AdvancedDataTypeRequest, AdvancedDataTypeResponse

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
        try:
            if (0 <= val <= 255):
                resp["values"].append(str(val))
            else:
                resp["error_message"] = f"'{ val }' is not a valid IP protocol.  Must be a value between 0 and 255."
                return resp
        except:
            resp["error_message"] = f"'{ val }' is not a valid IP protocol.  Must be a value between 0 and 255."
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
