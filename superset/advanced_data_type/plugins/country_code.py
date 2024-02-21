import re
from superset.advanced_data_type.plugins import translate_filter_func
from superset.advanced_data_type.plugins.operator_sets import EQUAL_NULLABLE_OPERATOR_SET
from superset.advanced_data_type.types import AdvancedDataType, AdvancedDataTypeRequest, AdvancedDataTypeResponse

def country_code_func(req: AdvancedDataTypeRequest) -> AdvancedDataTypeResponse:
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
        resp["error_message"] = "Country code must not be empty"
        return resp
    for val in req["values"]:
        string_value = str(val)
        #Can match the three ISO-3166-1 country codes (2/3 Letters or 3 Numbers)
        #https://en.wikipedia.org/wiki/List_of_ISO_3166_country_codes
        if re.search("^[A-Z]{2,3}$|^[0-9]{3}$", string_value):
            resp["values"].append(string_value)
        else:
            if (len(string_value) < 2 or len(string_value) > 3):
                resp["error_message"] = f"'{ val }' is not a valid country code. Expected 2-3 uppercase letters or 3 numbers. Received {len(string_value)}."
                return resp
            else:
                resp["error_message"] = f"'{ val }' is not a valid country code. Must be 2-3 uppercase letters or 3 numbers."
                return resp

    resp["display_value"] = ", ".join(resp["values"])
    return resp


country_code: AdvancedDataType = AdvancedDataType(
    verbose_name="Country code",
    description="Represents a country code",
    valid_data_types=["str"],
    translate_filter=translate_filter_func,
    translate_type=country_code_func,
)
