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
  DataRecord,
  getColumnLabel,
  QueryFormMetric,
  getMetricLabel,
  DataRecordValue,
  getSequentialSchemeRegistry,
  NumberFormatter,
  getNumberFormatter,
  NumberFormats,
  getTimeFormatter,
} from '@superset-ui/core';
import {
  EChartsCoreOption,
  HeatmapSeriesOption,
  LegendComponentOption,
} from 'echarts';
import { defaultGrid, defaultLegendPadding, defaultTooltip } from '../defaults';
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
  getColtypesMapping,
  getLegendProps,
} from '../utils/series';
import { LegendOrientation } from '../types';

const X_INDEX = 0;
const Y_INDEX = 1;
const VALUE_INDEX = 2;
const NORMALIZED_VALUE_INDEX = 3;
const PERCENT_INDEX = 4;
// const X_SUM_INDEX = 5;
// const Y_SUM_INDEX = 6;
const NORMALIZED_RANK_VALUE_INDEX = 7;

const DEFAULT_LEGEND_PADDING = {
  [LegendOrientation.Left]: 120,
  [LegendOrientation.Right]: 120,
  [LegendOrientation.Top]: 70,
  [LegendOrientation.Bottom]: 70,
};

export function formatTooltip({
  params,
  xCategory,
  yCategory,
  xCategories,
  yCategories,
  metricName,
  showPerc,
  numberFormatter,
  normalized,
}: {
  params: HeatmapSeriesCallbackDataParams; // TODO this doesn't seem to be HeatmapCallback
  xCategory: string;
  yCategory: string;
  xCategories: DataRecordValue[];
  yCategories: DataRecordValue[];
  metricName: string;
  showPerc: boolean;
  numberFormatter: NumberFormatter;
  normalized: boolean;
}): string {
  const { value } = params;

  const stats = [
    `<b>${xCategory}</b>: ${xCategories[value[X_INDEX]]}`,
    `<b>${yCategory}</b>: ${yCategories[value[Y_INDEX]]}`,
    `<b>${metricName}</b>: ${numberFormatter(value[VALUE_INDEX])}`,
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

/**
 * Returns a sorted list of category values.
 *
 * @param sortOption indicates the value on
 * which to sort and in which order (may have
 * a value of 'alpha_asc', 'alpha_desc', 'value_asc', or 'value_desc')
 * @param axis the axis to sort ('x' or 'y')
 * @param sums a map where the key represents the category value
 * (e.g., the value displayed on the heatmap axis for one row or column)
 * and the value is the sum of the values on that row or column
 * @returns a sorted list of category values
 */
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

/**
 * Returns the value of x normalized on a given range.
 *
 * @param a the minimum value of the range onto which x is normalized
 * @param b the maximum value of the range onto which x is normalized
 * @param x the value to be normalized
 * @param min_x the minimum possible value of x
 * @param max_x the maximum possible value of x
 * @returns the normalized value of x
 */
function getNormalizedValue(
  a: number,
  b: number,
  x: number,
  min_x: number,
  max_x: number,
): number {
  return (b - a) * ((x - min_x) / (max_x - min_x)) + a;
}

/**
 * Returns a map of ranked values, where the key is the value and
 * the value is the rank
 *
 * @remarks This is based on Pandas DataFrame.rank() method. When given
 * a list that contains n duplicate values, the rank of that number
 * is equal to the sum of the ranks of the n elements divided by the
 * length of the list divided by the n.
 *
 * @param values a list of the values in a row, column, or the heatmap as a whole
 * @returns a map of ranked values
 */
function getPercentRanks(values: number[]): Map<number, number> {
  const orderedValues = [...values].sort((value1, value2) => value1 - value2);
  const valueCountMap: Map<number, number> = new Map();
  orderedValues.forEach(value => {
    valueCountMap.set(value, (valueCountMap.get(value) || 0) + 1);
  });

  const percentRanks: Map<number, number> = new Map();

  if (orderedValues.length > 0) {
    let currentValue = orderedValues[0];
    let rankSum = 0;
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

    // Get the last value // TODO refactor this after tests are in place
    percentRanks.set(
      currentValue,
      (rankSum /
        orderedValues.length /
        (valueCountMap.get(currentValue) || 1)) *
        100,
    );
  }

  return percentRanks;
}

export default function transformProps(
  chartProps: EchartsHeatmapChartProps,
): HeatmapChartTransformedProps {
  const { width, height, formData, queriesData, hooks, filterState } =
    chartProps;
  const {
    allColumnsX: xCategory,
    allColumnsY: yCategory,
    bottomMargin,
    dateFormat,
    emitFilter,
    groupby,
    leftMargin,
    legendMargin,
    legendOrientation,
    legendType,
    linearColorScheme,
    metric = '',
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
    xAxisRotation,
  }: EchartsHeatmapFormData = { ...DEFAULT_FORM_DATA, ...formData };
  const data = (queriesData[0]?.data || []) as DataRecord[];
  const groupbyLabels = groupby.map(getColumnLabel);
  const numberFormatter = getNumberFormatter(numberFormat);
  const scheme_colors = getSequentialSchemeRegistry()
    ?.get(linearColorScheme)
    ?.getColors();
  const colors = scheme_colors ? [...scheme_colors].reverse() : [];

  const metricName = getMetricLabel(metric);

  const columnsLabelMap = new Map<string, string[]>();

  const { setDataMask = () => {}, onContextMenu } = hooks;

  // These maps hold the summations of the values found in the
  // heatmap's rows and columns, where the key is the x or y
  // category value as shown on the axes
  const xSums = new Map<string, number>();
  const ySums = new Map<string, number>();

  // These maps hold the min or max values found in the heatmap's
  // rows and columns, where the key is the x or y category value
  // as shown on the axes.
  const xMins = new Map<string, number>();
  const xMaxes = new Map<string, number>();
  const yMins = new Map<string, number>();
  const yMaxes = new Map<string, number>();

  // These maps hold the values found in the heatmap's rows and
  // columns, where the key is the x or y category value as shown
  // on the axes. This is used for getting ranks when the heatmap
  // is normalized.
  const xValues = new Map<string, number[]>();
  const yValues = new Map<string, number[]>();

  const overallMaxValue = Math.max(
    ...data.map(datum => datum[metricName] as number),
  );
  const overallMinValue = Math.min(
    ...data.map(datum => datum[metricName] as number),
  );

  const coltypeMapping = getColtypesMapping(queriesData[0]);

  // get a list of distinct values, ordered
  // then below, for each entry, give it a rank = average position in ordered list?
  if (!Number.isNaN(overallMaxValue)) {
    data.forEach(datum => {
      const value: number = datum[metricName] as number; // TODO sketchy casts?
      const xCategoryValue: string = extractGroupbyLabel({
        datum,
        groupby: xCategory,
        coltypeMapping,
        timeFormatter: getTimeFormatter(dateFormat),
        numberFormatter,
      });
      const yCategoryValue: string = extractGroupbyLabel({
        datum,
        groupby: yCategory,
        coltypeMapping,
        timeFormatter: getTimeFormatter(dateFormat),
        numberFormatter,
      });

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
  }

  // minBound = overallMinValue unless one of Min/Max bound is set
  // (in which case it's the set minV bound, or 0 by default) or
  // if normalized is checked, in which case 0 is lower default bound
  let minBound = Number.isNaN(overallMinValue) ? 0 : overallMinValue;
  let maxBound = Number.isNaN(overallMaxValue) ? 0 : overallMaxValue;

  if (normalizeAcross === 'heatmap') {
    if (yAxisBounds[0] != null) {
      minBound = yAxisBounds[0];
    } else if (normalized || yAxisBounds[1] != null) {
      minBound = 0;
    }

    if (yAxisBounds[1] != null) {
      maxBound = yAxisBounds[1];
    } else if (normalized || yAxisBounds[0] != null) {
      maxBound = 100;
    }
  }

  const xCategories = sortCategoryList(sortXAxis, 'x', xSums);
  const yCategories = sortCategoryList(sortYAxis, 'y', ySums);

  // TODO this is awful!?
  // key = x/ycategory or heatmap, (key = cell value, value = rank as percent)
  const percentRanks: Map<string, Map<number, number>> = new Map();
  if (normalized) {
    if (normalizeAcross === 'heatmap') {
      percentRanks.set(
        'heatmap',
        getPercentRanks(data.map(datum => datum[metricName] as number)),
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
    const value: number = datum[metricName] as number; // TODO sketchy casts?
    // TODO this code v is duplicated
    const xCategoryValue: string = extractGroupbyLabel({
      datum,
      groupby: xCategory,
      coltypeMapping,
      timeFormatter: getTimeFormatter(dateFormat),
      numberFormatter,
    });
    const yCategoryValue: string = extractGroupbyLabel({
      datum,
      groupby: yCategory,
      coltypeMapping,
      timeFormatter: getTimeFormatter(dateFormat),
      numberFormatter,
    });

    let percentRank: number;
    let normalizedValue: number = value;
    let maxDataValue: number;
    let minDataValue: number;

    if (normalizeAcross === 'heatmap') {
      percentRank = percentRanks.get('heatmap')?.get(value) || 0;
      maxDataValue = overallMaxValue;
      minDataValue = overallMinValue;
    } else if (normalizeAcross === 'x') {
      percentRank = percentRanks.get(xCategoryValue)?.get(value) || 0;
      maxDataValue = xMaxes.get(xCategoryValue) || overallMaxValue;
      minDataValue = xMins.get(xCategoryValue) || overallMinValue;
    } else {
      // normalizeAcross == 'y'
      percentRank = percentRanks.get(yCategoryValue)?.get(value) || 0;
      maxDataValue = yMaxes.get(yCategoryValue) || overallMaxValue;
      minDataValue = yMins.get(yCategoryValue) || overallMinValue;
    }

    normalizedValue = getNormalizedValue(
      minBound,
      maxBound,
      value,
      minDataValue,
      maxDataValue,
    );

    // Old heatmap calculates percent this way.
    const percent =
      ((value - minDataValue) / (maxDataValue - minDataValue)) * 100;

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

    if (!Number.isNaN(overallMaxValue)) {
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
    }
    return [xIndex, yIndex, null, null, null, null, null, null];
  });

  // TODO shady cast? getLegendProps doesn't seem to ever return a list, but a list is an option
  // VisualMap isn't quite a legend, so getLegendProps returns attributes (e.g., scroll)
  // that visualMap doesn't know about if we don't explicitly destructure.
  const {
    orient,
    top: legendTop,
    bottom: legendBottom,
    right: legendRight,
    left: legendLeft,
    itemHeight: legendItemHeight,
    itemWidth: legendItemWidth,
    show: legendShow,
  } = getLegendProps(
    legendType,
    legendOrientation,
    showLegend,
  ) as LegendComponentOption;

  const padding = {
    left: (leftMargin === 'auto' ? 0 : leftMargin) as number,
    bottom: (bottomMargin === 'auto' ? 20 : bottomMargin) as number,
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
          xCategory,
          yCategory,
          xCategories,
          yCategories,
          metricName,
          showPerc,
          numberFormatter,
          normalized,
        }),
    },
    grid: {
      ...defaultGrid,
      ...getChartPadding(
        showLegend,
        legendOrientation,
        legendMargin || DEFAULT_LEGEND_PADDING[legendOrientation],
        padding,
      ),
    },
    xAxis: {
      type: 'category',
      data: xCategories,
      axisLabel: {
        interval: xscaleInterval - 1,
        rotate: xAxisRotation,
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
      min: minBound,
      max: maxBound,
      calculable: true,
      orient,
      top: legendTop,
      bottom: legendBottom,
      left: legendLeft,
      right: legendRight,
      show: legendShow,
      itemHeight: legendItemHeight,
      itemWidth: legendItemWidth,
      color: colors,
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
    onContextMenu,
  };
}
