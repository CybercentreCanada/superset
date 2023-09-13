import { ChartDataResponseResult, ChartProps, QueryFormData, SetDataMaskHook } from '@superset-ui/core';

export type CccsTableFormData = QueryFormData & {
  includeSearch: boolean;
  pageLength: number;
  enableRowNumbers: boolean;
  enableGrouping: boolean;
  enableJsonExpand: boolean;
  principalColumns: string[];
  percent_metrics: string[];
  
};

export type CccsTableChartProps = ChartProps & {
  formData: CccsTableFormData;
  queriesData: AgGridChartDataResponseResult[];
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
  principalColumns: string[];
  agGridLicenseKey: string;
  setDataMask: SetDataMaskHook;
};

export interface AgGridChartDataResponseResult
  extends ChartDataResponseResult {
  agGridLicenseKey: string;
}
