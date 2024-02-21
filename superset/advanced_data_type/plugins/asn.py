import re
from superset.advanced_data_type.plugins import translate_filter_func
from superset.advanced_data_type.plugins.operator_sets import EQUAL_NULLABLE_OPERATOR_SET, PATTERN_MATCHING_OPERATOR_SET
from superset.advanced_data_type.plugins.utils.safely_get_int_value import safely_get_int_value
from superset.advanced_data_type.types import AdvancedDataType, AdvancedDataTypeRequest, AdvancedDataTypeResponse

MIN_ASN_16B = 1
MAX_ASN_16B = 65534
MIN_ASN_32B = 131072
MAX_ASN_32B = 4294967294

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
