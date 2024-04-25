import re
from typing import Any, List

from sqlalchemy import Column
from superset.advanced_data_type.types import (
    AdvancedDataType,
    AdvancedDataTypeRequest,
    AdvancedDataTypeResponse,
)
from superset.utils.core import FilterOperator, FilterStringOperators

EML_SEARCH_STRING = "^((C|N)BS_EMAIL:\/\/)([0-9]{4}\/[0-9]{2}\/[0-9]{2}\/eml\/(c|n)bs\/).*(\.eml\.cart)$"

# Operator Sets

EQUAL_NULLABLE_OPERATOR_SET = [
            FilterStringOperators.EQUALS,
            FilterStringOperators.NOT_EQUALS,
            FilterStringOperators.IN,
            FilterStringOperators.NOT_IN,
            FilterStringOperators.IS_NOT_NULL,
            FilterStringOperators.IS_NULL,
        ]

def translate_filter_func(col: Column, operator: FilterOperator, values: List[Any]) -> Any:
    """
    Convert a passed in column, FilterOperator and
    list of values into an sqlalchemy expression
    """
    return_expression: Any
    if operator == FilterOperator.IN.value:
        return_expression = col.in_(values)
    elif operator == FilterOperator.NOT_IN.value:
        return_expression = ~(col.in_(values))
    elif operator == FilterOperator.IS_NULL.value:
        return_expression = col == None
    elif operator == FilterOperator.IS_NOT_NULL.value:
        return_expression = col != None
    elif len(values) == 1:
        value = values[0]
        if operator == FilterOperator.EQUALS.value:
            return_expression = col == value
        if operator == FilterOperator.NOT_EQUALS.value:
            return_expression = col != value
    return return_expression

def eml_path_func(req: AdvancedDataTypeRequest) -> AdvancedDataTypeResponse:
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
        resp["error_message"] = f"{eml_path.verbose_name} must not be empty"
        return resp
    for val in req["values"]:
        string_value = str(val)
        if re.search(EML_SEARCH_STRING, string_value):
            resp["values"].append(string_value)
        else:
            resp["error_message"] = f"'{ val }' is not a valid {eml_path.verbose_name}. EML_paths are in the format {EML_SEARCH_STRING}"
            return resp

    resp["display_value"] = ", ".join(resp["values"])
    return resp


eml_path: AdvancedDataType = AdvancedDataType(
    verbose_name="EMLPath",
    description="Represents a the EML path of an email",
    valid_data_types=["str"],
    translate_filter=translate_filter_func,
    translate_type=eml_path_func,
)