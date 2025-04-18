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
import {
  t,
  QueryMode,
  ensureIsArray,
  validateNonEmpty,
} from '@superset-ui/core';
import {
  Dataset,
  ControlConfig,
  ControlStateMapping,
  ControlPanelConfig,
  ControlPanelsContainerProps,
  QueryModeLabel,
  sharedControls,
  ControlPanelState,
  ControlState,
  formatSelectOptions,
  ColumnMeta,
} from '@superset-ui/chart-controls';
import { StyledColumnOption } from 'src/explore/components/optionRenderers';

import { bootstrapData } from 'src/preamble';
import AdhocFilterControl from 'src/explore/components/controls/FilterControl/AdhocFilterControl';
import ChangeDataSourceButton from '../components/controls/changeDatasourceButton';
import AdvancedDataTypeValue from '../components/controls/advancedDataTypeValueControl';
import DateTimeControl from '../components/controls/datetimeControl';

export const PAGE_SIZE_OPTIONS = formatSelectOptions<number>([
  [0, t('page_size.all')],
  10,
  20,
  50,
  100,
  200,
]);

function getQueryMode(controls: ControlStateMapping): QueryMode {
  const mode = controls?.query_mode?.value;
  if (mode === QueryMode.Aggregate || mode === QueryMode.Raw) {
    return mode as QueryMode;
  }
  return QueryMode.Raw;
}

/**
 * Visibility check
 */
function isQueryMode(mode: QueryMode) {
  return ({ controls }: Pick<ControlPanelsContainerProps, 'controls'>) =>
    getQueryMode(controls) === mode;
}

const isAggMode = isQueryMode(QueryMode.Aggregate);
const isRawMode = isQueryMode(QueryMode.Raw);
const isTimeColumnSelected = ({
  controls,
}: Pick<ControlPanelsContainerProps, 'controls'>) =>
  controls.granularity_sqla && !!controls.granularity_sqla.value;

const queryMode: ControlConfig<'RadioButtonControl'> = {
  type: 'RadioButtonControl',
  label: t('Query mode'),
  default: QueryMode.Raw,
  value: QueryMode.Raw,
  options: [
    [QueryMode.Aggregate, QueryModeLabel[QueryMode.Aggregate]],
    [QueryMode.Raw, QueryModeLabel[QueryMode.Raw]],
  ],
  mapStateToProps: ({ controls }) => ({ value: getQueryMode(controls) }),
  rerender: ['columns', 'groupby'],
};

