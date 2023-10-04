import { forEach } from "cypress/types/lodash";

const ADVANCED_DATA_TYPES: Array<string> = []
const DEFAULT_OPERATORS: Array<string> = ['EQUALS', 'NOT_EQUALS', 'IN', 'NOT_IN', 'IS_NOT_NULL', 'IS_NULL']
const EXTRA_OPERATORS: Array<string> = DEFAULT_OPERATORS.concat('LIKE', 'ILIKE')

before(() => {
  cy.cccsLogin()
  // Call Superset to find the available data types
  let advancedDatatypesQueryUrl = '/api/v1/advanced_data_type/types'
  cy.request(advancedDatatypesQueryUrl).then(response => {
    response.body.result.forEach((advancedDataType: any) => {
      ADVANCED_DATA_TYPES.push(advancedDataType);
    })
    expect(ADVANCED_DATA_TYPES, 'Ensure advanced data type list is not empty').not.to.be.empty
  })

});

beforeEach(() => {
  cy.cccsLogin()
});

describe('Test /convert endpoi5nt', () => {

  const CONVERT_ADVANCED_DATA_TYPE_URL = '/api/v1/advanced_data_type/convert?q='

  /**
   * Test /convert endpoint with invalid values for equals operator.
   * 
   * @param advancedDataType The advanced data type
   * @param values an array of invalid values
   * @param validFilterOperators an array of expected operators
   */
  function testInvalidValuesForEqualsOperator(advancedDataType: string, validFilterOperators: Array<string>, values: Array<string>) {
    expect(ADVANCED_DATA_TYPES, `Ensure '${advancedDataType}' appears in the list of advanced data types`).to.include(advancedDataType)
    values.forEach(value => {
      let requestUrl = CONVERT_ADVANCED_DATA_TYPE_URL + `(operator:EQUALS,type:${advancedDataType},values:!('${value}'))`
      cy.request(requestUrl).then(response => {
        let json  = JSON.parse(JSON.stringify(response.body.result))
        expect(json['display_value'], `For '${advancedDataType}', value '${value}', ensure 'display_value' is empty`).to.be.empty
        let expectedErrorMessage = `'${value}' `
        expect(json['error_message'].startsWith(expectedErrorMessage), `For '${advancedDataType}', value '${value}', ensure 'error_message' starts with '${expectedErrorMessage}'`).to.be.true
        expect(json['valid_filter_operators'].length, `For '${advancedDataType}', value '${value}', number of filter operators is incorrect`).to.be.equal(validFilterOperators.length)
        validFilterOperators.forEach(operator => {
          expect(json['valid_filter_operators'], `For '${advancedDataType}', value '${value}', ensure filter operator '${operator}' is present`).to.include(operator)
        })
      })
    })
  }

 /**
   * Test /convert endpoint with invalid values for equals operator
   * 
   * @param advancedDataType The advanced data type
   * @param values an array of valid values
   * @param validFilterOperators an array of expected operators
   */
  // TODO Add another variation of this test to check with a different operator
  function testValidValuesForEqualsOperator(advancedDataType: string, validFilterOperators: Array<any>, values: Array<any>, expectedValues?: Array<Array<any>>, expectedDisplayValues?: Array<Array<any>>) {
    expect(ADVANCED_DATA_TYPES, `Ensure '${advancedDataType}' appears in the list of advanced data types`).to.include(advancedDataType)
    values.forEach((value, index) => {
      let requestUrl = CONVERT_ADVANCED_DATA_TYPE_URL + `(operator:EQUALS,type:${advancedDataType},values:!('${value}'))`
      cy.request(requestUrl).then(response => {
        if (expectedValues) {
          expect(response.body.result.values[0], `For '${advancedDataType}', value '${value}', ensure 'values' is correct`).deep.equal(expectedValues[index])
        }
        else {
          expect(response.body.result.values, `For '${advancedDataType}', value '${value}', ensure 'values' contains the value`).to.include(String(value))
        }
        if (expectedDisplayValues) {
          if (Array.isArray(expectedDisplayValues[index])) {
            expectedDisplayValues[index].forEach(expectedDisplayValue => {
              expect(response.body.result.values[0], `For '${advancedDataType}', value '${value}', ensure 'values' is correct`).to.include(expectedDisplayValue)
            })
          }
          else {
            expect(response.body.result.display_value, `For '${advancedDataType}', value '${value}', ensure 'display_value' is correct`).to.equals(String(expectedDisplayValues[index]))
          }
        }
        else {
          expect(response.body.result.display_value, `For '${advancedDataType}', value '${value}', ensure 'display_value' is correct`).to.equals(String(value))
        }
        expect(response.body.result.error_message, `For '${advancedDataType}', value '${value}', ensure 'error_message' is empty`).to.be.empty
        expect(response.body.result.valid_filter_operators.length, `For '${advancedDataType}', value '${value}', number of filter operators is correct`).to.be.equal(validFilterOperators.length)
        validFilterOperators.forEach(operator => {
          expect(response.body.result.valid_filter_operators, `For '${advancedDataType}', value '${value}', filter operator '${operator}' is present`).to.include(operator)
        })
      })
    })
  }

  it('Test all advanced data types with no value with operator Equal To (=)', () => {
    ADVANCED_DATA_TYPES.forEach((advancedDataType: any) => {
      let requestUrl = CONVERT_ADVANCED_DATA_TYPE_URL + `(operator:EQUALS,type:${advancedDataType},values:!(''))`
      cy.request(requestUrl).then(response => {
        expect(response.body.result.display_value, `For '${advancedDataType}' advanced data type, ensure 'display_value' is empty`).to.be.empty
        // TODO Dustin will fix port for empty values
        if (advancedDataType != 'port') {
          expect(response.body.result.error_message.endsWith('must not be empty'), `For '${advancedDataType}' advanced data type, ensure 'error_message' ends with 'must not be empty'`).to.be.true
        }
      })
    })
  })

  it('Test invalid advanced data type', () => {
    let invalidAdvancedDataType = 'SomeGarbage'
    let requestUrl = CONVERT_ADVANCED_DATA_TYPE_URL + `(operator:EQUALS,type:${invalidAdvancedDataType},values:!(''))`
    cy.request({ url: requestUrl, failOnStatusCode: false }).then(response => {
      expect(response.status, 'Incorrect status code').to.be.equal(400)
      expect(response.body.message, `Incorrect error message`).to.be.equal(`Invalid advanced data type: ${invalidAdvancedDataType}`)
    })
  })

  {
    const CBS_ID_VALID_OPERATORS = DEFAULT_OPERATORS
    it('Test cbs_id with invalid values', () => {
      let values = ['SomeGarbage', '123456789012345678901234567890', '123456789012345678901234567890123456', '1234%' ]
      testInvalidValuesForEqualsOperator('cbs_id', CBS_ID_VALID_OPERATORS, values)
    })
    it('Test cbs_id with valid values', () => {
      let values = ['00000000-0000-0000-0000-000000000000', 'ffffffff-ffff-ffff-ffff-ffffffffffff']
      testValidValuesForEqualsOperator('cbs_id', CBS_ID_VALID_OPERATORS, values)
    })
  }
  
  {
    // TODO Revisit once the new operators are added, missing the NOT_IN and NOT_EQUALS
    const PORT_VALID_OPERATORS: Array<string> = ['EQUALS', 'NOT_EQUALS', 'GREATER_THAN_OR_EQUAL', 'GREATER_THAN', 'IN', 'NOT_IN', 'LESS_THAN', 'LESS_THAN_OR_EQUAL' ]
    it('Test port with invalid values', () => {
      let values: Array<any> = ['SomeGarbage', '100000', '-100', 65536 ]
      testInvalidValuesForEqualsOperator('port', PORT_VALID_OPERATORS, values)
    })
    it('Test port with valid values', () => {
      let values: Array<any> = ['ftp', 'ftps', 'smtp', 'http', 'ssh', 'https', 65535 ]
      let expectedValues: Array<Array<any>> = [[20, 21], [989, 990], [25], [80], [22], [443], [65535]]
      testValidValuesForEqualsOperator('port', PORT_VALID_OPERATORS, values, expectedValues, expectedValues)
    })
  }

  {
    const AWS_ACCOUNT_ID_VALID_OPERATORS = DEFAULT_OPERATORS
    it('Test aws_account_id with invalid values', () => {
      let values: Array<any> = ['SomeGarbage', 100000, '1234567890', '-10' ]
      testInvalidValuesForEqualsOperator('aws_account_id', AWS_ACCOUNT_ID_VALID_OPERATORS, values)
    })
    it('Test aws_account_id with valid values', () => {
      let values: Array<any> = [123456789012, '000056789012' ]
      testValidValuesForEqualsOperator('aws_account_id', AWS_ACCOUNT_ID_VALID_OPERATORS, values)
    })
  }

  {
    const AWS_ARN_VALID_OPERATORS = EXTRA_OPERATORS
    it('Test aws_arn with invalid values', () => {
      let values: Array<any> = ['SomeGarbage', '100000', '1234567890', 'abcdefghij', 'arn:aws:iam::123456789012']
      testInvalidValuesForEqualsOperator('aws_arn', AWS_ARN_VALID_OPERATORS, values)
    })
    it('Test aws_arn with valid values', () => {
      // TODO Fix the end point to allow the following in comments
      let values: Array<any> = ['arn:aws:iam::123456789012:user/johndoe'/*, 'arn:aws:sns:us-east-1:123456789012:example-sns-topic-name', 'arn:aws:ec2:us-east-1:123456789012:vpc/vpc-0e9801d129EXAMPLE'*/]
      testValidValuesForEqualsOperator('aws_arn', AWS_ARN_VALID_OPERATORS, values)
    })
  }

  {
    const AGENT_ID_OPERATORS = EXTRA_OPERATORS
    it('Test agent_id with valid values', () => {
      let values: Array<any> = ['012345678901', -10, 'fjdhfjdshf843843']
      testValidValuesForEqualsOperator('agent_id', AGENT_ID_OPERATORS, values)
    })
  }

  {
    const DEPARTMENT_VALID_OPERATORS = EXTRA_OPERATORS
    it('Test department with valid values', () => {
      // TODO Fix the end point to allow the following
      let values: Array<any> = ['PSC', 'Department of National defence', '***345***']
      testValidValuesForEqualsOperator('department', DEPARTMENT_VALID_OPERATORS, values)
    })
  }

  {
    const EMAIL_ADDRESS_VALID_OPERATORS = EXTRA_OPERATORS
    it('Test email_address with invalid values', () => {
      let values: Array<any> = ['SomeGarbage', '100000', 'my_email_address_at_mydomain', 'abcdefghij']
      testInvalidValuesForEqualsOperator('aws_arn', EMAIL_ADDRESS_VALID_OPERATORS, values)
    })
    it('Test email_address with valid values', () => {
      // TODO Fix the end point to allow the following
      let values: Array<any> = ['johndoe@mydomain.com', 'myname@', '43243234234@4324324234234']
      testValidValuesForEqualsOperator('department', EMAIL_ADDRESS_VALID_OPERATORS, values)
    })
  }

  {
    const HARMONIZED_EMAIL_ID_VALID_OPERATORS = DEFAULT_OPERATORS
    it('Test harmonized_email_id with invalid values', () => {
      let values: Array<any> = ['SomeGarbage', 'AA', 'ABC_EMAIL_FA', 'CBS_EMAIL', 'NBS_SomeSensor_0000', 'CBS_EMAIL_GHGH']
      testInvalidValuesForEqualsOperator('harmonized_email_id', HARMONIZED_EMAIL_ID_VALID_OPERATORS, values)
    })
    it('Test harmonized_email_id with valid values', () => {
      let values: Array<any> = ['NBS_EMAIL_FA', 'CBS_EMAIL_AABBCCDDEEFF00', 'NBS_EMAIL_000000000000000000000000000000000000000000']
      testValidValuesForEqualsOperator('harmonized_email_id', HARMONIZED_EMAIL_ID_VALID_OPERATORS, values)
    })
  }

  {
    const USER_AGENT_VALID_OPERATORS = EXTRA_OPERATORS
    it('Test user_agent with valid values', () => {
      let values: Array<any> = ['SomeGarbage', '1234567890', 'AbcdeFGHIJ', 'kjfds8f734']
      testValidValuesForEqualsOperator('user_agent', USER_AGENT_VALID_OPERATORS, values)
    })
  }

  {
    const IPV4_VALID_OPERATORS = ['EQUALS','GREATER_THAN_OR_EQUAL','GREATER_THAN','IN','LESS_THAN','LESS_THAN_OR_EQUAL']
  it('Test ipv4 with invalid values', () => {
      let values: Array<any> = ['SomeGarbage', '1.1.1', '1.1.1.1/33', '1.1.1.256', -10000, 10000000000]
      testInvalidValuesForEqualsOperator('ipv4', IPV4_VALID_OPERATORS, values)
    })
    it('Test ipv4 with valid values', () => {
      let values: Array<any> = ['1.1.1.1', '1.1.1.1/32', '255.255.255.255', '1.1.1.1/0']
      let expectedValues: Array<any> = [16843009, 16843009, 4294967295, {"end": 4294967295, "start": 0}]
      // TODO The following shouldn't be strings
      let expectedDisplayValues: Array<any> = ['16843009', '16843009', '4294967295', '0 - 4294967295']
      testValidValuesForEqualsOperator('ipv4', IPV4_VALID_OPERATORS, values, expectedValues, expectedDisplayValues)
    })
  }
})
