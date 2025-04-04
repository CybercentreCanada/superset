import {
  Column,
  GenericDataType,
  Metric,
  NumberFormats,
  QueryFormColumn,
  TimeseriesDataRecord,
  getNumberFormatter,
} from '@superset-ui/core';

import { ValueFormatterParams } from 'ag-grid-community';
import ExpandAllValueRenderer from '../../renderers/ExpandAllValueRenderer';
import { CccsTableChartProps, CccsTableFormData } from '../../types';
import { formatterMap, rendererMap } from '../../types/advancedDataTypes';

const calcMetricColumnDefs = (
  metrics: any[],
  percent_metrics: any[],
  datasource_metrics: Metric[],
) => {
  const percentMetricValueFormatter = function (params: ValueFormatterParams) {
    return getNumberFormatter(NumberFormats.PERCENT_3_POINT).format(
      params.value,
    );
  };

  // Map of verbose names, key is metric name, value is verbose name
  const metricVerboseNameMap = datasource_metrics.reduce(
    (metricMap, metric: Metric) => ({
      ...metricMap,
      [metric.metric_name]: metric.verbose_name,
    }),
    {} as { [index: string]: string },
  );

  let columnDefs: any[] = [];

  if (metrics) {
    const metricsColumnDefs = metrics.map((metric: any) => {
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
    columnDefs = columnDefs.concat(metricsColumnDefs);
  }

  if (percent_metrics) {
    const percentMetricsColumnDefs = percent_metrics.map((metric: any) => {
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
    });
    columnDefs = columnDefs.concat(percentMetricsColumnDefs);
  }

  return columnDefs;
};

const calcColumnColumnDefs = (
  columns: QueryFormColumn[],
  defaultGroupBy: string[],
  dataset_columns: Column[],
  enable_row_numbers = true,
  orderByCols: any,
) => {
  const columnDataMap = dataset_columns.reduce(
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

  const columnDefs = columns.map((column: any) => {
    const columnType = columnDataMap[column]?.type || '';
    const isDate = !!columnDataMap[column]?.is_dttm;
    const columnTypeGeneric = columnDataMap[column]?.type_generic || -1;
    const advancedDataType = columnDataMap[column]?.advanced_data_type || '';
    const columnHeader = columnDataMap[column]?.verbose_name
      ? columnDataMap[column]?.verbose_name
      : column;
    const orderByColsArray = orderByCols.map((c: string) => JSON.parse(c));
    const sortIndex = orderByColsArray.map((c: any) => c[0]).indexOf(column);
    const sort =
      sortIndex > -1 ? (orderByColsArray[sortIndex][1] ? 'asc' : 'desc') : null;
    const cellRenderer =
      isDate || columnTypeGeneric === GenericDataType.Temporal
        ? rendererMap.DATE
        : rendererMap[advancedDataType.toUpperCase()] ??
          rendererMap[columnType] ??
          undefined;
    const valueFormatter =
      advancedDataType.toUpperCase() in formatterMap
        ? formatterMap[advancedDataType.toUpperCase()]
        : formatterMap[columnType] ?? undefined;
    const useValueFormatterForExport = !!valueFormatter;
    const getQuickFilterText = valueFormatter
      ? (params: any) =>
          params.value ? params.colDef.valueFormatter(params.value) : undefined
      : undefined;
    const isSortable = true;
    const enableRowGroup = true;
    const columnDescription = columnDataMap[column]?.description || '';
    const autoHeight = columnType === 'JSON';
    const rowGroupIndex = defaultGroupBy.findIndex(
      (element: any) => element === column,
    );
    const rowGroup = rowGroupIndex >= 0;
    const hide = rowGroup;
    const maxWidth = 800;

    return {
      field: column,
      headerName: columnHeader,
      sortable: isSortable,
      enableRowGroup,
      advancedDataType,
      rowGroup,
      hide,
      cellRenderer,
      rowGroupIndex: rowGroupIndex === -1 ? null : rowGroupIndex,
      initialRowGroupIndex: rowGroupIndex === -1 ? null : rowGroupIndex,
      headerTooltip: columnDescription,
      autoHeight,
      maxWidth,
      valueFormatter,
      useValueFormatterForExport,
      getQuickFilterText,
      sort,
      sortIndex: sortIndex > -1 ? sortIndex : null,
      type: columnType,
      isDateColumn: isDate || columnTypeGeneric === GenericDataType.Temporal,
    };
  });

  if (enable_row_numbers) {
    columnDefs.splice(0, 0, {
      headerName: '#',
      colId: 'rowNum',
      pinned: 'left',
      width: 70,
      lockVisible: true,
      enableRowGroup: false,
      valueGetter: (params: any) =>
        params.node ? params.node.rowIndex + 1 : null,
    } as any);
  }

  return columnDefs;
};

export default function transformProps(chartProps: CccsTableChartProps) {
  const {
    hooks,
    datasource,
    width,
    height,
    formData,
    queriesData,
    emitCrossFilters,
  } = chartProps;
  const {
    includeSearch,
    pageLength,
    defaultGroupBy,
    enableRowNumbers,
    enableGrouping,
    enableJsonExpand,
    principalColumns,
    orderByCols,
    jumpActionConfigs,
  }: CccsTableFormData = {
    ...formData,
  };

  const datasource_metrics = datasource?.metrics as Metric[];
  const data = queriesData[0].data as TimeseriesDataRecord[];

  const columns =
    formData.queryMode === 'raw'
      ? formData.columns || []
      : formData.groupby || [];

  const { metrics, percentMetrics } = formData;

  let columnDefs = calcColumnColumnDefs(
    columns,
    defaultGroupBy,
    datasource?.columns as Column[],
    enableRowNumbers,
    orderByCols,
  );
  columnDefs = columnDefs.concat(
    calcMetricColumnDefs(
      metrics || [],
      percentMetrics || [],
      datasource_metrics,
    ),
  );

  const { setDataMask = () => {} } = hooks;

  // If the flag is set to true, add a column which will contain
  // a button to expand all JSON blobs in the row
  if (enableJsonExpand) {
    columnDefs.splice(1, 0, {
      colId: 'jsonExpand',
      pinned: 'left',
      cellRenderer: ExpandAllValueRenderer,
      minWidth: 105,
      lockVisible: true,
    } as any);
  } else if (enableGrouping) {
    // enable row grouping
    columnDefs = columnDefs.map(c => {
      const rowGroupIndex = defaultGroupBy.findIndex(
        (element: any) => element === c.field,
      );
      const rowGroup = rowGroupIndex >= 0;
      const hide = rowGroup;
      return {
        ...c,
        rowGroup,
        rowGroupIndex: rowGroupIndex === -1 ? null : rowGroupIndex,
        initialRowGroupIndex: rowGroupIndex === -1 ? null : rowGroupIndex,
        hide,
      };
    });
  }
  const agGridLicenseKey = queriesData[0].agGridLicenseKey as String;
  const assemblyLineUrl = queriesData[0].assemblyLineUrl as String;
  const enableAlfred = queriesData[0].enableAlfred as Boolean;
  const enableDownload = queriesData[0].enableDownload as Boolean;

  const parsedJumpActionConfigs = {};
  jumpActionConfigs?.forEach((e: any) => {
    if (e.dashboardID in parsedJumpActionConfigs) {
      parsedJumpActionConfigs[e.dashboardID] = parsedJumpActionConfigs[
        e.dashboardID
      ].concat({
        advancedDataType: e.advancedDataType,
        nativefilters: e.filters,
        name: e.dashBoardName,
      });
    } else {
      parsedJumpActionConfigs[e.dashboardID] = [
        {
          advancedDataType: e.advancedDataType,
          nativefilters: e.filters,
          name: e.dashBoardName,
        },
      ];
    }
  });

  return {
    width,
    height,
    formData: chartProps.formData,
    rowData: data,
    columnDefs,
    includeSearch,
    pageLength,
    enableGrouping,
    principalColumns,
    agGridLicenseKey,
    assemblyLineUrl,
    enableAlfred,
    enableDownload,
    setDataMask,
    emitCrossFilters,
    jumpActionConfigs,
  };
}
