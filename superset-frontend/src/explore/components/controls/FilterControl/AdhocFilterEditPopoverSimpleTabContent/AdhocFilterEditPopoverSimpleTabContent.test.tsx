/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import * as redux from 'react-redux';
import {
  act,
  fireEvent,
  render,
  screen,
  userEvent,
  waitFor,
} from 'spec/helpers/testing-library';
import thunk from 'redux-thunk';
import configureStore from 'redux-mock-store';

import AdhocFilter from 'src/explore/components/controls/FilterControl/AdhocFilter';
import {
  AGGREGATES,
  Operators,
  OPERATOR_ENUM_TO_OPERATOR_TYPE,
} from 'src/explore/constants';
import AdhocMetric from 'src/explore/components/controls/MetricControl/AdhocMetric';
import {
  FeatureFlag,
  isFeatureEnabled,
  SupersetClient,
  type JsonResponse,
} from '@superset-ui/core';
import fetchMock from 'fetch-mock';

import { TestDataset, Dataset } from '@superset-ui/chart-controls';
import AdhocFilterEditPopoverSimpleTabContent, { Props } from '.';
import { Clauses, ExpressionTypes } from '../types';

const simpleAdhocFilter = new AdhocFilter({
  expressionType: ExpressionTypes.Simple,
  subject: 'value',
  operatorId: Operators.GreaterThan,
  operator: OPERATOR_ENUM_TO_OPERATOR_TYPE[Operators.GreaterThan].operation,
  comparator: '10',
  clause: Clauses.Where,
});

const advancedTypeTestAdhocFilterTest = new AdhocFilter({
  expressionType: ExpressionTypes.Simple,
  subject: 'advancedDataType',
  operatorId: undefined,
  operator: undefined,
  comparator: undefined,
  clause: undefined,
});

const simpleMultiAdhocFilter = new AdhocFilter({
  expressionType: ExpressionTypes.Simple,
  subject: 'value',
  operatorId: Operators.In,
  operator: OPERATOR_ENUM_TO_OPERATOR_TYPE[Operators.In].operation,
  comparator: ['10'],
  clause: Clauses.Where,
});

const sumValueAdhocMetric = new AdhocMetric({
  expressionType: ExpressionTypes.Simple,
  column: { type: 'VARCHAR(255)', column_name: 'source', id: 5 },
  aggregate: AGGREGATES.SUM,
  label: 'test-AdhocMetric',
});

const options = [
  { type: 'VARCHAR(255)', column_name: 'source', id: 1 },
  { type: 'VARCHAR(255)', column_name: 'target', id: 2 },
  { type: 'DOUBLE', column_name: 'value', id: 3 },
  { saved_metric_name: 'my_custom_metric', id: 4 },
  sumValueAdhocMetric,
];

const getAdvancedDataTypeTestProps = (overrides?: Record<string, unknown>) => {
  const onChange = jest.fn();
  const validHandler = jest.fn();
  const props = {
    adhocFilter: advancedTypeTestAdhocFilterTest,
    onChange,
    options: [{ type: 'DOUBLE', column_name: 'advancedDataType', id: 5 }],
    datasource: {
      ...TestDataset,

      columns: [],
      filter_select: false,
    },
    partitionColumn: 'test',
    ...overrides,
    validHandler,
  };
  return props;
};

function setup(overrides?: Record<string, unknown>) {
  const onChange = jest.fn();
  const validHandler = jest.fn();
  const spy = jest.spyOn(redux, 'useSelector');
  spy.mockReturnValue({});
  const props = {
    adhocFilter: simpleAdhocFilter,
    onChange,
    options,
    datasource: {
      ...TestDataset,

      columns: [],
      filter_select: false,
    },
    partitionColumn: 'test',
    ...overrides,
    validHandler,
  };
  render(
    <AdhocFilterEditPopoverSimpleTabContent {...(props as unknown as Props)} />,
  );
  return props;
}

jest.mock('@superset-ui/core', () => ({
  ...jest.requireActual('@superset-ui/core'),
  isFeatureEnabled: jest.fn(),
}));

