import re
from superset.advanced_data_type.plugins import translate_filter_func
from superset.advanced_data_type.plugins.operator_sets import EQUAL_NULLABLE_OPERATOR_SET
from superset.advanced_data_type.types import AdvancedDataType, AdvancedDataTypeRequest, AdvancedDataTypeResponse


def aws_organization_id_func(req: AdvancedDataTypeRequest) -> AdvancedDataTypeResponse:
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
        resp["error_message"] = "AWS Organization ID must not be empty"
        return resp
    else:
        for val in req["values"]:
            string_value = str(val)
            #based on information from https://docs.aws.amazon.com/organizations/latest/APIReference/API_Organization.html
            if re.search("^o-[a-z0-9]{10,32}$", string_value):
                resp["values"].append(string_value)
            else:
                if (len(string_value) > 32 or len(string_value) < 10):
                    resp["error_message"] = f"'{ val }' is not a valid AWS Organization ID. Expected 10-32 characters. Received {len(string_value)}."
                elif (string_value[0] != "o" and string_value[1] != "-"):
                    resp["error_message"] = f"'{val}' is not a valid AWS Organization ID. Must begin with 'o-'."
                else:
                    resp["error_message"] = f"'{ val }' is not a valid AWS Organization ID. Invalid format."
                return resp

        resp["display_value"] = ", ".join(resp["values"])
        return resp


aws_organization_id: AdvancedDataType = AdvancedDataType(
    verbose_name="AWS Organization ID",
    description="Represents an AWS Organization ID",
    valid_data_types=["str"],
    translate_filter=translate_filter_func,
    translate_type=aws_organization_id_func,
)
