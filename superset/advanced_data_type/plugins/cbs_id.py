from superset.advanced_data_type.plugins import translate_filter_func
from superset.advanced_data_type.plugins.operator_sets import EQUAL_NULLABLE_OPERATOR_SET
from superset.advanced_data_type.types import AdvancedDataType, AdvancedDataTypeRequest, AdvancedDataTypeResponse
import re

def cbs_id_func(req: AdvancedDataTypeRequest) -> AdvancedDataTypeResponse:
    """
    Convert a passed in AdvancedDataTypeRequest to an AdvancedDataTypeResponse
    """
    resp: AdvancedDataTypeResponse = {
        "values": [],
        "error_message": "",
        "display_value": "",
        "valid_filter_operators": EQUAL_NULLABLE_OPERATOR_SET,
    }
    if req["operator"] in ['IS NULL', 'IS NOT NULL']:
        return resp
    elif req["values"] == [""]:
        resp["error_message"] = "CBS ID must not be empty"
        return resp
    else:
        for val in req["values"]:
            string_value = str(val)
            if re.search("^[A-Fa-f0-9]{8}\-[A-Fa-f0-9]{4}\-[A-Fa-f0-9]{4}\-[A-Fa-f0-9]{4}\-[A-Fa-f0-9]{12}$", string_value):
                resp["values"].append(string_value)
            else:
                character_block_lengths = [len(block) for block in string_value.split("-")]

                if (len(string_value) != 36):
                    resp["error_message"] = f"'{ val }' is not a valid CBS ID. Expected 36 characters. Received {len(string_value)}."
                    return resp
                elif (character_block_lengths != [8,4,4,4,12]):
                    resp["error_message"] = f"'{ val }' is not a valid CBS ID. Invalid format."
                    return resp
                else:
                    resp["error_message"] = f"'{ val }' is not a valid CBS ID. Invalid characters. Accepted characters: a-f, A-F, 0-9, -"
                    return resp

        resp["display_value"] = ", ".join(resp["values"])
        return resp


cbs_id: AdvancedDataType = AdvancedDataType(
    verbose_name="CBS ID",
    description="Represents a CBS ID",
    valid_data_types=["str"],
    translate_filter=translate_filter_func,
    translate_type=cbs_id_func,
)
