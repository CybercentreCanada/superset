import { COMPLEX_STRUCTURES_DATASET, 
  cccsExploreView,
  baseFormData,
  DATASET_URL,
  CHART_DATA_URL,
  SQLLAB_URL } from '../support/helper'
import { exploreView } from '../support/directories'
import { graphql_queries } from  '../support/helper';

const DATAHUB_BASE_URL = Cypress.env('datahubBaseUrl')
const GLOSSARY_TERMS_URNS: string[] = Cypress.env('glossaryTermsUrns')
const DOMAINS_URNS: string[] = Cypress.env('domainsUrns')
const DATAHUB_PAT = Cypress.env('datahubPAT')

const databaseMap: Map<string, number> = new Map<string, number>();

before(() => {

  expect(DATAHUB_BASE_URL != undefined, 'Ensure datahubBaseUrl is defined as an environment variable').to.be.true
  expect(GLOSSARY_TERMS_URNS!= undefined || DOMAINS_URNS != undefined, 'Ensure glossaryTermsUrns or domainsUrns are defined as environment variables').to.be.true
  expect(DATAHUB_PAT != undefined, 'Ensure datahubPAT is defined as environment variables').to.be.true

  cy.cccsLogin()

  // Call Superset to find the database unique ids and the store them for subsequent calls
  let databasesQueryUrl = '/api/v1/database/'
    cy.request(databasesQueryUrl).then(databasesResponse => {
      databasesResponse.body.result.forEach((database: any) => {
        databaseMap.set(database.database_name, database.id);
      })
  })
});

