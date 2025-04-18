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
import { ValueFormatterParams } from 'ag-grid-enterprise';
import {
  Column,
  GenericDataType,
  getNumberFormatter,
  Metric,
  NumberFormats,
  QueryMode,
  TimeseriesDataRecord,
} from '@superset-ui/core';
import {
  formatIpv4,
  rendererMap,
} from 'src/cccs-viz/plugins/plugin-chart-ag-grid/src/types/advancedDataTypes';
import {
  CccsGridChartProps,
  CccsGridQueryFormData,
  DEFAULT_FORM_DATA,
} from '../types';

export default function transformProps(chartProps: CccsGridChartProps) {
  /**
   * This function is called after a successful response has been
   * received from the chart data endpoint, and is used to transform
   * the incoming data prior to being sent to the Visualization.
   *
   * The transformProps function is also quite useful to return
   * additional/modified props to your data viz component. The formData
   * can also be accessed from your CccsGrid.tsx file, but
   * supplying custom props here is often handy for integrating third
   * party libraries that rely on specific props.
   *
   * A description of properties in `chartProps`:
   * - `height`, `width`: the height/width of the DOM element in which
   *   the chart is located
   * - `formData`: the chart data request payload that was sent to the
   *   backend.
   * - `queriesData`: the chart data response payload that was received
   *   from the backend. Some notable properties of `queriesData`:
   *   - `data`: an array with data, each row with an object mapping
   *     the column/alias to its value. Example:
   *     `[{ col1: 'abc', metric1: 10 }, { col1: 'xyz', metric1: 20 }]`
   *   - `rowcount`: the number of rows in `data`
   *   - `query`: the query that was issued.
   *
   * Please note: the transformProps function gets cached when the
   * application loads. When making changes to the `transformProps`
   * function during development with hot reloading, changes won't
   * be seen until restarting the development server.
   */
  const {
    datasource,
    hooks,
    width,
    height,
    rawFormData: formData,
    queriesData,
  } = chartProps;
  const {
    boldText,
    headerFontSize,
    headerText,
    principalColumns,
    query_mode,
    column_state,
  }: CccsGridQueryFormData = { ...DEFAULT_FORM_DATA, ...formData };
  const data = queriesData[0].data as TimeseriesDataRecord[];
  const agGridLicenseKey = queriesData[0].agGridLicenseKey as String;

  const default_group_by: any[] = [];
  const enable_row_numbers = true;
  const jump_action_configs: string[] = [];
  const enable_json_expand = false;

  const include_search = true;
  const page_length = 50;
  const enable_grouping = true;

  const { setDataMask = () => {}, setControlValue } = hooks;
  const columns = datasource?.columns as Column[];
  const metrics = datasource?.metrics as Metric[];

  const columnTypeMap = new Map<string, string>();
  columns.reduce(function (columnMap, column: Column) {
    const newColumnMap = { ...columnMap };
    // @ts-ignore
    const name = column.column_name;
    // @ts-ignore
    newColumnMap[name] = column.type;
    return newColumnMap;
  }, columnTypeMap);

  // Map of column advanced types, key is column name, value is column type
  const columnAdvancedTypeMap = new Map<string, string>();
  columns.reduce(function (columnMap, column: Column) {
    const newColumnMap = { ...columnMap };
    // @ts-ignore
    const name = column.column_name;
    // @ts-ignore
    newColumnMap[name] = (
      (column.advanced_data_type as string) ?? ''
    ).toUpperCase();
    return newColumnMap;
  }, columnAdvancedTypeMap);

  // Map of verbose names, key is column name, value is verbose name
  const columnVerboseNameMap = new Map<string, string>();
  columns.reduce(function (columnMap, column: Column) {
    const newColumnMap = { ...columnMap };
    // @ts-ignore
    const name = column.column_name;
    // @ts-ignore
    newColumnMap[name] = column.verbose_name;
    return newColumnMap;
  }, columnVerboseNameMap);

  // Map of column descriptions, key is column name, value is the description
  const columnDescriptionMap = new Map<string, string>();
  columns.reduce(function (columnMap, column: Column) {
    const newColumnMap = { ...columnMap };
    const name = column.column_name;
    newColumnMap[name] = column.description;
    return newColumnMap;
  }, columnDescriptionMap);

  // Map of verbose names, key is metric name, value is verbose name
  const metricVerboseNameMap = new Map<string, string>();
  metrics.reduce(function (metricMap, metric: Metric) {
    const newMetricMap = { ...metricMap };
    // @ts-ignore
    const name = metric.metric_name;
    // @ts-ignore
    newMetricMap[name] = metric.verbose_name;
    return newMetricMap;
  }, metricVerboseNameMap);

  const valueFormatter = (params: any) => {
    if (
      params.value != null &&
      params.colDef.cellRenderer === 'ipv4ValueRenderer'
    ) {
      return formatIpv4(params.value.toString());
    }
    return params.value != null ? params.value.toString() : '';
  };

  let columnDefs: Column[] = [];

  const columnDataMap = columns.reduce(
    (columnMap, column: Column) => ({
      ...columnMap,
      [column.column_name]: {
        type: column.type,
        is_dttm: column.is_dttm,
        type_generic: column.type_generic,
        advanced_data_type: (column.advanced_data_type as string) ?? '',
        verbose_name: column.verbose_name,
        description: column.description,
      },
    }),
    {} as { [index: string]: Partial<Column> },
  );

  if (query_mode === QueryMode.Raw) {
    columnDefs = formData.columns.map((column: any) => {
      const columnType = columnDataMap[column]?.type || '';
      const isDate = !!columnDataMap[column]?.is_dttm;
      const columnTypeGeneric = columnDataMap[column]?.type_generic || -1;
      const columnAdvancedType =
        columnDataMap[column]?.advanced_data_type || '';
      const columnHeader = columnDataMap[column]?.verbose_name
        ? columnDataMap[column]?.verbose_name
        : column;
      const cellRenderer =
        isDate || columnTypeGeneric === GenericDataType.Temporal
          ? rendererMap.DATE
          : rendererMap[columnAdvancedType.toUpperCase()] ??
            rendererMap[columnType] ??
            undefined;
      const isSortable = true;
      const enableRowGroup = true;
      const columnDescription = columnDescriptionMap[column];
      const autoHeight = true;
      const rowGroupIndex = default_group_by.findIndex(
        (element: any) => element === column,
      );
      const rowGroup = rowGroupIndex >= 0;
      const hide = rowGroup;
      return {
        field: column,
        headerName: columnHeader,
        cellRenderer,
        sortable: isSortable,
        enableRowGroup,
        rowGroup,
        hide,
        rowGroupIndex,
        getQuickFilterText: (params: any) => valueFormatter(params),
        headerTooltip: columnDescription,
        autoHeight,
      };
    });
  } else {
    if (formData.groupby) {
      const groupByColumnDefs = formData.groupby.map((column: any) => {
        const columnType = columnTypeMap[column];
        const columnAdvancedType = columnAdvancedTypeMap[column];
        const columnHeader = columnVerboseNameMap[column]
          ? columnVerboseNameMap[column]
          : column;
        const cellRenderer =
          columnAdvancedType in rendererMap
            ? rendererMap[columnAdvancedType]
            : columnType in rendererMap
              ? rendererMap[columnType]
              : undefined;
        const isSortable = true;
        const enableRowGroup = true;
        const columnDescription = columnDescriptionMap[column];
        const autoHeight = true;
        const rowGroupIndex = default_group_by.findIndex(
          (element: any) => element === column,
        );
        const initialRowGroupIndex = rowGroupIndex;
        const rowGroup = rowGroupIndex >= 0;
        const hide = rowGroup;
        return {
          field: column,
          headerName: columnHeader,
          cellRenderer,
          sortable: isSortable,
          enableRowGroup,
          rowGroup,
          rowGroupIndex,
          initialRowGroupIndex,
          hide,
          getQuickFilterText: (params: any) => valueFormatter(params),
          headerTooltip: columnDescription,
          autoHeight,
        };
      });
      columnDefs = columnDefs.concat(groupByColumnDefs);
    }

    const percentMetricValueFormatter = function (
      params: ValueFormatterParams,
    ) {
      return getNumberFormatter(NumberFormats.PERCENT_3_POINT).format(
        params.value,
      );
    };

    if (metrics) {
      const metricsColumnDefs = formData.metrics?.map((metric: any) => {
        const metricLabel = metric.label ? metric.label : metric;
        const metricHeader = metricVerboseNameMap[metric]
          ? metricVerboseNameMap[metric]
          : metricLabel;
        return {
          field: metricLabel,
          headerName: metricHeader,
          sortable: true,
          enableRowGroup: true,
        };
      });
      columnDefs = columnDefs.concat(metricsColumnDefs || []);
    }

    if (formData.percent_metrics) {
      const percentMetricsColumnDefs = formData.percent_metrics.map(
        (metric: any) => {
          const metricLabel = metric.label ? metric.label : metric;
          const metricHeader = metricVerboseNameMap[metric]
            ? metricVerboseNameMap[metric]
            : metricLabel;
          return {
            field: `%${metricLabel}`,
            headerName: `%${metricHeader}`,
            sortable: true,
            valueFormatter: percentMetricValueFormatter,
          };
        },
      );
      columnDefs = columnDefs.concat(percentMetricsColumnDefs);
    }
  }

  if (enable_row_numbers) {
    columnDefs.splice(0, 0, {
      headerName: '#',
      colId: 'rowNum',
      pinned: 'left',
      lockVisible: true,
      valueGetter: (params: any) =>
        params.node ? params.node.rowIndex + 1 : null,
    } as any);
  }
  const parsed_jump_action_configs = {};
  jump_action_configs?.forEach((e: any) => {
    if (e.dashboardID in parsed_jump_action_configs) {
      parsed_jump_action_configs[e.dashboardID] = parsed_jump_action_configs[
        e.dashboardID
      ].concat({
        advancedDataType: e.advancedDataType,
        nativefilters: e.filters,
        name: e.dashBoardName,
      });
    } else {
      parsed_jump_action_configs[e.dashboardID] = [
        {
          advancedDataType: e.advancedDataType,
          nativefilters: e.filters,
          name: e.dashBoardName,
        },
      ];
    }
  });

  // If the flag is set to true, add a column which will contain
  // a button to expand all JSON blobs in the row
  if (enable_json_expand) {
    columnDefs.splice(1, 0, {
      colId: 'jsonExpand',
      pinned: 'left',
      cellRenderer: 'expandAllValueRenderer',
      autoHeight: true,
      minWidth: 105,
      lockVisible: true,
    } as any);
  }

  return {
    formData,
    setDataMask,
    setControlValue,
    width,
    height,
    columnDefs,
    rowData: data,
    // and now your control data, manipulated as needed, and passed through as props!
    boldText,
    headerFontSize,
    headerText,
    emitFilter: true,
    emitCrossFilters: true,
    principalColumns,
    include_search,
    page_length,
    enable_grouping,
    column_state,
    agGridLicenseKey,
    datasetColumns: columns,
    jumpActionConfigs: parsed_jump_action_configs,
  };
}
