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
  QuickFilterModule,
  ValidationModule,
} from 'ag-grid-community';
import {
  LicenseManager,
  CellSelectionModule,
  ColumnMenuModule,
  ContextMenuModule,
  RichSelectModule,
  RowGroupingModule,
  RowGroupingPanelModule,
} from 'ag-grid-enterprise';
import {
  ThemedAgGridReact,
  ThemedAgGridReactProps,
} from '@superset-ui/core/components';

import { AgGridReact } from '@superset-ui/core/components/ThemedAgGridReact';
import { PAGE_SIZE_OPTIONS } from '../consts';

// Module TODOs:
//  - Pagination: "All" option, on by default
//  - Row grouping: Show panel conditionally
//  - Search/find: Make it pretty. Also I broke the CSS and the pagination stuff isn't visible anymore

const DEFAULT_COL_DEF = {
  resizable: true,
  autoHeight: true,
  sortable: true,
  enableRowGroup: true,
};

export interface ThemedCCCSGridVizProps extends ThemedAgGridReactProps {
  agGridLicenseKey: string;
  height: number;
}

const AGGridViz: FunctionComponent<ThemedCCCSGridVizProps> = memo(
  ({ columnDefs, rowData, height, agGridLicenseKey }) => {
    const gridRef = useRef<AgGridReact>(null);
    const defaultColDef = useMemo<ColDef>(() => DEFAULT_COL_DEF, []);
    const containerRef = useRef<HTMLDivElement>(null);

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

    LicenseManager.setLicenseKey(agGridLicenseKey);

    return (
      <div style={containerStyles}>
        <div css={headerStyles}>
          <div className="example-header">
            <span>Quick Filter:</span>
            <input
              type="text"
              id="filter-text-box"
              placeholder="Filter..."
              onInput={onFilterTextBoxChanged}
            />
          </div>
        </div>
        <div ref={containerRef} style={gridStyle}>
          <ThemedAgGridReact
            ref={gridRef}
            rowData={rowData}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            // enableBrowserTooltips
            cacheQuickFilter
            quickFilterText={quickFilterText}
            pagination
            paginationPageSizeSelector={paginationPageSizeSelector}
            suppressContextMenu
            // getContextMenuItems={() => console.log("Context menu")}
            modules={[
              ClientSideRowModelModule,
              CellSelectionModule,
              ColumnMenuModule,
              ContextMenuModule,
              RowGroupingModule,
              RowGroupingPanelModule,
              RichSelectModule,
              QuickFilterModule,
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
