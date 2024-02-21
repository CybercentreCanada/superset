import re
from superset.advanced_data_type.plugins import translate_filter_func
from superset.advanced_data_type.plugins.operator_sets import EQUAL_NULLABLE_OPERATOR_SET, PATTERN_MATCHING_OPERATOR_SET
from superset.advanced_data_type.types import AdvancedDataType, AdvancedDataTypeRequest, AdvancedDataTypeResponse

def aws_access_key_id_func(req: AdvancedDataTypeRequest) -> AdvancedDataTypeResponse:
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
        resp["error_message"] = "AWS Access Key ID must not be empty"
        return resp
    else:
        for val in req["values"]:
            string_value = str(val)
            #based on information from https://docs.aws.amazon.com/IAM/latest/APIReference/API_AccessKey.html
            if re.search("^[a-zA-Z0-9]{16,128}$", string_value):
                resp["values"].append(string_value)
            else:
                if (len(string_value) > 128 or len(string_value) < 16):
                    resp["error_message"] = f"'{ val }' is not a valid AWS Access Key ID. Expected 16-128 characters. Received {len(string_value)}."
                else:
                    resp["error_message"] = f"'{ val }' is not a valid AWS Access Key ID. Invalid format."
                return resp

        resp["display_value"] = ", ".join(resp["values"])
        return resp


aws_access_key_id: AdvancedDataType = AdvancedDataType(
    verbose_name="AWS Access Key ID",
    description="Represents an AWS Access Key ID",
    valid_data_types=["str"],
    translate_filter=translate_filter_func,
    translate_type=aws_access_key_id_func,
)
