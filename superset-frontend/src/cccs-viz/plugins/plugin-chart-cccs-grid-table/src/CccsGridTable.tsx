import {
  useMemo,
  memo,
  useRef,
  useCallback,
  useState,
  ChangeEvent,
  FunctionComponent,
  useEffect,
} from 'react';

import {
  CellSelectionChangedEvent,
  ClientSideRowModelModule,
  ColDef,
  DefaultMenuItem,
  GetContextMenuItemsParams,
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
  RowNumbersModule,
} from 'ag-grid-enterprise';
import { Icons, Input, ThemedAgGridReact } from '@superset-ui/core/components';

import { AgGridReact } from '@superset-ui/core/components/ThemedAgGridReact';
import {
  ensureIsArray,
  Filter,
  isNativeFilter,
  SupersetClient,
  useTheme,
} from '@superset-ui/core';

import { useToasts } from 'src/components/MessageToasts/withToasts';
import { saveAs } from 'file-saver';
import useEmitGlobalFilter from 'src/cccs-viz/plugins/hooks/useEmitGlobalFilter';
import { clearDataMask } from 'src/dataMask/actions';
import { useDispatch, useSelector } from 'react-redux';
import rison from 'rison';
import { RootState } from 'src/dashboard/types';
import AssemblyLineLogo from './images/assemblyline-logo.png';
import AlfredLogo from './images/alfred-logo-black-small.png';
import EmailLogo from './images/email-logo.png';
import {
  DOWNLOAD_LIMIT,
  PAGE_SIZE_OPTIONS,
  QUERY_TIMEOUT_LIMIT,
  RETENTION_LIMIT,
  SUBMISSION_LIMIT,
} from './consts';
import { CccsGridTransformedProps, DataMap, GridData } from './types';

const b64ToBlob = (b64Data: string, contentType = '', sliceSize = 512) => {
  const byteCharacters = atob(b64Data);
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);

    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i += 1) {
      byteNumbers[i] = slice.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  const blob = new Blob(byteArrays, { type: contentType });
  return blob;
};

const DEFAULT_COL_DEF: ColDef = {
  resizable: true,
  autoHeight: true,
  sortable: true,
  enableRowGroup: true,
};

