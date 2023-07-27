'use strict';
import React, {
    ChangeEvent,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
  } from 'react';

import { AGGridVizProps } from '../types'

import { AgGridReact } from 'ag-grid-react';
import { AgGridReact as AgGridReactType } from 'ag-grid-react';

import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { RangeSelectionModule } from '@ag-grid-enterprise/range-selection';
import { RowGroupingModule } from '@ag-grid-enterprise/row-grouping';
import { RichSelectModule } from '@ag-grid-enterprise/rich-select';

import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

import { ModuleRegistry } from '@ag-grid-community/core';
import { ChartRangeSelectionChanged, RangeSelectionChangedEvent } from 'ag-grid-community';
// Register the required feature modules with the Grid
ModuleRegistry.registerModules([ClientSideRowModelModule, RangeSelectionModule, RowGroupingModule, RichSelectModule]);

export default function AGGridViz({columnDefs, rowData, formData, height, width }: AGGridVizProps) {
    
    const [columnDefsStateful, setColumnDefsStateful] = useState(columnDefs)
    
    const [rowDataStateful, setrowDataStateful] = useState(rowData)

    useEffect(() => {
        setColumnDefsStateful(columnDefs);
    }, columnDefs);

    useEffect(() => {
        setrowDataStateful(rowData);
    }, rowData);

    const defaultColDef = useMemo(() => ({
        resizable: true,
        sortable: true
    }), []);

    const gridRef = useRef<AgGridReactType>(null);

    const onRangeSelectionChanged = (event: RangeSelectionChangedEvent) => {
       if (event.finished) {
        console.log("Event Finished")
       }
       else if (event.started) {
        console.log("Event Starated")
       }
       else {
        console.log("Event runnning")
       }
    }

    return (
        <div
            style={{ width: width, height: height, display: 'flex', flexFlow: 'column' }}
            >
            <AgGridReact
                ref={gridRef}
                className="ag-theme-alpine" 
                columnDefs={columnDefsStateful}
                defaultColDef={defaultColDef}
                enableRangeSelection={true}
                rowData={rowDataStateful}
                //rowSelection="multiple"
                onRangeSelectionChanged={onRangeSelectionChanged}
                suppressRowClickSelection={true}
                modules={[ClientSideRowModelModule, RangeSelectionModule, RowGroupingModule, RichSelectModule]}
            />
        </div>
    );
}

