import re
from superset.advanced_data_type.plugins import translate_filter_func
from superset.advanced_data_type.plugins.operator_sets import EQUAL_NULLABLE_OPERATOR_SET
from superset.advanced_data_type.plugins.utils import is_json
from superset.advanced_data_type.types import AdvancedDataType, AdvancedDataTypeRequest, AdvancedDataTypeResponse


def aws_principal_id_func(req: AdvancedDataTypeRequest) -> AdvancedDataTypeResponse:
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
        resp["error_message"] = "AWS Principal ID must not be empty"
        return resp
    else:
        for val in req["values"]:
            string_value = str(val)
            """
            Intentionally very broad because the principal ID can take various forms as long as it follows
            the "Principal" : {} structure.
            https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_elements_principal.html#Principal_specifying
            """
            if re.search("^\"Principal\"\s*:\s*\{.*\}$", string_value, re.DOTALL):
                if is_json(f"{{ {string_value} }}"):
                    resp["values"].append(string_value)
                else:
                    resp["error_message"] = f"The value after \"Principal\": must be valid JSON. Received '{ val }'."
                    return resp

            else:
                resp["error_message"] = f"'{ val }' is not a valid AWS Principal ID. Must be of format \"Principal\": JSON"
                return resp

        resp["display_value"] = ", ".join(resp["values"])
        return resp


aws_principal_id: AdvancedDataType = AdvancedDataType(
    verbose_name="AWS Principal ID",
    description="Represents an AWS Principal ID",
    valid_data_types=["str"],
    translate_filter=translate_filter_func,
    translate_type=aws_principal_id_func,
)
