import { chooseSelectDropdownOption, getDropdown, selectDropdownItem, shouldHaveTooltip } from '@hon2a/cypress-antd'
import { exploreView } from '../support/directories'
import { cccsExploreView } from 'cypress/support/helper';

const PREFIX_EXPLORE_URL = '/explore/';
const BASE_EXPLORE_URL = PREFIX_EXPLORE_URL + '?datasource_type=table&datasource_id='
const SQLLAB_URL = '/superset/sqllab/';
const LOGOUT_URL = '/logout';
const LOGIN_URL = '/login';
const IMPORT_DATASET_URL = '/api/v1/dataset/import/'

Cypress.Commands.add('cccsLogin', () => {
  // Should we really logout for every test? Probably if we want to test different user
  cy.logout()

  // TODO Consider using the experimentalSessionAndOrigin flag and 
  // use Cy.session in order to reduce test setup times

  cy.url().then(($url) => {
    if($url.includes('.cyber.gc.ca')) {
      // On the HOGWARTS platform, login using oAuth
      // TODO When running the tests headless, clicking the login button brings the user to the Authentication provider
      cy.get('.panel-body > div > .btn').click()
    } 
    else  {
      // Probably on a local version, using basic auth to login
      cy.request({
        method: 'POST',
        url: LOGIN_URL,
        body: { username: 'admin', password: 'admin' },
      }).then(response => {
        expect(response.status).to.eq(200);
      });
    }
  })
});

Cypress.Commands.add('logout', () => {
    cy.visit(LOGOUT_URL)
    cy.url().should('include', '/login') 
});

Cypress.Commands.add('visitSqllab', () => {
    cy.visit(SQLLAB_URL)
    // TODO Close existing query tab(s) and start a new one
});

Cypress.Commands.add('chooseHogwartsTrinoConnection', () => {
  // Get the database control
  cy.get('[data-test="DatabaseSelector"]').click()
  // Ask the @hon2a/cypress-antd module to select the desired option
  // Tags are not supported so we need to supply the tag as part of the text we want to select
  chooseSelectDropdownOption('trinohogwarts_users_u');
});

Cypress.Commands.add('saveSqlAsDataset', (datasetName: string) => {
  // Ensure we are on the Sql Lab page
  cy.url().should('include', SQLLAB_URL) 
  // Click the explore button 
  cy.get('.css-f6q18k > :nth-child(1)').click()
  // Click the Save as new radio button
  cy.get('.ant-radio-wrapper-checked > .ant-radio').click()
  // Type the dataset name
  cy.get('.ant-input').type(`{selectall}{backspace}${datasetName}`)
  // Click the Save & Explore button
  cy.get('.ant-modal-footer > .ant-btn').click();
});

Cypress.Commands.add('visitDatasetByName', name => {
  cy.request(`/api/v1/dataset/?q=(filters:!((col:table_name,opr:ct,value:${name})))`).then(response => {
    expect(response.body.ids).to.have.lengthOf(1)
    cy.visit(`${BASE_EXPLORE_URL}${response.body.ids[0]}`);
  });
});

Cypress.Commands.add('visitChartByParams',
  (formData: {
    datasource?: string;
    datasource_id?: number;
    datasource_type?: string;
    [key: string]: unknown;
  }) => {
    let datasource_id;
    let datasource_type;
    if (formData.datasource_id && formData.datasource_type) {
      ({ datasource_id, datasource_type } = formData);
    } else {
      [datasource_id, datasource_type] = formData.datasource?.split('__') || [];
    }
    const accessToken = window.localStorage.getItem('access_token');
    cy.request({
      method: 'POST',
      url: 'api/v1/explore/form_data',
      body: {
        datasource_id,
        datasource_type,
        form_data: JSON.stringify(formData),
      },
      headers: {
        ...(accessToken && {
          Cookie: `csrf_access_token=${accessToken}`,
          'X-CSRFToken': accessToken,
        }),
        'Content-Type': 'application/json',
        Referer: `${Cypress.config().baseUrl}/`,
      },
    }).then(response => {
      const formDataKey = response.body.key;
      const url = `/explore/?form_data_key=${formDataKey}`;
      cy.visit(url);
    });
  },
);

Cypress.Commands.add('visitChartByDatasetNameAndParams', (name, params) => {
  cy.request(`/api/v1/dataset/?q=(filters:!((col:table_name,opr:ct,value:${name})))`).then(response => {
    expect(response.body.ids).to.have.lengthOf(1)
    const datasetId = response.body.ids[0]
    const formData = {
      ...params,
      datasource: datasetId + '__table',
    };

    cy.visitChartByParams(formData);
  });
});

