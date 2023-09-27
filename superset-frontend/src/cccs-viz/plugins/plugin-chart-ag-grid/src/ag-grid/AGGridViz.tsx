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
import { SupersetTheme, css, ensureIsArray, t } from '@superset-ui/core';
import { CellRange } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-balham.css';
import { LicenseManager } from 'ag-grid-enterprise';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from 'src/dashboard/types';
import { clearDataMask } from 'src/dataMask/actions';
// import { ExplorePageState } from 'src/explore/types';
import _ from 'lodash';
import useEmitGlobalFilter from 'src/cccs-viz/plugins/hooks/useEmitGlobalFilter';
import Button from 'src/components/Button';
import ChartContextMenu, {
  Ref as ContextRef,
} from './ContextMenu/AGGridContextMenu';

import CopyMenuItem from './ContextMenu/MenuItems/CopyMenuItem';
import CopyWithHeaderMenuItem from './ContextMenu/MenuItems/CopyWithHeaderMenuItem';
import EmitFilterMenuItem from './ContextMenu/MenuItems/EmitFilterMenuItem';

import {
  DEFAULT_CLICK_ACTIONS,
  PAGE_SIZE_OPTIONS,
} from '../cccs-grid/plugin/controlPanel';

import EmitIcon from '../../../components/EmitIcon';
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

const headerStyles = css`
  display: flex;
  flex-direction: row;
`;

