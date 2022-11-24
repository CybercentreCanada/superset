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
import { DataFormatMixin } from 'echarts/types/src/model/mixin/dataFormat';
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

const X_INDEX = 0;
const Y_INDEX = 1;
const VALUE_INDEX = 2;
const NORMALIZED_VALUE_INDEX = 3;
const PERCENT_INDEX = 4;
const X_SUM_INDEX = 5;
const Y_SUM_INDEX = 6;

export function formatTooltip({
  params,
  xCategory,
  yCategory,
  xCategories,
  yCategories,
  metric,
  showPerc,
  numberFormatter,
}: {
  params: HeatmapSeriesCallbackDataParams;
  xCategory: string;
  yCategory: string;
  xCategories: DataRecordValue[];
  yCategories: DataRecordValue[];
  metric: string | object;
  showPerc: boolean;
  numberFormatter: NumberFormatter;
}): string {
  const { value } = params;

  // TODO could/should store x/y category in value?
  const stats = [
    `<b>${xCategory}</b>: ${xCategories[value[X_INDEX]]}`,
    `<b>${yCategory}</b>: ${yCategories[value[Y_INDEX]]}`,
    `<b>${metric}</b>: ${numberFormatter(value[VALUE_INDEX])}`,
    showPerc ? `<b>%</b>: ${value[PERCENT_INDEX].toFixed(2)}%` : '',
  ];

  return [...stats].join('<br/>');
}