const mockedIsFeatureEnabled = isFeatureEnabled as jest.Mock;

const ADVANCED_DATA_TYPE_ENDPOINT_VALID =
  'glob:*/api/v1/advanced_data_type/convert?q=(operator:%27%27,type:type,values:!(v))';
const ADVANCED_DATA_TYPE_ENDPOINT_INVALID =
  'glob:*/api/v1/advanced_data_type/convert?q=(operator:%27%27,type:type,values:!(e))';

fetchMock.get(ADVANCED_DATA_TYPE_ENDPOINT_VALID, {
  result: {
    display_value: 'VALID',
    error_message: '',
    valid_filter_operators: [Operators.Equals],
    values: ['VALID'],
  },
});
fetchMock.get(ADVANCED_DATA_TYPE_ENDPOINT_INVALID, {
  result: {
    display_value: '',
    error_message: 'error',
    valid_filter_operators: [],
    values: [],
  },
});

const mockStore = configureStore([thunk]);
const store = mockStore({});

let isFeatureEnabledMock: jest.SpyInstance;

beforeEach(() => {
  fetchMock.clearHistory();
  isFeatureEnabledMock = mockedIsFeatureEnabled.mockImplementation(
    (featureFlag: FeatureFlag) =>
      featureFlag === FeatureFlag.EnableAdvancedDataTypes,
  );
});

afterAll(() => {
  if (isFeatureEnabledMock) {
    isFeatureEnabledMock.mockRestore();
  }
});

test('can render the simple tab form', () => {
  expect(() => setup()).not.toThrow();
});

const openOperatorMenu = async () => {
  await userEvent.click(
    screen.getByRole('combobox', { name: 'Select operator' }),
  );
};

const selectOperator = async (label: string) => {
  await openOperatorMenu();
  await userEvent.click(await screen.findByText(label));
};

test.each(['BOOL', 'INT'])(
  'shows boolean and null operators for %s columns',
  async type => {
    setup({
      adhocFilter: new AdhocFilter({
        expressionType: ExpressionTypes.Simple,
        subject: 'value',
        clause: Clauses.Where,
      }),
      datasource: {
        columns: [{ id: 3, column_name: 'value', type }],
      },
    });
    await openOperatorMenu();
    expect(screen.getByText('Is true')).toBeInTheDocument();
    expect(screen.getByText('Is false')).toBeInTheDocument();
    expect(screen.getByText('Is null')).toBeInTheDocument();
    expect(screen.getByText('Is not null')).toBeInTheDocument();
  },
);

test('converts an individual comparator to an array for a multi operator', async () => {
  const props = setup();
  await selectOperator('In');
  expect(props.onChange).toHaveBeenLastCalledWith(
    expect.objectContaining({ operatorId: Operators.In, comparator: ['10'] }),
  );
});

test('preserves a false comparator when converting to a multi operator', async () => {
  const props = setup({
    adhocFilter: new AdhocFilter({
      expressionType: ExpressionTypes.Simple,
      subject: 'value',
      operatorId: Operators.Equals,
      operator: OPERATOR_ENUM_TO_OPERATOR_TYPE[Operators.Equals].operation,
      comparator: false,
      clause: Clauses.Where,
    }),
  });
  await selectOperator('In');
  expect(props.onChange).toHaveBeenLastCalledWith(
    expect.objectContaining({ operatorId: Operators.In, comparator: [false] }),
  );
});

test('converts a multi comparator to an individual value', async () => {
  const props = setup({
    adhocFilter: simpleMultiAdhocFilter,
  });
  await selectOperator('Less than (<)');
  expect(props.onChange).toHaveBeenLastCalledWith(
    simpleMultiAdhocFilter.duplicateWith({
      operatorId: Operators.LessThan,
      operator: '<',
      comparator: '10',
    }),
  );
});

test('passes the new comparator to onChange', () => {
  const props = setup();
  fireEvent.change(screen.getByTestId('adhoc-filter-simple-value'), {
    target: { value: '20' },
  });
  expect(props.onChange).toHaveBeenLastCalledWith(
    simpleAdhocFilter.duplicateWith({ comparator: '20' }),
  );
});

