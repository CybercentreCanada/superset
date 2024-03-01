# Licensed to the Apache Software Foundation (ASF) under one
# or more contributor license agreements.  See the NOTICE file
# distributed with this work for additional information
# regarding copyright ownership.  The ASF licenses this file
# to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance
# with the License.  You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing,
# software distributed under the License is distributed on an
# "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
# KIND, either express or implied.  See the License for the
# specific language governing permissions and limitations
# under the License.
# isort:skip_file
"""Unit tests for Superset"""

import sqlalchemy
from sqlalchemy import Column, Integer, String
from superset.advanced_data_type.plugins.agent_id import agent_id_func
from superset.advanced_data_type.plugins.asn import asn_func
from superset.advanced_data_type.plugins.aws_access_key_id import aws_access_key_id_func
from superset.advanced_data_type.plugins.aws_account_id import aws_account_id_func
from superset.advanced_data_type.plugins.aws_arn import aws_arn_func
from superset.advanced_data_type.plugins.aws_organization_id import (
    aws_organization_id_func,
)
from superset.advanced_data_type.plugins.aws_principal_id import aws_principal_id_func
from superset.advanced_data_type.plugins.azure_application_id import (
    azure_application_id_func,
)
from superset.advanced_data_type.plugins.azure_object_id import azure_object_id_func
from superset.advanced_data_type.plugins.cbs_id import cbs_id as cbs_id, cbs_id_func
from superset.advanced_data_type.plugins.cbs_workload import cbs_workload_func
from superset.advanced_data_type.plugins.classification import classification_func
from superset.advanced_data_type.plugins.country_code import country_code_func
from superset.advanced_data_type.plugins.cpoints import cpoints_func
from superset.advanced_data_type.plugins.department import department_func
from superset.advanced_data_type.plugins.domain import domain_func
from superset.advanced_data_type.plugins.email_address import email_address_func
from superset.advanced_data_type.plugins.file_md5 import file_md5_func
from superset.advanced_data_type.plugins.file_sha256 import file_sha256_func
from superset.advanced_data_type.plugins.harmonized_email_id import (
    harmonized_email_id_func,
)
from superset.advanced_data_type.plugins.ip_protocol import ip_protocol_func
from superset.advanced_data_type.plugins.ipv6_address import ipv6_func
from superset.advanced_data_type.plugins.oid_tag import oid_tag_func
from superset.advanced_data_type.plugins.tcp_sequence import tcp_sequence_func
from superset.advanced_data_type.plugins.translate_filter_func import (
    translate_filter_func,
)
from superset.advanced_data_type.plugins.uri import uri_func
from superset.advanced_data_type.plugins.user_agent import user_agent_func
from superset.advanced_data_type.plugins.zone import zone_func
from superset.advanced_data_type.types import (
    AdvancedDataTypeRequest,
    AdvancedDataTypeResponse,
)
from superset.utils.core import FilterOperator, FilterStringOperators
from superset.advanced_data_type.plugins.operator_sets import (
    CIDR_OPERATOR_SET,
    EQUAL_NULLABLE_OPERATOR_SET,
    PATTERN_MATCHING_OPERATOR_SET,
)
from superset.advanced_data_type.plugins.internet_address import internet_address
from superset.advanced_data_type.plugins.internet_port import internet_port as port


# To run the unit tests below, use the following command in the root Superset folder:
# tox -e py38 -- tests/unit_tests/advanced_data_type/types_tests.py


def test_ip_func_valid_ip():
    """Test to see if the cidr_func behaves as expected when a valid IP is passed in"""
    cidr_request: AdvancedDataTypeRequest = {
        "advanced_data_type": "cidr",
        "values": ["1.1.1.1"],
    }
    cidr_response: AdvancedDataTypeResponse = {
        "values": [16843009],
        "error_message": "",
        "display_value": "16843009",
        "valid_filter_operators": [
            FilterStringOperators.EQUALS,
            FilterStringOperators.GREATER_THAN_OR_EQUAL,
            FilterStringOperators.GREATER_THAN,
            FilterStringOperators.IN,
            FilterStringOperators.LESS_THAN,
            FilterStringOperators.LESS_THAN_OR_EQUAL,
        ],
    }

    assert internet_address.translate_type(cidr_request) == cidr_response


def test_cidr_func_invalid_ip():
    """Test to see if the cidr_func behaves as expected when an invalid IP is passed in"""
    cidr_request: AdvancedDataTypeRequest = {
        "advanced_data_type": "cidr",
        "values": ["abc"],
    }
    cidr_response: AdvancedDataTypeResponse = {
        "values": [],
        "error_message": "'abc' does not appear to be an IPv4 or IPv6 network",
        "display_value": "",
        "valid_filter_operators": [
            FilterStringOperators.EQUALS,
            FilterStringOperators.GREATER_THAN_OR_EQUAL,
            FilterStringOperators.GREATER_THAN,
            FilterStringOperators.IN,
            FilterStringOperators.LESS_THAN,
            FilterStringOperators.LESS_THAN_OR_EQUAL,
        ],
    }

    assert internet_address.translate_type(cidr_request) == cidr_response


