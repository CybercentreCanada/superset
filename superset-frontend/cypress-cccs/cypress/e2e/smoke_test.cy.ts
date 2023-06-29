import { DEPARTMENTS_DATASET, 
         COMPLEX_STRUCTURES_DATASET, 
         IP_ADDRESSES_DATASET, 
         EMPLOYEES_DATASET, 
         cccsDefaults,
         cccsExploreView,
         baseFormData,
         DATASET_URL,
         CHART_DATA_URL } from '../support/helper'

import { exploreView } from '../support/directories'

import { chooseSelectDropdownOption } from '@hon2a/cypress-antd'
import { ipv4ToIntAsString } from  '../support/helper';

describe('Smoke Test', () => {

  before(() => {
    cy.cccsLogin()

    cy.importDatasetFromFixture(DEPARTMENTS_DATASET)
    cy.importDatasetFromFixture(COMPLEX_STRUCTURES_DATASET)
    cy.importDatasetFromFixture(IP_ADDRESSES_DATASET)
    cy.importDatasetFromFixture(EMPLOYEES_DATASET)
  });

  beforeEach(() => {
    cy.cccsLogin();
  });

  it('Test the default viz to explore datasets is the one we expect', () => {

    cy.visitDatasetByName(DEPARTMENTS_DATASET)

    cy.get('[data-test="fast-viz-switcher"]').find('.css-2kik2p > .css-33kp5q') .then(span => {
      expect(span).to.have.text(cccsDefaults.viz)
    })
  })

  it('Test explore select all button in both query modes', () => {

    // Build arrays of column names from the file
    var yamlDisplayedNames: Array<string> = []
    cy.fixture(`${DEPARTMENTS_DATASET}.yaml`).then((yamlString) => {
      var yaml = Cypress.yamljs.parse(yamlString)
      yaml.databases[0].tables[0].columns.forEach((column: any, index: number) => {
        if (column.verbose_name) {
          yamlDisplayedNames.push(column.verbose_name)
        }
        else {
          yamlDisplayedNames.push(column.column_name)
        }
      })

      cy.visitDatasetByName(DEPARTMENTS_DATASET)

      // Aggregate query mode
      cy.clickAggregateQueryMode()
      cy.clickAggregateDimensionsSelectAllButton()
      cy.get(exploreView.controlPanel.querySection.groupByField).find('.ant-select > .ant-select-selector')
        .find('.ant-select-selection-item')
          .should('have.length', yamlDisplayedNames.length)
          .each(el => {
            expect(el.find('.column-option-label').text()).to.be.oneOf(yamlDisplayedNames)
        })

      // Raw records query mode
      cy.clickRawRecordsQueryMode()
      cy.clickRawRecordsDimensionsSelectAllButton()
      cy.get(cccsExploreView.controlPanel.querySection.columnField).find('.ant-select > .ant-select-selector')
        .find('.ant-select-selection-item')
          .should('have.length', yamlDisplayedNames.length)
          .each(el => {
            expect(el.find('.column-option-label').text()).to.be.oneOf(yamlDisplayedNames)
        })

      cy.clickCustomizeTab()
      cy.clickRowNumbersCheckbox()
      cy.clickDataTab()
      cy.get(exploreView.controlPanel.runButton).click()

      // Ensure the columns in the viz are in the same order with the proper name
      cy.get(cccsExploreView.agGrid).find('.ag-header-cell-text').each((el, index) => {
        expect(yamlDisplayedNames[index]).equals(el.text())
      })
    })
  })

  it('Test explore copy content button in both query modes', () => {

    // Build arrays of column names from the file
    const yamlColumnNames: Array<string> = []
    cy.fixture(`${DEPARTMENTS_DATASET}.yaml`).then((yamlString) => {
      var yaml = Cypress.yamljs.parse(yamlString)
      yaml.databases[0].tables[0].columns.forEach((column: any, index: number) => {
        yamlColumnNames.push(column.column_name)
      })

      cy.visitDatasetByName(DEPARTMENTS_DATASET)

      // Aggregate query mode
      cy.clickAggregateQueryMode()
      cy.clickAggregateDimensionsSelectAllButton()
      cy.clickAggregateDimensionsCopyContentButton()
      cy.window().then((win) => {
        win.navigator.clipboard.readText().then((text) => {
          const clipboardColumnNames = text.split(',')
          expect(yamlColumnNames.length).equals(clipboardColumnNames.length)
          yamlColumnNames.forEach(el => {
            expect(el).to.be.oneOf(clipboardColumnNames)
          })
        });
      });

      // Raw Records query mode
      cy.clickRawRecordsQueryMode()
      cy.clickRawRecordsDimensionsSelectAllButton()
      cy.clickRawRecordsDimensionsCopyContentButton()
      cy.window().then((win) => {
        win.navigator.clipboard.readText().then((text) => {
          const clipboardColumnNames = text.split(',')
          expect(yamlColumnNames.length).equals(clipboardColumnNames.length)
          yamlColumnNames.forEach(el => {
            expect(el).to.be.oneOf(clipboardColumnNames)
          })
        });
      });
    })
  })

  it('Test explore principal columns to emit in Aggregate Mode', () => {

    // Build arrays of column names from the file
    var yamlDisplayedNames: Array<string> = []
    var yamlColumnNames: Array<string> = []
    cy.fixture(`${DEPARTMENTS_DATASET}.yaml`).then((yamlString) => {
      var yaml = Cypress.yamljs.parse(yamlString)
      yaml.databases[0].tables[0].columns.forEach((column: any, index: number) => {
        yamlColumnNames.push(column.column_name)
        if (column.verbose_name) {
          yamlDisplayedNames.push(column.verbose_name)
        }
        else {
          yamlDisplayedNames.push(column.column_name)
        }
      })

      cy.visitDatasetByName(DEPARTMENTS_DATASET)
      cy.clickAggregateQueryMode()

      cy.clickAggregateDimensionsSelectAllButton()
      cy.get(cccsExploreView.controlPanel.querySection.principalColumnsField).find('.ant-select > .ant-select-selector')
        .find('.ant-select-selection-item')
          .should('have.length', 0)

      cy.clickPrincipalColumnsSelectAllButton()
      cy.get(cccsExploreView.controlPanel.querySection.principalColumnsField).find('.ant-select > .ant-select-selector')
        .find('.ant-select-selection-item')
          .should('have.length', yamlDisplayedNames.length)
          .each(el => {
            expect(el.find('.column-option-label').text()).to.be.oneOf(yamlDisplayedNames)
        })

      cy.clickPrincipalColumnsCopyContentButton()
      cy.window().then((win) => {
        win.navigator.clipboard.readText().then((text) => {
          const clipboardColumnNames = text.split(',')
          expect(yamlColumnNames.length).equals(clipboardColumnNames.length)
          yamlColumnNames.forEach(el => {
            expect(el).to.be.oneOf(clipboardColumnNames)
          })
        });
      });
    })
  })

  it('Test explore principal columns to emit in Raw Records mode', () => {

    // Build arrays of column names from the file
    var yamlDisplayedNames: Array<string> = []
    var yamlColumnNames: Array<string> = []
    cy.fixture(`${DEPARTMENTS_DATASET}.yaml`).then((yamlString) => {
      var yaml = Cypress.yamljs.parse(yamlString)
      yaml.databases[0].tables[0].columns.forEach((column: any, index: number) => {
        yamlColumnNames.push(column.column_name)
        if (column.verbose_name) {
          yamlDisplayedNames.push(column.verbose_name)
        }
        else {
          yamlDisplayedNames.push(column.column_name)
        }
      })

      cy.visitDatasetByName(DEPARTMENTS_DATASET)
      cy.clickRawRecordsQueryMode()

      cy.clickRawRecordsDimensionsSelectAllButton()
      cy.get(cccsExploreView.controlPanel.querySection.principalColumnsField).find('.ant-select > .ant-select-selector')
        .find('.ant-select-selection-item')
          .should('have.length', 0)

      cy.clickPrincipalColumnsSelectAllButton()
      cy.get(cccsExploreView.controlPanel.querySection.principalColumnsField).find('.ant-select > .ant-select-selector')
        .find('.ant-select-selection-item')
          .should('have.length', yamlDisplayedNames.length)
          .each(el => {
            expect(el.find('.column-option-label').text()).to.be.oneOf(yamlDisplayedNames)
        })

      cy.clickPrincipalColumnsCopyContentButton()
      cy.window().then((win) => {
        win.navigator.clipboard.readText().then((text) => {
          const clipboardColumnNames = text.split(',')
          expect(yamlColumnNames.length).equals(clipboardColumnNames.length)
          yamlColumnNames.forEach(el => {
            expect(el).to.be.oneOf(clipboardColumnNames)
          })
        });
      });
    })
  })
  
  it('Test AG Grid license is valid for the next 2 weeks', () => {

    const companyNameKey = 'CompanyName'
    const expiryDateKey = 'ExpiryDate'
    const supportServicesEndKey = 'SupportServicesEnd'

    cy.request(`/api/v1/dataset/?q=(filters:!((col:table_name,opr:ct,value:${DEPARTMENTS_DATASET})))`).then(findResponse => {
      expect(findResponse.body.ids).to.have.lengthOf(1)
      const datasetId = findResponse.body.ids[0]
      cy.request(DATASET_URL + datasetId).then(datasetResponse => {
        const defaultTimeColumn = datasetResponse.body.result.main_dttm_col
        const columns: Array<string> = []
        datasetResponse.body.result.columns.forEach((column: any) => {
          columns.push(column.column_name)
        })
        const formData = { ...baseFormData.form_data, datasource: datasetId + '__table', columns: columns, granularity_sqla: defaultTimeColumn !=null ? defaultTimeColumn : '' }
        const datasource = { ...baseFormData.datasource, id: datasetId }
        const query = { ...baseFormData.queries[0], columns: columns, granularity: defaultTimeColumn !=null ? defaultTimeColumn : '' }
        const postData = { ...baseFormData, datasource: datasource, form_data: formData, queries: [query] }

        const options = { 
          method: 'POST',
          url: CHART_DATA_URL,
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
          body: postData
        }

        cy.request(options).then((queryResponse) => {

          expect(queryResponse.body.result[0].agGridLicenseKey).exist

          const map = new Map(queryResponse.body.result[0].agGridLicenseKey.split(",").map((pair: string) => pair.split("=")))

          // Company name
          assert.containsAllKeys(map, [companyNameKey], `${companyNameKey} key is missing`)
          assert.equal(map.get(companyNameKey), 'Communications Security Establishment')

          // Expiry date
          assert.hasAnyKeys(map, [expiryDateKey, supportServicesEndKey], `Either ${expiryDateKey} or ${supportServicesEndKey} key is missing`)
          let expiryDateValue;
          if (map.has(supportServicesEndKey)) {
            // For newer licenses
            expiryDateValue = String(map.get(supportServicesEndKey))
          }
          else {
            // For older licenses
            expiryDateValue = String(map.get(expiryDateKey))
          }
          const expiryDateString = expiryDateValue.substring(0, expiryDateValue.indexOf('[') - 1).replaceAll('_', ' ')
          const expiryDate = Cypress.dayjs(expiryDateString, 'D MMMM YYYY').toDate()
          const twoWeeksFromToday = Cypress.dayjs().add(2, 'weeks').toDate()
          assert.isAtLeast(expiryDate, twoWeeksFromToday, 'License will expire in two weeks')
        })
      });
    });
  });
    
  it('Test quick filter on an IPv4 in Hogwarts Table viz', () => {

    const formData = {
      query_mode: 'raw',
      viz_type: cccsDefaults.viz_type,
      columns: ['id','ip_as_numeric'], // ip_as_numeric is marked as IPv4
      adhoc_filters: [],
      enable_row_numbers: true,
      include_search: true,
      row_limit: 100
    };

    cy.visitChartByDatasetNameAndParams(IP_ADDRESSES_DATASET, formData)

    const ipFilter = '8.8.8.8'

    cy.get(cccsExploreView.agGridSearchBox).type(`{selectAll}${ipFilter}`, { force: true })
    cy.wait(1500)
    const expectedTableData = [
       { Index: '2', Decimal: ipFilter }
    ];
    cy.get(cccsExploreView.agGrid).getAgGridData({ onlyColumns: ['Index', 'Decimal' ] }).then((actualTableData) => {
      cy.agGridValidateRowsExactOrder(actualTableData, expectedTableData, false);
    });

    cy.get(cccsExploreView.agGridSearchBox).type('{selectAll}134744072', { force: true })
    cy.wait(1500)
    cy.get(cccsExploreView.agGrid).getAgGridData().then((actualTableData) => {
      cy.agGridValidateEmptyTable(actualTableData, false);
    });
  });

  it('Test explore filter accepts IPs or CIDRs for IPv4 advanced types', () => {

    const formData = {
      query_mode: 'raw',
      viz_type: cccsDefaults.viz_type,
      adhoc_filters: []
    };

    cy.visitChartByDatasetNameAndParams(IP_ADDRESSES_DATASET, formData)

    // Click Filters to bring the Filter modal up
    cy.get(exploreView.controlPanel.querySection.filtersField).click()
    // Click the Simple tab
    cy.get(exploreView.controlPanel.querySection.filterModal.simple.tab).click()
    // Select an IPv4 column
    cy.get(cccsExploreView.controlPanel.querySection.filterModal.column).click()
    chooseSelectDropdownOption('Decimal');
    // Select an operator
    cy.get(cccsExploreView.controlPanel.querySection.filterModal.operator).click()
    chooseSelectDropdownOption('>');

    let expectedTooltip = 'IPv4 address or CIDR must not be empty'
    cy.testTooltipAfterEnteringValue(cccsExploreView.controlPanel.querySection.filterModal.value, '', expectedTooltip)

    const invalidEntry = 'SomeGarbage'
    expectedTooltip = `'${invalidEntry}' is not a valid IPv4 address or CIDR`
    cy.testTooltipAfterEnteringValue(cccsExploreView.controlPanel.querySection.filterModal.value, invalidEntry, expectedTooltip)

    const invalidIPv4 = '1.1.1.1.1'
    expectedTooltip = `'${invalidIPv4}' is not a valid IPv4 address or CIDR`
    cy.testTooltipAfterEnteringValue(cccsExploreView.controlPanel.querySection.filterModal.value, invalidIPv4, )

    const invalidCIDR = '1.1.1.1/99'
    expectedTooltip = `'${invalidCIDR}' is not a valid IPv4 address or CIDR`
    cy.testTooltipAfterEnteringValue(cccsExploreView.controlPanel.querySection.filterModal.value, invalidCIDR, expectedTooltip)

    const validIPv4 = '8.8.8.8'
    expectedTooltip = ipv4ToIntAsString(validIPv4)
    cy.testTooltipAfterEnteringValue(cccsExploreView.controlPanel.querySection.filterModal.value, validIPv4, expectedTooltip)

    const validCIDR = '3.3.3.3/32'
    expectedTooltip = ipv4ToIntAsString(validCIDR.substring(0, validCIDR.indexOf('/')))
    cy.testTooltipAfterEnteringValue(cccsExploreView.controlPanel.querySection.filterModal.value, validCIDR, expectedTooltip)
  })

})