test('shows LIKE for table datasources', async () => {
  setup({ datasource: { type: 'table' as const } });
  await openOperatorMenu();
  expect(screen.getByText('Like')).toBeInTheDocument();
});

test('shows LATEST PARTITION only for the partition column', async () => {
  setup({
    datasource: {
      type: 'table' as const,
      datasource_name: 'table1',
      schema: 'schema',
    },
    adhocFilter: simpleAdhocFilter,
    partitionColumn: 'ds',
  });
  await openOperatorMenu();
  expect(
    screen.queryByText('use latest_partition template'),
  ).not.toBeInTheDocument();
});

test('generates custom SQL when selecting LATEST PARTITION', async () => {
  const testAdhocFilter = new AdhocFilter({
    expressionType: ExpressionTypes.Simple,
    subject: 'ds',
  });
  const props = setup({
    datasource: {
      type: 'table' as const,
      datasource_name: 'table1',
      schema: 'schema',
    },
    adhocFilter: testAdhocFilter,
    partitionColumn: 'ds',
  });
  await selectOperator('use latest_partition template');
  expect(props.onChange).toHaveBeenLastCalledWith(
    testAdhocFilter.duplicateWith({
      subject: 'ds',
      operator: 'LATEST PARTITION',
      operatorId: Operators.LatestPartition,
      comparator: null,
      clause: 'WHERE',
      expressionType: 'SQL',
      sqlExpression: "ds = '{{ presto.latest_partition('schema.table1') }}'",
    }),
  );
});

test('does not display boolean operators for a string column', async () => {
  setup({
    datasource: {
      type: 'table' as const,
      datasource_name: 'table1',
      schema: 'schema',
      columns: [{ column_name: 'value', type: 'STRING' }],
    },
    adhocFilter: simpleAdhocFilter,
  });
  await openOperatorMenu();
  expect(screen.queryByText('Is true')).not.toBeInTheDocument();
  expect(screen.queryByText('Is false')).not.toBeInTheDocument();
});

test('displays boolean operators when the column is an expression', async () => {
  setup({
    datasource: {
      type: 'table' as const,
      datasource_name: 'table1',
      schema: 'schema',
      columns: [
        {
          column_name: 'value',
          expression: 'case when value is 0 then "NO"',
        },
      ],
    },
    adhocFilter: simpleAdhocFilter,
  });
  await openOperatorMenu();
  expect(screen.getByText('Is true')).toBeInTheDocument();
  expect(screen.getByText('Is false')).toBeInTheDocument();
});

test.each([
  [Operators.IsTrue, 'Is true'],
  [Operators.IsFalse, 'Is false'],
  [Operators.IsNull, 'Is null'],
  [Operators.IsNotNull, 'Is not null'],
])('clears the comparator for %s', async (operatorId, label) => {
  const props = setup({
    datasource: { columns: [{ column_name: 'value', type: 'INT' }] },
  });
  await selectOperator(label);
  expect(props.onChange).toHaveBeenLastCalledWith(
    expect.objectContaining({
      operatorId,
      operator: OPERATOR_ENUM_TO_OPERATOR_TYPE[operatorId].operation,
      comparator: undefined,
    }),
  );
});

test('should not call API when column has no advanced data type', async () => {
  const props = getAdvancedDataTypeTestProps();

  await act(async () => {
    render(
      <AdhocFilterEditPopoverSimpleTabContent
        {...(props as unknown as Props)}
      />,
      {
        store,
      },
    );
  });

  const filterValueField = screen.getByPlaceholderText(
    'Filter value (case sensitive)',
  );
  await act(async () => {
    userEvent.type(filterValueField, 'v');
  });

  await act(async () => {
    userEvent.type(filterValueField, '{enter}');
  });

  await waitFor(() =>
    expect(
      fetchMock.callHistory.calls(ADVANCED_DATA_TYPE_ENDPOINT_VALID),
    ).toHaveLength(0),
  );
});

