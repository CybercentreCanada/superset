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
from sqlalchemy import Column, Integer
from superset.advanced_data_type.plugins.agent_id import agent_id_func
from superset.advanced_data_type.plugins.asn import asn_func
from superset.advanced_data_type.plugins.aws_access_key_id import aws_access_key_id_func
from superset.advanced_data_type.plugins.aws_account_id import aws_account_id_func
from superset.advanced_data_type.plugins.aws_arn import aws_arn_func
from superset.advanced_data_type.plugins.aws_organization_id import aws_organization_id_func
from superset.advanced_data_type.plugins.aws_principal_id import aws_principal_id_func
from superset.advanced_data_type.plugins.azure_application_id import azure_application_id_func
from superset.advanced_data_type.plugins.azure_object_id import azure_object_id_func
from superset.advanced_data_type.plugins.cbs_id import cbs_id_func
from superset.advanced_data_type.plugins.cbs_workload import cbs_workload_func
from superset.advanced_data_type.plugins.classification import classification_func
from superset.advanced_data_type.plugins.country_code import country_code_func
from superset.advanced_data_type.plugins.cpoints import cpoints_func
from superset.advanced_data_type.plugins.department import department_func
from superset.advanced_data_type.plugins.domain import domain_func
from superset.advanced_data_type.plugins.email_address import email_address_func
from superset.advanced_data_type.plugins.file_md5 import file_md5_func
from superset.advanced_data_type.plugins.file_sha256 import file_sha256_func
from superset.advanced_data_type.plugins.harmonized_email_id import harmonized_email_id_func
from superset.advanced_data_type.plugins.ip_protocol import ip_protocol_func
from superset.advanced_data_type.plugins.ipv6_address import ipv6_func
from superset.advanced_data_type.plugins.oid_tag import oid_tag_func
from superset.advanced_data_type.plugins.stream_id import STREAM_DICT, stream_id_func
from superset.advanced_data_type.plugins.tcp_sequence import tcp_sequence_func
from superset.advanced_data_type.plugins.uri import uri_func
from superset.advanced_data_type.plugins.url import url_func
from superset.advanced_data_type.plugins.user_agent import user_agent_func
from superset.advanced_data_type.plugins.zone import zone_func
from superset.advanced_data_type.types import (
    AdvancedDataType,
    AdvancedDataTypeRequest,
    AdvancedDataTypeResponse,
)
from superset.utils.core import FilterOperator, FilterStringOperators
from superset.advanced_data_type.plugins.operator_sets import EQUAL_NULLABLE_OPERATOR_SET, PATTERN_MATCHING_OPERATOR_SET
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

def test_advanced_data_type_equals_operator(advanced_data_type_func, valid_value, advanced_data_type_name, valid_data_type):
    """
    Test to see if the advanced_data_type_func behaves as expected when the EQUALS operator is used.
    """
    input_operation = FilterStringOperators.EQUALS
    input_values = [valid_value]
    input_column = Column(advanced_data_type_name, valid_data_type)
    advanced_data_type_response: sqlalchemy.sql.expression.BinaryExpression = (
        input_column == input_values[0]
    )

    assert advanced_data_type_func(input_column, input_operation, input_values).compare(
        advanced_data_type_response
    )

def test_advanced_data_type_greater_than_or_equal_operator(advanced_data_type_func, valid_value, advanced_data_type_name, valid_data_type):
    """
    Test to see if the advanced_data_type_func behaves as expected when the GREATER_THAN_OR_EQUAL operator is used.
    """
    input_operation = FilterStringOperators.GREATER_THAN_OR_EQUAL
    input_values = [valid_value]
    input_column = Column(advanced_data_type_name, valid_data_type)
    advanced_data_type_response: sqlalchemy.sql.expression.BinaryExpression = (
        input_column >= input_values[0]
    )

    assert advanced_data_type_func(input_column, input_operation, input_values).compare(
        advanced_data_type_response
    )

def test_advanced_data_type_greater_than_operator(advanced_data_type_func, valid_value, advanced_data_type_name, valid_data_type):
    """
    Test to see if the advanced_data_type_func behaves as expected when the GREATER_THAN operator is used.
    """
    input_operation = FilterStringOperators.GREATER_THAN
    input_values = [valid_value]
    input_column = Column(advanced_data_type_name, valid_data_type)
    advanced_data_type_response: sqlalchemy.sql.expression.BinaryExpression = (
        input_column > input_values[0]
    )

    assert advanced_data_type_func(input_column, input_operation, input_values).compare(
        advanced_data_type_response
    )

def test_advanced_data_type_in_operator(advanced_data_type_func, valid_value, advanced_data_type_name, valid_data_type):
    """
    Test to see if the advanced_data_type_func behaves as expected when the IN operator is used.
    """
    input_operation = FilterStringOperators.IN
    input_values = [[valid_value]]
    input_column = Column(advanced_data_type_name, valid_data_type)
    advanced_data_type_response: sqlalchemy.sql.expression.BinaryExpression = (
        input_column.in_(input_values[0])
    )

    assert advanced_data_type_func(input_column, input_operation, input_values).compare(
        advanced_data_type_response
    )

