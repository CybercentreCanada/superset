import { DATASET_URL, CHART_DATA_URL, cccsDefaults, baseFormData } from 'cypress/support/helper'
import { result } from 'cypress/types/lodash'

describe('Verify certified datasets by the Analytical Platform team', () => {

  // Number of datasets to verify
  let count: number;

  // Need to have a separate test to collect and another one to report errors with global variables
  const errors: Array<string> = []
  const warnings: Array<string> = []

  it('Collect information on queries for the certified datasets', () => {

    let pageIndex = 0;

    const PAGE_SIZE = 50;
    const CERTIFIED_DATASETS_QUERY_STRING = `?q=(filters:!((col:id,opr:dataset_is_certified,value:!t)),page:${pageIndex},page_size:${PAGE_SIZE})`

    function recursiveVerifyDatasets() {
      cy.request(DATASET_URL + CERTIFIED_DATASETS_QUERY_STRING).then(datasetsResponse => {
        pageIndex++
        datasetsResponse.body.result.filter(datasetsResult => datasetsResult.extra.includes(cccsDefaults.certifiedByAPA2Key)).forEach((dataset: string) => {
          const datasetId = dataset.id
          const datasetName = dataset.table_name
          cy.request(DATASET_URL + datasetId).then(datasetResponse => {
            const defaultTimeColumn = datasetResponse.body.result.main_dttm_col
            const columns: Array<string> = []
            datasetResponse.body.result.columns.forEach((column: string) => {
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
              body: postData,
              timeout: 5 * 60 * 1000, // Give 5mins to query
              failOnStatusCode: false
            }
            cy.request(options).then((response) => {
              if (response.status == 200) {
                // Query is fine
                if (response.body.result[0].data.length > 0) {
                  // All good!
                  cy.log(`Dataset '${datasetName}' looks fine.`)
                }
                else {
                  // Query is fine but we anticipated some results
                  const warningMessage = `Dataset '${datasetName}' ${defaultTimeColumn != null ? 'has no data for the last day' : 'is empty'}.`
                  cy.log(warningMessage)
                  warnings.push(warningMessage)
                }
              }
              else {
                // Something's wrong
                const errorMessage = `Dataset '${datasetName}' returns ${response.statusText} (${response.status}), ${response.body.message}.`
                cy.log(errorMessage)
                errors.push(errorMessage)
              }
            })
          })
        })

        if (pageIndex * PAGE_SIZE > count) {
            return
        }
        recursiveVerifyDatasets()
      })
    }

    cy.cccsLogin();
    cy.request(DATASET_URL + CERTIFIED_DATASETS_QUERY_STRING).then(datasetsResponse => {
      count = datasetsResponse.body.count
      recursiveVerifyDatasets()
    })
  })

  it('Report problems on queries for the certified datasets', () => {
    expect(errors.concat(warnings), 'Expected no error and no warning but some were found: \n' + 
      (warnings.length > 0 ? 'Warnings:\n' : 'No warning\n') +
      warnings.join('\n') + '\n' +
      (errors.length > 0 ? 'Errors:\n' : 'No error\n') +
      errors.join('\n') + '\n').to.be.empty
  })
})