test('should call API when column has advanced data type', async () => {
  const props = getAdvancedDataTypeTestProps({
    options: [
      {
        type: 'DOUBLE',
        column_name: 'advancedDataType',
        id: 5,
        advanced_data_type: 'type',
      },
    ],
  });

  await act(async () => {
    render(
      <AdhocFilterEditPopoverSimpleTabContent
        {...(props as unknown as Props)}
      />,
      {
        store,
      },
    );
  });

  const filterValueField = screen.getByPlaceholderText(
    'Filter value (case sensitive)',
  );
  await act(async () => {
    userEvent.type(filterValueField, 'v');
  });

  await act(async () => {
    userEvent.type(filterValueField, '{enter}');
  });

  await waitFor(() =>
    expect(
      fetchMock.callHistory.calls(ADVANCED_DATA_TYPE_ENDPOINT_VALID),
    ).toHaveLength(1),
  );
  expect(
    props.validHandler.mock.calls[props.validHandler.mock.calls.length - 1][0],
  ).toBe(true);
});

test('save button should be disabled if error message from API is returned', async () => {
  const props = getAdvancedDataTypeTestProps({
    options: [
      {
        type: 'DOUBLE',
        column_name: 'advancedDataType',
        id: 5,
        advanced_data_type: 'type',
      },
    ],
  });

  await act(async () => {
    render(
      <AdhocFilterEditPopoverSimpleTabContent
        {...(props as unknown as Props)}
      />,
      {
        store,
      },
    );
  });

  const filterValueField = screen.getByPlaceholderText(
    'Filter value (case sensitive)',
  );
  await act(async () => {
    userEvent.type(filterValueField, 'e');
  });

  await act(async () => {
    userEvent.type(filterValueField, '{enter}');
  });

  await waitFor(() =>
    expect(
      fetchMock.callHistory.calls(ADVANCED_DATA_TYPE_ENDPOINT_INVALID),
    ).toHaveLength(1),
  );
  expect(
    props.validHandler.mock.calls[props.validHandler.mock.calls.length - 1][0],
  ).toBe(false);
});

test('advanced data type operator list should update after API response', async () => {
  const props = getAdvancedDataTypeTestProps({
    options: [
      {
        type: 'DOUBLE',
        column_name: 'advancedDataType',
        id: 5,
        advanced_data_type: 'type',
      },
    ],
  });

  await act(async () => {
    render(
      <AdhocFilterEditPopoverSimpleTabContent
        {...(props as unknown as Props)}
      />,
      {
        store,
      },
    );
  });

  const filterValueField = screen.getByPlaceholderText(
    'Filter value (case sensitive)',
  );
  await act(async () => {
    userEvent.type(filterValueField, 'v');
  });

  await act(async () => {
    userEvent.type(filterValueField, '{enter}');
  });

  await waitFor(() =>
    expect(
      fetchMock.callHistory.calls(ADVANCED_DATA_TYPE_ENDPOINT_VALID),
    ).toHaveLength(1),
  );
  expect(
    props.validHandler.mock.calls[props.validHandler.mock.calls.length - 1][0],
  ).toBe(true);

  const operatorValueField = screen.getByRole('combobox', {
    name: 'Select operator',
  });

  userEvent.click(operatorValueField);

  await act(async () => {
    userEvent.type(operatorValueField, '{enter}');
  });

  expect(
    await screen.findByText('Equal to (=)', {
      selector: '.ant-select-selection-item',
    }),
  ).toBeInTheDocument();
});

