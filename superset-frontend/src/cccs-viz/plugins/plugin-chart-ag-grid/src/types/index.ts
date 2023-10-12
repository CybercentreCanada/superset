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
  onClickBehaviour: string;
  enableActionButton: boolean;
  enableMultiResults: boolean;
  actionUrl: string;
  parameterName: string;
  columnForValue: string;
  parameterPrefix: string;
  actionJoinCharacter: string;
  parameterSuffix: string;
  actionFindReplace: string;
  actionButtonLabel: string;
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
  onClickBehaviour: string;
  agGridLicenseKey: string;
  emitCrossFilters: boolean;
  columnsToRetain: string[];
  setDataMask: SetDataMaskHook;
  jumpActionConfigs?: any[];
};

export interface AgGridChartDataResponseResult extends ChartDataResponseResult {
  agGridLicenseKey: string;
}

export type DataMap = { [key: string]: string[] };

export type GridData = {
  highlightedData: DataMap;
  principalData: DataMap;
  advancedTypeData: DataMap;
  actionButtonData: any[];
};