function sortCategoryList(
  sortOption: string,
  axis: string,
  sums: Map<string, number>,
): DataRecordValue[] {
  let sortedCategories = [...sums.keys()];

  if (
    (sortOption === 'alpha_asc' && axis === 'x') ||
    (sortOption === 'alpha_desc' && axis === 'y')
  ) {
    sortedCategories = [...sums.keys()].sort();
  } else if (
    (sortOption === 'alpha_desc' && axis === 'x') ||
    (sortOption === 'alpha_asc' && axis === 'y')
  ) {
    sortedCategories = [...sums.keys()].sort().reverse();
  } else if (
    (sortOption === 'value_asc' && axis === 'x') ||
    (sortOption === 'value_desc' && axis === 'y')
  ) {
    sortedCategories = [...sums.entries()]
      .sort((a, b) => {
        let ret = 0;

        if (a[1] < b[1]) {
          ret = -1;
        } else if (a[1] > b[1]) {
          ret = 1;
        }

        return ret;
      })
      .map(entry => entry[0]);
  } else if (
    (sortOption === 'value_desc' && axis === 'x') ||
    (sortOption === 'value_asc' && axis === 'y')
  ) {
    sortedCategories = [...sums.entries()]
      .sort((a, b) => {
        let ret = 0;

        if (a[1] > b[1]) {
          ret = -1;
        } else if (a[1] < b[1]) {
          ret = 1;
        }

        return ret;
      })
      .map(entry => entry[0]);
  }

  return sortedCategories;
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
  const numberFormatter = getNumberFormatter(yAxisFormat);
  const scheme_colors = getSequentialSchemeRegistry()
    ?.get(linearColorScheme)
    ?.getColors();
  const colors = scheme_colors ? [...scheme_colors].reverse() : [];

  const columnsLabelMap = new Map<string, string[]>();

  // const transformedData: HeatmapDataItemOption[] = data.map(
  //   (data_point, index) => {
  //     const name = groupbyLabels
  //       .map(column => `${column}: ${data_point[column]}`)
  //       .join(', ');
  //     columnsLabelMap.set(
  //       name,
  //       groupbyLabels.map(col => data_point[col] as string),
  //     );
  //     const item = {
  //       value: [100], // [data_point[index]] || [0], // TODO
  //     };
  //     return item; // item;
  //   },
  // );

  const { setDataMask = () => {}, onContextMenu } = hooks;

  // const heatmapSeriesOptions: HeatmapSeriesOption[] = [
  //   {
  //     type: 'heatmap',
  //     coordinateSystem: 'cartesian2d', // TODO
  //     pointSize: 10,
  //     blurSize: 100, // TODO
  //     maxOpacity: 100, // TODO
  //     minOpacity: 0, // TODO
  //     data: transformedData,
  //   },
  // ];

  // const X_CATEGORY_INDEX = 5;
  // const Y_CATEGORY_INDEX = 6;

  const xSums = new Map<string, number>(); // key = xValue
  const ySums = new Map<string, number>(); // key = yValue
  const xMins = new Map<string, number>();
  const xMaxes = new Map<string, number>();
  const yMins = new Map<string, number>();
  const yMaxes = new Map<string, number>();

  const xCategory = allColumnsX;
  const yCategory = allColumnsY;

  const overallMaxValue = Math.max(
    ...data.map(datum => datum[metric.toString()] as number),
  );
  const overallMinValue = Math.min(
    ...data.map(datum => datum[metric.toString()] as number),
  );

  data.forEach(datum => {
    const value: number = datum[metric.toString()] as number; // TODO sketchy casts?
    const xCategoryValue: string = datum[xCategory] as string; // TODO sketchy cast?
    const yCategoryValue: string = datum[yCategory] as string;

    xSums.set(xCategoryValue, (xSums.get(xCategoryValue) || 0) + value);

    ySums.set(yCategoryValue, (ySums.get(yCategoryValue) || 0) + value);

    xMins.set(
      xCategoryValue,
      Math.min(xMins.get(xCategoryValue) || Number.MAX_SAFE_INTEGER, value),
    );

    xMaxes.set(
      xCategoryValue,
      Math.max(xMaxes.get(xCategoryValue) || Number.MIN_SAFE_INTEGER, value),
    );

    yMins.set(
      yCategoryValue,
      Math.min(yMins.get(yCategoryValue) || Number.MAX_SAFE_INTEGER, value),
    );

    yMaxes.set(
      yCategoryValue,
      Math.max(yMaxes.get(yCategoryValue) || Number.MIN_SAFE_INTEGER, value),
    );
  });

  const minBound =
    normalizeAcross === 'heatmap'
      ? yAxisBounds[0] || overallMinValue
      : overallMinValue;
  // TODO this and legend always spanned from 0 to 1 in old version
  const maxBound =
    normalizeAcross === 'heatmap'
      ? yAxisBounds[1] || overallMaxValue
      : overallMaxValue;

  const enrichedData = data.map(datum => {
    const value: number = datum[metric.toString()] as number; // TODO sketchy casts?
    const xCategoryValue: string = datum[xCategory] as string; // TODO sketchy cast?
    const yCategoryValue: string = datum[yCategory] as string;

    let normalizedValue: number = value;
    let percent = 0;
    let maxDataValue: number;
    let minDataValue: number;

    if (normalizeAcross === 'x') {
      maxDataValue = xMaxes.get(xCategoryValue) || overallMaxValue;
      minDataValue = xMins.get(xCategoryValue) || overallMinValue;
    } else if (normalizeAcross === 'y') {
      maxDataValue = yMaxes.get(yCategoryValue) || overallMaxValue;
      minDataValue = yMins.get(yCategoryValue) || overallMinValue;
    } else {
      // normalizeAcross === 'heatmap'
      maxDataValue = overallMaxValue;
      minDataValue = overallMinValue;
    }

    normalizedValue = getNormalizedValue(
      minBound,
      maxBound,
      value,
      minDataValue,
      maxDataValue,
    );

    percent = (value / maxDataValue) * 100;

    return {
      value,
      xCategoryValue,
      yCategoryValue,
      xSum: xSums.get(xCategoryValue),
      ySum: ySums.get(yCategoryValue),
      normalizedValue,
      percent,
    };
  });

  const xCategories = sortCategoryList(sortXAxis, 'x', xSums);
  const yCategories = sortCategoryList(sortYAxis, 'y', ySums);

  const transformedData = enrichedData.map(datum => {
    const xIndex = xCategories.findIndex(
      category => category === datum.xCategoryValue,
    );

    const yIndex = yCategories.findIndex(
      category => category === datum.yCategoryValue,
    );

    // TODO heatmap seems to require a number, so no formatting allowed?
    // (e.g., for 1k or 4,000%)
    const formattedData = Number(numberFormatter(datum.value));
    // [xIndex, yIndex, value, normalized, percent, x_sum, y_sum]
    return [
      xIndex,
      yIndex,
      datum.value,
      datum.normalizedValue,
      datum.percent,
      datum.xSum,
      datum.ySum,
    ];
  });

  const echartOptions: EChartsCoreOption = {
    tooltip: {
      position: 'top',
      appendToBody: true,
      trigger: 'item',
      formatter: (params: HeatmapSeriesCallbackDataParams) =>
        formatTooltip({
          params,
          xCategory: allColumnsX,
          yCategory: allColumnsY,
          xCategories,
          yCategories,
          metric,
          showPerc,
          numberFormatter,
        }),
    },
    grid: {
      ...defaultGrid,
      left: leftMargin,
      bottom: bottomMargin,
    },
    xAxis: {
      type: 'category',
      data: xCategories,
      axisLabel: {
        interval: xscaleInterval - 1,
        rotate: 45, // TODO pull into constants or defaults?
      },
      splitArea: {
        show: true,
      },
    },
    yAxis: {
      type: 'category',
      data: yCategories,
      axisLabel: {
        interval: yscaleInterval - 1,
      },
      splitArea: {
        show: true,
      },
    },
    visualMap: {
      min: minBound, // minDataValue, // TODO test 'dataMin',
      max: maxBound, // maxDataValue,
      calculable: true,
      orient: legendOrientation, // 'vertical',
      top: '15%',
      left: 'right',
      show: showLegend,
      itemWidth: 15,
      itemHeight: 80,
      color: colors,
      // TODO vv VALUE_INDEX if yAxisBounds AND normalized across heatmap
      // or only normalized_value index if normalized on x/y
      dimension:
        yAxisBounds && normalizeAcross === 'heatmap'
          ? VALUE_INDEX
          : NORMALIZED_VALUE_INDEX,
    },
    series: [
      {
        type: 'heatmap',
        data: transformedData,
        label: {
          show: showValues,
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
