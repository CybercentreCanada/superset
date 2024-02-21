import re
from superset.advanced_data_type.plugins import translate_filter_func
from superset.advanced_data_type.plugins.operator_sets import EQUAL_NULLABLE_OPERATOR_SET, PATTERN_MATCHING_OPERATOR_SET
from superset.advanced_data_type.types import AdvancedDataType, AdvancedDataTypeRequest, AdvancedDataTypeResponse

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
