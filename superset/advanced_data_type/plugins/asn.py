from superset.advanced_data_type.plugins import translate_filter_func
from superset.advanced_data_type.plugins.operator_sets import EQUAL_NULLABLE_OPERATOR_SET
from superset.advanced_data_type.types import AdvancedDataType, AdvancedDataTypeRequest, AdvancedDataTypeResponse

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
        try:
            if (0 <= val <= 4294967295):
                resp["values"].append(str(val))
            else:
                resp["error_message"] = f"'{ val }' is not a valid ASN. Expected a number between 0 and 4294967295. Received {str(val)}."
                return resp
        except TypeError:
                resp["error_message"] = f"'{ val }' is not a valid ASN. Must be a number "
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
