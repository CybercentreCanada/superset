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

import { CccsGridChartProps } from '../../types';

const calcColumnDefs = (columns: QueryFormColumn[]) =>
  columns.map(col => ({ field: col, Blah: 'Yeeeea' }));

export default function transformProps(chartProps: CccsGridChartProps) {
  const {
    datasource,
    hooks,
    width,
    height,
    formData,
    queriesData,
    emitCrossFilters,
  } = chartProps;

  const columnDefs =
    formData.queryMode === QueryMode.raw
      ? calcColumnDefs(formData.allColumns || [])
      : calcColumnDefs(formData.groupby || []);

  const data = queriesData[0].data as TimeseriesDataRecord[];

  return {
    width,
    height,
    formdata: chartProps.formData,
    rowData: data,
    columnDefs,
  };
}
