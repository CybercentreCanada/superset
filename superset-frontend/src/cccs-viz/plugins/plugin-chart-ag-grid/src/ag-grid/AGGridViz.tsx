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
import { css, ensureIsArray } from '@superset-ui/core';
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
import { AGGridVizProps, DataMap, GridData } from '../types';

// Register the required feature modules with the Grid
ModuleRegistry.registerModules([
  ClientSideRowModelModule,
  RangeSelectionModule,
  RowGroupingModule,
  RichSelectModule,
]);

const DEFAULT_COL_DEF = {
  resizable: true,
  autoHeight: true,
  sortable: true,
  enableRowGroup: true,
};

const headerStyles = css`
  display: flex;
  flex-direction: row;
`;

const paginationStyles = css`
  margin-right: 0.5rem;
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

  const [selectedData, setSelectedData] = useState<GridData>({
    highlightedData: {},
    principalData: {},
    actionButtonData: [],
  });
  const [searchValue, setSearchValue] = useState('');
  const [pageSize, setPageSize] = useState(pageLength);
  const [isDestroyed, setIsDestroyed] = useState(false);
  const [contextDivID] = useState(Math.random());

  const gridRef = useRef<AgGridReactType>(null);

  const actionButtonLink = useMemo(() => {
    let values = selectedData.actionButtonData;
    if (!formData.enableMultiResults) {
      values = [values[0]];
    }

    if (formData.actionFindReplace) {
      const [regex, ...replaceStr] = formData.actionFindReplace
        .replace(/^\/(.+)\/$/, '$1')
        .split('/');

      values = values.map(v =>
        v.replace(new RegExp(regex, 'ig'), replaceStr.join('/')),
      );
    }

    return `${formData.actionUrl}?${encodeURIComponent(
      formData.parameterName,
    )}=${encodeURIComponent(
      formData.parameterPrefix +
        values.join(formData.actionJoinCharacter) +
        formData.parameterSuffix,
    )}`;
  }, [
    selectedData.actionButtonData,
    formData.enableMultiResults,
    formData.actionFindReplace,
    formData.actionUrl,
    formData.parameterName,
    formData.parameterPrefix,
    formData.actionJoinCharacter,
    formData.parameterSuffix,
  ]);

  const updatePageSize = useCallback((newSize: number) => {
    gridRef.current?.api?.paginationSetPageSize(newSize);
    setPageSize(newSize <= 0 ? 0 : newSize);
  }, []);

  const setSearch = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    setSearchValue(e.target.value);
  }, []);

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
        emitGlobalFilter(formData.sliceId, groupBy);
      }
    },
    [emitGlobalFilter, formData.sliceId, setDataMask],
  ); // only take relevant page size options

  const handleOnClickBehavior = useCallback(
    (highlightedData: DataMap, principalData: DataMap) => {
      // handle default click behaviour
      if (onClickBehaviour !== 'None' && emitCrossFilters) {
        // get action
        const action = DEFAULT_CLICK_ACTIONS.find(
          a => a.verbose_name === onClickBehaviour,
        )?.action_name;

        // handle action
        if (action === 'emit_filters') {
          emitFilter(highlightedData);
        } else if (action === 'emit_principal_filters') {
          emitFilter(principalData);
        }
      }
    },
    [emitCrossFilters, emitFilter, onClickBehaviour],
  );

  const onRangeSelectionChanged = useCallback(() => {
    const cellRanges = gridRef.current!.api.getCellRanges();
    const newSelectedData: { [key: string]: string[] } = {};
    const newPrincipalData: { [key: string]: string[] } = {};
    const newActionButtonData: any[] = [];

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
          const rowNode = api.getModel().getRow(rowIndex)!;

          range.columns.forEach((column: any) => {
            const col = column.colDef?.field;

            if (col) {
              newSelectedData[col] = newSelectedData[col] || [];
              const value = api.getValue(column, rowNode);

              if (!newSelectedData[col].includes(value)) {
                newSelectedData[col].push(value);
              }
            }
          });

          principalColumns.forEach((column: string) => {
            newPrincipalData[column] = newPrincipalData[column] || [];
            const value = api.getValue(column, rowNode);

            if (!newPrincipalData[column].includes(value)) {
              newPrincipalData[column].push(value);
            }
          });

          if (formData.enableActionButton) {
            const value = api
              .getValue(formData.columnForValue, rowNode)
              .toString();

            if (value && !newActionButtonData.includes(value)) {
              newActionButtonData.push(value);
            }
          }
        });
      });
    }

    setSelectedData({
      highlightedData: newSelectedData,
      principalData: newPrincipalData,
      actionButtonData: newActionButtonData,
    });

    if (!_.isEmpty(newSelectedData)) {
      handleOnClickBehavior(newSelectedData, newPrincipalData);
    }
  }, [
    formData.columnForValue,
    formData.enableActionButton,
    handleOnClickBehavior,
    principalColumns,
  ]);

  const onClick = useCallback(
    (data: DataMap, globally = false) => {
      emitFilter(data, globally);
    },
    [emitFilter],
  );

  const handleContextMenu = useCallback(() => {
    contextMenuRef.current?.close();
  }, []);

  const handleOnContextMenu = useCallback(
    (offsetX: number, offsetY: number, filters: any) => {
      let menuItems = [
        <CopyMenuItem
          key="copy-menu-item"
          selectedData={selectedData.highlightedData}
          onSelection={handleContextMenu}
        />,
        <CopyWithHeaderMenuItem
          key="copy-with-header-menu-item"
          selectedData={selectedData.highlightedData}
          onSelection={handleContextMenu}
        />,
      ];

      if (emitCrossFilters) {
        menuItems = [
          ...menuItems,
          <EmitFilterMenuItem
            onClick={() => {
              onClick(selectedData.highlightedData);
            }}
            onSelection={handleContextMenu}
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
            onSelection={handleContextMenu}
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
            onSelection={handleContextMenu}
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
            onSelection={handleContextMenu}
            onClick={() => dispatch(clearDataMask(formData.sliceId))}
            label="Clear Emitted Filter(s)"
            key="clear-emitted-filters"
            disabled={crossFilterValue === undefined}
            icon={<CloseOutlined />}
          />,
        ];
      }
      contextMenuRef.current?.open(offsetX, offsetY, filters, menuItems);
    },
    [
      crossFilterValue,
      dispatch,
      emitCrossFilters,
      formData.sliceId,
      handleContextMenu,
      onClick,
      selectedData.highlightedData,
      selectedData.principalData,
    ],
  );

  const onContextMenu = useCallback(
    (event: any) => {
      event.preventDefault();
      handleOnContextMenu(event.clientX, event.clientY, []);
    },
    [handleOnContextMenu],
  );

  const destroyGrid = useCallback(() => {
    setIsDestroyed(true);
    setTimeout(() => setIsDestroyed(false), 0);
  }, []);

  useEffect(() => {
    updatePageSize(pageLength);
  }, [pageLength, updatePageSize]);

  useEffect(() => {
    if (!includeSearch) {
      setSearchValue('');
    }
  }, [includeSearch]);

  useEffect(() => {
    destroyGrid();
  }, [destroyGrid, enableGrouping]);

  return !isDestroyed ? (
    <>
      <ChartContextMenu
        ref={contextMenuRef}
        id={contextDivID}
        formData={formData}
        onSelection={handleContextMenu}
        onClose={handleContextMenu}
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
              <span
                className="dt-select-page-size form-inline"
                css={paginationStyles}
              >
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
                href={actionButtonLink}
                target="_blank"
                referrerPolicy="noreferrer"
                disabled={!selectedData.actionButtonData.length}
              >
                {formData.actionButtonLabel}
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
          columnDefs={columnDefs}
          defaultColDef={DEFAULT_COL_DEF}
          enableRangeSelection
          rowData={rowData}
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
