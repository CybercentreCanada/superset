import { ChangeEvent, useCallback, useEffect, useRef, useState } from 'react';

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
import { range as lodashRange } from 'lodash';
import useEmitGlobalFilter from 'src/cccs-viz/plugins/hooks/useEmitGlobalFilter';
import { Menu } from 'src/components/Menu';
import { addWarningToast } from 'src/components/MessageToasts/actions';
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
import DownloadEmailMenuItem from './ContextMenu/MenuItems/DownloadEmailMenuItem';
import OpenInAssemblyLineMenuItem from './ContextMenu/MenuItems/OpenInAssemblyLineMenuItem';
import SubmitToAssemblyLineMenuItem from './ContextMenu/MenuItems/SubmitToAssemblyLineMenuItem';

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

const RETENTION_LIMIT = 100;
const SUBMISSION_LIMIT = 10;
const DOWNLOAD_LIMIT = 10;

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
  enableDownload,
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
    selectedColData: {},
    typeData: {},
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
    (
      data: DataMap,
      globally = false,
      selectedColData?: { [key: string]: any },
    ) => {
      let groupBy: [string, any][] = Object.entries(data);

      // If not global, use the same setup as usual
      if (!globally) {
        if (selectedColData) {
          // filter out json columns
          if (Object.values(selectedColData).some(c => c.type === 'JSON')) {
            groupBy = groupBy.filter(
              entry => selectedColData[entry[0]]?.type !== 'JSON',
            );
            dispatch(
              addWarningToast('Removing JSON values from cross-filters'),
            );
          }
        }
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
        emitGlobalFilter(formData.sliceId, groupBy, selectedColData);
      }
    },
    [dispatch, emitGlobalFilter, formData.sliceId, setDataMask],
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
    const typeData: { [key: string]: string[] } = {};
    const selectedColData: { [key: string]: any } = {};
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
        lodashRange(startRow, endRow + 1).forEach(rowIndex => {
          const rowNode = api.getModel().getRow(rowIndex)!;

          all_columns?.forEach((column: any) => {
            const colDef = column.getColDef();
            const col = colDef.field;
            const value = api.getValue(column, rowNode);
            const unnested = ensureIsArray(unnestValue(value));
            const formattedValue: any[] =
              typeof value === 'string' && unnested?.length
                ? unnested.map(v =>
                    colDef.valueFormatter?.name ? colDef.valueFormatter(v) : v,
                  )
                : [value];
            const dataType: string = colDef?.advancedDataType
              ? String(colDef.advancedDataType)
              : colDef?.type
                ? String(colDef.type)
                : 'NoType';
            if (range.columns.map(c => c.getColDef().field).includes(col)) {
              newSelectedData[col] = newSelectedData[col] || [];
              if (!newSelectedData[col].includes(value)) {
                newSelectedData[col].push(value);
              }
              if (!selectedColData?.[col]) {
                selectedColData[col] = colDef;
              }
              jumpToData[dataType] = jumpToData[dataType] || [];
              formattedValue.forEach(v => {
                if (v && !jumpToData[dataType].includes(v)) {
                  jumpToData[dataType].push(v);
                }
              });
            }
            if (principalColumns?.includes(col)) {
              newPrincipalData[col] = newPrincipalData[col] || [];
              if (!newPrincipalData[col].includes(value)) {
                newPrincipalData[col].push(value);
              }
            }
            typeData[dataType] = typeData[dataType] || [];
            formattedValue.forEach(v => {
              if (v && !typeData[dataType].includes(v)) {
                typeData[dataType].push(v);
              }
            });
          });
        });
      });
    }
    setSelectedData({
      highlightedData: newSelectedData,
      principalData: newPrincipalData,
      typeData,
      selectedColData,
      jumpToData,
    });
  }, [principalColumns]);

  const onClick = useCallback(
    (
      data: DataMap,
      globally = false,
      selectedColData?: { [key: string]: any },
    ) => {
      emitFilter(data, globally, selectedColData);
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
            onClick(
              selectedData.highlightedData,
              true,
              selectedData.selectedColData,
            );
          }}
          onSelection={handleContextMenu}
          label="Filter on selection"
          disabled={
            !adhocFiltersInScope.length ||
            Object.values(selectedData.selectedColData).every(
              data => data.type === 'JSON',
            )
          }
          key="filter-on-selection"
          icon={
            <FilterOutlined
              disabled={!Object.keys(selectedData.highlightedData).length}
            />
          }
          tooltip={
            !adhocFiltersInScope.length
              ? 'No adhoc filter exists with this chart in scope'
              : Object.values(selectedData.selectedColData).every(
                    data => data.type === 'JSON',
                  )
                ? 'JSON columns cannot be used as filters.'
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
            onClick(
              selectedData.highlightedData,
              false,
              selectedData.selectedColData,
            );
          }}
          onSelection={handleContextMenu}
          label="Add cross-filter(s)"
          disabled={
            Object.keys(selectedData.highlightedData).length === 0 ||
            Object.values(selectedData.selectedColData).every(
              data => data.type === 'JSON',
            )
          }
          key={contextDivID.toString()}
          icon={
            <EmitIcon
              disabled={!Object.keys(selectedData.highlightedData).length}
            />
          }
          tooltip={
            Object.values(selectedData.selectedColData).every(
              data => data.type === 'JSON',
            )
              ? 'JSON columns cannot be used as cross-filters.'
              : 'Cross-filter(s) will be applied to all charts whose datasets contain columns with the same name.'
          }
        />,
        <EmitFilterMenuItem
          onClick={() => {
            onClick(
              selectedData.principalData,
              false,
              selectedData.selectedColData,
            );
          }}
          onSelection={handleContextMenu}
          label="Add principle column cross-filter(s)"
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
          label="Remove cross-filters(s)"
          disabled={crossFilterValue === undefined}
          icon={<CloseOutlined />}
        />,
      ];
    }
    // special menu items
    let specialMenuItems: JSX.Element[] = [];
    if (
      enableAlfred &&
      selectedData.typeData.harmonized_email_id &&
      selectedData.typeData.harmonized_email_id.length > 0
    ) {
      specialMenuItems = [
        ...specialMenuItems,
        <RetainEmlMenuItem
          onSelection={handleContextMenu}
          label={
            selectedData.typeData.harmonized_email_id.length > 1
              ? 'Retain EML records to ALFRED'
              : 'Retain EML record to ALFRED'
          }
          key="retain-eml"
          data={{
            email_ids: Array.from(
              new Set(selectedData.typeData.harmonized_email_id),
            ),
            dates: [
              ...Object.entries(selectedData.typeData)
                .filter(k => k[0].includes('TIME'))
                .map(v => v[1])
                .flat(),
              ...(selectedData.typeData.DATE || []),
              ...(selectedData.typeData.DATETIME || []),
            ],
          }}
          disabled={
            selectedData.typeData.harmonized_email_id.length > RETENTION_LIMIT
          }
          tooltip={
            new Set(selectedData.typeData.harmonized_email_id).size >
            RETENTION_LIMIT
              ? `Cannot retain more than ${RETENTION_LIMIT} unique harmonized email IDs.`
              : undefined
          }
        />,
      ];
    }
    if (
      assemblyLineUrl &&
      selectedData.typeData.file_sha256 &&
      selectedData.typeData.file_sha256.length > 0 &&
      selectedData.typeData.file_sha256[0].length > 3
    ) {
      specialMenuItems = [
        ...specialMenuItems,
        <OpenInAssemblyLineMenuItem
          onSelection={handleContextMenu}
          label="Open in ASSEMBLYLINE"
          key="open-file-in-assembly-line"
          data={selectedData.typeData.file_sha256}
          base_url={assemblyLineUrl}
        />,
      ];
    }
    if (
      assemblyLineUrl &&
      selectedData.typeData.eml_path &&
      selectedData.typeData.eml_path.length > 0 &&
      selectedData.typeData.eml_path[0].length > 3
    ) {
      // Create a set to remove duplicate items
      const uniqueEmlPaths = new Set(selectedData.typeData.eml_path);
      specialMenuItems = [
        ...specialMenuItems,
        <SubmitToAssemblyLineMenuItem
          onSelection={handleContextMenu}
          label={
            uniqueEmlPaths.size > 1
              ? 'Submit files to ASSEMBLYLINE'
              : 'Submit file to ASSEMBLYLINE'
          }
          key="submit-file-to-assembly-line"
          data={Array.from(uniqueEmlPaths)} // Convert set back to an array
          base_url={assemblyLineUrl}
          disabled={uniqueEmlPaths.size > SUBMISSION_LIMIT}
          tooltip={
            uniqueEmlPaths.size > SUBMISSION_LIMIT
              ? `You cannot submit more than ${SUBMISSION_LIMIT} EML files at a time.`
              : `A new tab will open for each distinct EML path submission.`
          }
        />,
      ];
    }
    if (
      enableDownload &&
      selectedData.typeData.eml_path &&
      selectedData.typeData.eml_path.length > 0 &&
      selectedData.typeData.eml_path[0].length > 3
    ) {
      const uniqueEmlPaths = new Set(selectedData.typeData.eml_path);
      specialMenuItems = [
        ...specialMenuItems,
        <DownloadEmailMenuItem
          onSelection={handleContextMenu}
          label={
            uniqueEmlPaths.size > 1 ? 'Download EML files' : 'Download EML file'
          }
          key="download-email"
          data={Array.from(uniqueEmlPaths)}
          disabled={uniqueEmlPaths.size > DOWNLOAD_LIMIT}
          tooltip={
            uniqueEmlPaths.size > DOWNLOAD_LIMIT
              ? `You cannot download more than ${DOWNLOAD_LIMIT} EML files at a time.`
              : `A download will begin for each distinct EML file.`
          }
        />,
      ];
    }
    if (jumpActionConfigs?.length) {
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
          suppressFieldDotNotation
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
