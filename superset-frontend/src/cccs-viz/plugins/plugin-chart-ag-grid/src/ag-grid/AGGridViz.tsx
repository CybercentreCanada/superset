import AssemblyLineLogo from 'src/cccs-viz/plugins/components/assemblyline-logo.png';
import AssemblyLineIcon from 'src/cccs-viz/plugins/components/AssemblyLineIcon';

import {
  useMemo,
  memo,
  useRef,
  useCallback,
  useState,
  ChangeEvent,
} from 'react';

import {
  ClientSideRowModelModule,
  ColDef,
  DefaultMenuItem,
  GetContextMenuItemsParams,
  MenuItemDef,
  QuickFilterModule,
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
} from 'ag-grid-enterprise';
import {
  Image,
  Input,
  ThemedAgGridReact,
  ThemedAgGridReactProps,
} from '@superset-ui/core/components';

import { AgGridReact } from '@superset-ui/core/components/ThemedAgGridReact';
import { useTheme } from '@superset-ui/core';
import { PAGE_SIZE_OPTIONS } from '../consts';
import EmitFilterMenuItem from './ContextMenu/MenuItems/EmitFilterMenuItem';

// Module TODOs:
//  - Pagination: "All" option, on by default
//  - Row grouping: Show panel conditionally
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
  // contextMenuItems: ['copy', 'copyWithHeaders', 'export'],
};

const RETENTION_LIMIT = 100;
const SUBMISSION_LIMIT = 10;
const DOWNLOAD_LIMIT = 10;

export interface ThemedCCCSGridVizProps extends ThemedAgGridReactProps {
  agGridLicenseKey: string;
  height: number;
  assemblyLineUrl: string;
}

const AGGridViz: FunctionComponent<ThemedCCCSGridVizProps> = memo(
  ({ columnDefs, rowData, height, agGridLicenseKey, assemblyLineUrl }) => {
    const theme = useTheme();

    const gridRef = useRef<AgGridReact>(null);
    const defaultColDef = useMemo<ColDef>(() => DEFAULT_COL_DEF, []);
    const containerRef = useRef<HTMLDivElement>(null);

    // Superset has a custom context menu and doesn't override ag-grid's context menu styling, which has a weird transparent background.
    const themeOverrides = useMemo(
      () => ({
        menuBackgroundColor: theme.colorBgElevated,
      }),
      [theme.colorBgElevated],
    );

    const headerStyles = useMemo(
      () => ({ display: 'flex', 'flex-direction': 'row' }),
      [],
    );
    const containerStyles = useMemo(() => ({ height }), [height]);
    const gridStyle = useMemo(() => ({ height: '100%' }), []);

    const paginationPageSizeSelector = useMemo<number[] | boolean>(
      () => PAGE_SIZE_OPTIONS,
      [],
    );

    const [quickFilterText, setQuickFilterText] = useState<string>();

    const onFilterTextBoxChanged = useCallback(
      ({ target: { value } }: ChangeEvent<HTMLInputElement>) => {
        setQuickFilterText(value);
      },
      [],
    );

    const getContextMenuItems = useCallback(
      (
        params: GetContextMenuItemsParams,
      ):
        | (DefaultMenuItem | MenuItemDef)[]
        | Promise<(DefaultMenuItem | MenuItemDef)[]> => {
        const result: (DefaultMenuItem | MenuItemDef)[] = [
          'copy',
          'copyWithHeaders',
          'separator',
          // filter on selection,
          {
            name: 'Filter on selection',
            action: () => console.log('filter on selection clicked'),
          },
          'separator',
          // add cross-filter(s),
          // add principle column cross-filter(s),
          // remove cross-filter(s),
          'separator',
          {
            name: 'Retain EML record(s) to ALFRED',
            disabled: params.node?.data?.length > RETENTION_LIMIT,
            tooltip:
              params.node?.data?.length > RETENTION_LIMIT
                ? `Cannot retain more than ${RETENTION_LIMIT} unique harmonized email IDs.`
                : undefined,
            action: () => {
              const email_ids =
                params.node?.data?.map((d: any) => d.harmonized_email_id) ?? [];
            },
          },
          {
            name: 'Open in ASSEMBLYLINE',
            // icon: AssemblyLineLogo,
            action: () => {
              const data =
                params.node?.data?.map((d: any) => d.file_sha256) ?? [];
              console.log(
                `Would open URL: window.open(\`https://${assemblyLineUrl}/search/submission?query=${data.join('+')}\`)`,
              );
            },
          },
          {
            name: 'Submit file(s) to ASSEMBLYLINE',
            // icon: `<img src="${AssemblyLineLogo}" />`,
            disabled: params.node?.data?.length > SUBMISSION_LIMIT,
            tooltip:
              params.node?.data?.length > SUBMISSION_LIMIT
                ? `You cannot submit more than ${SUBMISSION_LIMIT} EML files at a time.`
                : `A new tab will open for each distinct EML path submission.`,
            action: () => {
              const data = params.node?.data?.map((d: any) => d.eml_path) ?? [];
              for (const d of data) {
                console.log(
                  `Would open URL: window.open(\`https://${assemblyLineUrl}/search/submission?query=${d}\`)`,
                );
              }
            },
          },
          {
            name: 'Download EML file(s)',
            disabled: params.node?.data?.length > DOWNLOAD_LIMIT,
            tooltip:
              params.node?.data?.length > DOWNLOAD_LIMIT
                ? `You cannot download more than ${DOWNLOAD_LIMIT} EML files at a time.`
                : `A download will begin for each distinct EML file.`,
            action: () => {
              const data = params.node?.data?.map((d: any) => d.eml_path) ?? [];
              for (const d of data) {
                console.log(
                  `TODO omg this actually does something. "Download" file at /api/v1/fission/get-eml?file=${d}`,
                );
              }
            },
          },
          'separator',
          {
            name: 'something about jump to dashboard configs here',
          },
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
        <div style={headerStyles}>
          <span>Quick Filter:</span>
          <Input
            type="text"
            id="filter-text-box"
            placeholder="Filter..."
            onInput={onFilterTextBoxChanged}
          />
        </div>
        <div ref={containerRef} style={gridStyle}>
          <ThemedAgGridReact
            themeOverrides={themeOverrides}
            ref={gridRef}
            rowData={rowData}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            cacheQuickFilter
            quickFilterText={quickFilterText}
            pagination
            paginationPageSizeSelector={paginationPageSizeSelector}
            getContextMenuItems={getContextMenuItems}
            modules={[
              ClientSideRowModelModule,
              CellSelectionModule,
              RichSelectModule,
              ColumnMenuModule,
              QuickFilterModule,
              // row grouping modules
              RowGroupingModule,
              RowGroupingPanelModule,
              // context menu modules
              ClipboardModule,
              ContextMenuModule,
              ExcelExportModule,
              // ValidationModule is a development helper
              ...(process.env.NODE_ENV !== 'production'
                ? [ValidationModule]
                : []),
            ]}
            rowGroupPanelShow="always"
          />
        </div>
      </div>
    );
  },
);

export default memo(AGGridViz);
