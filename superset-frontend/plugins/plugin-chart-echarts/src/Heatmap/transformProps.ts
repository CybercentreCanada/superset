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
}: {
  params: HeatmapSeriesCallbackDataParams;
  xCategory: string;
  yCategory: string;
  xCategories: DataRecordValue[];
  yCategories: DataRecordValue[];
  metric: string | object;
  showPerc: boolean;
}): string {
  const { value } = params;

  // TODO could/should store x/y category in value?
  const stats = [
    `<b>${xCategory}</b>: ${xCategories[value[X_INDEX]]}`,
    `<b>${yCategory}</b>: ${yCategories[value[Y_INDEX]]}`,
    `<b>${metric}</b>: ${value[VALUE_INDEX]}`,
    showPerc ? `<b>%</b>: ${value[PERCENT_INDEX].toFixed(2)}%` : '',
  ];

  return [...stats].join('<br/>');
}

function sortCategoryList(
  categories: DataRecordValue[],
  sortOption: string,
  axis: string,
): DataRecordValue[] {
  let sortedCategories = categories;

  if (
    (sortOption === 'alpha_asc' && axis === 'x') ||
    (sortOption === 'alpha_desc' && axis === 'y')
  ) {
    sortedCategories = [...categories].sort();
  }

  if (
    (sortOption === 'alpha_desc' && axis === 'x') ||
    (sortOption === 'alpha_asc' && axis === 'y')
  ) {
    sortedCategories = [...categories].sort().reverse();
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

function getNormalizedData(
  data: DataRecordValue[][],
  xCategoryLength: number,
  yCategoryLength: number,
  normalizedCategoryLength: number,
  dimensionIndex = -1,
  valueIndex = VALUE_INDEX,
  minBound: number,
  maxBound: number,
): DataRecordValue[][] {
  // data = [[x, y, value], ... ]

  let normalizedData = data; // TODO COPY?? start with empty?

  const x_sums: number[] = new Array(xCategoryLength).fill(0);
  const y_sums: number[] = new Array(yCategoryLength).fill(0);

  // TODO optimize
  data.forEach(value => {
    x_sums[value[X_INDEX] as number] =
      x_sums[value[X_INDEX] as number] + (value[valueIndex] as number);

    y_sums[value[Y_INDEX] as number] =
      y_sums[value[Y_INDEX] as number] + (value[valueIndex] as number);
  });

  if (dimensionIndex >= 0) {
    const mins: number[] = new Array(normalizedCategoryLength).fill(
      Number.MIN_SAFE_INTEGER,
    );
    const maxes: number[] = new Array(normalizedCategoryLength).fill(
      Number.MAX_SAFE_INTEGER,
    );

    // TODO error handling for if category length is wrong, or if a value is undefined?
    data.forEach(value => {
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
      const percent: number =
        ((value[valueIndex] as number) /
          maxes[value[dimensionIndex] as number]) *
        100;
      return [
        ...value,
        normalized_value,
        percent,
        x_sums[value[X_INDEX] as number],
        y_sums[value[Y_INDEX] as number],
      ];
    });
  } else {
    const maxDataValue = Math.max(
      ...data.map(item => Number(item[valueIndex])),
    );
    const minDataValue = Math.min(
      ...data.map(item => Number(item[valueIndex])),
    );
    normalizedData = data.map(value => {
      const normalized_value: number = getNormalizedValue(
        minBound,
        maxBound,
        value[valueIndex] as number,
        minDataValue,
        maxDataValue,
      );
      const percent: number =
        ((value[valueIndex] as number) / maxDataValue) * 100;
      return [
        ...value,
        normalized_value,
        percent,
        x_sums[value[X_INDEX] as number],
        y_sums[value[Y_INDEX] as number],
      ];
    });
    // normalizedData = data.map(value => [...value, value[valueIndex]]);
  }

  return normalizedData;
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

  // const X_CATEGORY_INDEX = 5;
  // const Y_CATEGORY_INDEX = 6;

  const xCategories = sortCategoryList(
    [...new Set(data.map(item => item[allColumnsX]))],
    sortXAxis,
    'x',
  );
  const yCategories = sortCategoryList(
    [...new Set(data.map(item => item[allColumnsY]))],
    sortYAxis,
    'y',
  );

  // data = [{count: 40, genre: "Misc", platform: "DS"} ...]
  // ==>
  // data = [{x_index, y_index, value, normalized_value} ...]
  // sorted by category at x_index/y_index or value
  const my_data2 = data.map(datum => {
    const xIndex = xCategories.findIndex(
      category => category === datum[allColumnsX],
    );

    const yIndex = yCategories.findIndex(
      category => category === datum[allColumnsY],
    );

    return [xIndex, yIndex, datum[metric.toString()]];
  });

  if (sortXAxis === 'value_asc' || sortYAxis === 'value_asc') {
    my_data2.sort((a, b) => {
      let ret = 0; // TODO handle alleged possible undefinted values better
      if (a[VALUE_INDEX] && b[VALUE_INDEX]) {
        if (b[VALUE_INDEX] > a[VALUE_INDEX]) {
          ret = -1;
        } else {
          ret = 1;
        }
      }
      return ret; // TODO handle alleged possible undefinted values better
    });
  }

  if (sortXAxis === 'value_desc' || sortYAxis === 'value_desc') {
    my_data2.sort((a, b) => {
      let ret = 0; // TODO handle alleged possible undefinted values better
      if (a[VALUE_INDEX] && b[VALUE_INDEX]) {
        if (a[VALUE_INDEX] > b[VALUE_INDEX]) {
          ret = -1;
        } else {
          ret = 1;
        }
      }
      return ret; // TODO handle alleged possible undefinted values better
    });
  }

  // TODO sketchyy number cast? Is 0 an okay default?
  // Could have all other negative numbers.
  // Is it possible an item won't have a count?
  const maxDataValue = Math.max(...data.map(item => Number(item.count)), 0);
  const minDataValue = Math.min(...data.map(item => Number(item.count)), 0);

  let dimensionIndex = -1;
  if (normalizeAcross === 'x') {
    dimensionIndex = X_INDEX;
  } else if (normalizeAcross === 'y') {
    dimensionIndex = Y_INDEX;
  }

  const minBound =
    normalizeAcross === 'heatmap'
      ? yAxisBounds[0] || minDataValue
      : minDataValue;
  // TODO this and legend always spanned from 0 to 1 in old version
  const maxBound =
    normalizeAcross === 'heatmap'
      ? yAxisBounds[1] || maxDataValue
      : maxDataValue;

  const normalizedData = getNormalizedData(
    my_data2,
    xCategories.length,
    yCategories.length,
    normalizeAcross === 'x' ? xCategories.length : yCategories.length,
    dimensionIndex,
    VALUE_INDEX,
    minBound,
    maxBound,
  );

  normalizedData.sort((a, b) => {
    let ret = 0;
    // TODO check for/handle nulls better
    if (a[X_SUM_INDEX] && b[X_SUM_INDEX]) {
      if (sortXAxis === 'value_asc') {
        ret = a[X_SUM_INDEX] > b[X_SUM_INDEX] ? -1 : 1;
      } else if (sortXAxis === 'value_desc') {
        ret = b[X_SUM_INDEX] > a[X_SUM_INDEX] ? -1 : 1;
      }
    }
    if (a[Y_SUM_INDEX] && b[Y_SUM_INDEX]) {
      if (sortYAxis === 'value_asc') {
        ret = a[Y_SUM_INDEX] > b[Y_SUM_INDEX] ? -1 : 1;
      } else if (sortYAxis === 'value_desc') {
        ret = b[Y_SUM_INDEX] > a[Y_SUM_INDEX] ? -1 : 1;
      }
    }

    return ret;
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

function getCategories(
  allColumnsX: string,
  allColumnsY: string,
  data: DataRecordValue[][],
  sortXAxis: string,
  sortYAxis: string,
) {
  // data = [{count: 40, genre: "Misc", platform: "DS"} ...]
  const xCategories = [...new Set(data.map(item => item[allColumnsX]))];
  const yCategories = [...new Set(data.map(item => item[allColumnsY]))];

  if (sortXAxis === 'alpha_asc') {
    xCategories.sort();
  }
}
