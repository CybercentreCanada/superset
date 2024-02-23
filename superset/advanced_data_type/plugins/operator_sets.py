from superset.utils.core import FilterStringOperators


CIDR_OPERATOR_SET = [
            FilterStringOperators.EQUALS,
            FilterStringOperators.GREATER_THAN_OR_EQUAL,
            FilterStringOperators.GREATER_THAN,
            FilterStringOperators.IN,
            FilterStringOperators.LESS_THAN,
            FilterStringOperators.LESS_THAN_OR_EQUAL,
        ]
EQUAL_NULLABLE_OPERATOR_SET = [
            FilterStringOperators.EQUALS,
            FilterStringOperators.NOT_EQUALS,
            FilterStringOperators.IN,
            FilterStringOperators.NOT_IN,
            FilterStringOperators.IS_NOT_NULL,
            FilterStringOperators.IS_NULL,
        ]
PATTERN_MATCHING_OPERATOR_SET = [
            FilterStringOperators.LIKE,
            FilterStringOperators.ILIKE,
        ]