const actionStyles = (theme: SupersetTheme) => css`
  margin-left: 0.5rem;
`;

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
  onClickBehaviour,
  agGridLicenseKey,
  emitCrossFilters,
}: AGGridVizProps) {
  LicenseManager.setLicenseKey(agGridLicenseKey);

  const crossFilterValue = useSelector<RootState, any>(
    state => state.dataMask[formData.sliceId]?.filterState?.value,
  );
  const dispatch = useDispatch();
  const emitGlobalFilter = useEmitGlobalFilter();

  const contextMenuRef = useRef<ContextRef>(null);

  const [, setInContextMenu] = useState<boolean>(true);
  const [selectedData, setSelectedData] = useState<gridData>({
    highlightedData: {},
    principalData: {},
  });
  const [columnDefsStateful, setColumnDefsStateful] = useState(columnDefs);
  const [searchValue, setSearchValue] = useState('');
  const [pageSize, setPageSize] = useState<number>(pageLength);
  const [rowDataStateful, setRowDataStateful] = useState(rowData);
  const [isDestroyed, setIsDestroyed] = useState(false);
  const [contextDivID] = useState(Math.random());
  const [emitCrossFiltersStateful, setEmitCrossFiltersStateful] =
    useState<boolean>(emitCrossFilters);

  useEffect(() => {
    setEmitCrossFiltersStateful(emitCrossFilters);
  }, [emitCrossFilters]);

  useEffect(() => {
    setColumnDefsStateful(columnDefs);
  }, [columnDefs]);

  useEffect(() => {
    setRowDataStateful(rowData);
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

  const updatePageSize = useCallback((newSize: number) => {
    gridRef.current?.api?.paginationSetPageSize(newSize);
    setPageSize(newSize <= 0 ? 0 : newSize);
  }, []);

  const setSearch = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    setSearchValue(e.target.value);
  }, []);

  useEffect(() => {
    updatePageSize(pageLength);
  }, [pageLength, updatePageSize]);

  useEffect(() => {
    if (!includeSearch) {
      setSearchValue('');
    }
  }, [includeSearch]);

  const emitFilter = useCallback(
    (data, globally = false) => {
      const groupBy: [string, any][] = Object.entries(data);

      // If not global, use the same setup as usual
      if (!globally) {
        setDataMask({
          extraFormData: {
            filters:
              groupBy.length === 0
                ? []
                : groupBy.map(([col, _val]) => {
                    const val = ensureIsArray(_val);
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
            value: groupBy.length ? groupBy.map(col => col[1]) : null,
          },
        });
      } else {
        emitGlobalFilter(groupBy);
      }
    },
    [emitGlobalFilter, setDataMask],
  ); // only take relevant page size options

  const handleOnClickBehavior = useCallback(
    (highlightedData: DataMap, principalData: DataMap) => {
      const to_emit = emitCrossFiltersStateful;
      // handle default click behaviour
      if (onClickBehaviour !== 'None') {
        // get action
        const action = DEFAULT_CLICK_ACTIONS.find(
          a => a.verbose_name === onClickBehaviour,
        )?.action_name;
        // handle action
        if (action === 'emit_filters' && to_emit) {
          emitFilter(highlightedData);
        } else if (action === 'emit_principal_filters' && to_emit) {
          emitFilter(principalData);
        }
      }
    },
    [emitCrossFiltersStateful, emitFilter, onClickBehaviour],
  );

  const onRangeSelectionChanged = useCallback(() => {
    const cellRanges = gridRef.current!.api.getCellRanges();
    const newSelectedData: { [key: string]: string[] } = {};
    const principalData: { [key: string]: string[] } = {};

    if (cellRanges) {
      cellRanges.forEach((range: CellRange) => {
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

        _.range(startRow, endRow + 1).forEach(rowIndex => {
          range.columns.forEach((column: any) => {
            const col = column.colDef?.field;

            if (col) {
              newSelectedData[col] = newSelectedData[col] || [];
              const rowNode = api.getModel().getRow(rowIndex)!;
              const value = api.getValue(column, rowNode);

              if (!newSelectedData[col].includes(value)) {
                newSelectedData[col].push(value);
              }
            }
          });

          principalColumns.forEach((column: string) => {
            principalData[column] = principalData[column] || [];
            const rowNode = api.getModel().getRow(rowIndex)!;
            const value = api.getValue(column, rowNode);

            if (!principalData[column].includes(value)) {
              principalData[column].push(value);
            }
          });
        });
      });
    }

    setSelectedData({
      highlightedData: newSelectedData,
      principalData,
    });

    if (!_.isEmpty(newSelectedData)) {
      handleOnClickBehavior(newSelectedData, principalData);
    }
  }, [handleOnClickBehavior, principalColumns]);

  const onClick = (data: DataMap, globally = false) => {
    emitFilter(data, globally);
  };

  const handleContextMenuSelected = () => {
    contextMenuRef.current?.close();
  };

  const handleContextMenuClosed = () => {
    contextMenuRef.current?.close();
  };

  const handleOnContextMenu = (
    offsetX: number,
    offsetY: number,
    filters: any,
  ) => {
    let menuItems = [
      <CopyMenuItem
        key="copy-menu-item"
        selectedData={selectedData.highlightedData}
        onSelection={handleContextMenuSelected}
      />,
      <CopyWithHeaderMenuItem
        key="copy-with-header-menu-item"
        selectedData={selectedData.highlightedData}
        onSelection={handleContextMenuSelected}
      />,
    ];
    if (emitCrossFiltersStateful) {
      menuItems = [
        ...menuItems,
        <EmitFilterMenuItem
          onClick={() => {
            onClick(selectedData.highlightedData);
          }}
          onSelection={handleContextMenuSelected}
          label="Emit Filter(s)"
          disabled={!Object.keys(selectedData.highlightedData).length}
          key="emit-filters"
          icon={
            <EmitIcon
              disabled={!Object.keys(selectedData.highlightedData).length}
            />
          }
        />,
        <EmitFilterMenuItem
          onClick={() => {
            onClick(selectedData.highlightedData, true);
          }}
          onSelection={handleContextMenuSelected}
          label="Filter on Selection"
          disabled={!Object.keys(selectedData.highlightedData).length}
          key="filter-on-selection"
          icon={
            <EmitIcon
              disabled={!Object.keys(selectedData.highlightedData).length}
            />
          }
        />,
        <EmitFilterMenuItem
          onClick={() => {
            onClick(selectedData.principalData);
          }}
          onSelection={handleContextMenuSelected}
          label="Emit Principle Column Filter(s)"
          key="emit-principle-column-filters"
          disabled={!Object.keys(selectedData.principalData).length}
          icon={
            <EmitIcon
              disabled={!Object.keys(selectedData.principalData).length}
            />
          }
        />,
        <EmitFilterMenuItem
          onSelection={handleContextMenuSelected}
          onClick={() => dispatch(clearDataMask(formData.sliceId))}
          label="Clear Emitted Filter(s)"
          key="clear-emitted-filters"
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          <div css={headerStyles}>
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
            {formData.enableActionButton && (
              <Button
                buttonStyle="secondary"
                css={actionStyles}
                href={formData.url}
                target="_blank"
                referrerPolicy="noreferrer"
              >
                {t('Action Button')}
              </Button>
            )}
            <div style={{ flex: 1 }} />
            {includeSearch && (
              <span>
                Search{' '}
                <input
                  className="form-control input-sm"
                  placeholder={`${rowData.length} records...`}
                  value={searchValue}
                  onChange={setSearch}
                />
              </span>
            )}
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
