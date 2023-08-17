import React, {
  ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { AgGridReact } from 'ag-grid-react';
import { AgGridReact as AgGridReactType } from 'ag-grid-react';

import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { RangeSelectionModule } from '@ag-grid-enterprise/range-selection';
import { RowGroupingModule } from '@ag-grid-enterprise/row-grouping';
import { RichSelectModule } from '@ag-grid-enterprise/rich-select';

import ChartContextMenu, { Ref as ContextRef} from './ContextMenu/AGGridContextMenue';

import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { ModuleRegistry } from '@ag-grid-community/core';
import { CellRange, RangeSelectionChangedEvent } from 'ag-grid-community';

import EmitFilterMenuItem from './ContextMenu/MenuItems/EmitFilterMenuItem'
import CopyMenuItem from './ContextMenu/MenuItems/CopyMenuItem'

import { PAGE_SIZE_OPTIONS } from '../cccs-grid/plugin/controlPanel';

import {AGGridVizProps} from '../types'
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from 'src/dashboard/types';
import { clearDataMask } from 'src/dataMask/actions';
import { ensureIsArray } from '@superset-ui/core';

// Register the required feature modules with the Grid
ModuleRegistry.registerModules([
  ClientSideRowModelModule,
  RangeSelectionModule,
  RowGroupingModule,
  RichSelectModule,
]);

type DataMap = { [key: string]: string[] }

type gridData = {
  highlightedData: DataMap,
  princibleData: DataMap,
} 

export default function AGGridViz({
  columnDefs,
  rowData,
  formData,
  height,
  width,
  includeSearch,
  pageLength = 0,
  enableGrouping,
  setDataMask,
  principalColumns,
}: AGGridVizProps) {

  const crossFilterValue = useSelector<RootState, any>(
    state => state.dataMask[formData.slice_id]?.filterState?.value,
  );
  const dispatch = useDispatch();
  
  const contextMenuRef = useRef<ContextRef>(null);

  const [inContextMenu, setInContextMenu] = useState<boolean>(false)
  const [selectedData, setSelectedData] = useState<gridData>({highlightedData: {}, princibleData: {}})
  const [columnDefsStateful, setColumnDefsStateful] = useState(columnDefs);
  const [searchValue, setSearchValue] = useState('');
  const [pageSize, setPageSize] = useState<number>(pageLength);
  const [rowDataStateful, setrowDataStateful] = useState(rowData);

  useEffect(() => {
    setColumnDefsStateful(columnDefs);
  }, [columnDefs]);

  useEffect(() => {
    setrowDataStateful(rowData);
  }, [rowData]);

    const defaultColDef = useMemo(() => ({
        resizable: true,
        sortable: true,
        enableRowGroup: true,
    }), []);

  const gridRef = useRef<AgGridReactType>(null);

  const updatePageSize = (newSize: number) => {
    gridRef.current?.api?.paginationSetPageSize(newSize);
    setPageSize(newSize <= 0 ? 0 : newSize);
  };

  useEffect(() => {
    updatePageSize(pageLength);
  }, [pageLength]);

  const setSearch = (e: ChangeEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement;
    e.preventDefault();
    setSearchValue(target.value);
  };


    useEffect(() => {
        if (!includeSearch) {
        setSearchValue('');
        }
    }, [includeSearch]);

    const onRangeSelectionChanged = useCallback(
        (event: RangeSelectionChangedEvent) => {
          var cellRanges = gridRef.current!.api.getCellRanges();
          const newSelectedData: { [key: string]: string[] } = {}
          const principleData: { [key: string]: string[] } = {}

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
              for (var rowIndex = startRow; rowIndex <= endRow; rowIndex++) {
              
                range.columns.forEach(function (column: any) {
                  const col = column.colDef?.field;
                  newSelectedData[col] = newSelectedData[col] || []
                  const rowModel = api.getModel();
                  const rowNode = rowModel.getRow(rowIndex)!;
                  const value = api.getValue(column, rowNode); 
                    
                  if (!newSelectedData[col].includes(value)) {
                      newSelectedData[col].push(value);
                  }                
                });
                principalColumns.forEach((column: any) => {
                  const col = column.colDef?.field;
                  principleData[col] = principleData[col] || [];
                  const rowModel = api.getModel();
                  const rowNode = rowModel.getRow(rowIndex)!;
                  const value = api.getValue(column, rowNode); 

                  if (!principleData[col].includes(value)) {
                    principleData[col].push(value);
                  }     
                });
            }
            });
          }
          setSelectedData({highlightedData: newSelectedData, princibleData: principleData})
        },
        []
      );
      const onClick = (data: DataMap) => {
        emitFilter(data)
      } 
      const emitFilter = useCallback(
        Data => {
          const groupBy = Object.keys(Data);
          const groupByValues = Object.values(Data);
          setDataMask({
            extraFormData: {
              filters:
                groupBy.length === 0
                  ? []
                  : groupBy.map(col => {
                      const val = ensureIsArray(Data?.[col]);
                      if (val === null || val === undefined)
                        return {
                          col,
                          op: 'IS NULL',
                        };
                      return {
                        col,
                        op: 'IN',
                        val,
                      };
                    }),
            },
            filterState: {
              value: groupByValues.length ? groupByValues : null,
            },
          });
        },
        [setDataMask],
      ); // only take relevant page size options
    

    const handleOnContextMenu = (offsetX: number, offsetY: number, filters: any) => {
    
        contextMenuRef.current?.open(offsetX, offsetY, filters, [
          <CopyMenuItem selectedData={selectedData.highlightedData}/>,
          <EmitFilterMenuItem 
              onClick={() => {onClick(selectedData.highlightedData)}}
              label={"Emit Filter(s)"}
              disabled={ Object.keys(selectedData.highlightedData).length === 0 }
            />,
          <EmitFilterMenuItem 
            onClick={() => {onClick(selectedData.princibleData)}}
            label={"Emit Filter(s)"}
            disabled={ Object.keys(selectedData.princibleData).length === 0 }
          />,
          <EmitFilterMenuItem 
            onClick={() => dispatch(clearDataMask(formData.slice_id))}
            label={"Clear Emited Filter(s)"}
            disabled={ crossFilterValue === undefined }
         />,
         
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
                <div
                    className="form-inline"
                    style={{ flex: '0 1 auto', paddingBottom: '0.5em' }}
                >
                    <div className="row">
                    <div className="col-sm-6">
                        {pageLength > 0 && (
                        <span className="dt-select-page-size form-inline">
                            Show{' '}
                            <select
                            className="form-control input-sm"
                            value={pageSize}
                            onBlur={() => {}} 
                            onChange={e => {
                                updatePageSize(
                                Number((e.target as HTMLSelectElement).value),
                                );
                            }}
                            >
                            {PAGE_SIZE_OPTIONS.map(option => {
                                const [size, text] = Array.isArray(option)
                                ? option
                                : [option, option];
                                return (
                                <option key={size} value={size}>
                                    {text}
                                </option>
                                );
                            })}
                            </select>{' '}
                            entries
                        </span>
                        )}
                    </div>
                    <div className="col-sm-6">
                        {includeSearch ? (
                        <span className="float-right">
                            Search{' '}
                            <input
                            className="form-control input-sm"
                            placeholder={`${rowData.length} records...`}
                            value={searchValue}
                            onChange={setSearch}
                            />
                        </span>
                        ) : null}
                    </div>
                    </div>
                </div>
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
                    suppressRowClickSelection={true}
                    suppressContextMenu={true}
                    modules={[ClientSideRowModelModule, RangeSelectionModule, RowGroupingModule, RichSelectModule]}
                    paginationPageSize={pageSize}
                    pagination={pageSize > 0}
                    quickFilterText={searchValue}
                    rowGroupPanelShow={enableGrouping ? 'always' : 'never'}
                />
            </div>
        </>
    );
}
