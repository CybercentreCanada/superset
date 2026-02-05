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

    const [harmonizedEmailIds, setHarmonizedEmailIds] = useState<string[]>();
    const [fileSHA256s, setFileSHA256s] = useState<string[]>();

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

        const result: (DefaultMenuItem | MenuItemDef)[] = [
          'copy',
          'copyWithHeaders',
          'separator',
          // filter on selection,
          {
            name: 'Filter on selection',
            action: () => {
              console.log('filter on selection clicked');
            },
          },
          'separator',
          // add cross-filter(s),
          // add principle column cross-filter(s),
          // remove cross-filter(s),
          'separator',
          // {
          //   name: 'Retain EML record(s) to ALFRED',
          //   disabled: params.node?.data?.length > RETENTION_LIMIT,
          //   tooltip:
          //     params.node?.data?.length > RETENTION_LIMIT
          //       ? `Cannot retain more than ${RETENTION_LIMIT} unique harmonized email IDs.`
          //       : undefined,
          //   action: () => {
          //     const email_ids =
          //       params.node?.data?.map((d: any) => d.harmonized_email_id) ?? [];
          //   },
          // },
          {
            name: 'Open in ASSEMBLYLINE',
            // icon: AssemblyLineLogo,
            action: () => {
              console.log('hello');
              // const data =
              //   params.node?.data?.map((d: any) => d.file_sha256) ?? [];
              // console.log(
              //   `Would open URL: window.open(\`https://${assemblyLineUrl}/search/submission?query=${data.join('+')}\`)`,
              // );
            },
          },
          // {
          //   name: 'Submit file(s) to ASSEMBLYLINE',
          //   // icon: `<img src="${AssemblyLineLogo}" />`,
          //   disabled: params.node?.data?.length > SUBMISSION_LIMIT,
          //   tooltip:
          //     params.node?.data?.length > SUBMISSION_LIMIT
          //       ? `You cannot submit more than ${SUBMISSION_LIMIT} EML files at a time.`
          //       : `A new tab will open for each distinct EML path submission.`,
          //   action: () => {
          //     const data = params.node?.data?.map((d: any) => d.eml_path) ?? [];
          //     for (const d of data) {
          //       console.log(
          //         `Would open URL: window.open(\`https://${assemblyLineUrl}/search/submission?query=${d}\`)`,
          //       );
          //     }
          //   },
          // },
          // {
          //   name: 'Download EML file(s)',
          //   disabled: params.node?.data?.length > DOWNLOAD_LIMIT,
          //   tooltip:
          //     params.node?.data?.length > DOWNLOAD_LIMIT
          //       ? `You cannot download more than ${DOWNLOAD_LIMIT} EML files at a time.`
          //       : `A download will begin for each distinct EML file.`,
          //   action: () => {
          //     const data = params.node?.data?.map((d: any) => d.eml_path) ?? [];
          //     for (const d of data) {
          //       console.log(
          //         `TODO omg this actually does something. "Download" file at /api/v1/fission/get-eml?file=${d}`,
          //       );
          //     }
          //   },
          // },
          // 'separator',
          // {
          //   name: 'something about jump to dashboard configs here',
          // },
          'separator',
          'export',
        ];

        return result;
      },
      [],
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
