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
  QueryFormColumn,
  QueryFormData,
} from '@superset-ui/core';
import { EChartTransformedProps } from '../types';
//import { DEFAULT_LEGEND_FORM_DATA } from '../constants';

export type EchartsHeatmapFormData = QueryFormData & {
  width: number;
  height: number;
  bottomMargin: number | string;
  canvasImageRendering: string; // TODO
  colorScheme?: string;
  groupby: QueryFormColumn[];
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
  xScaleInterval: number;
  yScaleInterval: number;
  yAxisBounds: Array<number>;
  emitFilter: boolean;
};

export const DEFAULT_FORM_DATA: Partial<EchartsHeatmapFormData> = {
  //...DEFAULT_LEGEND_FORM_DATA,
  width: 150,
  height: 150,
  bottomMargin: 'auto',
  canvasImageRendering: 'pixelated (Sharp)', // TODO
  groupby: [],
  columnX: '',
  columnY: '',
  leftMargin: 'auto',
  metric: '',
  normalized: false,
  numberFormat: 'SMART_NUMBER',
  showLegend: true,
  showPercentage: true,
  showValues: false,
  sortXAxis: 'Axis ascending',
  sortYAxis: 'Axis ascending',
  xScaleInterval: 1,
  yScaleInterval: 1,
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
