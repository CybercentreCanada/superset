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
  isQueryFormColumn,
  QueryFormColumn,
  QueryFormData,
} from '@superset-ui/core';
import { EChartTransformedProps } from '../types';
import { DEFAULT_LEGEND_FORM_DATA } from '../constants';
import { CallbackDataParams } from 'echarts/types/src/util/types';

export type EchartsHeatmapFormData = QueryFormData & {
  groupby: QueryFormColumn[];
  width: number;
  height: number;
  bottomMargin: number | string;
  canvasImageRendering: string; // TODO
  colorScheme?: string;
  columnX: string;
  columnY: string;
  leftMargin: number | string;
  metric: string | object;
  normalized: boolean;
  numberFormat: string;
  showLegend: boolean;
  showPercentage: boolean;
  showValues: boolean;
  sortXAxis: string;
  sortYAxis: string;
  xscaleInterval: number;
  yscaleInterval: number;
  yAxisBounds: Array<number>;
  emitFilter: boolean;
};

// TODO review these values
export const DEFAULT_FORM_DATA: Partial<EchartsHeatmapFormData> = {
  ...DEFAULT_LEGEND_FORM_DATA,
  groupby: [],
  width: 150,
  height: 150,
  bottomMargin: 'auto',
  canvasImageRendering: 'pixelated', // 'pixelated (Sharp)'? TODO
  columnX: '',
  columnY: '',
  leftMargin: 'auto',
  metric: '',
  normalized: false,
  numberFormat: 'SMART_NUMBERS',
  showLegend: true,
  showPercentage: true,
  showValues: false,
  sortXAxis: 'Axis ascending',
  sortYAxis: 'Axis ascending',
  xscaleInterval: 1,
  yscaleInterval: 1,
  yAxisBounds: [],
  emitFilter: false,
};

export interface EchartsHeatmapChartProps
  extends ChartProps<EchartsHeatmapFormData> {
  formData: EchartsHeatmapFormData;
  queriesData: ChartDataResponseResult[];
}

export type HeatmapChartTransformedProps =
  EChartTransformedProps<EchartsHeatmapFormData>;

export interface HeatmapSeriesCallbackDataParams extends CallbackDataParams {
  xCategory: string;
  yCategory: string;
  xCategoryValue: string;
  yCategoryValue: string;
  metric: string;
  showPerc: boolean;
}
