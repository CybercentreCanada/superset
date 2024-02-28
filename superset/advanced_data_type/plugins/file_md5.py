import re
from superset.advanced_data_type.plugins import translate_filter_func
from superset.advanced_data_type.plugins.operator_sets import EQUAL_NULLABLE_OPERATOR_SET
from superset.advanced_data_type.types import AdvancedDataType, AdvancedDataTypeRequest, AdvancedDataTypeResponse

def file_md5_func(req: AdvancedDataTypeRequest) -> AdvancedDataTypeResponse:
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
        resp["error_message"] = "FileMD5 must not be empty"
        return resp
    for val in req["values"]:
        string_value = str(val)
        if re.search("^[a-fA-F0-9]{32}$", string_value):
            resp["values"].append(string_value)
        else:
            if (len(string_value) != 32):
                resp["error_message"] = f"'{ val }' is not a valid FileMD5. Expected 32 characters. Received {len(string_value)}."
                return resp
            else:
                resp["error_message"] = f"'{ val }' is not a valid FileMD5. Invalid hex string characters. Accepted characters: a-f, A-F, 0-9"
                return resp

    resp["display_value"] = ", ".join(resp["values"])
    return resp


file_md5: AdvancedDataType = AdvancedDataType(
    verbose_name="File MD5",
    description="Represents an MD5 hash of a file",
    valid_data_types=["str"],
    translate_filter=translate_filter_func,
    translate_type=file_md5_func,
)
