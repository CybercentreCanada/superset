import React, {
  ChangeEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import 'ag-grid-enterprise';

import { AgGridReact, AgGridReact as AgGridReactType } from 'ag-grid-react';

import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { RangeSelectionModule } from '@ag-grid-enterprise/range-selection';
import { RichSelectModule } from '@ag-grid-enterprise/rich-select';
import { RowGroupingModule } from '@ag-grid-enterprise/row-grouping';
import { LicenseManager } from '@ag-grid-enterprise/core';
import { CloseOutlined, FilterOutlined } from '@ant-design/icons';
import { Filter, css, ensureIsArray, isNativeFilter } from '@superset-ui/core';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-balham.css';
import { ModuleRegistry } from '@ag-grid-community/core';
import {
  CellRange,
  GetMainMenuItemsParams,
  MenuItemDef,
} from 'ag-grid-community';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from 'src/dashboard/types';
import { clearDataMask } from 'src/dataMask/actions';
import _ from 'lodash';
import useEmitGlobalFilter from 'src/cccs-viz/plugins/hooks/useEmitGlobalFilter';
import { Menu } from 'src/components/Menu';
import ChartContextMenu, {
  Ref as ContextRef,
} from './ContextMenu/AGGridContextMenu';

import CopyMenuItem from './ContextMenu/MenuItems/CopyMenuItem';
import CopyWithHeaderMenuItem from './ContextMenu/MenuItems/CopyWithHeaderMenuItem';
import EmitFilterMenuItem from './ContextMenu/MenuItems/EmitFilterMenuItem';
import RetainEmlMenuItem from './ContextMenu/MenuItems/RetainEmlMenuItem';
import { PAGE_SIZE_OPTIONS } from '../cccs-grid/plugin/controlPanel';

import EmitIcon from '../../../components/EmitIcon';
import { AGGridVizProps, DataMap, GridData } from '../types';
import ExportMenu from './ContextMenu/MenuItems/ExportMenu';
import { getJumpToDashboardContextMenuItems } from './JumpActionConfigControl/utils';
import OpenInAssemblyLineMenuItem from './ContextMenu/MenuItems/OpenInAssemblyLineMenuItem';

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
  agGridLicenseKey,
  assemblyLineUrl,
  enableAlfred,
  emitCrossFilters,
  jumpActionConfigs,
}: AGGridVizProps) {
  LicenseManager.setLicenseKey(agGridLicenseKey);

  const crossFilterValue = useSelector<RootState, any>(
    state => state.dataMask[formData.sliceId]?.filterState?.value,
  );
  const dispatch = useDispatch();
  const emitGlobalFilter = useEmitGlobalFilter();

  const contextMenuRef = useRef<ContextRef>(null);

  const [, setInContextMenu] = useState<boolean>(true);
  const [selectedData, setSelectedData] = useState<GridData>({
    highlightedData: {},
    principalData: {},
    advancedTypeData: {},
    jumpToData: {},
  });
  const [menuItems, setMenuItems] = useState<JSX.Element[]>([]);
  const [searchValue, setSearchValue] = useState('');
  const [pageSize, setPageSize] = useState(pageLength);
  const [isDestroyed, setIsDestroyed] = useState(false);
  const [contextDivID] = useState(Math.random());

  const gridRef = useRef<AgGridReactType>(null);

  const updatePageSize = useCallback((newSize: number) => {
    gridRef.current?.api?.paginationSetPageSize(newSize);
    setPageSize(newSize <= 0 ? 0 : newSize);
  }, []);

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

  const unnestValue = (value: string): string[] => {
    let parsed;
    try {
      parsed = JSON.parse(value);
      return parsed;
    } catch (e) {
      return [value];
    }
  };

  const onRangeSelectionChanged = useCallback(() => {
    const api = gridRef.current!.api!;
    const cellRanges = api.getCellRanges();

    const col_api = gridRef.current!.columnApi!;
    const all_columns = col_api.getColumns();

    const newSelectedData: { [key: string]: string[] } = {};
    const newPrincipalData: { [key: string]: string[] } = {};
    const advancedTypeData: { [key: string]: string[] } = {};
    const jumpToData: { [key: string]: string[] } = {};

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
        _.range(startRow, endRow + 1).forEach(rowIndex => {
          const rowNode = api.getModel().getRow(rowIndex)!;

          all_columns?.forEach((column: any) => {
            const colDef = column.getColDef();
            const col = colDef.field;
            const value = api.getValue(column, rowNode);
            const formattedValue: any[] =
              typeof value === 'string'
                ? unnestValue(value).map(v =>
                    colDef.valueFormatter?.name ? colDef.valueFormatter(v) : v,
                  )
                : [value];
            const advancedType: string = colDef?.advancedDataType
              ? String(colDef.advancedDataType)
              : colDef?.type
              ? String(colDef.type)
              : 'NoType';
            if (range.columns.map(c => c.getColDef().field).includes(col)) {
              newSelectedData[col] = newSelectedData[col] || [];
              if (!newSelectedData[col].includes(value)) {
                newSelectedData[col].push(value);
              }
              jumpToData[advancedType] = jumpToData[advancedType] || [];
              formattedValue.forEach(v => {
                if (v && !jumpToData[advancedType].includes(v)) {
                  jumpToData[advancedType].push(v);
                }
              });
            }
            if (principalColumns.includes(col)) {
              newPrincipalData[col] = newPrincipalData[col] || [];
              if (!newPrincipalData[col].includes(value)) {
                newPrincipalData[col].push(value);
              }
            }
            advancedTypeData[advancedType] =
              advancedTypeData[advancedType] || [];
            formattedValue.forEach(v => {
              if (v && !advancedTypeData[advancedType].includes(v)) {
                advancedTypeData[advancedType].push(v);
              }
            });
          });
        });
      });
    }
    setSelectedData({
      highlightedData: newSelectedData,
      principalData: newPrincipalData,
      advancedTypeData,
      jumpToData,
    });
  }, [principalColumns]);

  const onClick = useCallback(
    (data: DataMap, globally = false) => {
      emitFilter(data, globally);
    },
    [emitFilter],
  );

  const handleContextMenu = useCallback(() => {
    contextMenuRef.current?.close();
  }, []);

  const copyText = (withHeaders?: boolean) => {
    gridRef.current?.api?.copySelectedRangeToClipboard({
      includeHeaders: withHeaders || false,
    });
    handleContextMenu();
  };

  const adhocFiltersInScope = useSelector<RootState, Filter[]>(
    state =>
      Object.values(state.nativeFilters.filters).filter(
        f =>
          isNativeFilter(f) &&
          f.filterType === 'filter_adhoc' &&
          f.chartsInScope?.includes(formData.sliceId),
      ) as Filter[],
  );

  useEffect(() => {
    let menuItems = [
      <CopyMenuItem onClick={copyText} />,
      <CopyWithHeaderMenuItem onClick={() => copyText(true)} />,
    ];
    if (emitCrossFilters) {
      menuItems = [
        ...menuItems,
        <Menu.Divider key="filter-on-select-divider" />,
        <EmitFilterMenuItem
          onClick={() => {
            onClick(selectedData.highlightedData, true);
          }}
          onSelection={handleContextMenu}
          label="Filter On Selection"
          disabled={!adhocFiltersInScope.length}
          key="filter-on-selection"
          icon={
            <FilterOutlined
              disabled={!Object.keys(selectedData.highlightedData).length}
            />
          }
          tooltip={
            !adhocFiltersInScope.length
              ? 'No adhoc filter exists with this chart in scope'
              : adhocFiltersInScope.length > 1
              ? `Will apply selection to adhoc filters: ${adhocFiltersInScope
                  .map(f => f.name)
                  .join(', ')}`
              : `Will apply selection to adhoc filter: ${adhocFiltersInScope[0].name}`
          }
        />,
        <Menu.Divider key="cross-filter-divider-start" />,
        <EmitFilterMenuItem
          onClick={() => {
            onClick(selectedData.highlightedData);
          }}
          onSelection={handleContextMenu}
          label="Emit Filter(s)"
          disabled={Object.keys(selectedData.highlightedData).length === 0}
          key={contextDivID.toString()}
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
          disabled={Object.keys(selectedData.principalData).length === 0}
          icon={
            <EmitIcon
              disabled={!Object.keys(selectedData.principalData).length}
            />
          }
        />,
        <EmitFilterMenuItem
          onSelection={handleContextMenu}
          onClick={() => dispatch(clearDataMask(formData.sliceId))}
          label="Clear Emited Filter(s)"
          disabled={crossFilterValue === undefined}
          icon={<CloseOutlined />}
        />,
      ];
    }
    // special menu items
    let specialMenuItems: JSX.Element[] = [];
    if (
      enableAlfred &&
      selectedData.advancedTypeData.harmonized_email_id &&
      selectedData.advancedTypeData.harmonized_email_id.length > 0
    ) {
      specialMenuItems = [
        ...specialMenuItems,
        <RetainEmlMenuItem
          onSelection={handleContextMenu}
          label="Retain EML record to ALFRED"
          key="retain-eml"
          data={selectedData.advancedTypeData.harmonized_email_id}
        />,
      ];
    }
    if (
      assemblyLineUrl &&
      selectedData.advancedTypeData.file_sha256 &&
      selectedData.advancedTypeData.file_sha256.length > 0
    ) {
      specialMenuItems = [
        ...specialMenuItems,
        <OpenInAssemblyLineMenuItem
          onSelection={handleContextMenu}
          label="Open in ASSEMBLYLINE"
          key="open-file-in-assembly-line"
          data={selectedData.advancedTypeData.file_sha256}
          base_url={assemblyLineUrl}
        />,
      ];
    }
    if (jumpActionConfigs) {
      const disabled =
        jumpActionConfigs.filter(j =>
          Object.keys(selectedData.jumpToData).includes(j.advancedDataType),
        ).length <= 0;
      specialMenuItems = [
        ...specialMenuItems,
        getJumpToDashboardContextMenuItems(
          jumpActionConfigs,
          selectedData.jumpToData,
          disabled,
        ),
      ];
    }
    if (specialMenuItems.length) {
      menuItems = [
        ...menuItems,
        <Menu.Divider key="special-items-divider" />,
        ...specialMenuItems,
      ];
    }
    menuItems = [
      ...menuItems,
      <Menu.Divider key="export-divider" />,
      <ExportMenu key="export-csv" api={gridRef.current!.api} />,
    ];
    setMenuItems(menuItems);
  }, [
    contextDivID,
    crossFilterValue,
    emitCrossFilters,
    formData.sliceId,
    jumpActionConfigs,
    selectedData.highlightedData,
    selectedData.jumpToData,
    selectedData.principalData,
    adhocFiltersInScope.length,
  ]);

  const handleOnContextMenu = (
    offsetX: number,
    offsetY: number,
    filters: any,
  ) => {
    contextMenuRef.current?.open(offsetX, offsetY, filters);
    setInContextMenu(true);
  };
  const onContextMenu = (event: any) => {
    event.preventDefault();
    handleOnContextMenu(event.clientX, event.clientY, []);
  };

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
  }, [enableGrouping]);

  const getMainMenuItems = (
    params: GetMainMenuItemsParams,
  ): (string | MenuItemDef)[] => {
    const menuItems: (MenuItemDef | string)[] = [];
    const itemsToExclude = ['rowGroup'];
    params.defaultItems.forEach((item: string) => {
      if (itemsToExclude.indexOf(item) < 0) {
        menuItems.push(item);
      }
    });
    return menuItems;
  };

  return !isDestroyed ? (
    <>
      <ChartContextMenu
        ref={contextMenuRef}
        id={contextDivID}
        formData={formData}
        onSelection={handleContextMenu}
        onClose={handleContextMenu}
        menuItems={menuItems}
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
          getMainMenuItems={getMainMenuItems}
        />
      </div>
    </>
  ) : (
    <div />
  );
}
