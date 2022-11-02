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

import { emitFilterControl } from '@superset-ui/chart-controls';
import { DataRecord, getColumnLabel } from '@superset-ui/core';
import { EChartsCoreOption, HeatmapSeriesOption } from 'echarts';
import { HeatmapDataItemOption } from 'echarts/types/src/chart/heatmap/HeatmapSeries';
import { OptionDataValue } from 'echarts/types/src/util/types';
import {
  EchartsHeatmapFormData,
  HeatmapChartTransformedProps,
  EchartsHeatmapChartProps,
} from './types';

export default function transformProps(
  chartProps: EchartsHeatmapChartProps,
): HeatmapChartTransformedProps {
  const { width, height, formData, queriesData, hooks } = chartProps;
  const {
    bottomMargin,
    canvasImageRendering,
    allColumnsX,
    allColumnsY,
    linearColorScheme,
    leftMargin,
    metric,
    normalized,
    showLegend,
    showPerc,
    showValues,
    sortXAxis,
    sortYAxis,
    xscaleInterval,
    yscaleInterval,
    yAxisBounds,
    yAxisFormat,
    emitFilter,
  } = formData as EchartsHeatmapFormData;
  const data = (queriesData[0]?.data || []) as DataRecord[];

  const echartOptions: EChartsCoreOption = {
    tooltip: {
      appendToBody: true,
      trigger: 'item',
    },
  };

  const transformedData: HeatmapDataItemOption[] = data.map(
    (data_point, index) => {
      const item: HeatmapDataItemOption = {
        value: data_point[index] as HeatmapDataValue, // TODO
      };
      return item;
    },
  );

  const { setDataMask = () => {}, onContextMenu } = hooks;

  const heatmapSeriesOptions: HeatmapSeriesOption[] = [
    {
      type: 'heatmap',
      coordinateSystem: 'cartesian2d', // TODO
      blurSize: 1, // TODO
      maxOpacity: 100, // TODO
      minOpacity: 0, // TODO
      data: transformedData,
    },
  ];
  // type?: 'heatmap';
  // coordinateSystem?: 'cartesian2d' | 'geo' | 'calendar';
  // blurSize?: number;
  // pointSize?: number;
  // maxOpacity?: number;
  // minOpacity?: number;
  // data?: (HeatmapDataItemOption | HeatmapDataValue)[];

  return {
    width,
    height,
    emitFilter,
    formData,
    echartOptions,
    labelMap,
    groupby,
    selectedValues,
    setDataMask,
  };
}
