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

import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

import { ModuleRegistry } from '@ag-grid-community/core';
import {
  ChartRangeSelectionChanged,
  RangeSelectionChangedEvent,
} from 'ag-grid-community';
import { AGGridVizTransformedProps } from '../types';
import { PAGE_SIZE_OPTIONS } from '../cccs-grid/plugin/controlPanel';
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
}: AGGridVizTransformedProps) {
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
      sortable: true,
    }),
    [],
  );

  const gridRef = useRef<AgGridReactType>(null);

  const onRangeSelectionChanged = (event: RangeSelectionChangedEvent) => {
    if (event.finished) {
      console.log('Event Finished');
    } else if (event.started) {
      console.log('Event Starated');
    } else {
      console.log('Event runnning');
    }
  };

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

  return (
    <div
      style={{
        width,
        height,
        display: 'flex',
        flexFlow: 'column',
      }}
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
        enableRangeSelection
        rowData={rowDataStateful}
        onRangeSelectionChanged={onRangeSelectionChanged}
        suppressRowClickSelection
        modules={[
          ClientSideRowModelModule,
          RangeSelectionModule,
          RowGroupingModule,
          RichSelectModule,
        ]}
        paginationPageSize={pageSize}
        pagination={pageSize > 0}
        cacheQuickFilter
        quickFilterText={searchValue}
        rowGroupPanelShow={enableGrouping ? 'always' : 'never'}
      />
    </div>
  );
}
