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
import { RichSelectModule } from '@ag-grid-enterprise/rich-select';
import { RowGroupingModule } from '@ag-grid-enterprise/row-grouping';

import { ModuleRegistry } from '@ag-grid-community/core';
import { CloseOutlined } from '@ant-design/icons';
import { ensureIsArray } from '@superset-ui/core';
import { CellRange, RangeSelectionChangedEvent } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-balham.css';
import { LicenseManager } from 'ag-grid-enterprise';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from 'src/dashboard/types';
import { clearDataMask } from 'src/dataMask/actions';
import ChartContextMenu, {
  Ref as ContextRef,
} from './ContextMenu/AGGridContextMenu';

import CopyMenuItem from './ContextMenu/MenuItems/CopyMenuItem';
import CopyWithHeaderMenuItem from './ContextMenu/MenuItems/CopyWithHeaderMenuItem';
import EmitFilterMenuItem from './ContextMenu/MenuItems/EmitFilterMenuItem';

import { PAGE_SIZE_OPTIONS } from '../cccs-grid/plugin/controlPanel';

import { AGGridVizProps } from '../types';

// Register the required feature modules with the Grid
ModuleRegistry.registerModules([
  ClientSideRowModelModule,
  RangeSelectionModule,
  RowGroupingModule,
  RichSelectModule,
]);

type DataMap = { [key: string]: string[] };

