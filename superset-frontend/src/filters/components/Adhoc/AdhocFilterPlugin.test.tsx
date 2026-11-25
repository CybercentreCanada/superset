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
import { AppSection, type DataMask } from '@superset-ui/core';
import { render, screen, userEvent } from 'spec/helpers/testing-library';
import AdhocFilter from 'src/explore/components/controls/FilterControl/AdhocFilter';
import PluginFilterAdhoc from './AdhocFilterPlugin';
import { DEFAULT_FORM_DATA, type PluginFilterAdhocProps } from './types';

const mockFilters = [
  new AdhocFilter({ subject: 'country', operator: '==', comparator: 'CA' }),
  new AdhocFilter({ subject: 'city', operator: '==', comparator: 'Ottawa' }),
];

jest.mock(
  'src/explore/components/controls/FilterControl/AdhocFilterControl',
  () =>
    ({ onChange }: { onChange: (filters: AdhocFilter[]) => void }) => (
      <>
        <button type="button" onClick={() => onChange(mockFilters.slice(0, 1))}>
          One filter
        </button>
        <button type="button" onClick={() => onChange(mockFilters)}>
          Two filters
        </button>
        <button type="button" onClick={() => onChange([])}>
          Clear filters
        </button>
      </>
    ),
);

const setDataMask = jest.fn<void, [DataMask]>();
const props: PluginFilterAdhocProps = {
  formData: {
    ...DEFAULT_FORM_DATA,
    enableEmptyFilter: true,
    datasource: '',
    viz_type: 'filter_adhoc',
    height: 32,
    width: 200,
  },
  filterState: {
    validateStatus: 'error',
    validateMessage: 'Value is required',
  },
  height: 32,
  width: 200,
  coltypeMap: {},
  data: [],
  behaviors: [],
  appSection: AppSection.FilterConfigModal,
  isRefreshing: false,
  showOverflow: false,
  setDataMask,
  setFocusedFilter: jest.fn(),
  unsetFocusedFilter: jest.fn(),
  setHoveredFilter: jest.fn(),
  unsetHoveredFilter: jest.fn(),
  setFilterActive: jest.fn(),
};

test('required validation follows the number of ad hoc filters', async () => {
  const { rerender } = render(<PluginFilterAdhoc {...props} />, {
    useRedux: true,
  });
  expect(screen.getByText('Value is required')).toBeInTheDocument();

  await userEvent.click(screen.getByText('One filter'));
  const oneFilterState = setDataMask.mock.lastCall?.[0].filterState;
  expect(oneFilterState).toMatchObject({
    value: [mockFilters[0]],
    filters: [mockFilters[0]],
    validateStatus: undefined,
    validateMessage: undefined,
  });
  rerender(<PluginFilterAdhoc {...props} filterState={oneFilterState || {}} />);
  expect(screen.queryByText('Value is required')).not.toBeInTheDocument();

  await userEvent.click(screen.getByText('Two filters'));
  const twoFilterState = setDataMask.mock.lastCall?.[0].filterState;
  expect(twoFilterState?.value).toEqual(mockFilters);
  rerender(<PluginFilterAdhoc {...props} filterState={twoFilterState || {}} />);
  expect(screen.queryByText('Value is required')).not.toBeInTheDocument();

  await userEvent.click(screen.getByText('Clear filters'));
  const emptyFilterState = setDataMask.mock.lastCall?.[0].filterState;
  expect(emptyFilterState?.value).toBeUndefined();
  rerender(
    <PluginFilterAdhoc
      {...props}
      filterState={{
        ...emptyFilterState,
        validateStatus: 'error',
      }}
    />,
  );
  expect(screen.getByText('Value is required')).toBeInTheDocument();
});

test('does not display a stale validation message without an error status', () => {
  render(
    <PluginFilterAdhoc
      {...props}
      filterState={{
        value: mockFilters,
        filters: mockFilters,
        validateMessage: 'Value is required',
      }}
    />,
    { useRedux: true },
  );
  expect(screen.queryByText('Value is required')).not.toBeInTheDocument();
});

test('shows a required error for an initially empty filter without a message', () => {
  render(
    <PluginFilterAdhoc {...props} filterState={{ validateStatus: 'error' }} />,
    { useRedux: true },
  );
  expect(screen.getByText('Value is required')).toBeInTheDocument();
});

test('does not show a required message for an optional or valid filter', () => {
  const { rerender } = render(
    <PluginFilterAdhoc
      {...props}
      formData={{ ...props.formData, enableEmptyFilter: false }}
      filterState={{ validateStatus: 'error' }}
    />,
    { useRedux: true },
  );
  expect(screen.queryByText('Value is required')).not.toBeInTheDocument();

  rerender(<PluginFilterAdhoc {...props} filterState={{}} />);
  expect(screen.queryByText('Value is required')).not.toBeInTheDocument();

  rerender(
    <PluginFilterAdhoc
      {...props}
      filterState={{
        value: mockFilters,
        filters: mockFilters,
        validateStatus: 'error',
      }}
    />,
  );
  expect(screen.queryByText('Value is required')).not.toBeInTheDocument();
});
