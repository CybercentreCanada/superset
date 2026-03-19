/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import {
  ChartDataResponseResult,
  ChartProps,
  DataRecord,
  QueryFormData,
  SetDataMaskHook,
} from '@superset-ui/core';
import { ColDef } from 'ag-grid-community';

export type CccsTableFormData = QueryFormData & {
  includeSearch: boolean;
  pageLength: number;
  defaultGroupBy?: string[];
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
  queriesData: CccsGridChartDataResponseResult[];
};

export interface CccsGridTransformedProps<D extends DataRecord = DataRecord> {
  height: number;
  width: number;

  setDataMask: SetDataMaskHook;
  data: D[];
  columns: ColDef[];

  pageLength?: number;
  includeSearch?: boolean;
  enableRowNumbers?: boolean;
  enableGrouping?: boolean;

  agGridLicenseKey: string;
  assemblyLineUrl: string;
  enableAlfred: boolean;
  enableDownload: boolean;

  principalColumns?: string[];
  emitCrossFilters?: boolean;
  jumpActionConfigs?: any[];

  formData: CccsTableFormData;
}

export type CccsGridProps = {
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
  emitCrossFilters?: boolean;
  columnsToRetain: string[];
  setDataMask: SetDataMaskHook;
  jumpActionConfigs?: any[];
};

export interface CccsGridChartDataResponseResult
  extends ChartDataResponseResult {
  agGridLicenseKey: string;
  assemblyLineUrl: string;
  enableAlfred: boolean;
  enableDownload: boolean;
}

export type DataMap = { [key: string]: Set<string> };

export type GridData = {
  highlightedData: DataMap;
  principalData: DataMap;
  selectedColData: { [key: string]: any };
  typeData: DataMap;
  jumpToData: DataMap;
};