def test_port_translation_func_valid_port_number():
    """Test to see if the port_translation_func behaves as expected when a valid port number
    is passed in"""
    port_request: AdvancedDataTypeRequest = {
        "advanced_data_type": "port",
        "values": ["80"],
    }
    port_response: AdvancedDataTypeResponse = {
        "values": [[80]],
        "error_message": "",
        "display_value": "[80]",
        "valid_filter_operators": [
            FilterStringOperators.EQUALS,
            FilterStringOperators.GREATER_THAN_OR_EQUAL,
            FilterStringOperators.GREATER_THAN,
            FilterStringOperators.IN,
            FilterStringOperators.LESS_THAN,
            FilterStringOperators.LESS_THAN_OR_EQUAL,
        ],
    }

    assert port.translate_type(port_request) == port_response


def test_port_translation_func_valid_port_name():
    """Test to see if the port_translation_func behaves as expected when a valid port name
    is passed in"""
    port_request: AdvancedDataTypeRequest = {
        "advanced_data_type": "port",
        "values": ["https"],
    }
    port_response: AdvancedDataTypeResponse = {
        "values": [[443]],
        "error_message": "",
        "display_value": "[443]",
        "valid_filter_operators": [
            FilterStringOperators.EQUALS,
            FilterStringOperators.GREATER_THAN_OR_EQUAL,
            FilterStringOperators.GREATER_THAN,
            FilterStringOperators.IN,
            FilterStringOperators.LESS_THAN,
            FilterStringOperators.LESS_THAN_OR_EQUAL,
        ],
    }

    assert port.translate_type(port_request) == port_response


def test_port_translation_func_invalid_port_name():
    """Test to see if the port_translation_func behaves as expected when an invalid port name
    is passed in"""
    port_request: AdvancedDataTypeRequest = {
        "advanced_data_type": "port",
        "values": ["abc"],
    }
    port_response: AdvancedDataTypeResponse = {
        "values": [],
        "error_message": "'abc' does not appear to be a port name or number",
        "display_value": "",
        "valid_filter_operators": [
            FilterStringOperators.EQUALS,
            FilterStringOperators.GREATER_THAN_OR_EQUAL,
            FilterStringOperators.GREATER_THAN,
            FilterStringOperators.IN,
            FilterStringOperators.LESS_THAN,
            FilterStringOperators.LESS_THAN_OR_EQUAL,
        ],
    }

    assert port.translate_type(port_request) == port_response


def test_port_translation_func_invalid_port_number():
    """Test to see if the port_translation_func behaves as expected when an invalid port
    number is passed in"""
    port_request: AdvancedDataTypeRequest = {
        "advanced_data_type": "port",
        "values": ["123456789"],
    }
    port_response: AdvancedDataTypeResponse = {
        "values": [],
        "error_message": "'123456789' does not appear to be a port name or number",
        "display_value": "",
        "valid_filter_operators": [
            FilterStringOperators.EQUALS,
            FilterStringOperators.GREATER_THAN_OR_EQUAL,
            FilterStringOperators.GREATER_THAN,
            FilterStringOperators.IN,
            FilterStringOperators.LESS_THAN,
            FilterStringOperators.LESS_THAN_OR_EQUAL,
        ],
    }

    assert port.translate_type(port_request) == port_response


def test_cidr_translate_filter_func_equals():
    """Test to see if the cidr_translate_filter_func behaves as expected when the EQUALS
    operator is used"""

    input_column = Column("user_ip", Integer)
    input_operation = FilterOperator.EQUALS
    input_values = [16843009]

    cidr_translate_filter_response = input_column == input_values[0]

    assert internet_address.translate_filter(
        input_column, input_operation, input_values
    ).compare(cidr_translate_filter_response)


def test_cidr_translate_filter_func_not_equals():
    """Test to see if the cidr_translate_filter_func behaves as expected when the NOT_EQUALS
    operator is used"""

    input_column = Column("user_ip", Integer)
    input_operation = FilterOperator.NOT_EQUALS
    input_values = [16843009]

    cidr_translate_filter_response = input_column != input_values[0]

    assert internet_address.translate_filter(
        input_column, input_operation, input_values
    ).compare(cidr_translate_filter_response)


def test_cidr_translate_filter_func_greater_than_or_equals():
    """Test to see if the cidr_translate_filter_func behaves as expected when the
    GREATER_THAN_OR_EQUALS operator is used"""

    input_column = Column("user_ip", Integer)
    input_operation = FilterOperator.GREATER_THAN_OR_EQUALS
    input_values = [16843009]

    cidr_translate_filter_response: sqlalchemy.sql.expression.BinaryExpression = (
        input_column >= input_values[0]
    )

    assert internet_address.translate_filter(
        input_column, input_operation, input_values
    ).compare(cidr_translate_filter_response)


def test_cidr_translate_filter_func_greater_than():
    """Test to see if the cidr_translate_filter_func behaves as expected when the
    GREATER_THAN operator is used"""

    input_column = Column("user_ip", Integer)
    input_operation = FilterOperator.GREATER_THAN
    input_values = [16843009]

    cidr_translate_filter_response: sqlalchemy.sql.expression.BinaryExpression = (
        input_column > input_values[0]
    )

    assert internet_address.translate_filter(
        input_column, input_operation, input_values
    ).compare(cidr_translate_filter_response)


def test_cidr_translate_filter_func_less_than():
    """Test to see if the cidr_translate_filter_func behaves as expected when the LESS_THAN
    operator is used"""

    input_column = Column("user_ip", Integer)
    input_operation = FilterOperator.LESS_THAN
    input_values = [16843009]

    cidr_translate_filter_response: sqlalchemy.sql.expression.BinaryExpression = (
        input_column < input_values[0]
    )

    assert internet_address.translate_filter(
        input_column, input_operation, input_values
    ).compare(cidr_translate_filter_response)


