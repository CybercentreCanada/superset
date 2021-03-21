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
import React, { Component, PureComponent, createRef } from 'react';
import { HelloWorldProps } from './types';


import Ipv4ValueRenderer from './Ipv4ValueRenderer';
import Ipv6ValueRenderer from './Ipv6ValueRenderer';
import DomainValueRenderer from './DomainValueRenderer';
import CustomTooltip from './CustomTooltip';



//// jcc

//'use strict';

import { AgGridReact } from '@ag-grid-community/react';
import { AllCommunityModules } from '@ag-grid-community/all-modules';
import '@ag-grid-community/all-modules/dist/styles/ag-grid.css';
import '@ag-grid-community/all-modules/dist/styles/ag-theme-alpine.css';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { MenuModule } from '@ag-grid-enterprise/menu';
import { ExcelExportModule } from '@ag-grid-enterprise/excel-export';
import { RangeSelectionModule } from '@ag-grid-enterprise/range-selection';
import { ClipboardModule } from '@ag-grid-enterprise/clipboard';
import { GridChartsModule } from '@ag-grid-enterprise/charts';
import '@ag-grid-community/core/dist/styles/ag-grid.css';
import '@ag-grid-community/core/dist/styles/ag-theme-alpine.css';


var toolTipValueGetter = function (params: any) {
  return { value: 'value'};//params.value };
};

class GridExample extends Component<
{
  columnDefs: any,
  rowData: any
},
 { tooltipShowDelay: any, 
  frameworkComponents: any, 
  modules: any, 
  columnDefs: any,
   defaultColDef: any,
    rowSelection: any, 
    rowData: any }> {
  
  gridApi: any;
  gridColumnApi: any;

  constructor(props: any) {
    super(props);

    this.state = {
      modules: [
        AllCommunityModules,
        ClientSideRowModelModule,
        MenuModule,
        ExcelExportModule,
        RangeSelectionModule,
        ClipboardModule,
        GridChartsModule,
      ],
      tooltipShowDelay: 0,
      frameworkComponents: {
        ipv4ValueRenderer: Ipv4ValueRenderer,
        ipv6ValueRenderer: Ipv6ValueRenderer,
        domainValueRenderer: DomainValueRenderer,
        customTooltip: CustomTooltip,
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
        tooltipComponent: 'customTooltip',
      },
      rowSelection: 'single',
      rowData: props.rowData,

    };
  }


  // getContextMenuItems = (params) => {
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




  onGridReady = (params: any) => {

    console.log('onGridReady called');

    this.gridApi = params.api;
    this.gridColumnApi = params.columnApi;
    this.forceUpdate();
  };

  onSelectionChanged = () => {
    console.log('onSelectionChanged called');

  };


  render() {

    const { rowData, columnDefs } = this.props;

    return (

      <div style={{ width: '100%', height: '100%' }}>
        <div
          id="myGrid"
          style={{
            height: '500px',
            width: '100%',
          }}
          className="ag-theme-alpine" >
          
          <AgGridReact
            modules={this.state.modules}
            columnDefs={columnDefs}
            defaultColDef={this.state.defaultColDef}
            frameworkComponents={this.state.frameworkComponents}
            enableRangeSelection={true}
            allowContextMenuWithControlKey={true}
            //getContextMenuItems={this.getContextMenuItems}
            onGridReady={this.onGridReady}
            rowData={rowData}
          />

       </div>
     </div>

    );
  }
}









// The following Styles component is a <div> element, which has been styled using Emotion
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

export default class HelloWorld extends PureComponent<HelloWorldProps> {
  // Often, you just want to get a hold of the DOM and go nuts.
  // Here, you can do that with createRef, and componentDidMount.

  rootElem = createRef<HTMLDivElement>();

  componentDidMount() {
    const root = this.rootElem.current as HTMLElement;
    console.log('Plugin element', root);

  }

  render() {

    // height and width are the height and width of the DOM element as it exists in the dashboard.
    // There is also a `data` prop, which is, of course, your DATA 🎉
    const { columnDefs, rowData } = this.props;

    console.log('Plugin props', this.props);
    return ( 
      <GridExample 
        columnDefs={columnDefs} 
        rowData={rowData} 
      />
     );

  }
}
