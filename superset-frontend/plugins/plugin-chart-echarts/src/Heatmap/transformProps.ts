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
import {
  DataRecord,
  getColumnLabel,
  QueryFormMetric,
  getMetricLabel,
  DataRecordValue,
  CategoricalColorNamespace,
  getSequentialSchemeRegistry,
} from '@superset-ui/core';
import { EChartsCoreOption, HeatmapSeriesOption } from 'echarts';
import { HeatmapDataItemOption } from 'echarts/types/src/chart/heatmap/HeatmapSeries';
import { OptionDataValue } from 'echarts/types/src/util/types';
import { defaultGrid, defaultTooltip } from '../defaults';
import {
  DEFAULT_FORM_DATA,
  EchartsHeatmapFormData,
  HeatmapChartTransformedProps,
  EchartsHeatmapChartProps,
} from './types';
import {
  extractGroupbyLabel,
  getChartPadding,
  getLegendProps,
  sanitizeHtml,
} from '../utils/series';

export default function transformProps(
  chartProps: EchartsHeatmapChartProps,
): HeatmapChartTransformedProps {
  const { width, height, formData, queriesData, hooks, filterState, theme } =
    chartProps;
  const {
    groupby,
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
    legendMargin,
    legendOrientation,
    legendType,
    sliceId,
  }: EchartsHeatmapFormData = { ...DEFAULT_FORM_DATA, ...formData };
  const data = (queriesData[0]?.data || []) as DataRecord[];
  const groupbyLabels = groupby.map(getColumnLabel);
  // const colorFn = CategoricalColorNamespace.getScale(linearColorScheme);
  const minBound = yAxisBounds[0] || 0;
  const maxBound = yAxisBounds[1] || 1;

  const scheme_colors = getSequentialSchemeRegistry()
    ?.get(linearColorScheme)
    ?.getColors();
  const colors = scheme_colors ? [...scheme_colors].reverse() : [];

  const columnsLabelMap = new Map<string, string[]>();

  const transformedData: HeatmapDataItemOption[] = data.map(
    (data_point, index) => {
      const name = groupbyLabels
        .map(column => `${column}: ${data_point[column]}`)
        .join(', ');
      columnsLabelMap.set(
        name,
        groupbyLabels.map(col => data_point[col] as string),
      );
      const item = {
        value: [100], // [data_point[index]] || [0], // TODO
      };
      return item; // item;
    },
  );

  const { setDataMask = () => {}, onContextMenu } = hooks;

  const heatmapSeriesOptions: HeatmapSeriesOption[] = [
    {
      type: 'heatmap',
      coordinateSystem: 'cartesian2d', // TODO
      pointSize: 10,
      blurSize: 100, // TODO
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

  // const echartOptions: EChartsCoreOption = {
  //   tooltip: {
  //     appendToBody: true,
  //     trigger: 'item',
  //   },
  //   heatmapSeriesOptions,
  // };

  const x_categories = [...new Set(data.map(item => item[allColumnsX]))];
  const y_categories = [...new Set(data.map(item => item[allColumnsY]))];

  const my_data2 = data.map(datum => {
    const x_index = x_categories.findIndex(
      category => category === datum[allColumnsX],
    );

    const y_index = y_categories.findIndex(
      category => category === datum[allColumnsY],
    );

    return [x_index, y_index, datum[metric.toString()]];
  });

  // TODO sketchyy number cast? Is 0 an okay default?
  // Could have all other negative numbers.
  // Is it possible an item won't have a count?
  const max_data_value = Math.max(...data.map(item => Number(item.count)), 0);
  const min_data_value = Math.min(...data.map(item => Number(item.count)), 0);

  const echartOptions: EChartsCoreOption = {
    tooltip: {
      position: 'top',
    },
    grid: {
      ...defaultGrid,
      // height: '90%',
      // top: 'top',
    },
    xAxis: {
      type: 'category',
      data: x_categories,
      splitArea: {
        show: true,
      },
    },
    yAxis: {
      type: 'category',
      data: y_categories,
      splitArea: {
        show: true,
      },
    },
    visualMap: {
      min: min_data_value,
      max: max_data_value,
      calculable: true,
      orient: legendOrientation, // 'vertical',
      top: '15%',
      left: 'right',
      show: showLegend,
      itemWidth: 15,
      itemHeight: 80,
      color: colors,
    },
    series: [
      {
        type: 'heatmap',
        data: my_data2,
        label: {
          show: true,
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            // eslint-disable-next-line theme-colors/no-literal-colors
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
      },
    ],
  };

  return {
    width,
    height,
    emitFilter,
    formData,
    echartOptions,
    labelMap: Object.fromEntries(columnsLabelMap),
    groupby: groupbyLabels,
    selectedValues: filterState.selectedValues || [],
    setDataMask,
  };
}
