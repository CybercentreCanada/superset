"use strict";

exports.__esModule = true;
exports.default = void 0;

var _core = require("@superset-ui/core");

var _cidrRegex = _interopRequireDefault(require("cidr-regex"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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
const QueryModeLabel = {
  [_core.QueryMode.aggregate]: (0, _core.t)('Aggregate'),
  [_core.QueryMode.raw]: (0, _core.t)('Raw Records')
};

function getQueryMode(controls) {
  var _controls$query_mode;

  const mode = controls == null ? void 0 : (_controls$query_mode = controls.query_mode) == null ? void 0 : _controls$query_mode.value;

  if (mode === _core.QueryMode.aggregate || mode === _core.QueryMode.raw) {
    return mode;
  } //const rawColumns: QueryFormColumn[] | undefined = controls?.all_columns?.value;
  //const hasRawColumns = rawColumns && rawColumns.length > 0;
  //return hasRawColumns ? QueryMode.raw : QueryMode.aggregate;


  return _core.QueryMode.raw;
}
/**
 * Visibility check
 */


function isQueryMode(mode) {
  return ({
    controls
  }) => getQueryMode(controls) === mode;
}

const isAggMode = isQueryMode(_core.QueryMode.aggregate);
const isRawMode = isQueryMode(_core.QueryMode.raw);

function getDataSourceSql(controls) {
  var _controls$datasource, _controls$datasource$;

  return controls == null ? void 0 : (_controls$datasource = controls.datasource) == null ? void 0 : (_controls$datasource$ = _controls$datasource.datasource) == null ? void 0 : _controls$datasource$.sql;
}

function datasourceAcceptsParam(paramType) {
  return ({
    controls
  }) => {
    var _getDataSourceSql;

    return (_getDataSourceSql = getDataSourceSql(controls)) == null ? void 0 : _getDataSourceSql.includes(paramType);
  };
}

const datasourceAcceptsIpParam = datasourceAcceptsParam('_ipv4_parameter_');
const queryMode = {
  type: 'RadioButtonControl',
  label: (0, _core.t)('Query Mode'),
  default: null,
  options: [{
    label: QueryModeLabel[_core.QueryMode.aggregate],
    value: _core.QueryMode.aggregate
  }, {
    label: QueryModeLabel[_core.QueryMode.raw],
    value: _core.QueryMode.raw
  }],
  mapStateToProps: ({
    controls
  }) => ({
    value: getQueryMode(controls)
  })
};

function isIP(v) {
  if (typeof v === 'string' && v.trim().length > 0) {
    //console.log(v.trim());
    // Test IP
    if (/^(?!0)(?!.*\.$)((1?\d?\d|25[0-5]|2[0-4]\d)(\.|$)){4}$/.test(v.trim())) {
      return true;
    } // Test CIDR


    return (0, _cidrRegex.default)({
      exact: true
    }).test(v.trim());
  }

  return false;
}

function validateIP(v) {
  if (Array.isArray(v)) {
    //console.log('is array');
    if (v.every(isIP)) {
      return false;
    }
  } else {
    if (isIP(v)) {
      return false;
    }
  }

  return 'is expected to be an ip address or cidr';
}

const config = {
  // For control input types, see: superset-frontend/src/explore/components/controls/index.js
  controlPanelSections: [{
    label: (0, _core.t)('Query'),
    expanded: true,
    controlSetRows: [[{
      name: '_ipv4_parameter_',
      config: {
        type: 'SelectControl',
        label: (0, _core.t)('IP Params'),
        default: [],
        multi: true,
        allowClear: true,
        freeForm: true,
        allowAll: true,
        tokenSeparators: [' ', ',', '\n', '\t', ';'],
        validators: [validateIP],
        renderTrigger: false,
        description: (0, _core.t)('The IPs or CIDRs to filter'),
        visibility: datasourceAcceptsIpParam
      }
    }], [{
      name: 'query_mode',
      config: queryMode
    }], [{
      name: 'metrics',
      override: {
        validators: [],
        visibility: isAggMode
      }
    }], [{
      name: 'groupby',
      override: {
        visibility: isAggMode
      }
    }], [{
      name: 'columns',
      override: {
        visibility: isRawMode
      }
    }], [{
      name: 'order_by_cols',
      config: {
        type: 'SelectControl',
        label: (0, _core.t)('Ordering'),
        description: (0, _core.t)('Order results by selected columns'),
        multi: true,
        default: [],
        mapStateToProps: ({
          datasource
        }) => ({
          choices: (datasource == null ? void 0 : datasource.order_by_choices) || []
        }),
        visibility: isRawMode
      }
    }], ['adhoc_filters'], [{
      name: 'row_limit',
      override: {
        default: 100
      }
    }]]
  }, {
    label: (0, _core.t)('Hello Controls!'),
    expanded: true,
    controlSetRows: [[{
      name: 'header_text',
      config: {
        type: 'TextControl',
        default: 'Hello, World!',
        renderTrigger: true,
        // ^ this makes it apply instantaneously, without triggering a "run query" button
        label: (0, _core.t)('Header Text'),
        description: (0, _core.t)('The text you want to see in the header')
      }
    }], [{
      name: 'bold_text',
      config: {
        type: 'CheckboxControl',
        label: (0, _core.t)('Bold Text'),
        renderTrigger: true,
        default: true,
        description: (0, _core.t)('A checkbox to make the ')
      }
    }], [{
      name: 'header_font_size',
      config: {
        type: 'SelectControl',
        label: (0, _core.t)('Font Size'),
        default: 'xl',
        choices: [// [value, label]
        ['xxs', 'xx-small'], ['xs', 'x-small'], ['s', 'small'], ['m', 'medium'], ['l', 'large'], ['xl', 'x-large'], ['xxl', 'xx-large']],
        renderTrigger: true,
        description: (0, _core.t)('The size of your header font')
      }
    }]]
  }],
  controlOverrides: {
    series: {
      validators: [_core.validateNonEmpty],
      clearable: false
    },
    row_limit: {
      default: 100
    }
  }
};
var _default = config;
exports.default = _default;