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

const calcColumnDefs = (columns: QueryFormColumn[]) =>
  columns.map(col => ({ field: col }));

export default function transformProps(chartProps: CccsTableChartProps) {
  const { width, height, formData, queriesData } = chartProps;
  const {
    includeSearch,
    pageLength,
    defaultGroupBy,
    enableRowNumbers,
    enableGrouping,
    enableJsonExpand,
  }: CccsTableFormData = {
    ...formData,
  };
  let columnDefs =
    formData.queryMode === QueryMode.raw
      ? calcColumnDefs(formData.allColumns || [])
      : calcColumnDefs(formData.groupby || []);

  const data = queriesData[0].data as TimeseriesDataRecord[];

  if (enableRowNumbers) {
    columnDefs.splice(0, 0, {
      headerName: '#',
      colId: 'rowNum',
      pinned: 'left',
      lockVisible: true,
      valueGetter: (params: any) =>
        params.node ? params.node.rowIndex + 1 : null,
    } as any);
  }

  // If the flag is set to true, add a column which will contain
  // a button to expand all JSON blobs in the row
  if (enableJsonExpand) {
    columnDefs.splice(1, 0, {
      colId: 'jsonExpand',
      pinned: 'left',
      cellRenderer: ExpandAllValueRenderer,
      autoHeight: true,
      minWidth: 105,
      lockVisible: true,
    } as any);
  } else if (enableGrouping) {
    // enable row grouping
    columnDefs = columnDefs.map(c => {
      const enableRowGroup = true;
      const rowGroupIndex = defaultGroupBy.findIndex(
        (element: any) => element === c.field,
      );
      const rowGroup = rowGroupIndex >= 0;
      const hide = rowGroup;
      return {
        ...c,
        enableRowGroup,
        rowGroup,
        rowGroupIndex: rowGroupIndex === -1 ? null : rowGroupIndex,
        hide,
      };
    });
  }

  return {
    width,
    height,
    formdata: chartProps.formData,
    rowData: data,
    columnDefs,
    includeSearch,
    pageLength,
    enableGrouping,
  };
}