def test_cidr_translate_filter_func_less_than_or_equals():
    """Test to see if the cidr_translate_filter_func behaves as expected when the
    LESS_THAN_OR_EQUALS operator is used"""

    input_column = Column("user_ip", Integer)
    input_operation = FilterOperator.LESS_THAN_OR_EQUALS
    input_values = [16843009]

    cidr_translate_filter_response: sqlalchemy.sql.expression.BinaryExpression = (
        input_column <= input_values[0]
    )

    assert internet_address.translate_filter(
        input_column, input_operation, input_values
    ).compare(cidr_translate_filter_response)


def test_cidr_translate_filter_func_in_single():
    """Test to see if the cidr_translate_filter_func behaves as expected when the IN operator
    is used with a single IP"""

    input_column = Column("user_ip", Integer)
    input_operation = FilterOperator.IN
    input_values = [16843009]

    cidr_translate_filter_response: sqlalchemy.sql.expression.BinaryExpression = (
        input_column.in_(input_values)
    )

    assert internet_address.translate_filter(
        input_column, input_operation, input_values
    ).compare(cidr_translate_filter_response)


def test_cidr_translate_filter_func_in_double():
    """Test to see if the cidr_translate_filter_func behaves as expected when the IN operator
    is used with two IP's"""

    input_column = Column("user_ip", Integer)
    input_operation = FilterOperator.IN
    input_values = [{"start": 16843009, "end": 33686018}]

    input_condition = input_column.in_([])

    cidr_translate_filter_response: sqlalchemy.sql.expression.BinaryExpression = (
        input_condition | ((input_column <= 33686018) & (input_column >= 16843009))
    )

    assert internet_address.translate_filter(
        input_column, input_operation, input_values
    ).compare(cidr_translate_filter_response)


def test_cidr_translate_filter_func_not_in_single():
    """Test to see if the cidr_translate_filter_func behaves as expected when the NOT_IN
    operator is used with a single IP"""

    input_column = Column("user_ip", Integer)
    input_operation = FilterOperator.NOT_IN
    input_values = [16843009]

    cidr_translate_filter_response: sqlalchemy.sql.expression.BinaryExpression = ~(
        input_column.in_(input_values)
    )

    assert internet_address.translate_filter(
        input_column, input_operation, input_values
    ).compare(cidr_translate_filter_response)


def test_cidr_translate_filter_func_not_in_double():
    """Test to see if the cidr_translate_filter_func behaves as expected when the NOT_IN
    operator is used with two IP's"""

    input_column = Column("user_ip", Integer)
    input_operation = FilterOperator.NOT_IN
    input_values = [{"start": 16843009, "end": 33686018}]

    input_condition = ~(input_column.in_([]))

    cidr_translate_filter_response: sqlalchemy.sql.expression.BinaryExpression = (
        input_condition & (input_column > 33686018) & (input_column < 16843009)
    )

    assert internet_address.translate_filter(
        input_column, input_operation, input_values
    ).compare(cidr_translate_filter_response)


def test_port_translate_filter_func_equals():
    """Test to see if the port_translate_filter_func behaves as expected when the EQUALS
    operator is used"""

    input_column = Column("user_ip", Integer)
    input_operation = FilterOperator.EQUALS
    input_values = [[443]]

    port_translate_filter_response: sqlalchemy.sql.expression.BinaryExpression = (
        input_column.in_(input_values[0])
    )

    assert port.translate_filter(input_column, input_operation, input_values).compare(
        port_translate_filter_response
    )


def test_port_translate_filter_func_not_equals():
    """Test to see if the port_translate_filter_func behaves as expected when the NOT_EQUALS
    operator is used"""

    input_column = Column("user_ip", Integer)
    input_operation = FilterOperator.NOT_EQUALS
    input_values = [[443]]

    port_translate_filter_response: sqlalchemy.sql.expression.BinaryExpression = ~(
        input_column.in_(input_values[0])
    )

    assert port.translate_filter(input_column, input_operation, input_values).compare(
        port_translate_filter_response
    )


def test_port_translate_filter_func_greater_than_or_equals():
    """Test to see if the port_translate_filter_func behaves as expected when the
    GREATER_THAN_OR_EQUALS operator is used"""

    input_column = Column("user_ip", Integer)
    input_operation = FilterOperator.GREATER_THAN_OR_EQUALS
    input_values = [[443]]

    port_translate_filter_response: sqlalchemy.sql.expression.BinaryExpression = (
        input_column >= input_values[0][0]
    )

    assert port.translate_filter(input_column, input_operation, input_values).compare(
        port_translate_filter_response
    )


def test_port_translate_filter_func_greater_than():
    """Test to see if the port_translate_filter_func behaves as expected when the
    GREATER_THAN operator is used"""

    input_column = Column("user_ip", Integer)
    input_operation = FilterOperator.GREATER_THAN
    input_values = [[443]]

    port_translate_filter_response: sqlalchemy.sql.expression.BinaryExpression = (
        input_column > input_values[0][0]
    )

    assert port.translate_filter(input_column, input_operation, input_values).compare(
        port_translate_filter_response
    )


