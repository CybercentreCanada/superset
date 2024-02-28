from superset.advanced_data_type.plugins import translate_filter_func
from superset.advanced_data_type.plugins.operator_sets import EQUAL_NULLABLE_OPERATOR_SET
from superset.advanced_data_type.types import AdvancedDataType, AdvancedDataTypeRequest, AdvancedDataTypeResponse
import re

def aws_account_id_func(req: AdvancedDataTypeRequest) -> AdvancedDataTypeResponse:
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
        resp["error_message"] = "AWS Account ID must not be empty"
        return resp
    else:
        for val in req["values"]:
            string_value = str(val)
            if re.search("^[0-9]{12}$", string_value):
                resp["values"].append(string_value)
            else:
                resp["error_message"] = f"'{ val }' is not a valid AWS Account ID. Invalid format. Accepted format: ^[0-9]{12}$"
                return resp

        resp["display_value"] = ", ".join(resp["values"])
        return resp


aws_account_id: AdvancedDataType = AdvancedDataType(
    verbose_name="AWS Account ID",
    description="Represents an AWS Account ID",
    valid_data_types=["int"],
    translate_filter=translate_filter_func,
    translate_type=aws_account_id_func,
)
