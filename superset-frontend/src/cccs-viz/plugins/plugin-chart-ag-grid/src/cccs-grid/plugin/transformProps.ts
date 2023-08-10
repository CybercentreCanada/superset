
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

const calcColumnDefs = (columns: QueryFormColumn[], enable_row_numbers=true) => {
    

    const columnDefs = columns.map(col => {
        return {field: col, Blah: "Yeeeea"}
    })


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

    return columnDefs
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
    const { setDataMask = () => {}, setControlValue } = hooks;

    return {
        width,
        height,
        setDataMask,
        formdata: chartProps.formData,
        rowData: data,
        columnDefs: columnDefs
    }
}