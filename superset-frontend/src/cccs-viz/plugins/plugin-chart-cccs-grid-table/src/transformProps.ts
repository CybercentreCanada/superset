import {
  Column,
  GenericDataType,
  Metric,
  NumberFormats,
  QueryFormColumn,
  TimeseriesDataRecord,
  getNumberFormatter,
} from '@superset-ui/core';

import { ColDef, ValueFormatterParams } from 'ag-grid-community';
import {
  CccsGridTransformedProps,
  CccsTableChartProps,
  CccsTableFormData,
} from './types';
import { formatterMap, rendererMap } from './types/advancedDataTypes';
import ExpandRowButtonRenderer from './renderers/ExpandRowButtonRenderer';

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

      if (metric.column) {
        const isDate = metric.column.is_dttm;
        const columnType = metric.column.type ?? '';
        const columnTypeGeneric = metric.column.type_generic || -1;
        const advancedDataType =
          metric.column.context?.advanced_data_type || '';
        const cellRenderer =
          isDate || columnTypeGeneric === GenericDataType.Temporal
            ? rendererMap.get('DATE')
            : (rendererMap.get(advancedDataType.toUpperCase()) ??
              rendererMap.get(columnType));

        return {
          field: metricLabel,
          headerName: metricHeader,
          cellRenderer,
        };
      }

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

// TODO a lot of this could be offloaded to the CccsGridTable using Column Types / the default column definition
// https://www.ag-grid.com/react-data-grid/column-definitions/#column-types
const calcColumnColumnDefs = (
  columns: QueryFormColumn[],
  defaultGroupBy: string[],
  dataset_columns: Column[],
  orderByCols: any,
): ColDef[] => {
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
    {} as { [index: string]: Column },
  );

  const columnDefs = columns.map((column: any): ColDef => {
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
      sortIndex > -1
        ? orderByColsArray[sortIndex][1]
          ? 'asc'
          : 'desc'
        : undefined;
    const cellRenderer =
      isDate || columnTypeGeneric === GenericDataType.Temporal
        ? rendererMap.get('DATE')
        : (rendererMap.get(advancedDataType.toUpperCase()) ??
          rendererMap.get(columnType));
    const valueFormatter =
      advancedDataType.toUpperCase() in formatterMap
        ? formatterMap.get(advancedDataType.toUpperCase())
        : formatterMap.get(columnType);
    const useValueFormatterForExport = !!valueFormatter;
    const getQuickFilterText = valueFormatter
      ? (params: any) =>
          params.value ? params.colDef.valueFormatter(params.value) : undefined
      : undefined;
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
      rowGroup,
      hide,
      cellRenderer,
      rowGroupIndex: rowGroupIndex === -1 ? undefined : rowGroupIndex,
      initialRowGroupIndex: rowGroupIndex === -1 ? undefined : rowGroupIndex,
      headerTooltip: columnDescription,
      autoHeight,
      maxWidth,
      valueFormatter,
      useValueFormatterForExport,
      getQuickFilterText,
      sort,
      sortIndex: sortIndex > -1 ? sortIndex : undefined,
      type: columnType,
      context: {
        isDateColumn: isDate || columnTypeGeneric === GenericDataType.Temporal,
        advancedDataType,
      },
    };
  });

  return columnDefs;
};

const transformProps = (
  chartProps: CccsTableChartProps,
): CccsGridTransformedProps => {
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
    enableRowNumbers,
    enableGrouping,
    enableJsonExpand,
    principalColumns,
    orderByCols,
    jumpActionConfigs,
  }: CccsTableFormData = formData;

  const datasource_metrics = datasource?.metrics as Metric[];
  const data = queriesData[0].data as TimeseriesDataRecord[];

  const columns =
    formData.queryMode === 'raw'
      ? formData.columns || []
      : formData.groupby || [];

  const { metrics, percentMetrics } = formData;

  const defaultGroupBy = formData.defaultGroupBy ?? [];

  let columnDefs = calcColumnColumnDefs(
    columns,
    defaultGroupBy,
    datasource?.columns as Column[],
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
      cellRenderer: ExpandRowButtonRenderer,
      resizable: false,
      width: 100,
      lockVisible: true,
      suppressHeaderMenuButton: true,
      suppressHeaderContextMenu: true,
    } as any);
  } else if (enableGrouping) {
    // enable row grouping
    columnDefs = columnDefs.map(c => {
      const rowGroupIndex = defaultGroupBy.findIndex(
        (element: string) => element === c.field,
      );
      const rowGroup = rowGroupIndex >= 0;
      const hide = rowGroup;
      return {
        ...c,
        rowGroup,
        rowGroupIndex: rowGroupIndex === -1 ? undefined : rowGroupIndex,
        initialRowGroupIndex: rowGroupIndex === -1 ? undefined : rowGroupIndex,
        hide,
      };
    });
  }
  const agGridLicenseKey = queriesData[0].agGridLicenseKey as string;
  const assemblyLineUrl = queriesData[0].assemblyLineUrl as string;
  const enableAlfred = queriesData[0].enableAlfred as boolean;
  const enableDownload = queriesData[0].enableDownload as boolean;

  const parsedJumpActionConfigs = new Map();
  jumpActionConfigs?.forEach((e: any) => {
    if (!(e.dashboardID in parsedJumpActionConfigs)) {
      parsedJumpActionConfigs.set(e.dashboardID, []);
    }

    parsedJumpActionConfigs.get(e.dashboardID).concat({
      advancedDataType: e.advancedDataType,
      nativefilters: e.filters,
      name: e.dashBoardName,
    });
  });

  return {
    width,
    height,
    formData: chartProps.formData,
    data,
    columns: columnDefs,
    includeSearch,
    pageLength,
    enableRowNumbers,
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
};

export default transformProps;