const CccsGridTableChart: FunctionComponent<CccsGridTransformedProps> = memo(
  ({
    formData,
    columns,
    data,
    height,
    includeSearch,
    pageLength,
    enableRowNumbers,
    enableGrouping,
    setDataMask,
    principalColumns,
    agGridLicenseKey,
    assemblyLineUrl,
    enableAlfred,
    enableDownload,
    emitCrossFilters,
    jumpActionConfigs,
  }) => {
    const theme = useTheme();
    const dispatch = useDispatch();
    const { addInfoToast, addWarningToast, addDangerToast } = useToasts();
    const emitGlobalFilter = useEmitGlobalFilter();

    const gridRef = useRef<AgGridReact>(null);
    const defaultColDef = useMemo<ColDef>(() => DEFAULT_COL_DEF, []);
    const containerRef = useRef<HTMLDivElement>(null);

    const [selectedData, setSelectedData] = useState<GridData>({
      highlightedData: {},
      principalData: {},
      selectedColData: {},
      typeData: {},
      jumpToData: {},
    });

    // Some of the grid elements are transparent, these overrides fix that.
    const themeOverrides = useMemo(
      () => ({
        menuBackgroundColor: theme.colorBgElevated,
        pickerListBackgroundColor: theme.colorBgElevated,
        panelBackgroundColor: theme.colorBgElevated,
        checkboxCheckedShapeColor: theme.colorText,
      }),
      [theme.colorBgElevated, theme.colorText],
    );

    const headerStyles = useMemo(
      () => ({ width: 'auto', paddingBottom: theme.sizeUnit * 2 }),
      [theme.sizeUnit],
    );
    const containerStyles = useMemo(() => ({ height }), [height]);
    const gridStyle = useMemo(() => ({ height: '100%' }), []);

    const paginationPageSizeSelector = useMemo<number[] | boolean>(
      () => ((pageLength ?? 0) > 0 ? PAGE_SIZE_OPTIONS : false),
      [pageLength],
    );

    const rowGroupPanelShow = useMemo<'always' | 'never'>(
      () => (enableGrouping ? 'always' : 'never'),
      [enableGrouping],
    );

    const rowNumbers = useMemo<boolean>(
      () => !!enableRowNumbers,
      [enableRowNumbers],
    );

    const [quickFilterText, setQuickFilterText] = useState<string>();

    useEffect(() => {
      if (!includeSearch) {
        setQuickFilterText('');
      }
    }, [includeSearch]);

    const onFilterTextBoxChanged = useCallback(
      ({ target: { value } }: ChangeEvent<HTMLInputElement>) => {
        setQuickFilterText(value);
      },
      [],
    );

    const emitFilter = useCallback(
      (
        data: DataMap,
        globally = false,
        selectedColData?: { [key: string]: any },
      ) => {
        let groupBy: [string, any][] = Object.entries(data).map(([k, v]) => [
          k,
          Array.from(v),
        ]);

        // If not global, use the same setup as usual
        if (!globally) {
          if (selectedColData) {
            // filter out json columns
            if (Object.values(selectedColData).some(c => c.type === 'JSON')) {
              groupBy = groupBy.filter(
                entry => selectedColData[entry[0]]?.type !== 'JSON',
              );
              addWarningToast('Removing JSON values from cross-filters');
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
      [addWarningToast, emitGlobalFilter, formData.sliceId, setDataMask],
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

    const onFilterMenuItemClick = useCallback(
      (
        data: DataMap,
        globally = false,
        selectedColData?: { [key: string]: any },
      ) => {
        emitFilter(data, globally, selectedColData);
      },
      [emitFilter],
    );

    // This code could use an overhaul but it's better than what it was in Superset 4.
    // Process selected cells + their rows into state
    const onCellSelectionChanged = useCallback(
      (e: CellSelectionChangedEvent) => {
        if (e.finished) {
          const newSelectedData: DataMap = {};
          const newPrincipalData: DataMap = {};
          const typeData: DataMap = {};
          const selectedColData: { [key: string]: any } = {};
          const jumpToData: DataMap = {};

          const gridApi = e.api;

          const cellRanges = gridApi.getCellRanges() ?? [];
          for (const range of cellRanges) {
            if (range.startRow && range.endRow) {
              const startIdx = Math.min(
                range.startRow.rowIndex,
                range.endRow.rowIndex,
              );
              const endIdx = Math.max(
                range.startRow.rowIndex,
                range.endRow.rowIndex,
              );

              for (let i = startIdx; i < endIdx + 1; i += 1) {
                const row = gridApi.getDisplayedRowAtIndex(i);

                if (row) {
                  // Set aside the whole row's data because some functions (e.g. ALFRED retention) rely on specific columns that may not be selected
                  for (const column of gridApi.getColumns() ?? []) {
                    const colDef = column.getColDef();

                    const field = colDef.field ?? '';
                    const dataType =
                      colDef.context?.advancedDataType ??
                      colDef.type ??
                      'NoType';
                    const value = row.data[field];
                    const unnested = ensureIsArray(unnestValue(value));
                    const formattedValue: any[] =
                      typeof value === 'string' && unnested?.length
                        ? unnested.map(v =>
                            colDef.valueFormatter
                              ? // @ts-ignore Sshhhh. No problems here
                                colDef.valueFormatter(v)
                              : v,
                          )
                        : [value];

                    // Push selected cells to selectedData and jumpToData, and their columns selectedColData
                    if (
                      range.columns.find(
                        c => c.getColId() === column.getColId(),
                      )
                    ) {
                      if (!(field in newSelectedData))
                        newSelectedData[field] = new Set();
                      newSelectedData[field].add(value);

                      if (!(dataType in jumpToData))
                        jumpToData[dataType] = new Set();
                      formattedValue.forEach(v => {
                        if (v) {
                          jumpToData[dataType].add(v);
                        }
                      });

                      if (!(field in selectedColData))
                        selectedColData[field] = colDef;
                    }

                    // Push row data to typeData, principalData
                    if (!(dataType in typeData)) typeData[dataType] = new Set();
                    formattedValue.forEach(v => {
                      if (v !== null) typeData[dataType].add(v);
                    });

                    if (principalColumns?.includes(field)) {
                      if (!(field in newPrincipalData))
                        newPrincipalData[field] = new Set();

                      newPrincipalData[field].add(value);
                    }
                  }
                } else {
                  console.error('Missing row displayed at index ', i);
                }
              }
            }
          }
          setSelectedData({
            highlightedData: newSelectedData,
            principalData: newPrincipalData,
            typeData,
            selectedColData,
            jumpToData,
          });
        }
      },
      [principalColumns],
    );

    const adhocFiltersInScope = useSelector<RootState, Filter[]>(
      state =>
        Object.values(state.nativeFilters.filters).filter(
          f =>
            isNativeFilter(f) &&
            f.filterType === 'filter_adhoc' &&
            f.chartsInScope?.includes(formData.sliceId),
        ) as Filter[],
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
            icon: '<i class="ag-icon ag-icon-filter-add" />',
            disabled:
              !adhocFiltersInScope.length ||
              Object.values(selectedData.selectedColData).every(
                data => data.type === 'JSON',
              ),
            tooltip: !adhocFiltersInScope.length
              ? 'No adhoc filter exists with this chart in scope'
              : Object.values(selectedData.selectedColData).every(
                    data => data.type === 'JSON',
                  )
                ? 'JSON columns cannot be used as filters.'
                : adhocFiltersInScope.length > 1
                  ? `Will apply selection to adhoc filters: ${adhocFiltersInScope
                      .map(f => f.name)
                      .join(', ')}`
                  : `Will apply selection to adhoc filter: ${adhocFiltersInScope[0].name}`,
            action: () => {
              onFilterMenuItemClick(
                selectedData.highlightedData,
                true,
                selectedData.selectedColData,
              );
            },
          });
          contextMenuItems.push('separator');
          contextMenuItems.push({
            name: 'Add cross-filter(s)',
            icon: '<i class="ag-icon ag-icon-filter" />',
            tooltip: Object.values(selectedData.selectedColData).every(
              data => data.type === 'JSON',
            )
              ? 'JSON columns cannot be used as cross-filters.'
              : 'Cross-filter(s) will be applied to all charts whose datasets contain columns with the same name.',
            action: () => {
              onFilterMenuItemClick(
                selectedData.highlightedData,
                false,
                selectedData.selectedColData,
              );
            },
          });
          contextMenuItems.push({
            name: 'Add principal column cross-filter(s)',
            icon: '<i class="ag-icon ag-icon-filter" />',
            disabled: false,
            action: () => {
              onFilterMenuItemClick(
                selectedData.principalData,
                false,
                selectedData.selectedColData,
              );
            },
          });
          contextMenuItems.push({
            name: 'Remove cross-filters(s)',
            icon: '<i class="ag-icon ag-icon-cancel" />',
            disabled: false,
            action: () => {
              dispatch(clearDataMask(formData.sliceId));
            },
          });
        }

        contextMenuItems.push('separator');

        if (
          enableAlfred &&
          selectedData.typeData.harmonized_email_id &&
          selectedData.typeData.harmonized_email_id.size > 0
        ) {
          contextMenuItems.push({
            name: 'Retain EML record(s) to ALFRED',
            disabled:
              selectedData.typeData.harmonized_email_id.size > RETENTION_LIMIT,
            icon: `<img src="${AlfredLogo}" class="ag-icon" />`,
            action: () => {
              const email_ids = Array.from(
                selectedData.typeData.harmonized_email_id,
              );
              const dates = [
                ...Object.entries(selectedData.typeData)
                  .filter(k => k[0].includes('TIME'))
                  .map(v => v[1])
                  .flat(),
                ...(selectedData.typeData.DATE || []),
                ...(selectedData.typeData.DATETIME || []),
              ].map((d: string) => {
                let date = new Date(Date.parse(d));
                if (Number.isNaN(date.getTime())) {
                  date = new Date(d);
                }
                const day = date.getDate();
                const month = date.getMonth() + 1; // months are labelled 0-11;
                const year = date.getFullYear();
                return `${year}-${month}-${day}`;
              });
              addInfoToast(
                'Retention started. A new tab will open upon successful retention.',
              );

              const endpoint = `/api/v1/alfred/retain-eml-record`;
              const jsonPayload = { email_ids, dates };
              SupersetClient.post({
                endpoint,
                jsonPayload,
                timeout: QUERY_TIMEOUT_LIMIT,
              })
                .then(({ json }) => {
                  window.open(json.result, '_blank');
                })
                .catch(() => {
                  addDangerToast(
                    'Retention failed. The records you attempted to retain were not retained.',
                  );
                });
            },
          });
        }

        if (
          assemblyLineUrl &&
          selectedData.typeData.file_sha256 &&
          selectedData.typeData.file_sha256.size > 0
        ) {
          contextMenuItems.push({
            name: 'Open in ASSEMBLYLINE',
            icon: `<img src="${AssemblyLineLogo}" class="ag-icon" />`,
            action: () => {
              window.open(
                `https://${assemblyLineUrl}/search/submission?query=${Array.from(selectedData.typeData.file_sha256).join('+')}`,
              );
            },
          });
        }

        if (
          assemblyLineUrl &&
          selectedData.typeData.eml_path &&
          selectedData.typeData.eml_path.size > 0
        ) {
          contextMenuItems.push({
            name: 'Submit file(s) to ASSEMBLYLINE',
            icon: `<img src="${AssemblyLineLogo}" class="ag-icon" />`,
            disabled: selectedData.typeData.eml_path.size > SUBMISSION_LIMIT,
            tooltip:
              selectedData.typeData.eml_path.size > SUBMISSION_LIMIT
                ? `You cannot submit more than ${SUBMISSION_LIMIT} EML files at a time.`
                : `A new tab will open for each distinct EML path submission.`,
            action: () => {
              // I preserved the original code's "functionality" here but it was bugged anyway,
              // you can only open one browser window per user interaction...
              // Probably not a huge problem since no one's complained about it.
              for (const eml of selectedData.typeData.eml_path) {
                const url = `https://${assemblyLineUrl}/submit?input=${encodeURIComponent(eml)}`;
                window.open(url, '_blank');
              }
            },
          });
        }

        if (
          enableDownload &&
          selectedData.typeData.eml_path &&
          selectedData.typeData.eml_path.size > 0
        ) {
          contextMenuItems.push({
            name: 'Download EML file(s)',
            icon: `<img src="${EmailLogo}" class="ag-icon" />`,
            disabled: selectedData.typeData.eml_path.size > DOWNLOAD_LIMIT,
            tooltip:
              selectedData.typeData.eml_path.size > DOWNLOAD_LIMIT
                ? `You cannot download more than ${DOWNLOAD_LIMIT} EML files at a time.`
                : `A download will begin for each distinct EML file.`,
            action: () => {
              for (const emlPath of selectedData.typeData.eml_path) {
                const endpoint = `/api/v1/fission/get-eml?file=${emlPath}`;
                addInfoToast('Download started');

                SupersetClient.get({ endpoint, timeout: QUERY_TIMEOUT_LIMIT })
                  .then(({ json }) => {
                    if (json.result?.content?.indexOf('base64') !== -1) {
                      // Check for base64 encoding
                      const b64Data = json.result.content.split(',')[1];
                      const contentType = 'message/rfc822'; // Correct MIME type for EML files

                      // Convert base64 data to a blob with the appropriate MIME type
                      const blob = b64ToBlob(b64Data, contentType);

                      // Derive file name from the title or use a default name, ensuring it ends with .eml
                      const uniqueTitle = json.result.title
                        ? `${json.result.title}.eml`
                        : `${emlPath}.eml`;

                      // Use FileSaver or a similar library to trigger the file download
                      saveAs(blob, uniqueTitle);
                    } else if (json.result?.content) {
                      addDangerToast(`Invalid file format for ${emlPath}.`);
                    } else if (json.result?.Error) {
                      addDangerToast(
                        `Download failed for ${emlPath}. ${json.result.Error}`,
                      );
                    } else {
                      addDangerToast(`No content to download for ${emlPath}.`);
                    }
                  })
                  .catch(() =>
                    addDangerToast(
                      `Download failed for ${emlPath}: EML file could not be found.`,
                    ),
                  );
              }
            },
          });
        }

        // jump action configs
        if (jumpActionConfigs?.length) {
          const isDisabled = !jumpActionConfigs.some(j =>
            Object.keys(selectedData.jumpToData).includes(j.advancedDataType),
          );

          const generateNativeFilterUrlString = (
            nativefilterID: string,
            urlSelectedData: any[],
            column = '',
          ) => {
            const stringSelectedData = urlSelectedData.map(
              e => `${e.toString()}`,
            );
            const nativeFilter = {
              __cache: {
                label: stringSelectedData,
                validateStatus: false,
                value: stringSelectedData,
              },
              extraFormData: {
                filters: [{ col: column, op: 'IN', val: stringSelectedData }],
              },
              filterState: {
                label: stringSelectedData,
                validateStatus: false,
                value: stringSelectedData,
              },
              id: nativefilterID,
              ownState: {},
            };
            return nativeFilter;
          };

          const submenuItems: MenuItemDef[] = [];
          if (jumpActionConfigs) {
            jumpActionConfigs.forEach(advancedDataTypeNativeFilters => {
              const nativeFilterUrls: any = {};
              const { advancedDataType } = advancedDataTypeNativeFilters;
              const { filters } = advancedDataTypeNativeFilters;
              const selectedDataForUrl = selectedData.jumpToData[
                advancedDataType
              ]
                ? Array.from(selectedData.jumpToData[advancedDataType])
                : [];

              if (selectedDataForUrl && filters) {
                filters.forEach(
                  (filter: { value: string; column: string | undefined }) => {
                    nativeFilterUrls[filter.value] =
                      generateNativeFilterUrlString(
                        filter.value,
                        selectedDataForUrl,
                        filter.column,
                      );
                  },
                );
              }

              if (Object.keys(nativeFilterUrls).length !== 0) {
                submenuItems.push({
                  name: advancedDataTypeNativeFilters.name,
                  action: () => {
                    // eslint-disable-next-line no-restricted-globals
                    const baseUrl = `${location.protocol}//${location.host}`;
                    const url = `${baseUrl}/superset/dashboard/${
                      advancedDataTypeNativeFilters.dashboardID
                    }/?native_filters=${rison.encode(nativeFilterUrls)}`;
                    window.open(url, '_blank');
                  },
                });
              }
            });
          }

          contextMenuItems.push('separator', {
            name: 'Jump to dashboard',
            icon: '📊',
            disabled: isDisabled,
            subMenu: submenuItems,
          });
        }

        contextMenuItems.push('separator');
        contextMenuItems.push('export');

        return contextMenuItems;
      },
      [
        addDangerToast,
        addInfoToast,
        adhocFiltersInScope,
        assemblyLineUrl,
        dispatch,
        emitCrossFilters,
        enableAlfred,
        enableDownload,
        formData.sliceId,
        jumpActionConfigs,
        onFilterMenuItemClick,
        selectedData.highlightedData,
        selectedData.jumpToData,
        selectedData.principalData,
        selectedData.selectedColData,
        selectedData.typeData,
      ],
    );

    LicenseManager.setLicenseKey(agGridLicenseKey);

    return (
      <div style={containerStyles}>
        {!!includeSearch && (
          <div style={headerStyles}>
            <Input
              allowClear
              type="text"
              placeholder={`Search ${data?.length || 0} records...`}
              onInput={onFilterTextBoxChanged}
              onClear={() => setQuickFilterText('')}
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
            rowData={data}
            columnDefs={columns}
            defaultColDef={defaultColDef}
            rowNumbers={rowNumbers}
            cellSelection
            onCellSelectionChanged={onCellSelectionChanged}
            cacheQuickFilter
            quickFilterText={quickFilterText}
            pagination={!!pageLength}
            paginationPageSize={pageLength}
            paginationPageSizeSelector={paginationPageSizeSelector}
            getContextMenuItems={getContextMenuItems}
            modules={[
              ClientSideRowModelModule,
              ColumnMenuModule,
              RowNumbersModule,
              CellSelectionModule,
              RowSelectionModule,
              RichSelectModule,
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
            rowGroupPanelShow={rowGroupPanelShow}
          />
        </div>
      </div>
    );
  },
);

export default memo(CccsGridTableChart);
