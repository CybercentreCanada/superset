import re
from superset.advanced_data_type.plugins import translate_filter_func
from superset.advanced_data_type.plugins.operator_sets import EQUAL_NULLABLE_OPERATOR_SET, PATTERN_MATCHING_OPERATOR_SET
from superset.advanced_data_type.types import AdvancedDataType, AdvancedDataTypeRequest, AdvancedDataTypeResponse



def agent_id_func(req: AdvancedDataTypeRequest) -> AdvancedDataTypeResponse:
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
        resp["error_message"] = "Agent ID must not be empty"
        return resp
    elif req["operator"] in ['LIKE', 'ILIKE']:
        for val in req["values"]:
            resp["values"].append(str(val))
        return resp
    else:
        for val in req["values"]:
            string_value = str(val)
            if re.search("^[a-zA-Z0-9]{2}\.[a-zA-Z0-9]{2}\.[a-zA-Z0-9]{2,}\.[a-zA-Z0-9]{2}$", string_value):
                resp["values"].append(string_value)
            else:
                resp["error_message"] = f"'{ val }' is not a valid Agent ID. Must be four strings separated by periods, and of lengths 2.2.*.2"
                return resp

        resp["display_value"] = ", ".join(resp["values"])
        return resp


agent_id: AdvancedDataType = AdvancedDataType(
    verbose_name="Agent ID",
    description="Represents an Agent ID",
    valid_data_types=["str"],
    translate_filter=translate_filter_func,
    translate_type=agent_id_func,
)
