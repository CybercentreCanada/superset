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
import React from 'react';

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
import ChangeDataSourceButton from '../../../plugin-chart-cccs-grid/src/components/controls/changeDatasourceButton';
import SelecttorValue from '../../../plugin-chart-cccs-grid/src/components/controls/selectorValueControl';
import DateTimeControl from '../../../plugin-chart-cccs-grid/src/components/controls/datetimeControl';

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
  if (mode === QueryMode.aggregate || mode === QueryMode.raw) {
    return mode as QueryMode;
  }
  return QueryMode.raw;
}

/**
 * Visibility check
 */
function isQueryMode(mode: QueryMode) {
  return ({ controls }: Pick<ControlPanelsContainerProps, 'controls'>) =>
    getQueryMode(controls) === mode;
}

const isAggMode = isQueryMode(QueryMode.aggregate);
const isRawMode = isQueryMode(QueryMode.raw);
const isTimeColumnSelected = ({
  controls,
}: Pick<ControlPanelsContainerProps, 'controls'>) => {
  const val = controls.granularity_sqla.value;
  return !!val;
};

const queryMode: ControlConfig<'RadioButtonControl'> = {
  type: 'RadioButtonControl',
  label: t('Query mode'),
  default: QueryMode.raw,
  value: QueryMode.raw,
  options: [
    [QueryMode.aggregate, QueryModeLabel[QueryMode.aggregate]],
    [QueryMode.raw, QueryModeLabel[QueryMode.raw]],
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
              optionRenderer: (c: any) => (
                <StyledColumnOption column={c} showType />
              ),
              valueKey: 'column_name',
              mapStateToProps: state => {
                const props: any = {};
                if (
                  state.datasource &&
                  'granularity_sqla' in state.datasource
                ) {
                  props.choices = state.datasource.granularity_sqla;
                  props.default = null;
                  if (state.datasource.main_dttm_col) {
                    props.default = state.datasource.main_dttm_col;
                  } else if (props.choices && props.choices.length > 0) {
                    props.default = props.choices[0].column_name;
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
              visibility: isTimeColumnSelected,
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
              rerender: ['selector_selection'],
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
              rerender: ['selector_selection'],
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
            name: 'selector_selection',
            config: {
              type: 'SelectControl',
              label: t('Selector'),
              description: t(
                'The advanced data type used to filter the rows to display',
              ),
              multi: false,
              rerender: ['selector_selection_value'],
              default: [],
              valueKey: 'value',
              mapStateToProps: (
                state: ControlPanelState,
                controlState: ControlState,
              ) => {
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
            name: 'selector_selection_value',
            config: {
              type: SelecttorValue,
              freeForm: true,
              label: t('Values'),
              description: t(
                'The value to be used along with the selector to filter the rows to display',
              ),
              multi: true,
              default: [],
              resetOnHide: false,
              mapStateToProps: (
                state: ControlPanelState,
                controlState: ControlState,
              ) => {
                const { datasource } = state;
                const selector =
                  state.controls?.selector_selection?.value || '';
                const disabled = ensureIsArray(selector).length === 0;
                const externalValidationErrors =
                  !disabled &&
                  controlState.value?.hasOwnProperty('columns') &&
                  ensureIsArray(controlState.value?.columns).length === 0
                    ? [t('must have a value')]
                    : [];
                return {
                  datasource,
                  selector,
                  disabled,
                  externalValidationErrors,
                };
              },
            },
          },
        ],
        [
          {
            name: 'adhoc_filters',
            override: {
              // validators: [adhocFilterValidator],
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
    // For CLDN-941: hiding away options that are not hooked up to the ag-grid, moving all to a block that
    // will hide / show the tab based on DASHBOARD_CROSS_FILTERS being enabled since that's the only option
    // that is working.
    // {
    //   label: t('CCCS Grid Options'),
    //   expanded: true,
    //   controlSetRows: [
    //     [
    //       {
    //         name: 'bold_text',
    //         config: {
    //           type: 'CheckboxControl',
    //           label: t('Bold Text'),
    //           renderTrigger: true,
    //           default: true,
    //           description: t('A checkbox to make the '),
    //         },
    //       },
    //     ],
    //     isFeatureEnabled(FeatureFlag.DASHBOARD_CROSS_FILTERS)
    //     ? [
    //         {
    //           name: 'table_filter',
    //           config: {
    //             type: 'CheckboxControl',
    //             label: t('Enable emitting filters'),
    //             default: false,
    //             renderTrigger: true,
    //             description: t('Whether to apply filter to dashboards when grid cells are clicked.'),
    //           },
    //         },
    //       ] : []
    //     ,
    //     [
    //       {
    //         name: 'column_config',
    //         config: {
    //           type: 'ColumnConfigControl',
    //           label: t('Customize columns'),
    //           description: t('Further customize how to display each column'),
    //           renderTrigger: true,
    //           mapStateToProps(explore, control, chart) {
    //             return {
    //               queryResponse: chart?.queriesResponse?.[0] as ChartDataResponseResult | undefined,
    //               emitFilter: explore?.controls?.table_filter?.value,
    //             };
    //           },
    //         },
    //       },
    //     ],
    //     [
    //       {
    //         name: 'header_font_size',
    //         config: {
    //           type: 'SelectControl',
    //           label: t('Font Size'),
    //           default: 'xl',
    //           choices: [
    //             // [value, label]
    //             ['xxs', 'xx-small'],
    //             ['xs', 'x-small'],
    //             ['s', 'small'],
    //             ['m', 'medium'],
    //             ['l', 'large'],
    //             ['xl', 'x-large'],
    //             ['xxl', 'xx-large'],
    //           ],
    //           renderTrigger: true,
    //           description: t('The size of your header font'),
    //         },
    //       },
    //     ],
    //   ],
    // },
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
