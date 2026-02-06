import AssemblyLineLogo from 'src/cccs-viz/plugins/components/assemblyline-logo.png';
import AssemblyLineIcon from 'src/cccs-viz/plugins/components/AssemblyLineIcon';

import {
  useMemo,
  memo,
  useRef,
  useCallback,
  useState,
  ChangeEvent,
  FunctionComponent,
} from 'react';

import {
  CellSelectionChangedEvent,
  ClientSideRowModelModule,
  ColDef,
  DefaultMenuItem,
  GetContextMenuItemsParams,
  GetRowIdParams,
  MenuItemDef,
  QuickFilterModule,
  RowSelectionModule,
  ValidationModule,
} from 'ag-grid-community';
import {
  LicenseManager,
  CellSelectionModule,
  ClipboardModule,
  ColumnMenuModule,
  ContextMenuModule,
  ExcelExportModule,
  RichSelectModule,
  RowGroupingModule,
  RowGroupingPanelModule,
  GroupFilterModule,
  PivotModule,
  TreeDataModule,
} from 'ag-grid-enterprise';
import {
  Icons,
  Input,
  ThemedAgGridReact,
  ThemedAgGridReactProps,
} from '@superset-ui/core/components';

import { AgGridReact } from '@superset-ui/core/components/ThemedAgGridReact';
import { useTheme } from '@superset-ui/core';
import { PAGE_SIZE_OPTIONS } from '../consts';

// Module TODOs:
//  - Search/find: Make it pretty. Also I broke the CSS and the pagination stuff isn't visible anymore
//  - Context menu:
//    - Add back the contextual logic once I have all the menu items working
//    - Superset's DTD menu appears on the first right click. This is wrong.
//    - Drill to detail: Flag is always on now but need the "canExplore" permission, there's a usePermissions() hook for that

const DEFAULT_COL_DEF: ColDef = {
  resizable: true,
  autoHeight: true,
  sortable: true,
  enableRowGroup: true,
};

const RETENTION_LIMIT = 100;
const SUBMISSION_LIMIT = 10;
const DOWNLOAD_LIMIT = 10;

export interface ThemedCCCSGridVizProps extends ThemedAgGridReactProps {
  includeSearch: boolean;
  pageLength: number;
  enableGrouping: boolean;
  agGridLicenseKey: string;
  height: number;
  assemblyLineUrl: string;
  enableAlfred: boolean;
  enableDownload: boolean;
  emitCrossFilters: boolean;
}

