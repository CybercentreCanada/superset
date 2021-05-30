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
import { styled } from '@superset-ui/core';
import { GwwkChartsProps } from './types';
import { Mode } from './plugin/gwwkUtils'
import { getURIDirectory } from 'src/explore/exploreUtils';
import { safeStringify } from 'src/utils/safeStringify';
/* eslint camelcase: 0 */
const URI = require('urijs');

// The following Styles component is a <div> element, which has been styled using Emotion
// For docs, visit https://emotion.sh/docs/styled

// Theming variables are provided for your use via a ThemeProvider
// imported from @superset-ui/core. For variables available, please visit
// https://github.com/apache-superset/superset-ui/blob/master/packages/superset-ui-core/src/style/index.ts


const Container = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: left;
  justify-content: left;
  overflow-y: auto;
`;

const Table = styled.table`
  border-collapse: collapse;
  height: 90%;
  width: 100%;
  overflow-y: auto;
`;

const Td = styled.td`
  padding: 5px;
  text-align: left;
  border-bottom: 1px solid #ddd;
  white-space: nowrap;
  text-overflow: ellipsis; 
  overflow: hidden; 
  max-width: 1px;
`;

const Tr = styled.tr`
  &:hover {
    background: #f5f5f5;
  }`;

/**
 * ******************* WHAT YOU CAN BUILD HERE *******************
 *  In essence, a chart is given a few key ingredients to work with:
 *  * Data: provided via `props.data`
 *  * A DOM element
 *  * FormData (your controls!) provided as props by transformProps.ts
 */
function renderDashboards(props: GwwkChartsProps) {
  const { selected_values, data, height, width } = props;
  return (
    <Container style={{ height: height, width: width }}>
      <h3>Dashboards {selected_values}</h3>
      <table>
        <tbody>
          {data.map((row, index) => {
            return (
              <tr>
                <td>preselected_filters not currently working for native filters</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </Container>
  )
}


function renderDatasets(props: GwwkChartsProps) {
  const { selected_values, data, height, width } = props;

  return (
    <Container style={{ height: height, width: width }}>
      <h3>Datasets for {selected_values.join(', ')}</h3>
      <Table>
        <tbody>
          {data.map((row, index) => {

            let adhoc_filters = [
              {
                clause: 'WHERE',
                comparator: selected_values,
                expressionType: 'SIMPLE',
                operator: 'IN',
                subject: row.filter_name,
              },
            ]

            const columns = JSON.parse(row.dataset_column_names as string)

            const formData = {
              datasource: `${row.id}__table`,
              columns: columns,
              adhoc_filters: adhoc_filters,
              metrics: [],
              groupby: [],
              time_range: 'No filter',
              viz_type: 'cccs_grid',
              query_mode: "raw",
            };

            const uri = new URI('/');
            const directory = getURIDirectory('base');
            const search = uri.search(true);

            // Building the querystring (search) part of the URI
            search.form_data = safeStringify(formData);
            const url = uri.search(search).directory(directory).toString();

            return (
              <Tr>
                <Td><a href={url}>
                  <span style={{ fontWeight: 'bold' }}>
                    {row.name}
                  </span></a>
                </Td>
                <Td>
                  <span style={{ fontWeight: 'normal' }}>
                    by {row.filter_name}
                  </span>
                </Td>
              </Tr>
            )
          })}
        </tbody>
      </Table>
    </Container>
  )
}

function renderCharts(props: GwwkChartsProps) {
  const { selected_values, data, height, width } = props;
  return (
    <Container style={{ height: height, width: width }}>
      <h3>Charts for {selected_values.join(', ')}</h3>
      <Table>
        <tbody>
          {data.map((row, index) => {

            let adhoc_filters = [
              {
                clause: 'WHERE',
                comparator: selected_values,
                expressionType: 'SIMPLE',
                operator: 'IN',
                subject: row.filter_name,
              },
            ]

            const formData = {
              slice_id: row.id,
              adhoc_filters: adhoc_filters,
              time_range: 'No filter',
            };

            const uri = new URI('/');
            const directory = getURIDirectory('base');
            const search = uri.search(true);

            // Building the querystring (search) part of the URI
            search.form_data = safeStringify(formData);
            const url = uri.search(search).directory(directory).toString();

            return (
              <Tr>
                <Td><a href={url}>
                  <span style={{ fontWeight: 'bold' }}>
                    {row.name}
                  </span></a>
                </Td>
                <Td>
                  <span style={{ fontWeight: 'normal' }}>
                    by {row.filter_name}
                  </span>
                </Td>
              </Tr>
            )
          })}
        </tbody>
      </Table>
    </Container>
  )
}

export default function GwwkCharts(props: GwwkChartsProps) {
  // height and width are the height and width of the DOM element as it exists in the dashboard.
  // There is also a `data` prop, which is, of course, your DATA 🎉
  const { mode } = props;

  switch (mode) {
    case Mode.CHARTS:
      return renderCharts(props)
      break;
    case Mode.DATASETS:
      return renderDatasets(props)
      break;
    case Mode.DASHBOARDS:
    default:
      return renderDashboards(props)
      break;
  }

}