test.each([Operators.IsNull, Operators.IsNotNull])(
  'loads advanced type operators when editing %s without validating a value',
  async operatorId => {
    const get = jest.spyOn(SupersetClient, 'get').mockResolvedValue({
      response: new Response(),
      json: {
        result: {
          display_value: '',
          error_message: 'Value must not be empty',
          valid_filter_operators: [Operators.Equals, Operators.In],
          values: [],
        },
      },
    });
    const props = getAdvancedDataTypeTestProps({
      adhocFilter: new AdhocFilter({
        subject: 'advancedDataType',
        operatorId,
        operator: OPERATOR_ENUM_TO_OPERATOR_TYPE[operatorId].operation,
        clause: Clauses.Where,
      }),
      options: [
        {
          type: 'DOUBLE',
          column_name: 'advancedDataType',
          id: 5,
          advanced_data_type: 'type',
        },
      ],
    });

    render(
      <AdhocFilterEditPopoverSimpleTabContent
        {...(props as unknown as Props)}
      />,
      { store },
    );

    await waitFor(() => expect(get).toHaveBeenCalled());
    await userEvent.click(
      screen.getByRole('combobox', { name: 'Select operator' }),
    );
    expect(await screen.findByText('Equal to (=)')).toBeInTheDocument();
    expect(props.validHandler).not.toHaveBeenCalledWith(false);
    expect(
      screen.queryByText('Value must not be empty'),
    ).not.toBeInTheDocument();
    get.mockRestore();
  },
);

test('ignores a stale value validation after switching to a nullary operator', async () => {
  const pending: ((response: JsonResponse) => void)[] = [];
  const get = jest
    .spyOn(SupersetClient, 'get')
    .mockImplementationOnce(() => new Promise(resolve => pending.push(resolve)))
    .mockResolvedValue({
      response: new Response(),
      json: {
        result: {
          display_value: '',
          error_message: 'Value must not be empty',
          valid_filter_operators: [Operators.Equals],
          values: [],
        },
      },
    });
  const props = getAdvancedDataTypeTestProps({
    adhocFilter: new AdhocFilter({
      subject: 'advancedDataType',
      operatorId: Operators.Equals,
      operator: '==',
      comparator: 'invalid',
      clause: Clauses.Where,
    }),
    options: [
      {
        type: 'DOUBLE',
        column_name: 'advancedDataType',
        id: 5,
        advanced_data_type: 'type',
      },
    ],
  });
  const { rerender } = render(
    <AdhocFilterEditPopoverSimpleTabContent {...(props as unknown as Props)} />,
    { store },
  );
  await waitFor(() => expect(pending).toHaveLength(1));

  rerender(
    <AdhocFilterEditPopoverSimpleTabContent
      {...(props as unknown as Props)}
      adhocFilter={props.adhocFilter.duplicateWith({
        operatorId: Operators.IsNull,
        operator: 'IS NULL',
      })}
    />,
  );
  await waitFor(() => expect(get).toHaveBeenCalledTimes(2));
  await act(async () => {
    pending[0]({
      response: new Response(),
      json: {
        result: {
          display_value: '',
          error_message: 'Invalid value',
          valid_filter_operators: [],
          values: [],
        },
      },
    });
  });
  expect(props.validHandler).not.toHaveBeenCalledWith(false);
  get.mockRestore();
});

test('dropdown should remain open when clicked after filter is configured', async () => {
  const onChange = jest.fn();
  const validHandler = jest.fn();
  const spy = jest.spyOn(redux, 'useSelector');
  spy.mockReturnValue({});

  const filterWithSubjectAndOperator = new AdhocFilter({
    expressionType: ExpressionTypes.Simple,
    subject: 'value',
    operatorId: Operators.Equals,
    operator: OPERATOR_ENUM_TO_OPERATOR_TYPE[Operators.Equals].operation,
    comparator: '10',
    clause: Clauses.Where,
  });

  const props = {
    adhocFilter: filterWithSubjectAndOperator,
    onChange,
    options,
    datasource: {
      ...TestDataset,
      columns: [{ column_name: 'value', type: 'DOUBLE', id: 3 }],
      filter_select: false,
    } as Dataset,
    partitionColumn: 'test',
    validHandler,
  };

  render(
    <AdhocFilterEditPopoverSimpleTabContent {...(props as unknown as Props)} />,
  );

  const operatorDropdown = screen.getByRole('combobox', {
    name: 'Select operator',
  });

  await act(async () => {
    userEvent.click(operatorDropdown);
  });

  await waitFor(() => {
    expect(operatorDropdown).toHaveAttribute('aria-expanded', 'true');
  });

  expect(operatorDropdown).toHaveAttribute('aria-expanded', 'true');
});
