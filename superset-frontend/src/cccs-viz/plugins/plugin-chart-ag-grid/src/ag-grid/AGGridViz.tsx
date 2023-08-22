import React, {
  ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { AgGridReact, AgGridReact as AgGridReactType } from 'ag-grid-react';

import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { RangeSelectionModule } from '@ag-grid-enterprise/range-selection';
import { RowGroupingModule } from '@ag-grid-enterprise/row-grouping';
import { RichSelectModule } from '@ag-grid-enterprise/rich-select';

import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

import { ModuleRegistry } from '@ag-grid-community/core';
import { CellRange, RangeSelectionChangedEvent } from 'ag-grid-community';
import ChartContextMenu, {
  Ref as ContextRef,
} from './ContextMenu/AGGridContextMenue';

import EmitFilterMenuItem from './ContextMenu/MenuItems/EmitFilterMenuItem';
import CopyMenuItem from './ContextMenu/MenuItems/CopyMenuItem';

import { PAGE_SIZE_OPTIONS } from '../cccs-grid/plugin/controlPanel';

import { AGGridVizProps } from '../types';

// Register the required feature modules with the Grid
ModuleRegistry.registerModules([
  ClientSideRowModelModule,
  RangeSelectionModule,
  RowGroupingModule,
  RichSelectModule,
]);

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
}: AGGridVizProps) {
  const contextMenuRef = useRef<ContextRef>(null);

  const [inContextMenu, setInContextMenu] = useState<boolean>(false);
  const [selectedData, setSelectedData] = useState<{ [key: string]: string[] }>(
    {},
  );
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

  const defaultColDef = useMemo(
    () => ({
      resizable: true,
      autoHeight: true,
      sortable: true,
      enableRowGroup: true,
    }),
    [],
  );

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
      const cellRanges = gridRef.current!.api.getCellRanges();
      const newSelectedData: { [key: string]: string[] } = {};
      if (cellRanges) {
        cellRanges.forEach(function (range: CellRange) {
          // get starting and ending row, remember rowEnd could be before rowStart
          const startRow = Math.min(
            range.startRow!.rowIndex,
            range.endRow!.rowIndex,
          );
          const endRow = Math.max(
            range.startRow!.rowIndex,
            range.endRow!.rowIndex,
          );
          const api = gridRef.current!.api!;

          range.columns.forEach(function (column: any) {
            const col = column.colDef?.field;

            newSelectedData[col] = newSelectedData[col] || [];

            for (let rowIndex = startRow; rowIndex <= endRow; rowIndex += 1) {
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
      setSelectedData(newSelectedData);
    },
    [],
  );

  const handleOnContextMenu = (
    offsetX: number,
    offsetY: number,
    filters: any,
  ) => {
    contextMenuRef.current?.open(offsetX, offsetY, filters, [
      <EmitFilterMenuItem
        selectedData={selectedData}
        setDataMask={setDataMask}
      />,
      <CopyMenuItem selectedData={selectedData} />,
    ]);
    setInContextMenu(true);
  };

  const handleContextMenuSelected = () => {
    setInContextMenu(false);
  };

  const handleContextMenuClosed = () => {
    setInContextMenu(false);
  };

  const onContextMenu = (event: any) => {
    event.preventDefault();
    handleOnContextMenu(event.pageX, event.pageY, []);
  };

  return (
    <>
      <ChartContextMenu
        ref={contextMenuRef}
        id={1}
        formData={formData}
        onSelection={handleContextMenuSelected}
        onClose={handleContextMenuClosed}
      />
      <div
        style={{
          width,
          height,
          display: 'flex',
          flexFlow: 'column',
        }}
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
          animateRows
          className="ag-theme-alpine"
          columnDefs={columnDefsStateful}
          defaultColDef={defaultColDef}
          enableRangeSelection
          rowData={rowDataStateful}
          enableBrowserTooltips
          onRangeSelectionChanged={onRangeSelectionChanged}
          cacheQuickFilter
          suppressRowClickSelection
          suppressContextMenu
          modules={[
            ClientSideRowModelModule,
            RangeSelectionModule,
            RowGroupingModule,
            RichSelectModule,
          ]}
          paginationPageSize={pageSize}
          pagination={pageSize > 0}
          quickFilterText={searchValue}
          rowGroupPanelShow={enableGrouping ? 'always' : 'never'}
        />
      </div>
    </>
  );
}
