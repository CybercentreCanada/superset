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
from superset.advanced_data_type.types import (
    AdvancedDataTypeRequest,
    AdvancedDataTypeResponse,
)
from superset.utils.core import FilterOperator, FilterStringOperators

from superset.advanced_data_type.plugins.internet_address import internet_address
from superset.advanced_data_type.plugins.internet_port import internet_port as port
from superset.advanced_data_type.plugins.advanced_data_types import STREAM_DICT, stream_id_func, ipv6_func, domain_func
import unittest


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

class TestTypes(unittest.TestCase):

    """
    Test for advanced data types
    """
    def test_stream_id(self):
        print("Testing stream ID...\n")
        self.known_key = 11
        self.known_key_2 = 129
        self.known_value = "IIS_EXT"
        self.known_value_2 = "MT-ASSEMBLYLINE-U-PROD"
        self.assertEqual(list(STREAM_DICT.keys())[list(STREAM_DICT.values()).index(self.known_value)], self.known_key)
        self.assertEqual(list(STREAM_DICT.keys())[list(STREAM_DICT.values()).index(self.known_value_2)], self.known_key_2)
        self.assertNotEqual(list(STREAM_DICT.keys())[list(STREAM_DICT.values()).index(self.known_value)], self.known_key_2)
        self.assertNotEqual(list(STREAM_DICT.keys())[list(STREAM_DICT.values()).index(self.known_value)], self.known_key_2)
        val_req: AdvancedDataTypeRequest = {
        "values": ["IIS_EXT"]
        }
        key_req: AdvancedDataTypeRequest = {
        "values": [11]
        }
        test_key:AdvancedDataTypeResponse = stream_id_func(key_req)
        test_val:AdvancedDataTypeResponse = stream_id_func(val_req)
        assert(test_key["error_message"], "")
        self.assertEqual(test_val["error_message"], "")
        invalid_val_req: AdvancedDataTypeRequest = {
        "values": ["fail"]
        }
        invalid_key_req: AdvancedDataTypeRequest = {
        "values": [0]
        }
        test_invalid_key:AdvancedDataTypeResponse = stream_id_func(invalid_key_req)
        test_invalid_val:AdvancedDataTypeResponse = stream_id_func(invalid_val_req)
        self.assertEqual(test_invalid_val['error_message'], f"'{invalid_val_req['values'][0]}' is not a valid Stream ID. Did not match a known Stream ID or name.")
        self.assertEqual(test_invalid_key['error_message'], f"'{invalid_key_req['values'][0]}' is not a valid Stream ID. Did not match a known Stream ID or name.")
        print("Stream ID passed!\n")

    def test_ipv6_adddress(self):
        print("Testing IPv6 Address...\n")
        valid_ipv6_req: AdvancedDataTypeRequest = {
            "values": ["2001:0db8:85a3:0000:0000:8a2e:0370:7334"],
            "error_message": "",
            "display_value": "",
        }
        test_ipv6:AdvancedDataTypeResponse = ipv6_func(valid_ipv6_req)
        self.assertEqual(test_ipv6["error_message"], "")
        invalid_ipv6_req: AdvancedDataTypeRequest = {
            "values": [11111111],
            "error_message": "",
            "display_value": "",
        }
        test_invalid_ipv6:AdvancedDataTypeResponse = ipv6_func(invalid_ipv6_req)
        self.assertEqual(test_invalid_ipv6['error_message'], f"'{invalid_ipv6_req['values'][0]}' is not a valid IPv6 address.")
        print("IPv6 passed!\n")

    def test_domain(self):
        print("Testing domain...\n")
        valid_domain_req: AdvancedDataTypeRequest = {
            "values": ["https://helloworld.com"],
            "operator": "EQUALS",
            "error_message": "",
            "display_value": "",
        }
        test_domain:AdvancedDataTypeResponse = domain_func(valid_domain_req)
        self.assertEqual(test_domain["error_message"], "")
        inavlid_domain_req: AdvancedDataTypeRequest = {
            "values": [""],
            "error_message": "",
            "display_value": "",
            "operator": "EQUALS",
        }
        test_invalid_domain:AdvancedDataTypeResponse = domain_func(inavlid_domain_req)
        self.assertEqual(test_invalid_domain['error_message'], f"Domain must not be empty")
        print("Domain passed!\n")


if __name__ == '__main__':
    unittest.main()
