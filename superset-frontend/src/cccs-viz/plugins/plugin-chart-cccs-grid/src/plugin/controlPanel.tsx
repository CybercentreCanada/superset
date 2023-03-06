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
  FeatureFlag,
  isFeatureEnabled,
  DEFAULT_METRICS,
  QueryMode,
  QueryFormColumn,
  QueryResponse,
  ensureIsArray,
  validateNonEmpty,
  legacyValidateInteger,
} from '@superset-ui/core';
import {
  Dataset,
  ControlConfig,
  ControlStateMapping,
  ControlPanelConfig,
  ControlPanelsContainerProps,
  sections,
  QueryModeLabel,
  sharedControls,
  ControlPanelState,
  ControlState,
  formatSelectOptions,
  ColumnMeta,
} from '@superset-ui/chart-controls';
import { StyledColumnOption } from 'src/explore/components/optionRenderers';

import DrillActionConfig from '../components/controls/JumpActionConfigControll';

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
  const rawColumns = controls?.all_columns?.value as
    | QueryFormColumn[]
    | undefined;
  const hasRawColumns = rawColumns && rawColumns.length > 0;
  return hasRawColumns ? QueryMode.raw : QueryMode.aggregate;
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

const queryMode: ControlConfig<'RadioButtonControl'> = {
  type: 'RadioButtonControl',
  label: t('Query mode'),
  default: null,
  options: [
    [QueryMode.aggregate, QueryModeLabel[QueryMode.aggregate]],
    [QueryMode.raw, QueryModeLabel[QueryMode.raw]],
  ],
  mapStateToProps: ({ controls }) => ({ value: getQueryMode(controls) }),
  rerender: ['columns', 'groupby', 'metrics', 'percent_metrics'],
};

const validateAggControlValues = (
  controls: ControlStateMapping,
  values: any[],
) => {
  const areControlsEmpty = values.every(val => ensureIsArray(val).length === 0);
  // @ts-ignore
  return areControlsEmpty && isAggMode({ controls })
    ? [t('Group By, Metrics, or Percent Metrics must have a value')]
    : [];
};

// function isIP(v: unknown) {
//   if (typeof v === 'string' && v.trim().length > 0) {
//     //console.log(v.trim());
//     // Test IP
//     if (/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(v.trim())) {
//       return true;
//     }
//     // Test CIDR
//     return cidrRegex({ exact: true }).test(v.trim());
//   }
//   return false;
// }

// function validateIP(v: unknown) {

//   if (Array.isArray(v)) {
//     //console.log('is array');
//     if (v.every(isIP)) {
//       return false;
//     }
//   }
//   else {
//     if (isIP(v)) {
//       return false;
//     }
//   }

//   return (' is expected to be an IP address in dotted decimal or CIDR notation');
// }

// /**
//  * Validates the adhoc filter control. Each filter has a subject (the column name for example SRC_PORT) and a comparator (the value being tested),
//  * it can be a single value for operators like !=, >, <= etc
//  * or it can be an array of values for example when the IN or NOT IN operator is used.
//  *
//  * @param filters an array of adhoc filter with the following attributes
//  * @param state the current state of the adhoc filter control it includes a copy of the columns as defined in the dataset model
//  * @returns a string explaining the reason why the control is in an invalid state or false if there is no errors
//  */
// function adhocFilterValidator(filters: unknown, state: ControlState) {
//   if (Array.isArray(filters)) {
//     for (let i = 0; i < filters.length; i++) {
//       const filter = filters[i];
//       // Find the corresponding column in the model
//       const column = state.columns.find((c: any) => c.column_name == filter.subject);
//       if (typeof column !== 'undefined' && typeof column.type !== 'undefined') {
//         // Currently supporting 2 types of columns
//         // IPV4
//         // IPV4 FILTER
//         if (column.type.includes('IPV4')) {
//           const v = filter.comparator;
//           // check single value
//           if (typeof v === 'string' && v.trim().length > 0) {
//             const error = validateIP(v.trim());
//             if (error) {
//               return filter.subject + error;
//             }
//           }
//           // check array of values
//           else if (Array.isArray(v)) {
//             for (let index = 0; index < v.length; index++) {
//               const element = v[index];
//               const error = validateIP(element.trim());
//               if (error) {
//                 return filter.subject + error;
//               }
//             }
//           }
//         }
//         // else we assume the value is okay
//         // more type validators can be added here
//       }
//     }
//   }
//   return false;
// }