const AGGridViz: FunctionComponent<ThemedCCCSGridVizProps> = memo(
  ({
    columnDefs,
    rowData,
    height,
    includeSearch,
    pageLength = 0,
    enableGrouping,
    agGridLicenseKey,
    assemblyLineUrl,
    enableAlfred,
    enableDownload,
    emitCrossFilters,
  }) => {
    const theme = useTheme();

    const gridRef = useRef<AgGridReact>(null);
    const defaultColDef = useMemo<ColDef>(() => DEFAULT_COL_DEF, []);
    const containerRef = useRef<HTMLDivElement>(null);

    // Some of the grid menus are transparent and illegible, these overrides fix that.
    const themeOverrides = useMemo(
      () => ({
        menuBackgroundColor: theme.colorBgElevated,
        pickerListBackgroundColor: theme.colorBgElevated,
      }),
      [theme.colorBgElevated],
    );

    const headerStyles = useMemo(
      () => ({ width: 'auto', paddingBottom: theme.sizeUnit }),
      [theme.sizeUnit],
    );
    const containerStyles = useMemo(() => ({ height }), [height]);
    const gridStyle = useMemo(() => ({ height: '100%' }), []);

    const paginationPageSizeSelector = useMemo<number[] | boolean>(
      () => (pageLength > 0 ? PAGE_SIZE_OPTIONS : false),
      [pageLength],
    );

    const rowGroupPanelShow = useMemo<'always' | 'never'>(
      () => (enableGrouping ? 'always' : 'never'),
      [enableGrouping],
    );

    const [quickFilterText, setQuickFilterText] = useState<string>();

    const onFilterTextBoxChanged = useCallback(
      ({ target: { value } }: ChangeEvent<HTMLInputElement>) => {
        setQuickFilterText(value);
      },
      [],
    );

    const [harmonizedEmailIds, setHarmonizedEmailIds] = useState<string[]>([]);
    const [emlPaths, setEmlPaths] = useState<string[]>([]);
    const [fileSHA256s, setFileSHA256s] = useState<string[]>([]);

    const onCellSelectionChanged = useCallback(
      (e: CellSelectionChangedEvent) => {
        if (!e.started && e.finished) {
          const gridApi = e.api;

          const selectedHarmonizedEmailIds = [];
          const selectedFileSHA256s = [];

          const cellRanges = gridApi.getCellRanges() ?? [];
          for (const range of cellRanges) {
            if (range.startRow && range.endRow) {
              const hasHarmonizedEmailIds = range.columns.some(
                col =>
                  col.getColDef().advancedDataType === 'harmonized_email_id',
              );
              const hasFileSHA256s = range.columns.some(
                col => col.getColDef().advancedDataType === 'file_sha256',
              );

              const startIdx = Math.min(
                range.startRow.rowIndex,
                range.endRow.rowIndex,
              );
              const endIdx = Math.max(
                range.startRow.rowIndex,
                range.endRow.rowIndex,
              );

              // Iterate over the selected data for what we're interested in
              for (let i = startIdx; i < endIdx + 1; i += 1) {
                const row = gridApi.getDisplayedRowAtIndex(i);

                if (row) {
                  if (hasHarmonizedEmailIds) {
                    selectedHarmonizedEmailIds.push(row.data.id);
                  }
                  if (hasFileSHA256s) {
                    selectedFileSHA256s.push(row.data.file_sha256);
                  }
                } else {
                  console.error('Missing row displayed at index ', i);
                }
              }
            }
          }
          setHarmonizedEmailIds(selectedHarmonizedEmailIds);
          setFileSHA256s(selectedFileSHA256s);
        }
      },
      [],
    );

    const getContextMenuItems = useCallback(
      (
        params: GetContextMenuItemsParams,
      ): (DefaultMenuItem | MenuItemDef)[] => {
        const contextMenuItems: (DefaultMenuItem | MenuItemDef)[] = [
          'copy',
          'copyWithHeaders',
          'separator',
        ];

        if (emitCrossFilters) {
          contextMenuItems.push('separator');
          contextMenuItems.push({
            name: 'Filter on selection',
            disabled: false,
            action: () => console.log('filter on selection clicked'),
          });
          contextMenuItems.push('separator');
          contextMenuItems.push({
            name: 'Add cross-filter(s)',
            disabled: false,
            action: () => console.log('Add cross-filter(s) clicked'),
          });
          contextMenuItems.push({
            name: 'Add principle column cross-filter(s)',
            disabled: false,
            action: () =>
              console.log('Add principle column cross-filter(s) clicked'),
          });
          contextMenuItems.push({
            name: 'Remove cross-filters(s)',
            disabled: false,
            action: () => console.log('Remove cross-filters(s) clicked'),
          });
        }

        if (enableAlfred && harmonizedEmailIds.length > 0) {
          contextMenuItems.push('separator');
          contextMenuItems.push({
            name: 'Retain EML record(s) to ALFRED',
            disabled: false,
            action: () => console.log('Retain EML record(s) to ALFRED clicked'),
          });
        }

        if (assemblyLineUrl && fileSHA256s.length > 0) {
          contextMenuItems.push({
            name: 'Open in ASSEMBLYLINE',
            // icon: AssemblyLineLogo,
            disabled:
              fileSHA256s.length > 0 && fileSHA256s.length < SUBMISSION_LIMIT,
            action: () => {
              console.log(
                `Would open URL: window.open(\`https://${assemblyLineUrl}/search/submission?query=${fileSHA256s.join('+')}\`)`,
              );
            },
          });
        }

        if (assemblyLineUrl && emlPaths.length > 0) {
          contextMenuItems.push({
            name: 'Submit file(s) to Assemblyline',
            disabled: false,
            action: () => console.log('Submit to Assemblyline clicked'),
          });
        }

        if (enableDownload && emlPaths.length > 0) {
          contextMenuItems.push({
            name: 'Download EML file(s)',
            disabled: false,
            action: () => console.log('Download EML file(s) clicked'),
          });
        }

        // jump action configs

        contextMenuItems.push('separator');
        contextMenuItems.push('export');

        return contextMenuItems;
      },
      [
        assemblyLineUrl,
        emitCrossFilters,
        emlPaths.length,
        enableAlfred,
        enableDownload,
        fileSHA256s,
        harmonizedEmailIds.length,
      ],
    );

    LicenseManager.setLicenseKey(agGridLicenseKey);

    return (
      <div style={containerStyles}>
        {includeSearch && (
          <div style={headerStyles}>
            <Input
              allowClear
              type="text"
              placeholder="Search..."
              onInput={onFilterTextBoxChanged}
              prefix={
                <Icons.SearchOutlined
                  iconColor={theme.colorIcon}
                  iconSize="l"
                />
              }
            />
          </div>
        )}
        <div ref={containerRef} style={gridStyle}>
          <ThemedAgGridReact
            themeOverrides={themeOverrides}
            ref={gridRef}
            rowData={rowData}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            // Cell selection - I'm struggling
            cellSelection
            onCellSelectionChanged={onCellSelectionChanged}
            // Let's try row selection
            // rowSelection="multiple" // TODO use the new RowSelectionOptions interface
            // onSelectionChanged={onSelectionChanged}
            cacheQuickFilter
            quickFilterText={quickFilterText}
            pagination={pageLength > 0}
            paginationPageSize={pageLength}
            paginationPageSizeSelector={paginationPageSizeSelector}
            getContextMenuItems={getContextMenuItems}
            modules={[
              ClientSideRowModelModule,
              CellSelectionModule,
              RowSelectionModule,
              RichSelectModule,
              ColumnMenuModule,
              QuickFilterModule,
              // row grouping modules
              // TODO revisit if TreeData/Pivot/GroupFilter still needed
              RowGroupingModule,
              RowGroupingPanelModule,
              TreeDataModule,
              PivotModule,
              GroupFilterModule,
              // context menu modules
              ClipboardModule,
              ContextMenuModule,
              ExcelExportModule,
              // ValidationModule is a development helper
              ...(process.env.NODE_ENV !== 'production'
                ? [ValidationModule]
                : []),
            ]}
            rowGroupPanelShow={rowGroupPanelShow}
          />
        </div>
      </div>
    );
  },
);

export default memo(AGGridViz);
