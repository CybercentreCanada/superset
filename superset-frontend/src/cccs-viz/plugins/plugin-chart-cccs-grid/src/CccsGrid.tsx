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
import React, { useCallback, useState } from 'react';
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

import { AllModules } from "@ag-grid-enterprise/all-modules";

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
  emitFilter = false,
  filters: initialFilters = {},
}: CccsGridProps) {

  const [, setFilters] = useState(initialFilters);

  const [prevRow, setPrevRow] = useState(-1);
  const [prevColumn, setPrevColmun] = useState('');

  const handleChange = useCallback(filters => {
    if (!emitFilter) {
      return;
    }

    const groupBy = Object.keys(filters);
    const groupByValues = Object.values(filters);
    setDataMask({
      extraFormData: {
        filters: groupBy.length === 0 ? [] : groupBy.map(col => {
          const val = filters == null ? void 0 : filters[col];
          if (val === null || val === undefined) return {
            col,
            op: 'IS NULL'
          };
          return {
            col,
            op: 'IN',
            val: val
          };
        })
      },
      filterState: {
        value: groupByValues.length ? groupByValues : null
      }
    });
  }, [emitFilter, setDataMask]); // only take relevant page size options

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



  const frameworkComponents = {
    countryValueRenderer: CountryValueRenderer,
    ipv4ValueRenderer: Ipv4ValueRenderer,
    ipv6ValueRenderer: Ipv6ValueRenderer,
    domainValueRenderer: DomainValueRenderer,
    customTooltip: CustomTooltip,
  };

  const onGridReady = (params: any) => {
    console.log('onGridReady called');
    params.api.forceUpdate();
  };

  const onSelectionChanged = (params: any) => {
    const gridApi = params.api;
    var selectedRows = gridApi.getSelectedRows();
    gridApi.document.querySelector('#selectedRows').innerHTML =
      selectedRows.length === 1 ? selectedRows[0].athlete : '';
  };


  function isSingleCellSelection(cellRanges: any): boolean {
    if (cellRanges.length != 1) {
      return false;
    }
    const range = cellRanges[0];
    return range.startRow.rowIndex == range.endRow.rowIndex && range.columns.length == 1;
  }

  function isSameSingleSelection(range: any): boolean {
    const singleRow = Math.min(range.startRow.rowIndex, range.endRow.rowIndex);
    return prevRow == singleRow && prevColumn == range.columns[0].colId;
  }

  function cacheSingleSelection(range: any) {
    const singleRow = Math.min(range.startRow.rowIndex, range.endRow.rowIndex);
    setPrevRow(singleRow);
    setPrevColmun(range.columns[0].colId);
  }

  const onRangeSelectionChanged = (params: any) => {
    if (params.finished == false) {
      return;
    }

    const gridApi = params.api;
    let cellRanges = gridApi.getCellRanges();
    if (isSingleCellSelection(cellRanges)) {
      // Did user re-select the same single cell
      if (isSameSingleSelection(cellRanges[0])) {
        // clear selection in ag-grid
        gridApi.clearRangeSelection();
        // new cell ranges should be empty now
        cellRanges = gridApi.getCellRanges();
      }
      else {
        // remember the single cell selection
        cacheSingleSelection(cellRanges[0]);
      }
    }

    const updatedFilters = {};
    cellRanges.forEach((range: any) => {
      range.columns.forEach((column: any) => {
        const cellRenderer = column.colDef?.cellRenderer;
        const col = getEmitTarget(column.colDef?.field)
        updatedFilters[col] = updatedFilters[col] || [];
        if (cellRenderer == 'ipv4ValueRenderer') {
          const startRow = Math.min(range.startRow.rowIndex, range.endRow.rowIndex);
          const endRow = Math.max(range.startRow.rowIndex, range.endRow.rowIndex);
          for (let rowIndex = startRow; rowIndex <= endRow; rowIndex++) {
            const value = gridApi.getValue(column, gridApi.getModel().getRow(rowIndex));
            if (!updatedFilters[col].includes(value)) {
              updatedFilters[col].push(value);
            }
          }
        }
      });
    });

    setFilters(updatedFilters);
    handleChange(updatedFilters);
  }

  function getEmitTarget(col: string) {
    return formData.column_config?.[col]?.emitTarget || col;
  }

  function autoSizeFirst100Columns(params: any){
    // Autosizes only the first 100 Columns in Ag-Grid
    const allColumnIds = params.columnApi.getAllColumns().map((col: any) => {return col.getColId()});
    params.columnApi.autoSizeColumns(allColumnIds.slice(0,100), false);
  }

  const gridOptions = {
    suppressColumnVirtualisation: true
    // Disables a Key performance feature for Ag-Grid to enable autosizing of multiple columns
    // if not disabled, only the first 10-15 columns will autosize
    // This change will make initial load up of Ag-Grid slower than before
  };

  return (
    <div style={{ width, height }} className="ag-theme-balham" >
      <AgGridReact
        modules={AllModules}
        columnDefs={columnDefs}
        defaultColDef={DEFAULT_COLUMN_DEF}
        frameworkComponents={frameworkComponents}
        enableRangeSelection={true}
        allowContextMenuWithControlKey={true}
        gridOptions={gridOptions}
        onGridColumnsChanged={autoSizeFirst100Columns}
        //getContextMenuItems={getContextMenuItems}
        onGridReady={onGridReady}
        onRangeSelectionChanged={onRangeSelectionChanged}
        onSelectionChanged={onSelectionChanged}
        rowData={rowData}
      />
    </div>
  );
}
