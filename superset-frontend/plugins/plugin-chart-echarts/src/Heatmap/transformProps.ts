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
import {
  EChartsCoreOption,
  HeatmapSeriesOption,
  LegendComponentOption,
} from 'echarts';
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
const NORMALIZED_RANK_VALUE_INDEX = 7;

export function formatTooltip({
  params,
  xCategory,
  yCategory,
  xCategories,
  yCategories,
  metric,
  showPerc,
  numberFormatter,
  normalized,
}: {
  params: HeatmapSeriesCallbackDataParams;
  xCategory: string;
  yCategory: string;
  xCategories: DataRecordValue[];
  yCategories: DataRecordValue[];
  metric: string | object;
  showPerc: boolean;
  numberFormatter: NumberFormatter;
  normalized: boolean;
}): string {
  const { value } = params;

  // TODO could/should store x/y category in value?
  const stats = [
    `<b>${xCategory}</b>: ${xCategories[value[X_INDEX]]}`,
    `<b>${yCategory}</b>: ${yCategories[value[Y_INDEX]]}`,
    `<b>${metric}</b>: ${numberFormatter(value[VALUE_INDEX])}`,
    showPerc
      ? `<b>%</b>: ${
          normalized
            ? value[NORMALIZED_RANK_VALUE_INDEX]
            : value[PERCENT_INDEX].toFixed(2)
        }%`
      : '',
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

function getPercentRanks(values: number[]): Map<number, number> {
  // based on pandas DataFrame.rank
  // array of values (whole heatmap or row/col)
  // array: [1, 3, 7, 7] // MUST BE ORDERED
  // rank:  [1, 2, 3, 4]
  // counts:[1, 1, 2, 2]
  // rank2: [0.25, 0.5, 0.875, 0.875]
  // (1/array.length)*rank (if one value)
  // (rank1 + ...rankn)/array.length/n

  const orderedValues = [...values].sort((value1, value2) => value1 - value2);
  const valueCountMap: Map<number, number> = new Map();
  orderedValues.forEach(value => {
    valueCountMap.set(value, (valueCountMap.get(value) || 0) + 1);
  });

  // TODO check if values list is empty?
  // TODO MONDAY - THE OUTPUTTED VALUES ARE WROOONG
  let currentValue = orderedValues[0];
  let rankSum = 0;
  const percentRanks: Map<number, number> = new Map();
  orderedValues.forEach((value, index) => {
    if (currentValue === value) {
      rankSum += index + 1;
    } else {
      percentRanks.set(
        currentValue,
        (rankSum /
          orderedValues.length /
          (valueCountMap.get(currentValue) || 1)) *
          100,
      );
      currentValue = value;
      rankSum = index + 1;
    }
  });

  // Get the last value (this is shady)
  percentRanks.set(
    currentValue,
    (rankSum / orderedValues.length / (valueCountMap.get(currentValue) || 1)) *
      100,
  );

  return percentRanks;
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

  const { setDataMask = () => {}, onContextMenu } = hooks;

  const xSums = new Map<string, number>(); // key = xValue
  const ySums = new Map<string, number>(); // key = yValue
  const xMins = new Map<string, number>();
  const xMaxes = new Map<string, number>();
  const yMins = new Map<string, number>();
  const yMaxes = new Map<string, number>();
  // For getting ranks when normalized is checked
  const xValues = new Map<string, number[]>();
  const yValues = new Map<string, number[]>();

  const xCategory = allColumnsX;
  const yCategory = allColumnsY;

  const overallMaxValue = Math.max(
    ...data.map(datum => datum[metric.toString()] as number),
  );
  const overallMinValue = Math.min(
    ...data.map(datum => datum[metric.toString()] as number),
  );

  // const distinctValues = [
  //   ...new Set(data.map(datum => datum[metric.toString()] as number)),
  // ].sort((value1, value2) => value1 - value2);

  // get a list of distinct values, ordered
  // then below, for each entry, give it a rank = average position in ordered list?

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

    // TODO is there another way to do this? vv
    // Collect x or y or all values when needed?
    // Probably but then reiterating over entire dataset again.

    xValues.set(
      xCategoryValue,
      (xValues.get(xCategoryValue) || []).concat(value),
    );

    yValues.set(
      yCategoryValue,
      (yValues.get(yCategoryValue) || []).concat(value),
    );
  });

  let minBound =
    normalizeAcross === 'heatmap'
      ? yAxisBounds[0] || overallMinValue
      : overallMinValue;
  // TODO this and legend always spanned from 0 to 1 in old version
  let maxBound =
    normalizeAcross === 'heatmap'
      ? yAxisBounds[1] || overallMaxValue
      : overallMaxValue;

  const xCategories = sortCategoryList(sortXAxis, 'x', xSums);
  const yCategories = sortCategoryList(sortYAxis, 'y', ySums);

  // TODO this is awful!?
  // key = x/ycategory or heatmap, (key = cell value, value = rank as percent)
  const percentRanks: Map<string, Map<number, number>> = new Map();
  if (normalized) {
    minBound = 0;
    maxBound = 100;
    if (normalizeAcross === 'heatmap') {
      percentRanks.set(
        'heatmap',
        getPercentRanks(data.map(datum => datum[metric.toString()] as number)),
      );
    } else if (normalizeAcross === 'x') {
      xCategories.forEach(xCategory => {
        // TODO the || stuff here is shady.
        // Confirm what xCategories values (DataRecordValue) look like
        percentRanks.set(
          xCategory as string,
          getPercentRanks(xValues.get(xCategory as string) || []),
        );
      });
    } else if (normalizeAcross === 'y') {
      yCategories.forEach(yCategory => {
        percentRanks.set(
          yCategory as string,
          getPercentRanks(yValues.get(yCategory as string) || []),
        );
      });
    }
  }

  const enrichedData = data.map(datum => {
    const value: number = datum[metric.toString()] as number; // TODO sketchy casts?
    const xCategoryValue: string = datum[xCategory] as string; // TODO sketchy cast?
    const yCategoryValue: string = datum[yCategory] as string;

    let percentRank: number;

    if (normalizeAcross === 'heatmap') {
      percentRank = percentRanks.get('heatmap')?.get(value) || 0;
    } else if (normalizeAcross === 'x') {
      percentRank = percentRanks.get(xCategoryValue)?.get(value) || 0;
    } else {
      percentRank = percentRanks.get(yCategoryValue)?.get(value) || 0;
    }

    let normalizedValue: number = value;
    let percent = 0;
    let maxDataValue: number;
    let minDataValue: number;

    // TODO || new Map is shady
    // What happens if we hit the Math.min(new Map().values()) case?
    if (normalized) {
      if (normalizeAcross === 'x') {
        minDataValue = Math.min(
          ...(percentRanks.get(xCategoryValue) || new Map()).values(),
        );
        maxDataValue = Math.max(
          ...(percentRanks.get(xCategoryValue) || new Map()).values(),
        );
      } else if (normalizeAcross === 'y') {
        minDataValue = Math.min(
          ...(percentRanks.get(yCategoryValue) || new Map()).values(),
        );
        maxDataValue = Math.max(
          ...(percentRanks.get(yCategoryValue) || new Map()).values(),
        );
      } else {
        // TODO 'heatmap' hard coded key is shady
        minDataValue = Math.min(
          ...(percentRanks.get('heatmap') || new Map()).values(),
        );
        maxDataValue = Math.max(
          ...(percentRanks.get('heatmap') || new Map()).values(),
        );
      }
    } else if (normalizeAcross === 'x') {
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

    // percent = (value / maxDataValue) * 100;
    // Old heatmap does it this way:
    percent = ((value - minDataValue) / (maxDataValue - minDataValue)) * 100;

    return {
      value,
      xCategoryValue,
      yCategoryValue,
      xSum: xSums.get(xCategoryValue),
      ySum: ySums.get(yCategoryValue),
      normalizedValue,
      percent,
      percentRank,
    };
  });

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
    // [xIndex, yIndex, value, normalized, percent, x_sum, y_sum, percentRank]
    return [
      xIndex,
      yIndex,
      datum.value,
      datum.normalizedValue,
      datum.percent,
      datum.xSum,
      datum.ySum,
      datum.percentRank,
    ];
  });

  const test = defaultGrid;

  // VisualMap isn't quite a legend, so this returns attributes (e.g., scroll)
  // that visualMap doesn't know about.
  const legendProperties = getLegendProps(
    legendType,
    legendOrientation,
    showLegend,
  );
  const padding = {
    left: leftMargin as number,
    bottom: bottomMargin as number,
  };

  const dimension = normalized
    ? NORMALIZED_RANK_VALUE_INDEX
    : yAxisBounds && normalizeAcross === 'heatmap'
    ? VALUE_INDEX
    : NORMALIZED_VALUE_INDEX;

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
          normalized,
        }),
    },
    grid: {
      ...defaultGrid,
      ...getChartPadding(showLegend, legendOrientation, legendMargin, padding),
      // left: leftMargin,
      // bottom: bottomMargin,
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
      // TODO shady cast? getLegendProps doesn't seem to ever return a list, but a list is an option
      orient: (legendProperties as LegendComponentOption).orient, // legendOrientation, // 'vertical',
      top: (legendProperties as LegendComponentOption).top,
      bottom: (legendProperties as LegendComponentOption).bottom,
      left: (legendProperties as LegendComponentOption).left,
      right: (legendProperties as LegendComponentOption).right,
      show: (legendProperties as LegendComponentOption).show,
      itemHeight: (legendProperties as LegendComponentOption).itemHeight,
      itemWidth: (legendProperties as LegendComponentOption).itemWidth,
      // top: '15%',
      // left: 'right',
      // show: showLegend,
      // itemWidth: 15,
      // itemHeight: 80,
      color: colors,
      // TODO vv VALUE_INDEX if yAxisBounds AND normalized across heatmap
      // or only normalized_value index if normalized on x/y
      dimension,
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
