from superset.advanced_data_type.plugins import translate_filter_func
from superset.advanced_data_type.plugins.operator_sets import EQUAL_NULLABLE_OPERATOR_SET, PATTERN_MATCHING_OPERATOR_SET
from superset.advanced_data_type.types import AdvancedDataType, AdvancedDataTypeRequest, AdvancedDataTypeResponse


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