def test_port_translate_filter_func_less_than_or_equals():
    """Test to see if the port_translate_filter_func behaves as expected when the
    LESS_THAN_OR_EQUALS operator is used"""

    input_column = Column("user_ip", Integer)
    input_operation = FilterOperator.LESS_THAN_OR_EQUALS
    input_values = [[443]]

    port_translate_filter_response: sqlalchemy.sql.expression.BinaryExpression = (
        input_column <= input_values[0][0]
    )

    assert port.translate_filter(input_column, input_operation, input_values).compare(
        port_translate_filter_response
    )


def test_port_translate_filter_func_less_than():
    """Test to see if the port_translate_filter_func behaves as expected when the LESS_THAN
    operator is used"""

    input_column = Column("user_ip", Integer)
    input_operation = FilterOperator.LESS_THAN
    input_values = [[443]]

    port_translate_filter_response: sqlalchemy.sql.expression.BinaryExpression = (
        input_column < input_values[0][0]
    )

    assert port.translate_filter(input_column, input_operation, input_values).compare(
        port_translate_filter_response
    )


def test_port_translate_filter_func_in_single():
    """Test to see if the port_translate_filter_func behaves as expected when the IN operator
    is used with a single port"""

    input_column = Column("user_ip", Integer)
    input_operation = FilterOperator.IN
    input_values = [[443]]

    port_translate_filter_response: sqlalchemy.sql.expression.BinaryExpression = (
        input_column.in_(input_values[0])
    )

    assert port.translate_filter(input_column, input_operation, input_values).compare(
        port_translate_filter_response
    )


def test_port_translate_filter_func_in_double():
    """Test to see if the port_translate_filter_func behaves as expected when the IN operator
    is used with two ports"""

    input_column = Column("user_ip", Integer)
    input_operation = FilterOperator.IN
    input_values = [[443, 80]]

    port_translate_filter_response: sqlalchemy.sql.expression.BinaryExpression = (
        input_column.in_(input_values[0])
    )

    assert port.translate_filter(input_column, input_operation, input_values).compare(
        port_translate_filter_response
    )


def test_port_translate_filter_func_not_in_single():
    """Test to see if the port_translate_filter_func behaves as expected when the NOT_IN
    operator is used with a single port"""

    input_column = Column("user_ip", Integer)
    input_operation = FilterOperator.NOT_IN
    input_values = [[443]]

    port_translate_filter_response: sqlalchemy.sql.expression.BinaryExpression = ~(
        input_column.in_(input_values[0])
    )

    assert port.translate_filter(input_column, input_operation, input_values).compare(
        port_translate_filter_response
    )


def test_port_translate_filter_func_not_in_double():
    """Test to see if the port_translate_filter_func behaves as expected when the NOT_IN
    operator is used with two ports"""

    input_column = Column("user_ip", Integer)
    input_operation = FilterOperator.NOT_IN
    input_values = [[443, 80]]

    port_translate_filter_response: sqlalchemy.sql.expression.BinaryExpression = ~(
        input_column.in_(input_values[0])
    )

    assert port.translate_filter(input_column, input_operation, input_values).compare(
        port_translate_filter_response
    )


# Tests for translate_filter_func with various FilterOperator values
def test_translate_filter_func_equals_operator(
    advanced_data_type_name, valid_value, valid_data_types: list
):
    """
    Test to see if the advanced_data_type_func behaves as expected when the EQUALS operator is used.
    """
    input_operation = FilterOperator.EQUALS
    input_values = [valid_value]
    for valid_data_type in valid_data_types:
        input_column = Column(advanced_data_type_name, valid_data_type)
        advanced_data_type_response: sqlalchemy.sql.expression.BinaryExpression = (
            input_column == input_values[0]
        )

        assert translate_filter_func(
            input_column, input_operation, input_values
        ).compare(advanced_data_type_response)
    if verbose:
        print(f"{valid_value} passed {input_operation.value}!")


def test_translate_filter_func_greater_than_or_equal_operator(
    advanced_data_type_name, valid_value, valid_data_types: list
):
    """
    Test to see if the advanced_data_type_func behaves as expected when the GREATER THAN OR EQUAL operator is used.
    """
    input_operation = FilterOperator.GREATER_THAN_OR_EQUAL
    input_values = [valid_value]
    for valid_data_type in valid_data_types:
        input_column = Column(advanced_data_type_name, valid_data_type)
        advanced_data_type_response: sqlalchemy.sql.expression.BinaryExpression = (
            input_column >= input_values[0]
        )

        assert translate_filter_func(
            input_column, input_operation, input_values
        ).compare(advanced_data_type_response)
    if verbose:
        print(f"{valid_value} passed {input_operation.value}!")


def test_translate_filter_func_greater_than_operator(
    advanced_data_type_func, valid_value, advanced_data_type_name, valid_data_type
):
    """
    Test to see if the advanced_data_type_func behaves as expected when the GREATER_THAN operator is used.
    """
    input_operation = FilterOperator.GREATER_THAN
    input_values = [valid_value]
    input_column = Column(advanced_data_type_name, valid_data_type)
    advanced_data_type_response: sqlalchemy.sql.expression.BinaryExpression = (
        input_column > input_values[0]
    )

    assert advanced_data_type_func(input_column, input_operation, input_values).compare(
        advanced_data_type_response
    )
    if verbose:
        print(f"{valid_value} passed {input_operation.value}!")


