import { ChartProps, QueryFormData, SetDataMaskHook } from '@superset-ui/core';

export type CccsTableFormData = QueryFormData & {
  includeSearch: boolean;
  pageLength: number;
  enableRowNumbers: boolean;
  enableGrouping: boolean;
  enableJsonExpand: boolean;
};

export type CccsTableChartProps = ChartProps & {
  formData: CccsTableFormData;
};


export type AGGridVizProps = {
  formData: CccsTableFormData;
  width: any;
  height: any;
  rowData: any[];
  columnDefs: any[];
  includeSearch: boolean;
  pageLength: number;
  enableRowNumbers: boolean;
  enableGrouping: boolean;
  setDataMask: SetDataMaskHook;
};
