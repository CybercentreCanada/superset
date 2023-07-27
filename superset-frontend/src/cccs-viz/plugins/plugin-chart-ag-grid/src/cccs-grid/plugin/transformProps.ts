
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

import {
    CccsGridChartProps
} from '../../types';

const calcColumnDefs = (columns: QueryFormColumn[]) => {

    return columns.map(col => {
        return {field: col, Blah: "Yeeeea"}
    })
}

export default function transformProps(chartProps: CccsGridChartProps) {
    
    const {
        datasource,
        hooks,
        width,
        height,
        formData: formData,
        queriesData,
        emitCrossFilters,
    } = chartProps;

    const columnDefs = formData.queryMode === "raw" ?  calcColumnDefs( formData.all_columns || []) : calcColumnDefs( formData.groupby || []) 
      
    const data = queriesData[0].data as TimeseriesDataRecord[];

    return {
        width,
        height,
        formdata: chartProps.formData,
        rowData: data,
        columnDefs: columnDefs
    }
}