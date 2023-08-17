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

const calcColumnDefs = (columns: QueryFormColumn[], defaultGroupBy: string[], enable_row_numbers=true ) => {
    

    const columnDefs = columns.map(col => {
      const rowGroupIndex = defaultGroupBy.findIndex(
        (element: any) => element === col,
      );
      const rowGroup = rowGroupIndex >= 0;
        return {
          field: col, 
          rowGroup,
          rowGroupIndex: rowGroupIndex === -1 ? null : rowGroupIndex,
        }
    })

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
  const { width, height, formData, queriesData } = chartProps;
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

  const data = queriesData[0].data as TimeseriesDataRecord[];

  const columns =  formData.queryMode === "raw" ? formData.allColumns || [] : formData.groupby || [];
  const columnDefs = calcColumnDefs(columns, defaultGroupBy ,enableRowNumbers) 
  
  
  const { setDataMask = () => {}, setControlValue } = hooks;

  // If the flag is set to true, add a column which will contain
  // a button to expand all JSON blobs in the row
  // if (enableJsonExpand) {
  //   columnDefs.splice(1, 0, {
  //     colId: 'jsonExpand',
  //     pinned: 'left',
  //     cellRenderer: ExpandAllValueRenderer,
  //     autoHeight: true,
  //     minWidth: 105,
  //     lockVisible: true,
  //   } as any);
  // } else if (enableGrouping) {
  //   // enable row grouping
  //   columnDefs = columnDefs.map(c => {
  //     const enableRowGroup = true;
  //     const rowGroupIndex = defaultGroupBy.findIndex(
  //       (element: any) => element === c.field,
  //     );
  //     const rowGroup = rowGroupIndex >= 0;
  //     const hide = rowGroup;
  //     return {
  //       ...c,
  //       enableRowGroup,
  //       rowGroup,
  //       rowGroupIndex: rowGroupIndex === -1 ? null : rowGroupIndex,
  //       hide,
  //     };
  //   });
  // }

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
