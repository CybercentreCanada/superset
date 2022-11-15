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
  NumberFormatter,
  getNumberFormatter,
  NumberFormats,
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
  HeatmapSeriesCallbackDataParams,
} from './types';
import {
  extractGroupbyLabel,
  getChartPadding,
  getLegendProps,
  sanitizeHtml,
} from '../utils/series';
import { DataFormatMixin } from 'echarts/types/src/model/mixin/dataFormat';

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
    normalizeAcross,
    numberFormat,
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
  // const minBound = yAxisBounds[0] || 0;
  // const maxBound = yAxisBounds[1] || 1;

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

  const xCategories = [...new Set(data.map(item => item[allColumnsX]))];
  const yCategories = [...new Set(data.map(item => item[allColumnsY]))];

  const my_data2 = data.map(datum => {
    const xIndex = xCategories.findIndex(
      category => category === datum[allColumnsX],
    );

    const yIndex = yCategories.findIndex(
      category => category === datum[allColumnsY],
    );

    return [xIndex, yIndex, datum[metric.toString()]];
  });

  // TODO sketchyy number cast? Is 0 an okay default?
  // Could have all other negative numbers.
  // Is it possible an item won't have a count?
  const maxDataValue = Math.max(...data.map(item => Number(item.count)), 0);
  const minDataValue = Math.min(...data.map(item => Number(item.count)), 0);

  const normalizedValueIndex = 3;
  const valueIndex = 2;
  let dimensionIndex = -1;
  if (normalizeAcross === 'x') {
    dimensionIndex = 0;
  } else if (normalizeAcross === 'y') {
    dimensionIndex = 1;
  }

  const minBound = yAxisBounds[0] || minDataValue;
  // TODO this and legend always spanned from 0 to 1 in old version
  const maxBound = yAxisBounds[1] || maxDataValue;

  const normalizedData = getNormalizedData(
    my_data2,
    normalizeAcross === 'x' ? xCategories.length : yCategories.length,
    dimensionIndex,
    valueIndex,
    minBound,
    maxBound,
  );

  const numberFormatter = getNumberFormatter(numberFormat);
  const formatter = (params: HeatmapSeriesCallbackDataParams) => {
    const { value, seriesName, data, percent } = params;

    console.log('test!!!! ');
    console.log(params);

    const stats = [
      // x
      // y
      // count
      // percent
      `<b>${allColumnsX}</b>: ${xCategories[data[0]]}`,
      `<b>${allColumnsY}</b>: ${yCategories[data[1]]}`,
      `<b>${metric}</b>: ${value}`,
      `${seriesName}`,
      `${data}`,
      `${percent}`,
      // TODO can we get the platform (y axis value) from transformed data?
    ];

    // TODO if show percent
    const percentage = `<b>%</b>: PERCENT HERE`;

    return [...stats, percentage].join('<br/>');
  };

  const echartOptions: EChartsCoreOption = {
    tooltip: {
      position: 'top',
      appendToBody: true,
      trigger: 'item',
      formatter,
    },
    grid: {
      ...defaultGrid,
      // height: '100%',
      // width: '100%',
    },
    xAxis: {
      type: 'category',
      data: xCategories,
      axisLabel: {
        interval: xscaleInterval,
      },
      splitArea: {
        show: true,
      },
    },
    yAxis: {
      type: 'category',
      data: yCategories,
      axisLabel: {
        interval: yscaleInterval,
      },
      splitArea: {
        show: true,
      },
    },
    visualMap: {
      min: minDataValue, // TODO test 'dataMin',
      max: maxDataValue,
      calculable: true,
      orient: legendOrientation, // 'vertical',
      top: '15%',
      left: 'right',
      show: showLegend,
      itemWidth: 15,
      itemHeight: 80,
      color: colors,
      dimension: normalizedValueIndex,
    },
    series: [
      {
        type: 'heatmap',
        data: normalizedData,
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

function getNormalizedData(
  data: DataRecordValue[][],
  categoryLength: number,
  dimensionIndex = -1,
  valueIndex = 2,
  minBound: number,
  maxBound: number,
): DataRecordValue[][] {
  // data = [[x, y, value], ... ]

  let normalizedData = data;

  if (dimensionIndex >= 0) {
    const sums: number[] = new Array(categoryLength).fill(0);
    const mins: number[] = new Array(categoryLength).fill(
      Number.MIN_SAFE_INTEGER,
    );
    const maxes: number[] = new Array(categoryLength).fill(
      Number.MAX_SAFE_INTEGER,
    );

    // TODO error handling for if category length is wrong, or if a value is undefined?
    data.forEach(value => {
      sums[value[dimensionIndex] as number] =
        sums[value[dimensionIndex] as number] + (value[valueIndex] as number);

      if (
        mins[value[dimensionIndex] as number] === Number.MIN_SAFE_INTEGER ||
        (value[valueIndex] as number) < mins[value[dimensionIndex] as number]
      ) {
        mins[value[dimensionIndex] as number] = value[valueIndex] as number;
      }

      if (
        maxes[value[dimensionIndex] as number] === Number.MAX_SAFE_INTEGER ||
        (value[valueIndex] as number) > maxes[value[dimensionIndex] as number]
      ) {
        maxes[value[dimensionIndex] as number] = value[valueIndex] as number;
      }
    });

    // normalized value in [a, b] = (b - a) * (x - minx)/(maxx - minx) + a
    normalizedData = data.map(value => {
      const normalized_value: number = getNormalizedValue(
        minBound,
        maxBound,
        value[valueIndex] as number,
        mins[value[dimensionIndex] as number],
        maxes[value[dimensionIndex] as number],
      );
      return [...value, normalized_value];
    });
  } else {
    const maxDataValue = Math.max(
      ...data.map(item => Number(item[valueIndex])),
      Number.MIN_SAFE_INTEGER,
    );
    const minDataValue = Math.min(
      ...data.map(item => Number(item[valueIndex])),
      Number.MAX_SAFE_INTEGER,
    );
    normalizedData = data.map(value => {
      const normalized_value: number = getNormalizedValue(
        minBound,
        maxBound,
        value[valueIndex] as number,
        minDataValue,
        maxDataValue,
      );
      return [...value, normalized_value];
    });
    // normalizedData = data.map(value => [...value, value[valueIndex]]);
  }

  return normalizedData;
}

function getNormalizedValue(
  a: number,
  b: number,
  x: number,
  min_x: number,
  max_x: number,
): number {
  return (b - a) * ((x - min_x) / (max_x - min_x)) + a;
}

export function formatTooltip({
  params,
  numberFormatter,
}: {
  params: HeatmapSeriesCallbackDataParams;
  numberFormatter: NumberFormatter;
}): string {
  const { value } = params;
  const formattedValue = numberFormatter(value as number);
  const percentFormatter = getNumberFormatter(NumberFormats.PERCENT_2_POINT);

  // let formattedPercent = '';
  // if (parentNode) {
  //   const percent: number = parentNode.value
  //     ? (currentNode.value as number) / (parentNode.value as number)
  //     : 0;
  //   formattedPercent = percentFormatter(percent);
  // }

  // x axis
  // y axis
  // count
  // percent if enabled
  return [
    `<div>${value}</div>`,
    `Test: ${formattedValue}`,
    // formattedPercent ? ` (${formattedPercent})` : '',
  ].join('');
}
