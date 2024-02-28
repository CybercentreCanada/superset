from superset.advanced_data_type.plugins import translate_filter_func
from superset.advanced_data_type.plugins.operator_sets import EQUAL_NULLABLE_OPERATOR_SET, PATTERN_MATCHING_OPERATOR_SET
from superset.advanced_data_type.types import AdvancedDataType, AdvancedDataTypeRequest, AdvancedDataTypeResponse
import re

def harmonized_email_id_func(req: AdvancedDataTypeRequest) -> AdvancedDataTypeResponse:
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
    elif req["operator"] in ['ILIKE']:
        for val in req["values"]:
            resp["values"].append(str(val))
        return resp
    elif req["values"] == [""]:
        resp["error_message"] = "Harmonized Email ID must not be empty"
        return resp
    else:
        for val in req["values"]:
            string_value = str(val)
            match = re.match(r"^(CBS|NBS)_(EMAIL)_([a-fA-F0-9]+)$", string_value)
            if match:
                resp["values"].append(string_value)
            else:
                character_blocks = match.groups()
                if (len(character_blocks) != 3):
                    resp["error_message"] = f"'{ val }' is not a valid Harmonized Email ID. Invalid format. Accepted format: <SENSOR>_EMAIL_<hex_string>"
                    return resp
                elif (character_blocks[0] != 'CBS' and character_blocks[0] != 'NBS'):
                    resp["error_message"] = f"'{ val }' is not a valid Harmonized Email ID. Invalid sensor type. Accepted types: CBS, NBS"
                    return resp
                elif (character_blocks[1] != 'EMAIL'):
                    resp["error_message"] = f"'{ val }' is not a valid Harmonized Email ID. Invalid second block. Accepted format: <SENSOR>_EMAIL_<hex_string>"
                    return resp
                elif len(character_blocks[2]) < 0:
                    resp["error_message"] = f"'{ val }' is not a valid Harmonized Email ID. Invalid third block. Accepted format: <SENSOR>_EMAIL_<hex_string>, where hex_string has 1 or more characters."
                    return resp
                else:
                    resp["error_message"] = f"'{ val }' is not a valid Harmonized Email ID. Invalid hex string characters. Accepted characters: a-f, A-F, 0-9"
                    return resp

        resp["display_value"] = ", ".join(resp["values"])
        return resp


harmonized_email_id: AdvancedDataType = AdvancedDataType(
    verbose_name="Harmonized Email ID",
    description="Represents a Harmonized Email ID",
    valid_data_types=["str"],
    translate_filter=translate_filter_func,
    translate_type=harmonized_email_id_func,
)
