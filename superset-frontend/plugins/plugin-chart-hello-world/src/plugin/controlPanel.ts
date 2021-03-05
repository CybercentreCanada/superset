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
  t,
  validateNonEmpty,
  QueryMode,
} from '@superset-ui/core';
import {
  ControlConfig,
  ControlStateMapping,
  ControlPanelConfig,
  ControlPanelsContainerProps,
} from '@superset-ui/chart-controls';

import cidrRegex from 'cidr-regex';




const QueryModeLabel = {
  [QueryMode.aggregate]: t('Aggregate'),
  [QueryMode.raw]: t('Raw Records'),
};

function getQueryMode(controls: ControlStateMapping): QueryMode {
  const mode = controls?.query_mode?.value;
  if (mode === QueryMode.aggregate || mode === QueryMode.raw) {
    return mode as QueryMode;
  }
  //const rawColumns: QueryFormColumn[] | undefined = controls?.all_columns?.value;
  //const hasRawColumns = rawColumns && rawColumns.length > 0;
  //return hasRawColumns ? QueryMode.raw : QueryMode.aggregate;
  return QueryMode.raw;
}

/**
 * Visibility check
 */
function isQueryMode(mode: QueryMode) {
  return ({ controls }: ControlPanelsContainerProps) => getQueryMode(controls) === mode;
}

const isAggMode = isQueryMode(QueryMode.aggregate);
const isRawMode = isQueryMode(QueryMode.raw);

function getDataSourceSql(controls: ControlStateMapping): QueryMode {
  return controls?.datasource?.datasource?.sql;
}

function datasourceAcceptsParam(paramType: string) {
  return ({ controls }: ControlPanelsContainerProps) => getDataSourceSql(controls)?.includes(paramType);
}

const datasourceAcceptsIpParam = datasourceAcceptsParam('_ipv4_parameter_');


const queryMode: ControlConfig<'RadioButtonControl'> = {
  type: 'RadioButtonControl',
  label: t('Query Mode'),
  default: null,
  options: [
    {
      label: QueryModeLabel[QueryMode.aggregate],
      value: QueryMode.aggregate,
    },
    {
      label: QueryModeLabel[QueryMode.raw],
      value: QueryMode.raw,
    },
  ],
  mapStateToProps: ({ controls }) => ({ value: getQueryMode(controls) }),
};







function isIP(v: unknown) {
  if (typeof v === 'string' && v.trim().length > 0) {
    //console.log(v.trim());
    // Test IP
    if (/^(?!0)(?!.*\.$)((1?\d?\d|25[0-5]|2[0-4]\d)(\.|$)){4}$/.test(v.trim())) {
      return true;
    }
    // Test CIDR
    return cidrRegex({ exact: true }).test(v.trim());
  }
  return false;
}

function validateIP(v: unknown) {

  if (Array.isArray(v)) {
    //console.log('is array');
    if (v.every(isIP)) {
      return false;
    }
  }
  else {
    if (isIP(v)) {
      return false;
    }
  }

  return ('is expected to be an ip address or cidr');
}



const config: ControlPanelConfig = {


  // For control input types, see: superset-frontend/src/explore/components/controls/index.js
  controlPanelSections: [
    {
      label: t('Query'),
      expanded: true,
      controlSetRows: [
        [
          {
            name: '_ipv4_parameter_',
            config: {
              type: 'SelectControl',
              label: t('IP Params'),
              default: [],
              multi: true,
              allowClear: true,
              freeForm: true,
              allowAll: true,
              tokenSeparators: [' ', ',', '\n', '\t', ';'],
              validators: [validateIP],
              renderTrigger: false,
              description: t('The IPs or CIDRs to filter'),
              visibility: datasourceAcceptsIpParam,
            }

          },

        ],

        [
          {
            name: 'query_mode',
            config: queryMode,
          },
        ],

        [
          {
            name: 'metrics',
            override: {
              validators: [],
              visibility: isAggMode,
            },
          },
        ],

        [
          {
            name: 'groupby',
            override: {
              visibility: isAggMode,
            },
          },
        ],

        [
          {
            name: 'columns',
            override: {
              visibility: isRawMode,
            },
          },
        ],

        [
          {
            name: 'order_by_cols',
            config: {
              type: 'SelectControl',
              label: t('Ordering'),
              description: t('Order results by selected columns'),
              multi: true,
              default: [],
              mapStateToProps: ({ datasource }) => ({
                choices: datasource?.order_by_choices || [],
              }),
              visibility: isRawMode,
            },
          },
        ],

        ['adhoc_filters'],
        [
          {
            name: 'row_limit',
            override: {
              default: 100,
            },
          },

        ],
      ],

    },
    {
      label: t('Hello Controls!'),
      expanded: true,
      controlSetRows: [
        [
          {
            name: 'header_text',
            config: {
              type: 'TextControl',
              default: 'Hello, World!',
              renderTrigger: true,
              // ^ this makes it apply instantaneously, without triggering a "run query" button
              label: t('Header Text'),
              description: t('The text you want to see in the header'),
            },
          },
        ],
        [
          {
            name: 'bold_text',
            config: {
              type: 'CheckboxControl',
              label: t('Bold Text'),
              renderTrigger: true,
              default: true,
              description: t('A checkbox to make the '),
            },
          },
        ],
        [
          {
            name: 'header_font_size',
            config: {
              type: 'SelectControl',
              label: t('Font Size'),
              default: 'xl',
              choices: [
                // [value, label]
                ['xxs', 'xx-small'],
                ['xs', 'x-small'],
                ['s', 'small'],
                ['m', 'medium'],
                ['l', 'large'],
                ['xl', 'x-large'],
                ['xxl', 'xx-large'],
              ],
              renderTrigger: true,
              description: t('The size of your header font'),
            },
          },
        ],
      ],
    },
  ],

  controlOverrides: {
    series: {
      validators: [validateNonEmpty],
      clearable: false,
    },
    row_limit: {
      default: 100,
    },
  },
};

export default config;