def test_advanced_data_type_less_than_operator(advanced_data_type_func, valid_value, advanced_data_type_name, valid_data_type):
    """
    Test to see if the advanced_data_type_func behaves as expected when the LESS_THAN operator is used.
    """
    input_operation = FilterStringOperators.LESS_THAN
    input_values = [valid_value]
    input_column = Column(advanced_data_type_name, valid_data_type)
    advanced_data_type_response: sqlalchemy.sql.expression.BinaryExpression = (
        input_column < input_values[0]
    )

    assert advanced_data_type_func(input_column, input_operation, input_values).compare(
        advanced_data_type_response
    )

def test_advanced_data_type_less_than_or_equal_operator(advanced_data_type_func, valid_value, advanced_data_type_name, valid_data_type):
    """
    Test to see if the advanced_data_type_func behaves as expected when the LESS_THAN_OR_EQUAL operator is used.
    """
    input_operation = FilterStringOperators.LESS_THAN_OR_EQUAL
    input_values = [valid_value]
    input_column = Column(advanced_data_type_name, valid_data_type)
    advanced_data_type_response: sqlalchemy.sql.expression.BinaryExpression = (
        input_column <= input_values[0]
    )

    assert advanced_data_type_func(input_column, input_operation, input_values).compare(
        advanced_data_type_response
    )

def test_advanced_data_type_not_equals_operator(advanced_data_type_func, valid_value, advanced_data_type_name, valid_data_type):
    """
    Test to see if the advanced_data_type_func behaves as expected when the NOT_EQUALS operator is used.
    """
    input_operation = FilterStringOperators.NOT_EQUALS
    input_values = [valid_value]
    input_column = Column(advanced_data_type_name, valid_data_type)
    advanced_data_type_response: sqlalchemy.sql.expression.BinaryExpression = (
        input_column != input_values[0]
    )

    assert advanced_data_type_func(input_column, input_operation, input_values).compare(
        advanced_data_type_response
    )

def test_advanced_data_type_not_in_operator(advanced_data_type_func, valid_value, advanced_data_type_name, valid_data_type):
    """
    Test to see if the advanced_data_type_func behaves as expected when the NOT_IN operator is used.
    """
    input_operation = FilterStringOperators.NOT_IN
    input_values = [[valid_value]]
    input_column = Column(advanced_data_type_name, valid_data_type)
    advanced_data_type_response: sqlalchemy.sql.expression.BinaryExpression = ~(
        input_column.in_(input_values[0])
    )

    assert advanced_data_type_func(input_column, input_operation, input_values).compare(
        advanced_data_type_response
    )

def test_advanced_data_type_is_not_null_operator(advanced_data_type_func, advanced_data_type_name, valid_data_type):
    """
    Test to see if the advanced_data_type_func behaves as expected when the IS_NOT_NULL operator is used.
    """
    input_operation = FilterStringOperators.IS_NOT_NULL
    input_column = Column(advanced_data_type_name, valid_data_type)
    advanced_data_type_response: sqlalchemy.sql.expression.BinaryExpression = (
        input_column.isnot(None)
    )

    assert advanced_data_type_func(input_column, input_operation, []).compare(
        advanced_data_type_response
    )

def test_advanced_data_type_is_null_operator(advanced_data_type_func, advanced_data_type_name, valid_data_type):
    """
    Test to see if the advanced_data_type_func behaves as expected when the IS_NULL operator is used.
    """
    input_operation = FilterStringOperators.IS_NULL
    input_column = Column(advanced_data_type_name, valid_data_type)
    advanced_data_type_response: sqlalchemy.sql.expression.BinaryExpression = (
        input_column.is_(None)
    )

    assert advanced_data_type_func(input_column, input_operation, []).compare(
        advanced_data_type_response
    )

def test_advanced_data_type_like_operator(advanced_data_type_func, valid_value, advanced_data_type_name, valid_data_type):
    """
    Test to see if the advanced_data_type_func behaves as expected when the LIKE operator is used.
    """
    input_column = Column(advanced_data_type_name, valid_data_type)
    input_operation = FilterStringOperators.LIKE
    input_values = [valid_value]

    advanced_data_type_response: sqlalchemy.sql.expression.BinaryExpression = (
        input_column.like(input_values[0])
    )

    assert advanced_data_type_func(input_column, input_operation, input_values).compare(
        advanced_data_type_response
    )

def test_advanced_data_type_ilike_operator(advanced_data_type_func, valid_value, advanced_data_type_name, valid_data_type):
    """
    Test to see if the advanced_data_type_func behaves as expected when the ILIKE operator is used.
    """
    input_operation = FilterStringOperators.ILIKE
    input_values = [valid_value]
    input_column = Column(advanced_data_type_name, valid_data_type)
    advanced_data_type_response: sqlalchemy.sql.expression.BinaryExpression = (
        input_column.ilike(input_values[0])
    )

    assert advanced_data_type_func(input_column, input_operation, input_values).compare(
        advanced_data_type_response
    )