Cypress.Commands.add('runQuery', (query) => {
  // Ensure we are on the Sql Lab page
  cy.url().should('include', SQLLAB_URL)
    // Clear the ACE editor, type new content and run the query
  cy.get('.ace_text-input').first().focus().type(`{selectall}{backspace}${query}{ctrl}r`, { force: true })
});

Cypress.Commands.add('importDatasetFromFixture', (datasetName: string) => {

  const url = Cypress.config().baseUrl + IMPORT_DATASET_URL
  const fileName = datasetName +  '.yaml'

  cy.fixture(fileName, 'binary')
    .then(txtBin => Cypress.Blob.binaryStringToBlob(txtBin))
    .then(blob => {
          const formData = new FormData()
          formData.append('formData', blob, fileName)
          formData.append('overwrite', 'true')
          formData.append('passwords', '{}')
          cy.request({
            url: url,
            method: 'POST',
            headers: {
                'Accept': 'application/json'
                // Content-Type seems to be set by some sort, 
                // if you set it, it gets set twice
            },
            body: formData
          }).its('status').should('be.equal', 200)
    })
});

Cypress.Commands.add('clickDataTab', () => {
  var selector = exploreView.controlPanel.panel + ' .ant-tabs-tab-btn'
  cy.get(selector).contains('Data').click()
  // Extra parent because Data is wrapped in a span
  cy.get(selector).contains('Data').parent().parent().should('have.class', 'ant-tabs-tab ant-tabs-tab-active')
});

Cypress.Commands.add('clickCustomizeTab', () => {
  var selector = exploreView.controlPanel.panel + ' .ant-tabs-tab-btn'
  cy.get(selector).contains('Customize').click()
  cy.get(selector).contains('Customize').parent().should('have.class', 'ant-tabs-tab ant-tabs-tab-active')
});

Cypress.Commands.add('clickRawRecordsQueryMode', () => {
  var selector = '[data-test="query_mode"] .btn'
  // TODO Improve this
  cy.get(selector).contains('Raw records').click()
  cy.get(selector).contains('Raw records').should('have.class', 'active')
});

Cypress.Commands.add('clickAggregateQueryMode', () => {
  var selector = '[data-test="query_mode"] .btn'
  // TODO Improve this
  cy.get(selector).contains('Aggregate').click()
  cy.get(selector).contains('Aggregate').should('have.class', 'active')
});

Cypress.Commands.add('clickAggregateDimensionsSelectAllButton', () => {
  cy.get(cccsExploreView.controlPanel.querySection.groupbyHeader +' > .pull-right').find('.fa-arrow-circle-up').click()
});

Cypress.Commands.add('clickAggregateDimensionsCopyContentButton', () => {
  cy.get(cccsExploreView.controlPanel.querySection.groupbyHeader +' > .pull-right').find('.fa-copy').click()
});

Cypress.Commands.add('clickRawRecordsDimensionsSelectAllButton', () => {
  cy.get(cccsExploreView.controlPanel.querySection.columnHeader + ' > .pull-right').find('.fa-arrow-circle-up').click()
});

Cypress.Commands.add('clickRawRecordsDimensionsCopyContentButton', () => {
  cy.get(cccsExploreView.controlPanel.querySection.columnHeader +' > .pull-right').find('.fa-copy').click()
});

Cypress.Commands.add('clickPrincipalColumnsSelectAllButton', () => {
  cy.get(cccsExploreView.controlPanel.querySection.principalColumnsHeader + ' > .pull-right').find('.fa-arrow-circle-up').click()
});

Cypress.Commands.add('clickPrincipalColumnsCopyContentButton', () => {
  cy.get(cccsExploreView.controlPanel.querySection.principalColumnsHeader + ' > .pull-right').find('.fa-copy').click()
});

Cypress.Commands.add('clickRowNumbersCheckbox', () => {
  cy.get(cccsExploreView.customizePanel.optionsSection.enableRowNumbersCheckbox).click()
});

Cypress.Commands.add('testTooltipAfterEnteringValue', (selector: string, inputValue: string, expectedTooltip: string) => {
  if (inputValue === null || inputValue.length === 0) {
    cy.get(selector).clear()
  }
  else {
    cy.get(selector).clear().type(inputValue, {force: true})
  }
  // Both the wait and the seem to be required to have the test pass every run
  cy.wait(500)
  cy.get(selector).click()
  cy.get(selector).then(shouldHaveTooltip(expectedTooltip))
});