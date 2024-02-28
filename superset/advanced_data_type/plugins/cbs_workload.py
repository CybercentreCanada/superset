import re
from superset.advanced_data_type.plugins import translate_filter_func
from superset.advanced_data_type.plugins.operator_sets import EQUAL_NULLABLE_OPERATOR_SET, PATTERN_MATCHING_OPERATOR_SET
from superset.advanced_data_type.types import AdvancedDataType, AdvancedDataTypeRequest, AdvancedDataTypeResponse


def cbs_workload_func(req: AdvancedDataTypeRequest) -> AdvancedDataTypeResponse:
    """
    Convert a passed in AdvancedDataTypeRequest to an AdvancedDataTypeResponse
    """
    resp: AdvancedDataTypeResponse = {
        "values": [],
        "error_message": "",
        "display_value": "",
        "valid_filter_operators": EQUAL_NULLABLE_OPERATOR_SET + PATTERN_MATCHING_OPERATOR_SET,
    }
    if req["values"] == [""]:
        resp["error_message"] = "CBS workload must not be empty"
        return resp
    elif req["operator"] in ['ILIKE']:
        for val in req["values"]:
            string_value = str(val)
            if re.search("^[a-zA-Z0-9]+(\.[a-zA-Z0-9]+){2,}$", string_value):
                resp["values"].append(string_value)
            else:
                resp["error_message"] = f"'{ val }' is not a valid CBS workload. Must contain at least three strings separated by periods."
                return resp
        return resp
    else:
        for val in req["values"]:
            string_value = str(val)
            if re.search("^[a-zA-Z0-9]+(\.[a-zA-Z0-9]+){2,}$", string_value):
                resp["values"].append(string_value)
            else:
                resp["error_message"] = f"'{ val }' is not a valid CBS workload. Must contain at least three strings separated by periods."
                return resp

        resp["display_value"] = ", ".join(resp["values"])
        return resp


cbs_workload: AdvancedDataType = AdvancedDataType(
    verbose_name="CBS Workload",
    description="Represents a CBS workload",
    valid_data_types=["str"],
    translate_filter=translate_filter_func,
    translate_type=cbs_workload_func,
)
