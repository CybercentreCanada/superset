import {
  Column,
  getMetricLabel,
  getNumberFormatter,
  Metric,
  NumberFormats,
  QueryFormColumn,
  QueryMode,
  t,
  TimeseriesDataRecord,
} from '@superset-ui/core';

import { CccsTableChartProps, CccsTableFormData } from '../../types';
import ExpandAllValueRenderer from '../../ExpandAllValueRenderer';
import { ValueFormatterParams } from 'ag-grid-community';

const calcMetricColumnDefs = (metrics: any[], percent_metrics: any[], datasource_metrics: Metric[]) => {
  
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
    const metricsColumnDefs = metrics
      .map((metric: any) => {
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
    const percentMetricsColumnDefs = percent_metrics
      .map((metric: any) => {
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
}


const calcColumnColumnDefs = (columns: QueryFormColumn[], defaultGroupBy: string[], dataset_columns: Column[], enable_row_numbers=true ) => {

  const columnDataMap = new Map<string, string>();
  dataset_columns.reduce(function (columnMap, column: Column) {
    // @ts-ignore
    const name = column.column_name;
    // @ts-ignore
    columnMap[name] = {
      type: column.type,
      advanced_data_type: ( (column.advanced_data_type as string) ?? ''),
      verbose_name: column.verbose_name,
      description: column.description
    } 
    return columnMap;
  }, columnDataMap);


const columnDefs = columns.map((column: any) => { 
    const columnType = columnDataMap[column].type;
    const advancedType = columnDataMap[column].advanced_data_type;
    const columnHeader = columnDataMap[column].verbose_name
      ? columnDataMap[column].verbose_name
      : column;
    // const cellRenderer =
    //   columnAdvancedType in rendererMap
    //     ? rendererMap[columnAdvancedType]
    //     : columnType in rendererMap
    //     ? rendererMap[columnType]
    //     : undefined;
    const isSortable = true;
    const enableRowGroup = true;
    const columnDescription = columnDataMap[column].description;
    const autoHeight = true;
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
      rowGroupIndex,
      // getQuickFilterText: (params: any) => valueFormatter(params),
      headerTooltip: columnDescription,
      autoHeight,
    }
  });

  if (enable_row_numbers) {
        columnDefs.splice(0, 0, {
          headerName: '#',
          colId: 'rowNum',
          pinned: 'left',
          width: 50,
          lockVisible: true,
          enableRowGroup: false,
          valueGetter: (params: any) =>
            params.node ? params.node.rowIndex + 1 : null,
        } as any);
      }

    return columnDefs
}


export default function transformProps(chartProps: CccsTableChartProps) {
  const { datasource, width, height, formData, queriesData } = chartProps;
  const {
    includeSearch,
    pageLength,
    defaultGroupBy,
    enableRowNumbers,
    enableGrouping,
    enableJsonExpand,
    principalColumns,
  }: CccsTableFormData = {
    ...formData,
  };

  const {
    hooks
  } = chartProps;
  
  const datasource_metrics = datasource?.metrics as Metric[];
  const data = queriesData[0].data as TimeseriesDataRecord[];
  
  const columns =  formData.queryMode === "raw" ? formData.allColumns || [] : formData.groupby || [];
  const metrics = formData.metrics;
  const percent_metrics = formData.percentMetrics;

  let columnDefs = calcColumnColumnDefs(columns, defaultGroupBy, datasource?.columns as Column[], enableRowNumbers) 
  columnDefs = columnDefs.concat(calcMetricColumnDefs(metrics || [], percent_metrics || [], datasource_metrics));
  
  const { setDataMask = () => {}, setControlValue } = hooks;

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
    setDataMask,
  };
}