def test_translate_filter_func_in_operator(
    advanced_data_type_name, valid_value, valid_data_types: list
):
    """
    Test to see if the advanced_data_type_func behaves as expected when the IN operator is used.
    """
    input_operation = FilterOperator.IN
    input_values = [valid_value]
    for valid_data_type in valid_data_types:
        input_column = Column(advanced_data_type_name, valid_data_type)
        advanced_data_type_response: sqlalchemy.sql.expression.BinaryExpression = (
            input_column.in_(input_values)
        )

        assert translate_filter_func(
            input_column, input_operation, input_values
        ).compare(advanced_data_type_response)
    if verbose:
        print(f"{valid_value} passed {input_operation.value}!")


def test_translate_filter_func_less_than_operator(
    advanced_data_type_name, valid_value, valid_data_types: list
):
    """
    Test to see if the advanced_data_type_func behaves as expected when the LESS_THAN operator is used.
    """
    input_operation = FilterOperator.LESS_THAN
    input_values = [valid_value]
    for valid_data_type in valid_data_types:
        input_column = Column(advanced_data_type_name, valid_data_type)
        advanced_data_type_response: sqlalchemy.sql.expression.BinaryExpression = (
            input_column < input_values[0]
        )

        assert translate_filter_func(
            input_column, input_operation, input_values
        ).compare(advanced_data_type_response)
    if verbose:
        print(f"{valid_value} passed {input_operation.value}!")


def test_translate_filter_func_less_than_or_equal_operator(
    advanced_data_type_name, valid_value, valid_data_types: list
):
    """
    Test to see if the advanced_data_type_func behaves as expected when the LESS_THAN_OR_EQUAL operator is used.
    """
    input_operation = FilterOperator.LESS_THAN_OR_EQUAL
    input_values = [valid_value]
    for valid_data_type in valid_data_types:
        input_column = Column(advanced_data_type_name, valid_data_type)
        advanced_data_type_response: sqlalchemy.sql.expression.BinaryExpression = (
            input_column <= input_values[0]
        )

        assert translate_filter_func(
            input_column, input_operation, input_values
        ).compare(advanced_data_type_response)
    if verbose:
        print(f"{valid_value} passed {input_operation.value}!")


def test_translate_filter_func_not_equals_operator(
    advanced_data_type_name, valid_value, valid_data_types: list
):
    """
    Test to see if the advanced_data_type_func behaves as expected when the NOT_EQUALS operator is used.
    """
    input_operation = FilterOperator.NOT_EQUALS
    input_values = [valid_value]
    for valid_data_type in valid_data_types:
        input_column = Column(advanced_data_type_name, valid_data_type)
        advanced_data_type_response: sqlalchemy.sql.expression.BinaryExpression = (
            input_column != input_values[0]
        )

        assert translate_filter_func(
            input_column, input_operation, input_values
        ).compare(advanced_data_type_response)
    if verbose:
        print(f"{valid_value} passed {input_operation.value}!")


def test_translate_filter_func_not_in_operator(
    advanced_data_type_name, valid_value, valid_data_types: list
):
    """
    Test to see if the advanced_data_type_func behaves as expected when the NOT_IN operator is used.
    """
    input_operation = FilterOperator.NOT_IN
    input_values = [valid_value]
    for valid_data_type in valid_data_types:
        input_column = Column(advanced_data_type_name, valid_data_type)
        advanced_data_type_response: sqlalchemy.sql.expression.BinaryExpression = ~(
            input_column.in_(input_values)
        )

        assert translate_filter_func(
            input_column, input_operation, input_values
        ).compare(advanced_data_type_response)
    if verbose:
        print(f"{valid_value} passed {input_operation.value}!")


def test_translate_filter_func_is_not_null_operator(
    advanced_data_type_name, valid_value, valid_data_types: list
):
    """
    Test to see if the advanced_data_type_func behaves as expected when the IS_NOT_NULL operator is used.
    """
    input_operation = FilterOperator.IS_NOT_NULL
    for valid_data_type in valid_data_types:
        input_column = Column(advanced_data_type_name, valid_data_type)
        advanced_data_type_response: sqlalchemy.sql.expression.BinaryExpression = (
            input_column.isnot(None)
        )

        assert translate_filter_func(input_column, input_operation, []).compare(
            advanced_data_type_response
        )
    if verbose:
        print(f"{valid_value} passed {input_operation.value}!")


def test_translate_filter_func_is_null_operator(
    advanced_data_type_name, valid_value, valid_data_types: list
):
    """
    Test to see if the advanced_data_type_func behaves as expected when the IS_NULL operator is used.
    """
    input_operation = FilterOperator.IS_NULL
    for valid_data_type in valid_data_types:
        input_column = Column(advanced_data_type_name, valid_data_type)
        advanced_data_type_response: sqlalchemy.sql.expression.BinaryExpression = (
            input_column.is_(None)
        )

        assert translate_filter_func(input_column, input_operation, []).compare(
            advanced_data_type_response
        )
    if verbose:
        print(f"{valid_value} passed {input_operation.value}!")


def test_translate_filter_func_like_operator(
    advanced_data_type_name, valid_value, valid_data_types: list
):
    """
    Test to see if the advanced_data_type_func behaves as expected when the LIKE operator is used.
    """
    input_operation = FilterOperator.LIKE
    input_values = [valid_value]
    for data_type in valid_data_types:
        input_column = Column(advanced_data_type_name, data_type)
        advanced_data_type_response: sqlalchemy.sql.expression.BinaryExpression = (
            input_column.like(input_values[0])
        )

        assert translate_filter_func(
            input_column, input_operation, input_values
        ).compare(advanced_data_type_response)
    if verbose:
        print(f"{valid_value} passed {input_operation.value}!")


