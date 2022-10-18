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
import { ChartProps, PlainObject, } from '@superset-ui/core';


const extractFiltersFromFormData = (formData: PlainObject): ({columnName: string, value: string | number | boolean | (string | number | boolean)[] })[] => {

  const filters = [...(formData?.adhocFilters || []),  ...(formData?.extraFormData?.adhocFilters || []), ...(formData?.extraFormData?.filters || [])]
  
  const simpleAdhocFilters = filters.reduce(
    (acc, filter) => {
      
      if ( ("subject" in filter) && ("comparator" in filter)  ) {
        acc.push( {columnName: filter.subject, value: filter.comparator} )
      }
      else if ( ("col" in filter) && ("val" in filter)  ) {
        acc.push( {columnName: filter.col.toString(), value: filter.val} )
      }
      return acc
    }, <({columnName: string, value: string | number | boolean | (string | number | boolean)[]})[]> []
  )

  return simpleAdhocFilters
}


export default function transformProps(chartProps: ChartProps) {
  /**
   * This function is called after a successful response has been
   * received from the chart data endpoint, and is used to transform
   * the incoming data prior to being sent to the Visualization.
   *
   * The transformProps function is also quite useful to return
   * additional/modified props to your data viz component. The formData
   * can also be accessed from your IframeDemo.tsx file, but
   * doing supplying custom props here is often handy for integrating third
   * party libraries that rely on specific props.
   *
   * A description of properties in `chartProps`:
   * - `height`, `width`: the height/width of the DOM element in which
   *   the chart is located
   * - `formData`: the chart data request payload that was sent to the
   *   backend.
   * - `queriesData`: the chart data response payload that was received
   *   from the backend. Some notable properties of `queriesData`:
   *   - `data`: an array with data, each row with an object mapping
   *     the column/alias to its value. Example:
   *     `[{ col1: 'abc', metric1: 10 }, { col1: 'xyz', metric1: 20 }]`
   *   - `rowcount`: the number of rows in `data`
   *   - `query`: the query that was issued.
   *
   * Please note: the transformProps function gets cached when the
   * application loads. When making changes to the `transformProps`
   * function during development with hot reloading, changes won't
   * be seen until restarting the development server.
   */
  const formData = chartProps.formData;

  const { url, parameterColumnName, parameterName } = formData

  const allFilters = extractFiltersFromFormData(formData);
  
  const url_parameter_values = allFilters.filter( e => {
    return e.columnName == parameterColumnName
  });
  
  const url_parameter_value = url_parameter_values.length === 1 ? url_parameter_values[0].value : 'invalid'

  return {
    url_parameter_value,
    parameter_name: parameterName,
    url,
  };
}
