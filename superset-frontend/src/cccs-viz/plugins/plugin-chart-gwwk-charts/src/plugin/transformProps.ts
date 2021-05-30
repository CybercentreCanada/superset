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
import { ChartProps, TimeseriesDataRecord } from '@superset-ui/core';
import { isSimpleAdhocFilter, isSetAdhocFilter, SetAdhocFilter } from '@superset-ui/core';
import { Mode } from './gwwkUtils';

export default function transformProps(chartProps: ChartProps) {
  const { width, height, formData, queriesData } = chartProps;
  const { mode, boldText, headerFontSize, headerText } = formData;
  let data = queriesData[0].data as TimeseriesDataRecord[];
  console.log('formData via TransformProps.ts', formData);

  let selected_values = []
  let selected_filter_name = ''

  if (formData.extraFormData?.filters?.length > 0) {
    const filter = formData.extraFormData.filters[0]
    selected_values = Array.isArray(filter.val) ? filter.val : [filter.val]
    selected_filter_name = filter.col
  }
  else if (formData.adhocFilters?.length > 0) {
    const filter = formData.adhocFilters[0]
    if (isSimpleAdhocFilter(filter) && isSetAdhocFilter(filter)) {
      const f = (filter as SetAdhocFilter)
      selected_values = Array.isArray(f.comparator) ? f.comparator : [f.comparator]
      selected_filter_name = f.subject
    }
  }

  if (mode == Mode.DASHBOARDS) {
    data = data.filter(row => {
      if (row.json_metadata) {
        const jsonString = row.json_metadata
        if (typeof jsonString == 'string') {
          const metadata = JSON.parse(jsonString)
          if (metadata.native_filter_configuration) {
            for (let index = 0; index < metadata.native_filter_configuration.length; index++) {
              const nativeFilter = metadata.native_filter_configuration[index];
              if (nativeFilter.name == selected_filter_name) {
                return true
              }
            }
          }
        }
      }
      return false
    });
  }

  return {
    width,
    height,
    data,
    // and now your control data, manipulated as needed, and passed through as props!
    selected_values,
    mode,
    boldText,
    headerFontSize,
    headerText
  };
}