type gridData = {
  highlightedData: DataMap;
  principalData: DataMap;
};

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
  agGridLicenseKey,
  emitCrossFilters,
}: AGGridVizProps) {
  LicenseManager.setLicenseKey(agGridLicenseKey);

  const crossFilterValue = useSelector<RootState, any>(
    state => state.dataMask[formData.sliceId]?.filterState?.value,
  );
  const dispatch = useDispatch();

  const contextMenuRef = useRef<ContextRef>(null);

  const [, setInContextMenu] = useState<boolean>(true);
  const [selectedData, setSelectedData] = useState<gridData>({
    highlightedData: {},
    principalData: {},
  });
  const [columnDefsStateful, setColumnDefsStateful] = useState(columnDefs);
  const [searchValue, setSearchValue] = useState('');
  const [pageSize, setPageSize] = useState<number>(pageLength);
  const [rowDataStateful, setrowDataStateful] = useState(rowData);
  const [isDestroyed, setIsDestroyed] = useState(false);
  const [contextDivID] = useState(Math.random());
  // const exploreState = useSelector((state: ExplorePageState) => state.explore);

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
      const principalData: { [key: string]: string[] } = {};

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
          for (let rowIndex = startRow; rowIndex <= endRow; rowIndex += 1) {
            range.columns.forEach((column: any) => {
              const col = column.colDef?.field;
              newSelectedData[col] = newSelectedData[col] || [];
              const rowModel = api.getModel();
              const rowNode = rowModel.getRow(rowIndex)!;
              const value = api.getValue(column, rowNode);

              if (!newSelectedData[col].includes(value)) {
                newSelectedData[col].push(value);
              }
            });
            principalColumns.forEach((column: any) => {
              const col = column;
              principalData[col] = principalData[col] || [];
              const rowModel = api.getModel();
              const rowNode = rowModel.getRow(rowIndex)!;
              const value = api.getValue(column, rowNode);

              if (!principalData[col].includes(value)) {
                principalData[col].push(value);
              }
            });
          }
        });
      }
      setSelectedData({
        highlightedData: newSelectedData,
        principalData,
      });
    },
    [],
  );

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

  const onClick = (data: DataMap) => {
    emitFilter(data);
  };

  const handleContextMenuSelected = () => {
    contextMenuRef.current?.close();
  };

  const handleContextMenuClosed = () => {
    contextMenuRef.current?.close();
  };

  const emitIcon = (disabled?: boolean) => (
    <div style={{ paddingRight: 8, display: 'inline' }}>
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        focusable="false"
      >
        '
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M18.1573 17.864C21.2763 14.745 21.2763 9.66935 18.1573 6.5503C15.0382 3.43125 9.96264 3.43125 6.84359 6.5503L5.42938 5.13609C9.32836 1.2371 15.6725 1.2371 19.5715 5.13609C23.4705 9.03507 23.4705 15.3792 19.5715 19.2782C15.6725 23.1772 9.32836 23.1772 5.42938 19.2782L6.84359 17.864C9.96264 20.9831 15.0375 20.9838 18.1573 17.864ZM2.00035 11.5C2.00035 11.2239 2.2242 11 2.50035 11H5.00035L5.00035 10C5.00035 9.58798 5.47073 9.35279 5.80035 9.60001L9.00035 12C9.17125 12.1032 6.98685 13.637 5.77613 14.4703C5.44613 14.6975 5.00035 14.4601 5.00035 14.0595V13L2.50035 13C2.22421 13 2.00035 12.7761 2.00035 12.5L2.00035 11.5ZM9.67202 9.37873C11.2319 7.81885 13.7697 7.81956 15.3289 9.37873C16.888 10.9379 16.8887 13.4757 15.3289 15.0356C13.769 16.5955 11.2312 16.5948 9.67202 15.0356L8.2578 16.4498C10.5976 18.7896 14.4033 18.7896 16.7431 16.4498C19.0829 14.11 19.0829 10.3043 16.7431 7.96451C14.4033 5.6247 10.5976 5.6247 8.2578 7.96451L9.67202 9.37873Z"
          fill={disabled ? '#97b9c2' : '#20A7C9'}
        />
      </svg>
    </div>
  );

  const handleOnContextMenu = (
    offsetX: number,
    offsetY: number,
    filters: any,
  ) => {
    let menuItems = [
      <CopyMenuItem
        selectedData={selectedData.highlightedData}
        onSelection={handleContextMenuSelected}
      />,
      <CopyWithHeaderMenuItem
        selectedData={selectedData.highlightedData}
        onSelection={handleContextMenuSelected}
      />,
    ];
    if (emitCrossFilters) {
      menuItems = [
        ...menuItems,
        <EmitFilterMenuItem
          onClick={() => {
            onClick(selectedData.highlightedData);
          }}
          onSelection={handleContextMenuSelected}
          label="Emit Filter(s)"
          disabled={Object.keys(selectedData.highlightedData).length === 0}
          key={contextDivID.toString()}
          icon={emitIcon(
            Object.keys(selectedData.highlightedData).length === 0,
          )}
        />,
        <EmitFilterMenuItem
          onClick={() => {
            onClick(selectedData.principalData);
          }}
          onSelection={handleContextMenuSelected}
          label="Emit Principle Column Filter(s)"
          disabled={Object.keys(selectedData.principalData).length === 0}
          icon={emitIcon(Object.keys(selectedData.principalData).length === 0)}
        />,
        <EmitFilterMenuItem
          onSelection={handleContextMenuSelected}
          onClick={() => dispatch(clearDataMask(formData.sliceId))}
          label="Clear Emited Filter(s)"
          disabled={crossFilterValue === undefined}
          icon={<CloseOutlined />}
        />,
      ];
    }
    contextMenuRef.current?.open(offsetX, offsetY, filters, menuItems);
    setInContextMenu(true);
  };

  useEffect(() => {
    if (!includeSearch) {
      setSearchValue('');
    }
  }, [includeSearch]);

  const onContextMenu = (event: any) => {
    event.preventDefault();
    handleOnContextMenu(event.clientX, event.clientY, []);
  };

  const recreateGrid = () => {
    setIsDestroyed(false);
  };

  const destroyGrid = () => {
    setIsDestroyed(true);
    setTimeout(() => recreateGrid(), 0);
  };

  useEffect(() => {
    destroyGrid();
  }, [enableGrouping]);

  return !isDestroyed ? (
    <>
      <ChartContextMenu
        ref={contextMenuRef}
        id={contextDivID}
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
                <span className="float-right" style={{ fontSize: '90%' }}>
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
          // animateRows
          className="ag-theme-balham"
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
  ) : (
    <div />
  );
}
