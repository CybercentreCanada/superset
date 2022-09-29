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
  EchartsHeatmapFormData,
  HeatmapChartTransformedProps,
  EchartsHeatmapChartProps,
} from './types';
import { DataRecord, getColumnLabel } from '@superset-ui/core';
import { EChartsCoreOption } from 'echarts';

export default function transformProps(
  chartProps: EchartsHeatmapChartProps,
): HeatmapChartTransformedProps {
  const { width, height, formData, queriesData, hooks, filterState, theme } =
    chartProps;

  const { emitFilter, groupby } = formData;

  const echartOptions: EChartsCoreOption = {
    tooltip: {
      appendToBody: true,
      trigger: 'item',
    },
  };

  const { setDataMask = () => {}, onContextMenu } = hooks;

  const groupbyLabels = groupby.map(getColumnLabel);
  const data = (queriesData[0]?.data || []) as DataRecord[];
  const columnsLabelMap = new Map<string, string[]>();
  data.map((data_point, index) => {
    const name = groupbyLabels
      .map(column => `${column}: ${data_point[column]}`)
      .join(', ');
    columnsLabelMap.set(
      name,
      groupbyLabels.map(col => data_point[col] as string),
    );
  });

  return {
    width,
    height,
    formData,
    echartOptions,
    setDataMask,
    emitFilter,
    labelMap: Object.fromEntries(columnsLabelMap),
    groupby,
    selectedValues: filterState.selectedValues || [],
    onContextMenu,
  };
}
