
import {
    ChartDataResponseResult,
    ChartProps,
    HandlerFunction,
    QueryFormData,
    SetDataMaskHook,
    supersetTheme,
    TimeseriesDataRecord,
    Column,
    
  } from '@superset-ui/core';

export type CccsGridFormData = QueryFormData & {}
 
export type CccsGridChartProps =
  ChartProps & {
    formData: CccsGridFormData;
  };


export type AGGridVizProps = {
  formData: CccsGridFormData;
  width: any;
  height: any;
  rowData: any[];
  columnDefs: any[];
}

