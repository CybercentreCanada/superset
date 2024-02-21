from typing import Any, List
from sqlalchemy import Column
from superset.utils.core import FilterOperator

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
        if operator == FilterOperator.LIKE.value:
            return_expression = col.like(value)
        if operator == FilterOperator.ILIKE.value:
            return_expression = col.ilike(value)
    return return_expression
