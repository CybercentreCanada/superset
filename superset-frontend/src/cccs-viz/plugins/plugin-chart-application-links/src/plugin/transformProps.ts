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
  const { formData, queriesData } = chartProps;
  const data = queriesData[0].data as TimeseriesDataRecord[];

  let appVal = '';
  let appType = 'IP';

  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < formData?.extraFormData?.filters?.length; i++) {
    const filter = formData.extraFormData.filters[0];
    if (filter.col === 'ip_string') {
      appType = 'IP';
      appVal = filter.val[0];
      break;
    } else if (filter.col === 'user_id') {
      appType = 'USER_ID';
      appVal = filter.val[0];
      break;
    }
  }

  const alfred_link = {
    app_name: 'Alfred',
    url: `https://alfred-tst.u.chimera.azure.cyber.gc.ca/?expression=MATCH%20(ip%3AIP_ADDRESS)%20WHERE%20ip.value%20IN%20%5B%22${appVal}%22%5D%20RETURN%20ip.value%2C%20ip.maliciousness%2C%20ip.creation_date%2C%20ip.created_by%2C%20ip.uri%2C%20ip.report_uri`,
    info_type: appType,
    thumbnail_src:
      'data:image/png;base64,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',
    api_url: '',
    value: `alfred/${appVal}`,
  };

  const assemblyline_link = {
    app_name: 'Assemblyline',
    url: `https://alfred-tst.u.chimera.azure.cyber.gc.ca/?expression=MATCH%20(ip%3AIP_ADDRESS)%20WHERE%20ip.value%20IN%20%5B%22${appVal}%22%5D%20RETURN%20ip.value%2C%20ip.maliciousness%2C%20ip.creation_date%2C%20ip.created_by%2C%20ip.uri%2C%20ip.report_uri`,
    info_type: appType,
    thumbnail_src:
      'data:image/png;base64,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',
    api_url: '',
    value: `assemblyline/${appVal}`,
  };

  const applinks = [alfred_link];

  if (appType === 'IP') {
    // Assembly Line can only be used for IP dashboard.
    applinks.push(assemblyline_link);
  }

  return {
    data,
    applinks,
  };
}
