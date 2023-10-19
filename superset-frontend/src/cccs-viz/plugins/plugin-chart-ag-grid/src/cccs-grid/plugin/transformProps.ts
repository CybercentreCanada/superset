import {
  Column,
  Metric,
  NumberFormats,
  QueryFormColumn,
  TimeseriesDataRecord,
  getNumberFormatter,
} from '@superset-ui/core';

import { ValueFormatterParams } from 'ag-grid-community';
import { CccsTableChartProps, CccsTableFormData } from '../../types';
import ExpandAllValueRenderer from '../../types/ExpandAllValueRenderer';
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
  const metricVerboseNameMap = new Map<string, string>();
  datasource_metrics.reduce(function (metricMap, metric: Metric) {
    // @ts-ignore
    const name = metric.metric_name;
    // @ts-ignore
    metricMap[name] = metric.verbose_name;
    return metricMap;
  }, metricVerboseNameMap);

  let columnDefs: any[] = [];

  if (metrics) {
    const metricsColumnDefs = metrics.map((metric: any) => {
      const metricHeader = metricVerboseNameMap[metric]
        ? metricVerboseNameMap[metric]
        : metric;
      return {
        field: metric,
        headerName: metricHeader,
        sortable: true,
        enableRowGroup: true,
      };
    });
    columnDefs = columnDefs.concat(metricsColumnDefs);
  }

  if (percent_metrics) {
    const percentMetricsColumnDefs = percent_metrics.map((metric: any) => {
      const metricHeader = metricVerboseNameMap[metric]
        ? metricVerboseNameMap[metric]
        : metric;
      return {
        field: `%${metric}`,
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
  enableRowNumbers = true,
  orderByCols: any,
  disableJsonRendering = false,
) => {
  const columnDataMap = new Map<string, string>();
  dataset_columns.reduce(function (columnMap, column: Column) {
    const name = column.column_name;
    // eslint-disable-next-line no-param-reassign
    columnMap[name] = {
      type: column.type,
      advanced_data_type: (column.advanced_data_type as string) ?? '',
      verbose_name: column.verbose_name,
      description: column.description,
    };
    return columnMap;
  }, columnDataMap);

  const columnDefs = columns.map((column: any) => {
    const columnType = columnDataMap[column]?.type || '';
    const advancedType = columnDataMap[column]?.advanced_data_type || '';
    const columnHeader = columnDataMap[column]?.verbose_name
      ? columnDataMap[column]?.verbose_name
      : column;
    const orderByColsArray = orderByCols.map((c: string) => JSON.parse(c));
    const sortIndex = orderByColsArray.map((c: any) => c[0]).indexOf(column);
    const sort =
      sortIndex > -1 ? (orderByColsArray[sortIndex][1] ? 'asc' : 'desc') : null;
    const cellRenderer =
      advancedType.toUpperCase() in rendererMap
        ? rendererMap[advancedType.toUpperCase()]
        : columnType in rendererMap
        ? disableJsonRendering && columnType === 'JSON'
          ? undefined
          : rendererMap[columnType]
        : undefined;
    const valueFormatter =
      advancedType.toUpperCase() in formatterMap
        ? formatterMap[advancedType.toUpperCase()]
        : undefined;
    const useValueFormatterForExport = !!valueFormatter;
    const isSortable = true;
    const enableRowGroup = true;
    const columnDescription = columnDataMap[column]?.description || '';
    const autoHeight = columnType === 'JSON';
    const rowGroupIndex = defaultGroupBy.findIndex(
      (element: any) => element === column,
    );
    const rowGroup = rowGroupIndex >= 0;
    const hide = rowGroup;
    return {
      field: column,
      headerName: columnHeader,
      sortable: isSortable,
      enableRowGroup,
      advancedType,
      rowGroup,
      hide,
      cellRenderer,
      rowGroupIndex: rowGroupIndex === -1 ? null : rowGroupIndex,
      initialRowGroupIndex: rowGroupIndex === -1 ? null : rowGroupIndex,
      headerTooltip: columnDescription,
      autoHeight,
      valueFormatter,
      useValueFormatterForExport,
      sort,
      sortIndex: sortIndex > -1 ? sortIndex : null,
    };
  });

  if (enableRowNumbers) {
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
    disableJsonRendering,
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
  const { metrics } = formData;
  const percent_metrics = formData.percentMetrics;

  let columnDefs = calcColumnColumnDefs(
    columns,
    defaultGroupBy,
    datasource?.columns as Column[],
    enableRowNumbers,
    orderByCols,
    disableJsonRendering,
  );
  columnDefs = columnDefs.concat(
    calcMetricColumnDefs(
      metrics || [],
      percent_metrics || [],
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
    setDataMask,
    emitCrossFilters,
    jumpActionConfigs,
  };
}