def test_translate_filter_func_ilike_operator(
    advanced_data_type_name, valid_value, valid_data_types: list
):
    """
    Test to see if the advanced_data_type_func behaves as expected when the ILIKE operator is used.
    """
    input_operation = FilterOperator.ILIKE
    input_values = [valid_value]
    for data_type in valid_data_types:
        input_column = Column(advanced_data_type_name, data_type)
        advanced_data_type_response: sqlalchemy.sql.expression.BinaryExpression = (
            input_column.ilike(input_values[0])
        )

        assert translate_filter_func(
            input_column, input_operation, input_values
        ).compare(advanced_data_type_response)
    if verbose:
        print(f"{valid_value} passed {input_operation.value}!")


def test_advanced_data_type_translate_type(
    advanced_data_type_func,
    valid_values: list,
    invalid_values: list,
    valid_operators: list,
    valid_data_types: list,
):
    """
    Unit test for any given superset advanced data type.
    Args:
        advanced_data_type_func (function): The translate type function to be tested.
        valid_values (list): A list of valid values for the advanced data type.
        invalid_values (list): A list of invalid values for the advanced data type.
        valid_operators (list): A list of valid operators for the advanced data type.
        valid_data_types (list): A list of valid SQLAlchemy type (ex. String, Integer).
    """
    name = " ".join(advanced_data_type_func.__name__.split("_")[:-1])
    if verbose:
        print(f"Testing {name}...\n")
    for value in valid_values:
        for operator in valid_operators:
            if operator == FilterOperator.IN.value:
                req: AdvancedDataTypeRequest = {
                    "values": [value],
                    "operator": operator,
                    "error_message": "",
                    "display_value": "",
                }
                res: AdvancedDataTypeResponse = advanced_data_type_func(req)
                assert (
                    res["error_message"] == ""
                ), f"Expected no error message for value {value} with operator {operator}, but got {res['error_message']}"
                test_translate_filter_func_in_operator(name, value, valid_data_types)

            elif operator in FilterStringOperators.NOT_IN.value:
                req: AdvancedDataTypeRequest = {
                    "values": [value],
                    "operator": operator,
                    "error_message": "",
                    "display_value": "",
                }
                res: AdvancedDataTypeResponse = advanced_data_type_func(req)
                assert (
                    res["error_message"] == ""
                ), f"Expected no error message for value {value} with operator {operator}, but got {res['error_message']}"
                test_translate_filter_func_not_in_operator(
                    name, value, valid_data_types
                )

            elif operator == FilterStringOperators.IS_NULL.value:
                req: AdvancedDataTypeRequest = {
                    "values": [value],
                    "operator": operator,
                    "error_message": "",
                    "display_value": "",
                }
                res: AdvancedDataTypeResponse = advanced_data_type_func(req)
                assert (
                    res["error_message"] == ""
                ), f"Expected no error message for value {value} with operator {operator}, but got {res['error_message']}"
                test_translate_filter_func_is_null_operator(
                    name, value, valid_data_types
                )

            elif operator == FilterStringOperators.IS_NOT_NULL.value:
                req: AdvancedDataTypeRequest = {
                    "values": [value],
                    "operator": operator,
                    "error_message": "",
                    "display_value": "",
                }
                res: AdvancedDataTypeResponse = advanced_data_type_func(req)
                assert (
                    res["error_message"] == ""
                ), f"Expected no error message for value {value} with operator {operator}, but got {res['error_message']}"
                test_translate_filter_func_is_not_null_operator(
                    name, value, valid_data_types
                )

            elif operator == FilterStringOperators.EQUALS.value:
                req: AdvancedDataTypeRequest = {
                    "values": [value],
                    "operator": operator,
                    "error_message": "",
                    "display_value": "",
                }
                res: AdvancedDataTypeResponse = advanced_data_type_func(req)
                assert (
                    res["error_message"] == ""
                ), f"Expected no error message for value {value} with operator {operator}, but got {res['error_message']}"
                test_translate_filter_func_equals_operator(
                    name, value, valid_data_types
                )

            elif operator == FilterStringOperators.NOT_EQUALS.value:
                req: AdvancedDataTypeRequest = {
                    "values": [value],
                    "operator": operator,
                    "error_message": "",
                    "display_value": "",
                }
                res: AdvancedDataTypeResponse = advanced_data_type_func(req)
                assert (
                    res["error_message"] == ""
                ), f"Expected no error message for value {value} with operator {operator}, but got {res['error_message']}"
                test_translate_filter_func_not_equals_operator(
                    name, value, valid_data_types
                )

            elif operator == FilterOperator.LIKE.value:
                req: AdvancedDataTypeRequest = {
                    "values": [value],
                    "operator": operator,
                    "error_message": "",
                    "display_value": "",
                }
                res: AdvancedDataTypeResponse = advanced_data_type_func(req)
                assert (
                    res["error_message"] == ""
                ), f"Expected no error message for value {value} with operator {operator}, but got {res['error_message']}"
                test_translate_filter_func_like_operator(name, value, valid_data_types)

            elif operator == FilterOperator.ILIKE.value:
                req: AdvancedDataTypeRequest = {
                    "values": [value],
                    "operator": operator,
                    "error_message": "",
                    "display_value": "",
                }
                res: AdvancedDataTypeResponse = advanced_data_type_func(req)
                assert (
                    res["error_message"] == ""
                ), f"Expected no error message for value {value} with operator {operator}, but got {res['error_message']}"
                test_translate_filter_func_ilike_operator(name, value, valid_data_types)

    # Test invalid values
    for value in invalid_values:
        for operator in valid_operators:
            if operator == FilterOperator.IN.value:
                req: AdvancedDataTypeRequest = {
                    "values": [value],
                    "operator": operator,
                    "error_message": "",
                    "display_value": "",
                }
                res: AdvancedDataTypeResponse = advanced_data_type_func(req)
                assert (
                    res["error_message"] != ""
                ), f"Expected an error message for value {value} with operator {operator}, but got {res['error_message']}"
                test_translate_filter_func_in_operator(name, value, valid_data_types)
            elif operator in FilterStringOperators.NOT_IN.value:
                req: AdvancedDataTypeRequest = {
                    "values": [value],
                    "operator": operator,
                    "error_message": "",
                    "display_value": "",
                }
                res: AdvancedDataTypeResponse = advanced_data_type_func(req)
                assert (
                    res["error_message"] != ""
                ), f"Expected an error message for value {value} with operator {operator}, but got {res['error_message']}"
                test_translate_filter_func_not_in_operator(
                    name, value, valid_data_types
                )
            elif operator == FilterStringOperators.IS_NULL.value:
                req: AdvancedDataTypeRequest = {
                    "values": [value],
                    "operator": operator,
                    "error_message": "",
                    "display_value": "",
                }
                res: AdvancedDataTypeResponse = advanced_data_type_func(req)
                assert (
                    res["error_message"] != ""
                ), f"Expected an error message for value {value} with operator {operator}, but got {res['error_message']}"
                test_translate_filter_func_is_null_operator(
                    name, value, valid_data_types
                )

            elif operator == FilterStringOperators.IS_NOT_NULL.value:
                req: AdvancedDataTypeRequest = {
                    "values": [value],
                    "operator": operator,
                    "error_message": "",
                    "display_value": "",
                }
                res: AdvancedDataTypeResponse = advanced_data_type_func(req)
                assert (
                    res["error_message"] != ""
                ), f"Expected an error message for value {value} with operator {operator}, but got {res['error_message']}"
                test_translate_filter_func_is_not_null_operator(
                    name, value, valid_data_types
                )

            elif operator == FilterStringOperators.EQUALS.value:
                req: AdvancedDataTypeRequest = {
                    "values": [value],
                    "operator": operator,
                    "error_message": "",
                    "display_value": "",
                }
                res: AdvancedDataTypeResponse = advanced_data_type_func(req)
                assert (
                    res["error_message"] != ""
                ), f"Expected an error message for value {value} with operator {operator}, but got {res['error_message']}"
                test_translate_filter_func_equals_operator(
                    name, value, valid_data_types
                )

            elif operator == FilterStringOperators.NOT_EQUALS.value:
                req: AdvancedDataTypeRequest = {
                    "values": [value],
                    "operator": operator,
                    "error_message": "",
                    "display_value": "",
                }
                res: AdvancedDataTypeResponse = advanced_data_type_func(req)
                assert (
                    res["error_message"] != ""
                ), f"Expected an error message for value {value} with operator {operator}, but got {res['error_message']}"
                test_translate_filter_func_not_equals_operator(
                    name, value, valid_data_types
                )

    if verbose:
        print(f"{name} passed!\n")


