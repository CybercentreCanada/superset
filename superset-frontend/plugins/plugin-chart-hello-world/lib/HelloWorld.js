"use strict";

exports.__esModule = true;
exports.default = void 0;

var _react = _interopRequireWildcard(require("react"));

var _Ipv4ValueRenderer = _interopRequireDefault(require("./Ipv4ValueRenderer"));

var _Ipv6ValueRenderer = _interopRequireDefault(require("./Ipv6ValueRenderer"));

var _DomainValueRenderer = _interopRequireDefault(require("./DomainValueRenderer"));

var _CustomTooltip = _interopRequireDefault(require("./CustomTooltip"));

var _react2 = require("@ag-grid-community/react");

var _allModules = require("@ag-grid-community/all-modules");

require("@ag-grid-community/all-modules/dist/styles/ag-grid.css");

require("@ag-grid-community/all-modules/dist/styles/ag-theme-alpine.css");

var _clientSideRowModel = require("@ag-grid-community/client-side-row-model");

var _menu = require("@ag-grid-enterprise/menu");

var _excelExport = require("@ag-grid-enterprise/excel-export");

var _rangeSelection = require("@ag-grid-enterprise/range-selection");

var _clipboard = require("@ag-grid-enterprise/clipboard");

var _charts = require("@ag-grid-enterprise/charts");

require("@ag-grid-community/core/dist/styles/ag-grid.css");

require("@ag-grid-community/core/dist/styles/ag-theme-alpine.css");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

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
//// jcc
//'use strict';
var toolTipValueGetter = function (params) {
  return {
    value: 'value'
  }; //params.value };
};

class GridExample extends _react.Component {
  constructor(props) {
    super(props);
    this.gridApi = void 0;
    this.gridColumnApi = void 0;

    this.onGridReady = params => {
      console.log('onGridReady called');
      this.gridApi = params.api;
      this.gridColumnApi = params.columnApi;
      this.forceUpdate();
    };

    this.onSelectionChanged = () => {
      console.log('onSelectionChanged called');
    };

    this.state = {
      modules: [_allModules.AllCommunityModules, _clientSideRowModel.ClientSideRowModelModule, _menu.MenuModule, _excelExport.ExcelExportModule, _rangeSelection.RangeSelectionModule, _clipboard.ClipboardModule, _charts.GridChartsModule],
      tooltipShowDelay: 0,
      frameworkComponents: {
        ipv4ValueRenderer: _Ipv4ValueRenderer.default,
        ipv6ValueRenderer: _Ipv6ValueRenderer.default,
        domainValueRenderer: _DomainValueRenderer.default,
        customTooltip: _CustomTooltip.default
      },
      columnDefs: [],
      defaultColDef: {
        flex: 1,
        minWidth: 100,
        editable: true,
        sortable: true,
        filter: true,
        resizable: true,
        tooltipField: 'SRC_IP',
        tooltipValueGetter: toolTipValueGetter,
        tooltipComponent: 'customTooltip'
      },
      rowSelection: 'single',
      rowData: props.rowData
    };
  } // getContextMenuItems = (params) => {
  //   var result = [
  //     {
  //       name: 'GWWK of IP: 23.56.24.67',
  //       action: function () {
  //         window.open('http://10.162.232.22:8000/gwwk.html', '_self');
  //       },
  //       cssClasses: ['redFont', 'bold'],
  //     },
  //     {
  //       name: 'Launch GWWK for domain: subsurface.com',
  //       action: function () {
  //         window.open('http://10.162.232.22:8000/gwwk.html', '_blank');
  //       },
  //       cssClasses: ['redFont', 'bold'],
  //     },
  //   ];
  //   return result;
  // };


  render() {
    const {
      rowData,
      columnDefs
    } = this.props;
    return /*#__PURE__*/_react.default.createElement("div", {
      style: {
        width: '100%',
        height: '100%'
      }
    }, /*#__PURE__*/_react.default.createElement("div", {
      id: "myGrid",
      style: {
        height: '500px',
        width: '100%'
      },
      className: "ag-theme-alpine"
    }, /*#__PURE__*/_react.default.createElement(_react2.AgGridReact, {
      modules: this.state.modules,
      columnDefs: columnDefs,
      defaultColDef: this.state.defaultColDef,
      frameworkComponents: this.state.frameworkComponents,
      enableRangeSelection: true,
      allowContextMenuWithControlKey: true //getContextMenuItems={this.getContextMenuItems}
      ,
      onGridReady: this.onGridReady,
      rowData: rowData
    })));
  }

} // The following Styles component is a <div> element, which has been styled using Emotion
// For docs, visit https://emotion.sh/docs/styled
// Theming variables are provided for your use via a ThemeProvider
// imported from @superset-ui/core. For variables available, please visit
// https://github.com/apache-superset/superset-ui/blob/master/packages/superset-ui-core/src/style/index.ts
// const Styles = styled.div<HelloWorldStylesProps>`
//   background-color: ${({ theme }) => theme.colors.secondary.light2};
//   padding: ${({ theme }) => theme.gridUnit * 4}px;
//   border-radius: ${({ theme }) => theme.gridUnit * 2}px;
//   height: ${({ height }) => height};
//   width: ${({ width }) => width};
//   overflow-y: scroll;
//   h3 {
//     /* You can use your props to control CSS! */
//     font-size: ${({ theme, headerFontSize }) => theme.typography.sizes[headerFontSize]};
//     font-weight: ${({ theme, boldText }) => theme.typography.weights[boldText ? 'bold' : 'normal']};
//   }
// `;

/**
 * ******************* WHAT YOU CAN BUILD HERE *******************
 *  In essence, a chart is given a few key ingredients to work with:
 *  * Data: provided via `props.data`
 *  * A DOM element
 *  * FormData (your controls!) provided as props by transformProps.ts
 */


class HelloWorld extends _react.PureComponent {
  constructor(...args) {
    super(...args);
    this.rootElem = /*#__PURE__*/(0, _react.createRef)();
  }

  componentDidMount() {
    const root = this.rootElem.current;
    console.log('Plugin element', root);
  }

  render() {
    // height and width are the height and width of the DOM element as it exists in the dashboard.
    // There is also a `data` prop, which is, of course, your DATA 🎉
    const {
      columnDefs,
      rowData
    } = this.props;
    console.log('Plugin props', this.props);
    return /*#__PURE__*/_react.default.createElement(GridExample, {
      columnDefs: columnDefs,
      rowData: rowData
    });
  }

}

exports.default = HelloWorld;