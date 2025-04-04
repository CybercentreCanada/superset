import {
  ChartDataResponseResult,
  ChartProps,
  QueryFormData,
  SetDataMaskHook,
} from '@superset-ui/core';

export type CccsTableFormData = QueryFormData & {
  includeSearch: boolean;
  pageLength: number;
  enableRowNumbers: boolean;
  enableGrouping: boolean;
  enableJsonExpand: boolean;
  emitCrossFilters: boolean;
  principalColumns: string[];
  percent_metrics: string[];
  jumpActionConfigs?: any[];
};

export type CccsTableChartProps = ChartProps & {
  formData: CccsTableFormData;
  queriesData: AgGridChartDataResponseResult[];
};

export type AGGridVizProps = {
  formData: CccsTableFormData;
  width: any;
  height: any;
  rowData: { [index: string]: any }[];
  columnDefs: any[];
  includeSearch: boolean;
  pageLength: number;
  enableRowNumbers: boolean;
  enableGrouping: boolean;
  principalColumns: string[];
  agGridLicenseKey: string;
  assemblyLineUrl: string;
  enableAlfred: boolean;
  enableDownload: boolean;
  emitCrossFilters: boolean;
  columnsToRetain: string[];
  setDataMask: SetDataMaskHook;
  jumpActionConfigs?: any[];
};

export interface AgGridChartDataResponseResult extends ChartDataResponseResult {
  agGridLicenseKey: string;
  assemblyLineUrl: string;
  enableAlfred: boolean;
  enableDownload: boolean;
}

export type DataMap = { [key: string]: string[] };

export type GridData = {
  highlightedData: DataMap;
  principalData: DataMap;
  selectedColData: { [key: string]: any };
  typeData: DataMap;
  jumpToData: DataMap;
};
