export const
  PREFIX_EXPLORE_URL = '/superset/explore/',
  BASE_EXPLORE_URL = PREFIX_EXPLORE_URL + 'table/',
  SQLLAB_URL = '/superset/sqllab/',
  LOGOUT_URL = '/logout',
  LOGIN_URL = '/login',
  IMPORT_DATASET_URL = '/api/v1/dataset/import/',
  DATASET_URL = '/api/v1/dataset/',
  CHART_DATA_URL = '/api/v1/chart/data?force'

export const 
  DEPARTMENTS_DATASET = 'AnalyticalPlatformQA-Departments',
  COMPLEX_STRUCTURES_DATASET = 'AnalyticalPlatformQA-ComplexStructs',
  IP_ADDRESSES_DATASET = 'AnalyticalPlatformQA-IPAddresses',
  EMPLOYEES_DATASET = 'AnalyticalPlatformQA-Employees'

export const cccsDefaults = {
    viz: 'Hogwarts Table',
    viz_type: 'cccs_grid',
    certifiedByAPA2Key: '"certified_by": "Analytical Platform Team"'
}

const dataTestLocator = (value: string) => `[data-test='${value}']`;

export const baseFormData = {
    datasource: {
      type: "table"
    },
    force: false,
    form_data: {
      enable_row_numbers: true,
      force: null,
      include_time: false,
      query_mode: "raw",
      result_format: "json",
      result_type: "post_processed",
      row_limit: 10,
      time_grain_sqla: "P1D",
      time_range: "Last day",
      timeseries_limit_metric: null,
      viz_type: "cccs_grid"
    },
    queries: [
      {
        extras: {
          time_grain_sqla: "P1D",
        },
        order_desc: true,
        row_limit: 10,
        time_range: "Last day",
        timeseries_limit: 0,
      }
    ],
    result_format: "json",
    result_type: "post_processed",
    viz_type: "cccs_grid"
}

export const cccsExploreView = {
    agGrid: '.cccs_grid > .ag-theme-balham',
    agGridSearchBox: '.cccs_grid > .ag-theme-balham > .form-inline > .row > :nth-child(2) > .float-right > .form-control', 
    errorArea: '.css-tl6px0',
    errorMessage: '.error-body',
    noResult: '.ant-empty',
    controlPanel: {
      querySection: {
        columnField: dataTestLocator('columns'),
        columnHeader: dataTestLocator('columns-header'),
        groupbyHeader: dataTestLocator('groupby-header'),
        filterModal: {
          column: '#adhoc-filter-edit-tabs-panel-SIMPLE > :nth-child(1) > .ant-select > .ant-select-selector',
          operator: '#adhoc-filter-edit-tabs-panel-SIMPLE > :nth-child(2) > .ant-select > .ant-select-selector',
          value: '#adhoc-filter-edit-tabs-panel-SIMPLE > .ant-input'
        },
        principalColumnsField: dataTestLocator('principalColumns'),
        principalColumnsHeader: dataTestLocator('principalColumns-header'),
      },
    },
    customizePanel: {
      optionsSection: {
        searchBoxCheckbox: dataTestLocator('include_search') + ' [role="checkbox"]',
        enableGroupingCheckbox: dataTestLocator('enable_grouping') + ' [role="checkbox"]',
        enableRowNumbersCheckbox: dataTestLocator('enable_row_numbers') + ' [role="checkbox"]',
        enableJsonExpandCheckbox: dataTestLocator('enable_json_expand') + ' [role="checkbox"]'
      }
    }
}

export function ipv4ToIntAsString(ipv4: string): string {
  return ipv4.split('.').reduce((int: any, v) => String(int * 256 + +v))
}