const defineSavedMetrics = (datasource: Dataset | QueryResponse | null) =>
  datasource?.hasOwnProperty('metrics')
    ? (datasource as Dataset)?.metrics || []
    : DEFAULT_METRICS;

const config: ControlPanelConfig = {
  // For control input types, see: superset-frontend/src/explore/components/controls/index.js
  controlPanelSections: [
    sections.legacyTimeseriesTime,
    {
      label: t('Query'),
      expanded: true,
      controlSetRows: [
        [
          {
            name: 'query_mode',
            config: queryMode,
          },
        ],
        [
          {
            name: 'groupby',
            override: {
              visibility: isAggMode,
              resetOnHide: false,
              canCopy: true,
              canSelectAll: true,
              mapStateToProps: (
                state: ControlPanelState,
                controlState: ControlState,
              ) => {
                const { controls } = state;
                const originalMapStateToProps =
                  sharedControls?.groupby?.mapStateToProps;
                const newState =
                  originalMapStateToProps?.(state, controlState) ?? {};
                newState.externalValidationErrors = validateAggControlValues(
                  controls,
                  [
                    controls.metrics?.value,
                    controls.percent_metrics?.value,
                    controlState.value,
                  ],
                );

                return newState;
              },
              rerender: ['metrics', 'percent_metrics'],
            },
          },
        ],
        [
          {
            name: 'metrics',
            override: {
              visibility: isAggMode,
              validators: [],
              mapStateToProps: (
                state: ControlPanelState,
                controlState: ControlState,
              ) => {
                const { controls } = state;
                const originalMapStateToProps =
                  sharedControls?.metrics?.mapStateToProps;
                const newState =
                  originalMapStateToProps?.(state, controlState) ?? {};
                newState.externalValidationErrors = validateAggControlValues(
                  controls,
                  [
                    controls.groupby?.value,
                    controlState.value,
                    controls.percent_metrics?.value,
                  ],
                );
                return newState;
              },
              rerender: ['groupby', 'percent_metrics'],
            },
          },
        ],
        [
          {
            name: 'percent_metrics',
            config: {
              type: 'MetricsControl',
              label: t('Percentage metrics'),
              description: t(
                'Metrics for which percentage of total are to be displayed. Calculated from only data within the row limit.',
              ),
              multi: true,
              visibility: isAggMode,
              mapStateToProps: ({ datasource, controls }, controlState) => ({
                columns: datasource?.columns || [],
                savedMetrics: defineSavedMetrics(datasource),
                datasourceType: datasource?.type,
                queryMode: getQueryMode(controls),
                externalValidationErrors: validateAggControlValues(controls, [
                  controls.groupby?.value,
                  controls.metrics?.value,
                  controlState.value,
                ]),
              }),
              rerender: ['groupby', 'metrics'],
              default: [],
              validators: [],
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
              rerender: ['principalColumns'],
              visibility: isRawMode,
              canCopy: true,
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
            name: 'timeseries_limit_metric',
            override: {
              visibility: isAggMode,
            },
          },
        ],
        [
          {
            name: 'row_limit',
            override: {
              default: 100,
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
              visibility: isRawMode,
              resetOnHide: false,
            },
          },
        ],
        [
          isFeatureEnabled(FeatureFlag.DASHBOARD_CROSS_FILTERS)
            ? {
                name: 'emitFilter',
                config: {
                  type: 'CheckboxControl',
                  label: t('Emit dashboard cross filters'),
                  default: false,
                  renderTrigger: true,
                  description: t('Emit dashboard cross filters.'),
                },
              }
            : null,
        ],
        [
          isFeatureEnabled(FeatureFlag.DASHBOARD_CROSS_FILTERS)
            ? {
                name: 'principalColumns',
                config: {
                  type: 'SelectControl',
                  label: t('Principal Column(s) to Emit'),
                  description: t(
                    'Preselect a set of principal columns that can easily be emitted from the context menu',
                  ),
                  multi: true,
                  freeForm: true,
                  allowAll: true,
                  default: [],
                  canSelectAll: true,
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
                    const originalMapStateToProps = isRawMode({ controls })
                      ? sharedControls?.columns?.mapStateToProps
                      : sharedControls?.groupby?.mapStateToProps;
                    const newState =
                      originalMapStateToProps?.(state, controlState) ?? {};
                    const choices = isRawMode({ controls })
                      ? controls?.columns?.value
                      : controls?.groupby?.value;
                    newState.options = newState.options.filter(
                      (o: { column_name: string }) =>
                        ensureIsArray(choices).includes(o.column_name),
                    );
                    const invalidOptions = ensureIsArray(
                      controlState.value,
                    ).filter(c => !ensureIsArray(choices).includes(c));
                    newState.externalValidationErrors =
                      invalidOptions.length > 0
                        ? invalidOptions.length > 1
                          ? [
                              `'${invalidOptions.join(', ')}'${t(
                                ' are not valid options',
                              )}`,
                            ]
                          : [
                              `'${invalidOptions}'${t(
                                ' is not a valid option',
                              )}`,
                            ]
                        : [];
                    return newState;
                  },
                  visibility: ({ controls }) =>
                    // TODO properly ensure is Bool
                    Boolean(controls?.emitFilter?.value),
                  canCopy: true,
                },
              }
            : null,
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

config.controlPanelSections.push({
  label: t('Options'),
  expanded: true,
  controlSetRows: [
    [
      {
        name: 'include_search',
        config: {
          type: 'CheckboxControl',
          label: t('Search box'),
          renderTrigger: true,
          default: false,
          description: t('Whether to include a client-side search box'),
        },
      },
    ],
    [
      {
        name: 'enable_grouping',
        config: {
          type: 'CheckboxControl',
          label: t('Row grouping'),
          renderTrigger: true,
          default: false,
          description: t(
            'Whether to enable row grouping (this will only take affect after a save). NOTE: "JSON Row Expand" and "Row Grouping" are mutually exclusive. If "Row Grouping" is selected, "JSON Row Expand" will not be visible.',
          ),
          visibility: ({ controls }) =>
            // TODO properly ensure is Bool
            Boolean(!controls?.enable_json_expand?.value),
        },
      },
    ],
    [
      {
        name: 'enable_row_numbers',
        config: {
          type: 'CheckboxControl',
          label: t('Row numbers'),
          renderTrigger: true,
          default: true,
          description: t('Whether to enable row numbers'),
        },
      },
    ],
    [
      {
        name: 'enable_json_expand',
        config: {
          type: 'CheckboxControl',
          label: t('JSON Row Expand'),
          renderTrigger: true,
          default: false,
          description: t(
            'Whether to enable row level JSON expand buttons. NOTE: "JSON Row Expand" and "Row Grouping" are mutually exclusive. If "JSON Row Expand" is selected, "Row Grouping" will not be visible.',
          ),
          visibility: ({ controls }) =>
            // TODO properly ensure is Bool
            Boolean(!controls?.enable_grouping?.value),
        },
      },
    ],
    [
      {
        name: 'page_length',
        config: {
          type: 'SelectControl',
          freeForm: true,
          renderTrigger: true,
          label: t('Page length'),
          default: 0,
          choices: PAGE_SIZE_OPTIONS,
          description: t('Rows per page, 0 means no pagination'),
          validators: [legacyValidateInteger],
        },
      },
    ],
    [
      {
        name: 'jump_action_configs',
        config: {
          type: DrillActionConfig,
          renderTrigger: true,
          label: t('Jump Actions'),
          description: t('Configure dashboard jump actions.'),
        },
      },
    ],
  ],
});

export default config;