advanced_data_type_test_bodies = {
    """
    Dictionary to store test data to be used with test_advanced_data_type_translate_type()
    Format:
    [{advanced_data_type_func},
    {valid_values: list},
    {invalid_values: list},
    {valid_operators: list},
    {valid_data_types: list}]
    """
    "agent_id": [
        agent_id_func,
        ["ff.ff.ff.ff", "FFFF.FF.FFFFFFFF.FF"],
        [""],
        EQUAL_NULLABLE_OPERATOR_SET + PATTERN_MATCHING_OPERATOR_SET,
        [String],
    ],
    "asn": [
        asn_func,
        [111, 4294967295],
        ["111", -1],
        EQUAL_NULLABLE_OPERATOR_SET,
        [Integer],
    ],
    "aws_access_key_id": [
        aws_access_key_id_func,
        ["ASIAXXXX34311113", "AKIAIOSFODNN7EXAMPLE"],
        ["111"],
        EQUAL_NULLABLE_OPERATOR_SET,
        [String],
    ],
    "aws_account_id": [
        aws_account_id_func,
        [111111111111, 222222222222],
        ["x"],
        EQUAL_NULLABLE_OPERATOR_SET,
        [Integer],
    ],
    "aws_arn_func": [
        aws_arn_func,
        [
            "arn:aws:s3:::beabetterdev-demo-bucket",
            "arn:aws:lambda:us-east-1:755314965794:function:Disconnect",
        ],
        ["lambda function"],
        EQUAL_NULLABLE_OPERATOR_SET + PATTERN_MATCHING_OPERATOR_SET,
        [String],
    ],
    "aws_principal_id_func": [
        aws_principal_id_func,
        ["AROATYNMAQ3LAV6PISTHQ:1709049210574347945"],
        [""],
        EQUAL_NULLABLE_OPERATOR_SET,
        [String],
    ],
    "aws_organization_id": [
        aws_organization_id_func,
        ["o-12345aaa678"],
        ["o-HELLOWORLD"],
        EQUAL_NULLABLE_OPERATOR_SET,
        [String],
    ],
    "azure_application_id": [
        azure_application_id_func,
        [
            "123e4567-e89b-12d3-a456-426655440000",
            "ba6eb330-4f7f-11eb-a2fb-67c34e9ac07c",
        ],
        ["111"],
        EQUAL_NULLABLE_OPERATOR_SET,
        [String],
    ],
    "azure_object_id": [
        azure_object_id_func,
        [
            "123e4567-e89b-12d3-a456-426655440000",
            "ba6eb330-4f7f-11eb-a2fb-67c34e9ac07c",
        ],
        ["111"],
        EQUAL_NULLABLE_OPERATOR_SET,
        [String],
    ],
    "cbs_id": [
        cbs_id_func,
        [
            "123e4567-e89b-12d3-a456-426655440000",
            "ba6eb330-4f7f-11eb-a2fb-67c34e9ac07c",
        ],
        ["111"],
        EQUAL_NULLABLE_OPERATOR_SET,
        [String],
    ],
    "cbs_workload": [
        cbs_workload_func,
        ["Amazon.S3.Bucket.HelloWorld", "hello.azure.world"],
        ["hello.world", ""],
        EQUAL_NULLABLE_OPERATOR_SET + PATTERN_MATCHING_OPERATOR_SET,
        [String],
    ],
    "classification": [
        classification_func,
        ["hello", "world"],
        [""],
        EQUAL_NULLABLE_OPERATOR_SET + PATTERN_MATCHING_OPERATOR_SET,
        [String],
    ],
    "country_code_func": [
        country_code_func,
        ["CA", "CAN", 124],
        ["china", 1111, "c"],
        EQUAL_NULLABLE_OPERATOR_SET,
        [String, Integer],
    ],
    "cpoints_func": [
        cpoints_func,
        ["11:11", '["11:11", "11:11"]'],
        ["world", 11],
        EQUAL_NULLABLE_OPERATOR_SET,
        [String],
    ],
    "department_func": [
        department_func,
        ["any"],
        [""],
        EQUAL_NULLABLE_OPERATOR_SET + PATTERN_MATCHING_OPERATOR_SET,
        [String],
    ],
    "domain_func": [
        domain_func,
        ["helloworld.com"],
        [""],
        EQUAL_NULLABLE_OPERATOR_SET + PATTERN_MATCHING_OPERATOR_SET,
        [String],
    ],
    "email_address_func": [
        email_address_func,
        ["hello@world.com"],
        ["hello world"],
        EQUAL_NULLABLE_OPERATOR_SET + PATTERN_MATCHING_OPERATOR_SET,
        [String],
    ],
    "file_md5_func": [
        file_md5_func,
        ["23db6982caef9e9152f1a5b2589e6ca3"],
        ["aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"],
        EQUAL_NULLABLE_OPERATOR_SET,
        [String],
    ],
    "file_sha256_func": [
        file_sha256_func,
        ["b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9"],
        ["hello world", "", 1],
        EQUAL_NULLABLE_OPERATOR_SET,
        [String],
    ],
    "harmonized_email_id_func": [
        harmonized_email_id_func,
        ["CBS_EMAIL_AA", "NBS_EMAIL_BF"],
        ["nbs email", "", 1],
        EQUAL_NULLABLE_OPERATOR_SET,
        [String],
    ],
    "ip_protocol_func": [
        ip_protocol_func,
        [0, 10, 255],
        ["10", "", -1],
        EQUAL_NULLABLE_OPERATOR_SET,
        [Integer],
    ],
    "ipv6_func": [
        ipv6_func,
        ["2001::0370:7334", "::ffff:abcd:1234"],
        ["world"],
        CIDR_OPERATOR_SET,
        [Integer],
    ],
    "oid_tag_func": [
        oid_tag_func,
        ["my_tag"],
        [""],
        EQUAL_NULLABLE_OPERATOR_SET + PATTERN_MATCHING_OPERATOR_SET,
        [String],
    ],
    # pending approval
    # stream_id_func
    "tcp_sequence_func": [
        tcp_sequence_func,
        [(2**31 - 1), (-(2**31))],
        ["1", "", "_"],
        EQUAL_NULLABLE_OPERATOR_SET,
        [Integer],
    ],
    "uri_func": [
        uri_func,
        ["hello://world"],
        [""],
        EQUAL_NULLABLE_OPERATOR_SET + PATTERN_MATCHING_OPERATOR_SET,
        [String],
    ],
    "url_func": [
        uri_func,
        ["hello://world"],
        [""],
        EQUAL_NULLABLE_OPERATOR_SET + PATTERN_MATCHING_OPERATOR_SET,
        [String],
    ],
    "user_agent_func": [
        user_agent_func,
        ["any"],
        [""],
        EQUAL_NULLABLE_OPERATOR_SET + PATTERN_MATCHING_OPERATOR_SET,
        [String],
    ],
    "zone_func": [
        zone_func,
        ["EXT", "DMZ", "INT", "11", 11],
        ["", 111, "WORLD"],
        EQUAL_NULLABLE_OPERATOR_SET,
        [String, Integer],
    ]
}

verbose = False

for test_body in advanced_data_type_test_bodies.values():
    test_advanced_data_type_translate_type(*test_body)

print("All tests passed!")
