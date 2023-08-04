import React from 'react';
import {
  ChartDataResponseResult,
  ensureIsArray,
  FeatureFlag,
  GenericDataType,
  hasGenericChartAxes,
  isAdhocColumn,
  isFeatureEnabled,
  isPhysicalColumn,
  legacyValidateInteger,
  QueryFormColumn,
  QueryMode,
  smartDateFormatter,
  t,
} from '@superset-ui/core';
import {
  ColumnOption,
  ControlConfig,
  ControlPanelConfig,
  ControlPanelsContainerProps,
  ControlStateMapping,
  D3_TIME_FORMAT_OPTIONS,
  QueryModeLabel,
  sections,
  sharedControls,
  ControlPanelState,
  ControlState,
  Dataset,
  ColumnMeta,
  defineSavedMetrics,
  getStandardizedControls,
  formatSelectOptions,
} from '@superset-ui/chart-controls';
import { StyledColumnOption } from 'src/explore/components/optionRenderers';

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

export const PAGE_SIZE_OPTIONS = formatSelectOptions<number>([
  [0, t('page_size.all')],
  10,
  20,
  50,
  100,
  200,
]);

/**
 * Visibility check
 */
function isQueryMode(mode: QueryMode) {
  return ({ controls }: Pick<ControlPanelsContainerProps, 'controls'>) =>
    getQueryMode(controls) === mode;
}

const isAggMode = isQueryMode(QueryMode.aggregate);
const isRawMode = isQueryMode(QueryMode.raw);

const validateAggControlValues = (
  controls: ControlStateMapping,
  values: any[],
) => {
  const areControlsEmpty = values.every(val => ensureIsArray(val).length === 0);
  return areControlsEmpty && isAggMode({ controls })
    ? [t('Group By, Metrics or Percentage Metrics must have a value')]
    : [];
};

const queryMode: ControlConfig<'RadioButtonControl'> = {
  type: 'RadioButtonControl',
  label: t('Query mode'),
  default: null,
  options: [
    [QueryMode.aggregate, QueryModeLabel[QueryMode.aggregate]],
    [QueryMode.raw, QueryModeLabel[QueryMode.raw]],
  ],
  mapStateToProps: ({ controls }) => ({ value: getQueryMode(controls) }),
  rerender: ['all_columns', 'groupby', 'metrics', 'percent_metrics'],
};

const allColumnsControl: typeof sharedControls.groupby = {
  ...sharedControls.groupby,
  label: t('Columns'),
  description: t('Columns to display'),
  multi: true,
  freeForm: true,
  allowAll: true,
  commaChoosesOption: false,
  optionRenderer: c => <ColumnOption showType column={c} />,
  valueRenderer: c => <ColumnOption column={c} />,
  valueKey: 'column_name',
  mapStateToProps: ({ datasource, controls }, controlState) => ({
    options: datasource?.columns || [],
    queryMode: getQueryMode(controls),
    externalValidationErrors:
      isRawMode({ controls }) && ensureIsArray(controlState?.value).length === 0
        ? [t('must have a value')]
        : [],
  }),
  visibility: isRawMode,
  resetOnHide: false,
  rerender: ['default_group_by'],
};

const percentMetricsControl: typeof sharedControls.metrics = {
  ...sharedControls.metrics,
  label: t('Percentage metrics'),
  description: t(
    'Metrics for which percentage of total are to be displayed. Calculated from only data within the row limit.',
  ),
  visibility: isAggMode,
  resetOnHide: false,
  mapStateToProps: ({ datasource, controls }, controlState) => ({
    columns: datasource?.columns || [],
    savedMetrics: defineSavedMetrics(datasource),
    datasource,
    datasourceType: datasource?.type,
    queryMode: getQueryMode(controls),
    externalValidationErrors: validateAggControlValues(controls, [
      controls.groupby?.value,
      controls.metrics?.value,
      controlState?.value,
    ]),
  }),
  rerender: ['groupby', 'metrics'],
  default: [],
  validators: [],
};

const config: ControlPanelConfig = {
  controlPanelSections: [
    sections.genericTime,
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
              rerender: ['metrics', 'percent_metrics', 'default_group_by'],
            },
          },
        ],
        [
          {
            name: 'metrics',
            override: {
              validators: [],
              visibility: isAggMode,
              resetOnHide: false,
              mapStateToProps: (
                { controls, datasource, form_data }: ControlPanelState,
                controlState: ControlState,
              ) => ({
                columns: datasource?.columns[0]?.hasOwnProperty('filterable')
                  ? (datasource as Dataset)?.columns?.filter(
                      (c: ColumnMeta) => c.filterable,
                    )
                  : datasource?.columns,
                savedMetrics: defineSavedMetrics(datasource),
                // current active adhoc metrics
                selectedMetrics:
                  form_data.metrics ||
                  (form_data.metric ? [form_data.metric] : []),
                datasource,
                externalValidationErrors: validateAggControlValues(controls, [
                  controls.groupby?.value,
                  controls.percent_metrics?.value,
                  controlState.value,
                ]),
              }),
              rerender: ['groupby', 'percent_metrics'],
            },
          },
          {
            name: 'all_columns',
            config: allColumnsControl,
          },
        ],
        [
          {
            name: 'percent_metrics',
            config: percentMetricsControl,
          },
        ],
        ['adhoc_filters'],
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
          {
            name: 'timeseries_limit_metric',
            override: {
              visibility: isAggMode,
            },
          },
        ],
      ],
    },
  ],
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
            Boolean(!controls?.enable_json_expand?.value),
        },
      },
    ],
    [
      {
        name: 'default_group_by',
        config: {
          type: 'SelectControl',
          label: t('Default columns for row grouping'),
          description: t(
            'Preselect a set of columns for row grouping in the grid.',
          ),
          multi: true,
          freeForm: true,
          allowAll: true,
          default: [],
          canSelectAll: true,
          renderTrigger: true,
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
              ? controls?.all_columns?.value
              : controls?.groupby?.value;
            newState.options = newState.options.filter(
              (o: { column_name: string }) =>
                ensureIsArray(choices).includes(o.column_name),
            );
            const invalidOptions = ensureIsArray(controlState.value).filter(
              c => !ensureIsArray(choices).includes(c),
            );
            newState.externalValidationErrors =
              invalidOptions.length > 0
                ? invalidOptions.length > 1
                  ? [
                      `'${invalidOptions.join(', ')}'${t(
                        ' are not valid options',
                      )}`,
                    ]
                  : [`'${invalidOptions}'${t(' is not a valid option')}`]
                : [];
            return newState;
          },
          visibility: ({ controls }) =>
            Boolean(controls?.enable_grouping?.value),
          canCopy: true,
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
  ],
});

export default config;