describe('Test Dataset Generation script', () => {

  const GRAPHQL_URL = DATAHUB_BASE_URL + '/api/v2/graphql'
  const ACCEPTED_PARTITION_DATATYPES = ['date', 'time', 'timestamp', 'timestamptz']
  const TEMPORAL_DATATYPES = [ 'DATE', 'TIMESTAMP', 'TIME', 'TIMESTAMP WITH TIME ZONE', 'TIME WITH TIME ZONE']
  const COMPLEX_DATATYPES = ['ARRAY', 'STRUCT']
  const OWNER_EXCLUSION_LIST = ['airflow/None']
  const DEFAULT_SUPERSET_DATA_TYPE = "TEXT"
  const DEFAULT_COMPLEX_DATA_TYPE = "JSON"
  const DBT_URN = 'urn:li:dataset:(urn:li:dataPlatform:dbt'
  const ICEBERG_URN = 'urn:li:dataset:(urn:li:dataPlatform:iceberg'

  let warnings: Array<string> = []
  let errors: Array<string> = []

  interface DatahubField {
    description: string | undefined;
    datatype: string;
    advancedDatatype: string | undefined;
    isTemporal: boolean;
  }

  /**
   * Get the partion column of a dataset.
   * 
   * @param dataset The dataset object
   * @returns The partition column or undefined if not found
   */
  function getPartitionColumn(dataset: any) {
    let partitionSpec = undefined
    if (dataset['properties'] && dataset['properties']['customProperties']) {
      dataset["properties"]["customProperties"].forEach((properties: any) => {
        if (properties['key'] == "partition-spec") {
          let aJson = JSON.parse(properties["value"]);
          aJson.forEach((item: any) => {
            if (ACCEPTED_PARTITION_DATATYPES.includes(item['source-type'])) {
              partitionSpec = item['source']
            }
          })
        }
      })
    }
    return partitionSpec
  }

  /**
   * Get the owners of an entity as an array, never null.
   * 
   * @param entity The entity object as returned by GrpahQL
   * @returns An array of stings representing the supported owners
   */
  function getOwners(entity: any) {
    let owners = new Array()
    if (entity['ownership'] && entity['ownership']['owners']) {
      entity['ownership']['owners'].forEach((owner: any) => {
        if (owner["owner"] && owner["owner"]["info"] && owner["owner"]["info"]["displayName"]) {
          owners.push(owner["owner"]["info"]["displayName"])
        }
        else if (owner["owner"]["type"]) {
          let ownerNameType = owner["owner"]["type"]
          if (ownerNameType == 'CORP_USER') {
            owners.push(owner['owner']['username'])
          }
          else if (ownerNameType == 'CORP_GROUP') {
            owners.push(owner['owner']['name'])
          }
        }
      })
    }
    return owners.filter(owner => !OWNER_EXCLUSION_LIST.includes(owner));
  }

  /**
   * Retrieves the first field name in a field path. This means that if the field is a child field,
   * this method will return the field name of the parent.
   * 
   * @param field the field object
   * @returns The first field name in the field path.
   */
  function getFieldName(field: any) {
    let fieldName = undefined
    let match  = field['fieldPath'].match(String.raw`(?:\[\S*?=\S*?\]\.)*([^\.\s]*)(?:\..*)?`);
    if (match) {
      fieldName = match[1]
    }
    return fieldName
  }

  /**
   * Based on type, get the transledt type for Superset.
   * 
   * @param datatype The datatype we want to translate.
   * @returns The Superset datatype, never null.
   */
  function getSupersetDatatype(datatype: string) {
    datatype = datatype.toUpperCase()
    let returnDatatype = datatype
    if (datatype == 'STRING' || datatype.startsWith('VARCHAR')) {
      returnDatatype = DEFAULT_SUPERSET_DATA_TYPE
    }
    else if (datatype == 'NUMBER') {
      returnDatatype = 'NUMERIC'
    }
    else if (TEMPORAL_DATATYPES.includes(datatype)) {
      returnDatatype = 'TIMESTAMP WITH TIME ZONE'
    }
    else if (COMPLEX_DATATYPES.includes(datatype)) {
      returnDatatype = DEFAULT_COMPLEX_DATA_TYPE
    }
    return returnDatatype
  }

  /**
   * Parse the full qualified dataset name
   * 
   * @param name The full qualified name
   * @returns A structure of 3 elements (catalog, schema, tableName) if successfully parsed or 
   * undefined if not parsed.
   */
  function parseDatasetName(name: String) {
    let nameStructure = undefined
    let match = name.match(String.raw`(\S+?)\.(\S+?)\.(\S+)`);
    if (match && match.length >= 3) {
      nameStructure = { 'catalog': match[1], 'schema': match[2], 'tableName': match[3] };
    }
    return nameStructure
  }

  /**
   * Run a dummy query in Superset against a dataset with all the columns.
   * 
   * @param id The dataset id
   * @param defaultDateTimeColumn the default date column / partition column
   * @param columns an array of columns
   */
  function runSimpleSupersetDatasetQuery(id: string, defaultDateTimeColumn: undefined, columns: string[], messagePrefix: string) {
    let formData = { ...baseFormData.form_data, datasource: id + '__table', columns: columns }
    let datasource = { ...baseFormData.datasource, id: id }
    let query
    if (defaultDateTimeColumn) {
      query = { ...baseFormData.queries[0], columns: columns, filters: [{ col: defaultDateTimeColumn, op: 'TEMPORAL_RANGE', val: 'Last week'}] }
    }
    else {
      query = { ...baseFormData.queries[0], columns: columns }
    }
    let postData = { ...baseFormData, datasource: datasource, form_data: formData, queries: [query] }
    let options = { 
      method: 'POST',
      url: CHART_DATA_URL,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: postData,
      timeout: 5 * 60 * 1000, // Give 5mins to query
      failOnStatusCode: false
    }
    cy.request(options).then((dummyQueryResponse) => {
      if (dummyQueryResponse.status == 200) {
        // Query is fine
        if (dummyQueryResponse.body.result[0].data.length == 0) {
          // Query is fine but we anticipated some results
          if (defaultDateTimeColumn) {
            warnings.push(`${messagePrefix}, 'has no data for the last week'`)
          }
          else {
            warnings.push(`${messagePrefix}, ' no data could be found'`)
          }
        }
      }
      else {
        // Something went wrong
        errors.push(`${messagePrefix}, ' a simple query returns ${dummyQueryResponse.statusText} (${dummyQueryResponse.status}), ${dummyQueryResponse.body.message}`)
      }
    })
  }

  it('Collect discrepancies between Datahub and Superset datasets for specific glossary terms or domains', () => {

    let headers = { 'Authorization': `Bearer ${DATAHUB_PAT}` }
    let input = {
      'count': 10000,
      'scrollId': null,
      'orFilters': [
          {'and': [{'field': 'glossaryTerms', 'values': GLOSSARY_TERMS_URNS}]},
          {'and': [{'field': 'domains', 'values': DOMAINS_URNS}]}
      ],
      'query': '*',
      'types': ['DATASET'],
    }
    let postData = {'query': graphql_queries.query_scrollAcrossEntities, 'variables': {'input': input}}

    cy.request({method: 'POST', url: GRAPHQL_URL, headers: headers, body: postData}).then((response) => {
      let entities = response.body['data']['scrollAcrossEntities']['searchResults']
      // TODO Deal with nextScrollId until null
      cy.log(`Found ${entities.length} datasets matching the criteria`)
      entities.forEach((entity: any) => {
        let datasetUrn :string = entity['entity']['urn']
        // Skip soft deleted datasets
        if (entity['status'] && entity['status']['removed']) {
          warnings.push(`Dataset ${datasetUrn} is soft deleted, will be skipped`)
          return false
        }
        // Call DataHub to get the metadata of the dataset
        let datasetData = {'query': graphql_queries.get_dataset, 'variables': {'urn': datasetUrn}}
        cy.request({method: 'POST', url: GRAPHQL_URL, headers: headers, body: datasetData}).then((response) => {
          let dataset = response.body['data']['dataset']
          let datasetFullQualifiedName = dataset['name']
          cy.log('Processing ' + datasetFullQualifiedName + '...')
          // If the entity is a dbt dataset, use the Iceberg table sibling as
          // the dbt version does not have partition column information nor
          // displays the correct data type for complex fields (arrays, structs, etc.)
          if (datasetUrn.startsWith(DBT_URN)) {
            if (entity['siblings'] &&
                entity['siblings']['siblings'] && 
                entity['siblings']['siblings'][0]['urn'] && 
                String(entity['siblings']['siblings'][0]['urn']).startsWith(ICEBERG_URN)) {
              dataset = entity["siblings"]["siblings"][0]
            }
            else {
              warnings.push(`Dataset ${datasetFullQualifiedName} does not have a sibling Iceberg dataset, will be skipped`)
              return false
            }
          }
          let nameStructure = parseDatasetName(datasetFullQualifiedName)
          if (nameStructure) {
            let catalog = nameStructure['catalog']
            let schema = nameStructure['schema']
            let tableName = nameStructure['tableName']
            let datasetOwners = getOwners(dataset)
            let datasetPartitionColumn = getPartitionColumn(dataset)
            // If there are no datetime partition columns in the main dataset, check sibling entities
            if (datasetPartitionColumn == undefined &&
                dataset['siblings'] &&
                dataset['siblings']['siblings']) {
                  datasetPartitionColumn = getPartitionColumn(dataset['siblings']['siblings'][0])
            }
            let editableSchemaMetadata = dataset['editableSchemaMetadata']
            // Collecting DataHub dataset advanced data types and descriptions for all fields
            let descriptions: Map<string, string> = new Map<string, string>();
            let advancedDatatypes: Map<string, string> = new Map<string, string>();
            if (editableSchemaMetadata && editableSchemaMetadata['editableSchemaFieldInfo']) {
              let editableSchemaFieldInfo = editableSchemaMetadata['editableSchemaFieldInfo']
              editableSchemaFieldInfo.forEach((field: any) => {
                if (field['description']) {
                  descriptions.set(field['fieldPath'], field['description'])
                }
                if (field['glossaryTerms'] && 
                  field['glossaryTerms']['terms'] && 
                  field['glossaryTerms']['terms'].filter((term: any) => term['term']['urn'].toLowerCase().includes('advanceddatatype')).length > 0) {
                  // The advanced data type is the first glossary term that is an advanced datatype
                  let advancedDatatype = field['glossaryTerms']['terms'].filter((term: any) => term['term']['urn'].toLowerCase().includes('advanceddatatype'))[0]['term']['name']
                  advancedDatatypes.set(field['fieldPath'], advancedDatatype)
                }
              })
            }
            // Collecting DataHub dataset fields
            let datahubDatasetFieldMap: Map<string, DatahubField> = new Map<string, DatahubField>(); 
            dataset['schemaMetadata']['fields'].forEach((field: any) => {
              let fieldName = getFieldName(field)
              // We are only interested in top level fields, which is always the first one to be named in the list
              if (! datahubDatasetFieldMap.has(fieldName)) {
                let fieldPath = field["fieldPath"]
                let datahubField: DatahubField = {
                  description: descriptions.has(fieldPath) ? descriptions.get(fieldPath) : undefined,
                  datatype: field['type'],
                  advancedDatatype: advancedDatatypes.has(fieldPath) ? advancedDatatypes.get(fieldPath) : undefined,
                  isTemporal: TEMPORAL_DATATYPES.includes(field['type'].toUpperCase())
                };
                datahubDatasetFieldMap.set(fieldName, datahubField)
              }
            })
            if (datahubDatasetFieldMap.size == 0) {
              warnings.push(`Dataset ${datasetFullQualifiedName} does not have any fields, will be skipped`)
              return false
            }
            // Call Superset to find the unique identifier of the dataset
            if (databaseMap.has(catalog)) {
              let databaseId = databaseMap.get(catalog)
              let datasetsQueryUrl = `/api/v1/dataset/?q=(filters:!((col:database,opr:equal,value:'${databaseId}'),(col:schema,opr:eq,value:'${schema}'),(col:table_name,opr:eq,value:'${tableName}')))`
              cy.request(datasetsQueryUrl).then(datasetsResponse => {
                if (datasetsResponse.body.count > 0) {
                  let supersetDatasetId = datasetsResponse.body.ids[0]
                  // Call Superset to get metadata of the dataset
                  let datasetQueryUrl = DATASET_URL + supersetDatasetId
                  cy.request(datasetQueryUrl).then(datasetResponse => {
                    let errorDatasetPrefix = `Datahub dataset '${datasetFullQualifiedName}', Superset dataset '${tableName} for database '${catalog}' and schema '${schema}'`
                    let extraAsJson = JSON.parse(datasetResponse.body.result.extra);
                    // Check owners
                    if (datasetOwners.length > 0) {
                      if (extraAsJson['certification'] && extraAsJson['certification']['certified_by']) {
                        let certifiedByItems = extraAsJson['certification']['certified_by']
                        if (datasetOwners.length != certifiedByItems.length) {
                          errors.push(`${errorDatasetPrefix}, for 'certification' value in extra settings, expected number of 'certified_by' values of ${datasetOwners.length} but got ${certifiedByItems.length}, ${certifiedByItems}`)
                        }
                        else {
                          datasetOwners.forEach((owner: string) => {
                            if (!certifiedByItems.includes(owner)) {
                              errors.push(`${errorDatasetPrefix}, for 'certification' value in extra settings, missing 'certified_by' value for '${owner}'`)
                            }
                          })
                        }
                      }
                    }
                    else if (extraAsJson['certification']) {
                      errors.push(`${errorDatasetPrefix}, for 'certification' value from the extra settings, expected empty value but got ${extraAsJson['certification']}`)
                    }
                    // Check Datahub urn in extra settings
                    if (!extraAsJson['urn'] || extraAsJson['urn'] != datasetUrn) {
                      errors.push(`${errorDatasetPrefix}, for 'urn' value from the extra settings, expected ${datasetUrn} but got ${extraAsJson['urn']}`)
                    }
                    // Check import value in extra settings
                    if (extraAsJson['imported_from_datahub']) {
                      if (String(extraAsJson['imported_from_datahub']) != 'true') {
                        errors.push(`${errorDatasetPrefix}, for 'imported_from_datahub' value from the extra settings, expected 'true' but got '${extraAsJson['imported_from_datahub']}'`)
                      }
                    }
                    else {
                      errors.push(`${errorDatasetPrefix}, the 'imported_from_datahub' value from the extra settings is missing`)
                    }
                    // Check main temporal column
                    if (!datasetPartitionColumn) {
                      if (extraAsJson['warning_markdown']) {
                        if (!String(extraAsJson['warning_markdown']).includes('There are no datetime partition columns in this dataset')) {
                          errors.push(`${errorDatasetPrefix}, the warning message to indicate there is no default temporal column is missing from the extra settings but '${extraAsJson['warning_markdown']}' was found`)
                        }
                      }
                      else if (extraAsJson['warning_markdown']) {
                        errors.push(`${errorDatasetPrefix}, the warning message to indicate there is no default temporal column is missing from the extra settings`)
                      }
                    }
                    if (datasetPartitionColumn != datasetResponse.body.result.main_dttm_col) {
                      errors.push(`${errorDatasetPrefix}, partition field does not match: partition field '${datasetPartitionColumn}' vs main temporal field '${datasetResponse.body.result.main_dttm_col}' `)
                    }
                    // Check fields
                    let supersetDatasetFieldCount = datasetResponse.body.result.columns.length
                    if (supersetDatasetFieldCount === datahubDatasetFieldMap.size) {
                        // TODO Check the order for fields, this is kind of broken with subsequent imports
                        datasetResponse.body.result.columns.forEach((column: any) => {
                          let errorFieldPrefix = `${errorDatasetPrefix}, for field '${column.column_name}'`
                          if (datahubDatasetFieldMap.has(column.column_name)) {
                            let datahubDatasetField = datahubDatasetFieldMap.get(column.column_name)
                            // Check description
                            if (datahubDatasetField?.description != column.description) {
                              errors.push(`${errorFieldPrefix}, descriptions don't match, '${datahubDatasetField?.description}' vs '${column.description}' `)
                            }
                            // Check label, not checking the content
                            if (!column.verbose_name) {
                              errors.push(`${errorFieldPrefix}, label is missing`)
                            }
                            // Check datatype
                            let translatedDatatype = getSupersetDatatype(datahubDatasetField!.datatype)
                            if (translatedDatatype != column.type) {
                              errors.push(`${errorFieldPrefix}, data types don't match: '${translatedDatatype}' vs '${column.type}'`)
                            }
                            // Check filterable flag
                            if (COMPLEX_DATATYPES.includes(datahubDatasetField!.datatype)) {
                              if (column.filterable) {
                                errors.push(`${errorFieldPrefix}, flag 'filterable' is enabled but it should not be`)
                              }
                            }
                            else if (!column.filterable) {
                              errors.push(`${errorFieldPrefix}, field should be filterable but it is not`)
                            }
                            // Check group by flag, whether or not the field shows up as a Dimension
                            if (!column.groupby) {
                              errors.push(`${errorFieldPrefix}, field should be a dimension but it is not`)
                            }
                            // Check advanced datatypes
                            if (datahubDatasetField?.advancedDatatype != column.advanced_data_type) {
                              errors.push(`${errorFieldPrefix}, advanced datatypes don't match: '${datahubDatasetField?.advancedDatatype}' vs '${column.advanced_data_type}' `)
                            }
                            // Check is temporal
                            if (TEMPORAL_DATATYPES.includes(datahubDatasetField!.datatype)) {
                              if (!column.is_dttm) {
                                errors.push(`${errorFieldPrefix}, field should be temporal in Superset but it is not`)
                              }
                            }
                            else {
                              if (column.is_dttm) {
                                errors.push(`${errorFieldPrefix}, field should not be temporal in Superset but it is`)
                              }
                            }
                          }
                          else {
                            errors.push(`${errorDatasetPrefix}, can't find Datahub field '${column.column_name}' in Superset dataset'`)
                          }
                      })
                    }
                    else {
                      errors.push(errorDatasetPrefix + `, field list sizes don't match: ${datahubDatasetFieldMap.size} vs ${supersetDatasetFieldCount}`)
                    }
                    // Run a dummy query and ensure we get some results
                    const columns: Array<string> = []
                    datasetResponse.body.result.columns.forEach((column: any) => {
                      columns.push(column.column_name)
                    })
                    // Check a simple query with all the columns
                    runSimpleSupersetDatasetQuery(supersetDatasetId, datasetPartitionColumn, columns, errorDatasetPrefix)
                  })
                }
                else {
                  errors.push(`Superset dataset '${tableName}' with database '${catalog}' and schema '${schema}' does not exist`)
                }
              })
            }
            else {
              errors.push(`Datahub dataset '${datasetFullQualifiedName}' has the catalog '${catalog}' that could not be found in Superset`)
            }
          }
          else {
            // Error parsing the schema, catalog and table names
            errors.push(`Error parsing the full qualified name for Datahub dataset ${datasetFullQualifiedName}`)
          }
        })
      })

    })
  })

  it('Report discrepancies between Datahub and Superset datasets for specific glossary terms or domains', () => {
    if (warnings.length > 0) {
      cy.log('Some warnings were found:')
      warnings.forEach(warning => {
        cy.log(warning)
      })
    }
    expect(errors, 'Ensure error list is empty: \n' + errors.join('\n') + '\n').to.be.empty
  })
})
