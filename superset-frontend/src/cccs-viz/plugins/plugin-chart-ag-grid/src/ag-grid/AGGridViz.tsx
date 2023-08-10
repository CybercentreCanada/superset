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

import { Menu } from 'src/components/Menu';
import ChartContextMenu, { Ref as ContextRef} from './ContextMenu/AGGridContextMenue';

import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

import { ModuleRegistry } from '@ag-grid-community/core';
import { CellRange, RangeSelectionChangedEvent } from 'ag-grid-community';

import EmitFilterMenuItem from './ContextMenu/MenuItems/EmitFilterMenuItem'
// Register the required feature modules with the Grid
ModuleRegistry.registerModules([ClientSideRowModelModule, RangeSelectionModule, RowGroupingModule, RichSelectModule]);


export default function AGGridViz({columnDefs, rowData, formData, height, width, setDataMask }: AGGridVizProps) {
    
    const contextMenuRef = useRef<ContextRef>(null);

    const [columnDefsStateful, setColumnDefsStateful] = useState(columnDefs)
    
    const [rowDataStateful, setrowDataStateful] = useState(rowData)

    const [inContextMenu, setInContextMenu] = useState(false)

    const [selectedData, setSelectedData] = useState<{ [key: string]: string[] }>({})

    useEffect(() => {
        setColumnDefsStateful(columnDefs);
    }, columnDefs);

    useEffect(() => {
        setrowDataStateful(rowData);
    }, rowData);

    const defaultColDef = useMemo(() => ({
        resizable: true,
        sortable: true,
        enableRowGroup: true,
    }), []);

    const gridRef = useRef<AgGridReactType>(null);

    function getEmitTarget(col: string) {
        return formData.column_config?.[col]?.emitTarget || col;
    }

    const onRangeSelectionChanged = useCallback(
        (event: RangeSelectionChangedEvent) => {
          var cellRanges = gridRef.current!.api.getCellRanges();
          const newSelectedData: { [key: string]: string[] } = {}
          if (cellRanges) {
            cellRanges.forEach(function (range: CellRange) {
              // get starting and ending row, remember rowEnd could be before rowStart
              var startRow = Math.min(
                range.startRow!.rowIndex,
                range.endRow!.rowIndex
              );
              var endRow = Math.max(
                range.startRow!.rowIndex,
                range.endRow!.rowIndex
              );
              var api = gridRef.current!.api!;
              

              range.columns.forEach(function (column: any) {
                const col = column.colDef?.field;

                newSelectedData[col] = newSelectedData[col] || []

                for (var rowIndex = startRow; rowIndex <= endRow; rowIndex++) {
                    const rowModel = api.getModel();
                    const rowNode = rowModel.getRow(rowIndex)!;
                    const value = api.getValue(column, rowNode); 
                    
                    if (!newSelectedData[col].includes(value)) {
                        newSelectedData[col].push(value);
                    }
                }
              });
            });
          }
          setSelectedData(newSelectedData)
        },
        []
      );
    
    const handleOnContextMenu = (offsetX: number, offsetY: number, filters: any) => {
        
        
        contextMenuRef.current?.open(offsetX, offsetY, filters, [
            <EmitFilterMenuItem selectedData={selectedData} setDataMask={setDataMask}/>
        ]);
        setInContextMenu(true);
    }
    
    const handleContextMenuSelected = () => {
        setInContextMenu(false);
    }
    
    const handleContextMenuClosed = () => {
        setInContextMenu(false );
    }
    
    const onContextMenu = (event: any) => {
        event.preventDefault();
        handleOnContextMenu( event.pageX,  event.pageY, [])
    } 
    
    return (
        <>
            
            {(
            <ChartContextMenu
                ref={contextMenuRef}
                id={1}
                formData={formData}
                onSelection={handleContextMenuSelected}
                onClose={handleContextMenuClosed}
            />
            )}
                <div
                style={{ width: width, height: height, display: 'flex', flexFlow: 'column' }}
                className="contextContainer"
                onContextMenu={onContextMenu}
                >
                <AgGridReact
                    ref={gridRef}
                    className="ag-theme-alpine" 
                    columnDefs={columnDefsStateful}
                    defaultColDef={defaultColDef}
                    enableRangeSelection={true}
                    rowData={rowDataStateful}
                    enableBrowserTooltips={true}
                    onRangeSelectionChanged={onRangeSelectionChanged}
                    cacheQuickFilter={true}
                    rowGroupPanelShow={'always'}
                    suppressRowClickSelection={true}
                    suppressContextMenu={true}
                    modules={[ClientSideRowModelModule, RangeSelectionModule, RowGroupingModule, RichSelectModule]}
                />
            </div>
        </>
    );
}

