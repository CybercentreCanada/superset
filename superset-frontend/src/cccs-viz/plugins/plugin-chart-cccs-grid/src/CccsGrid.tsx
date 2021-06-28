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
 import React, { useCallback } from 'react';
 //import { styled } from '@superset-ui/core';
 import { CccsGridProps } from './types';
 
 
 import CountryValueRenderer from './CountryValueRenderer';
 import Ipv4ValueRenderer from './Ipv4ValueRenderer';
 import Ipv6ValueRenderer from './Ipv6ValueRenderer';
 import DomainValueRenderer from './DomainValueRenderer';
 import CustomTooltip from './CustomTooltip';
  
 
 //// jcc
 
 //'use strict';
 
 import { AgGridReact } from '@ag-grid-community/react';
 import '@ag-grid-community/all-modules/dist/styles/ag-grid.css';
 import '@ag-grid-community/core/dist/styles/ag-grid.css';
 import '@ag-grid-community/core/dist/styles/ag-theme-balham.css';
 
 import { AllModules, GetDetailRowDataParams } from "@ag-grid-enterprise/all-modules";
 
 const DEFAULT_COLUMN_DEF = {
   flex: 1,
   minWidth: 100,
   editable: true,
   sortable: true,
   filter: true,
   resizable: true,
   tooltipField: '',
   tooltipComponent: 'customTooltip',
 };
 
 export default function CccsGrid({
   width,
   height,
   columnDefs,
   rowData,
   formData,
   setDataMask,
   selectedValues,
   tooltipShowDelay,
   rowSelection,
 }: CccsGridProps) {


   
   const frameworkComponents = {
     countryValueRenderer: CountryValueRenderer,
     ipv4ValueRenderer: Ipv4ValueRenderer,
     ipv6ValueRenderer: Ipv6ValueRenderer,
     domainValueRenderer: DomainValueRenderer,
     customTooltip: CustomTooltip
    };
 
 
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
 
   // What is ownFilters used for???
 
   const handleChange = useCallback(
     (values: string[]) => {
 
       if (!formData.emitFilter) {
         return;
       }
 
       setDataMask({
         extraFormData: {
           filters:
             values.length === 0
               ? []
               : [{
                 col: "ip_string",
                 op: 'IN',
                 val: values,
                 }],
         },
         filterState: {
           value: values.length ? values : null,
         },
         ownState: {
           selectedValues: values.length ? values : null,
         },
       },);
     },
     [setDataMask, selectedValues],
   );
 
   const onGridReady = (params: any) => {
     //const { name } = props;
     params.api.forceUpdate();
   };
 
   const onSelectionChanged = (params: any) => {
     const gridApi = params.api;
     var selectedRows = gridApi.getSelectedRows();
     const ranges = gridApi.getCellRanges();
     ranges.startRow
     ranges.endRow
     ranges.columns
     gridApi.document.querySelector('#selectedRows').innerHTML =
       selectedRows.length === 1 ? selectedRows[0].athlete : '';
   };

   const onRangeSelectionChanged = (params: any) => {
     const gridApi = params.api;
     var cellRanges = gridApi.getCellRanges();
 
     cellRanges.forEach( (range: any) => {
       // get starting and ending row, remember rowEnd could be before rowStart
       var startRow = Math.min(range.startRow.rowIndex, range.endRow.rowIndex);
       var endRow = Math.max(range.startRow.rowIndex, range.endRow.rowIndex);
 
       for (var rowIndex = startRow; rowIndex <= endRow; rowIndex++) {
         range.columns.forEach( (column: any) => {
           const cellRenderer = column.colDef?.cellRenderer;
           if (cellRenderer == 'ipv4ValueRenderer') {
             var rowModel = gridApi.getModel();
             var rowNode = rowModel.getRow(rowIndex);
             var value = gridApi.getValue(column, rowNode);
             const values = [value];
             handleChange([...values]);
           }
         });
       }
     });
   }
 
   const rowData2 = [{
          "name": "Fake Data Caller Number 1",
          "callId": 123,
          "duration": 72,
          "switchCode": "SWA",
          "direction": "Out",
          "number": "(00) 3334545"
      }, {
          "name": "Fake Data Caller Number 2",
          "callId": 456,
          "duration": 61,
          "switchCode": "SWB",
          "direction": "In",
          "number": "(01) 1111212"
      }]
  
   return (
 
     <div style={{ width, height}}  className="ag-theme-balham" >
         <AgGridReact
           modules={AllModules}
           columnDefs={columnDefs}
           sizeColumnsToFit={true}
           masterDetail={true}
           isRowMaster={function (dataItem) {
              // TODO Check if the column needs to be extended, something like dataItem ? dataItem.callRecords.length > 0 : false;
            return true;
           }}
           detailRowHeight={250}
           detailCellRendererParams={function (params: GetDetailRowDataParams) {
            var res: any = {};
            res.getDetailRowData = function (params: GetDetailRowDataParams) {
              // TODO We should return the JSON stored in the params, something like params.data assuming
              // data is a JSON string properly formed
              params.successCallback(rowData2);
            };
            res.detailGridOptions = {
              columnDefs: [{ field: 'name' }, { field: 'callId' }, { field: 'number' }],
              suppressCount: false,
              defaultColDef: { flex: 1 },
            };

            res.template= function (params: GetDetailRowDataParams) {
              return (
                '<div style="height: 100%; background-color: #EDF6FF; padding: 20px; box-sizing: border-box;">' +
                '  <div style="height: 10%; padding: 2px; font-weight: bold;">###### Name: ' +
                '&lt; Column name &gt;' +
                '</div>' +
                '  <div ref="eDetailGrid" style="height: 90%;"></div>' +
                '</div>'
              );
            };
            
            return res;
          }}
           defaultColDef={DEFAULT_COLUMN_DEF}
           frameworkComponents={frameworkComponents}
           enableRangeSelection={true}
           allowContextMenuWithControlKey={true}
           //getContextMenuItems={getContextMenuItems}
           onGridReady={onGridReady}
           onRangeSelectionChanged={onRangeSelectionChanged}
           onSelectionChanged={onSelectionChanged}
           rowData={rowData}
         >
         </AgGridReact>
       </div>
 
   );
 }
 