const config: ControlPanelConfig = {
  // For control input types, see: superset-frontend/src/explore/components/controls/index.js
  controlPanelSections: [
    {
      label: t('Query'),
      expanded: true,
      controlSetRows: [
        [
          {
            name: 'datasource_config',
            config: {
              type: ChangeDataSourceButton,
              label: t('Jump Actions'),
              description: t('Configure dashboard jump actions.'),
              mapStateToProps: (state: ControlPanelState) => ({
                datasource: state.datasource,
              }),
            },
          },
        ],
        [
          {
            name: 'query_mode',
            config: queryMode,
          },
        ],
        [
          {
            name: 'granularity_sqla',
            config: {
              type: 'SelectControl',
              label: 'Time Column',
              description: t(
                'The time column for the visualization. Note that you ' +
                  'can define arbitrary expression that return a DATETIME ' +
                  'column in the table. Also note that the ' +
                  'filter below is applied against this column or ' +
                  'expression',
              ),
              clearable: false,
              valueKey: 'column_name',
              rerender: ['time_range'],
              mapStateToProps: state => {
                const props: any = {};
                if (
                  state.datasource &&
                  'granularity_sqla' in state.datasource
                ) {
                  props.options = state.datasource.columns
                    .filter(c =>
                      ensureIsArray(
                        (state.datasource as Dataset)?.granularity_sqla,
                      )
                        .map(g => g[0])
                        .includes(c.column_name),
                    )
                    .map(c => ({
                      label: c.verbose_name ? c.verbose_name : c.column_name,
                      column_name: c.column_name,
                    }));
                  props.default = undefined;
                  if (state.datasource.main_dttm_col) {
                    props.default = state.datasource.main_dttm_col;
                  } else if (props.options && props.options.length > 0) {
                    props.default = props.options.column_name;
                  }
                }
                return props;
              },
            },
          },
        ],
        [
          {
            name: 'time_range',
            config: {
              type: DateTimeControl,
              label: t('Time Range'),
              default: 'Today : Tomorrow',
              resetOnHide: false,
              mapStateToProps: (state: ControlPanelState) => {
                const disabled = !isTimeColumnSelected(state);
                return { disabled };
              },
            },
          },
        ],
        [
          {
            name: 'groupby',
            config: {
              type: 'SelectControl',
              label: t('Dimensions'),
              description: t('Columns to display'),
              multi: true,
              freeForm: true,
              allowAll: true,
              default: [],
              canSelectAll: true,
              rerender: ['advanced_data_type_selection'],
              optionRenderer: (c: ColumnMeta) => (
                // eslint-disable-next-line react/react-in-jsx-scope
                <StyledColumnOption showType column={c} />
              ),
              // eslint-disable-next-line react/react-in-jsx-scope
              valueRenderer: (c: ColumnMeta) => (
                // eslint-disable-next-line react/react-in-jsx-scope
                <StyledColumnOption column={c} />
              ),
              valueKey: 'column_name',
              mapStateToProps: (
                state: ControlPanelState,
                controlState: ControlState,
              ) => {
                const { controls } = state;
                const originalMapStateToProps =
                  sharedControls?.groupby?.mapStateToProps;
                const newState =
                  originalMapStateToProps?.(state, controlState) ?? {};
                newState.externalValidationErrors =
                  // @ts-ignore
                  isAggMode({ controls }) &&
                  ensureIsArray(controlState.value).length === 0
                    ? [t('must have a value')]
                    : [];
                return newState;
              },
              visibility: isAggMode,
              canCopy: true,
            },
          },
        ],
        [
          {
            name: 'columns',
            config: {
              type: 'SelectControl',
              label: t('Dimensions'),
              description: t('Columns to display'),
              multi: true,
              freeForm: true,
              allowAll: true,
              default: [],
              canSelectAll: true,
              rerender: ['advanced_data_type_selection'],
              optionRenderer: (c: ColumnMeta) => (
                // eslint-disable-next-line react/react-in-jsx-scope
                <StyledColumnOption showType column={c} />
              ),
              // eslint-disable-next-line react/react-in-jsx-scope
              valueRenderer: (c: ColumnMeta) => (
                // eslint-disable-next-line react/react-in-jsx-scope
                <StyledColumnOption column={c} />
              ),
              valueKey: 'column_name',
              mapStateToProps: (
                state: ControlPanelState,
                controlState: ControlState,
              ) => {
                const { controls } = state;
                const originalMapStateToProps =
                  sharedControls?.columns?.mapStateToProps;
                const newState =
                  originalMapStateToProps?.(state, controlState) ?? {};
                newState.externalValidationErrors =
                  // @ts-ignore
                  isRawMode({ controls }) &&
                  ensureIsArray(controlState.value).length === 0
                    ? [t('must have a value')]
                    : [];
                return newState;
              },
              visibility: isRawMode,
              canCopy: true,
            },
          },
        ],
        [
          {
            name: 'advanced_data_type_selection',
            config: {
              type: 'SelectControl',
              label: t('Advanced Data Type'),
              description: t(
                'The advanced data type used to filter the rows to display',
              ),
              multi: false,
              rerender: ['advanced_data_type_value'],
              default: [],
              valueKey: 'value',
              mapStateToProps: (state: ControlPanelState) => {
                const options = state.datasource?.columns
                  ? bootstrapData?.common?.advanced_data_types
                      ?.filter(v =>
                        (state.datasource as Dataset).columns.some(
                          c => c.advanced_data_type === v.id,
                        ),
                      )
                      .map(v => ({ value: v.id, label: v.verbose_name }))
                  : [];
                return { options };
              },
              resetOnHide: false,
            },
          },
        ],
        [
          {
            name: 'advanced_data_type_value',
            config: {
              type: AdvancedDataTypeValue,
              freeForm: true,
              label: t('Values'),
              description: t(
                'The value to be used along with the advanced data type to filter the rows to display',
              ),
              multi: true,
              default: [],
              resetOnHide: false,
              mapStateToProps: (
                state: ControlPanelState,
                controlState: ControlState,
              ) => {
                const { datasource } = state;
                const advancedDataType =
                  state.controls?.advanced_data_type_selection?.value || '';
                const disabled = ensureIsArray(advancedDataType).length === 0;
                const val: any = controlState.value;
                const externalValidationErrors =
                  !disabled && ensureIsArray(val)[0]?.columns.length === 0
                    ? [t('Must have a valid entry')]
                    : [];
                return {
                  datasource,
                  advancedDataType,
                  disabled,
                  externalValidationErrors,
                };
              },
            },
          },
        ],
        [
          {
            name: 'adhoc_filters_no_date_default',
            config: {
              type: AdhocFilterControl,
              label: t('Filters'),
              mapStateToProps(state, controlState, chartState) {
                const { datasource } = state;
                const columns = datasource?.columns;
                return { datasource, columns };
              },
            },
          },
        ],
        [
          {
            name: 'order_by_cols',
            config: {
              type: 'SelectControl',
              label: t('Ordering'),
              description: t('Order results by selected columns'),
              multi: true,
              default: [],
              mapStateToProps: ({ datasource }) => ({
                choices: datasource?.hasOwnProperty('order_by_choices')
                  ? (datasource as Dataset)?.order_by_choices
                  : datasource?.columns || [],
              }),
              resetOnHide: false,
            },
          },
        ],
        [
          {
            name: 'row_limit',
            override: {
              label: t('Row Limit'),
              default: 100,
            },
          },
        ],
        [
          {
            name: 'column_state',
            config: {
              type: 'HiddenControl',
              hidden: true,
              label: t('Column state'),
              description: t('State of AG Grid columns'),
              dontRefreshOnChange: true,
            },
          },
        ],
      ],
    },
  ],
  // override controls that are inherited by the default configuration
  controlOverrides: {
    series: {
      validators: [validateNonEmpty],
      clearable: false,
    },
    viz_type: {
      default: 'cccs_grid',
    },
    time_range: {
      default: t('Last day'),
    },
  },
};

export default config;
