import React, { useEffect, useState } from 'react';
import { RiGlobalFill } from 'react-icons/ri';
import { getChartDataRequest } from 'src/chart/chartAction';
import { QueryFormData, AdhocFilter } from '@superset-ui/core';
import { Row, Col, Grid} from 'react-bootstrap/';
import styles from './styles';

/**
*   getPayloadField:
*     description: Returns the value for a given field.
*     parameters:
*       - name: field
*       - type: string
*       - required: true
*       - description: name of the field you want to get the value of  
*
*       - name: payload
*       - type: any
*       - required: true
*       - description: data object containing the response from the server.  
*     returns:
*       value:
*         description: Returns the value of the given field if found.
*/
const getPayloadField = (field: string, payload: any) => {
  try{
    if (payload != undefined) {
      const value = payload[field];
      if (value !== null) {
        return value;
      }
      else{
        return "Unknown";
      }
    }
  }catch (e)
  {
    console.log(e);
    return "Something went wrong";
  }
};

/**
*   buildaadFormData:
*     description: builds the formData object that will be passed to the server in the request.
*     parameters:
*       - name: currentFormData
*       - type: QueryFormData
*       - required: true
*       - description: current formdata object that needs to be updated  
*
*       - name: ip
*       - type: string
*       - required: true
*       - description: ip that needs to be added to the current form data.  
*     returns:
*       value:
*         description: Returns the appropriately filled form data.
*/
const buildAadFormData = (currentFormData: QueryFormData, userId: string) =>{
  // Filter that will be applied to all the queries for each datasrouce. Use this statement when ip_string is available in datasource.
  // const filter : AdhocFilter = {expressionType: 'SIMPLE', clause: 'WHERE', subject: 'ip_string', operator: 'IN', comparator: [userIDString] };
  // For now, we are translating the dotted notation back to numerical and casting it into a string as the adhocFilter accepts a string as a comparator but 
  // for the mvp and when the types are put in place by 2A, the component will most like need to be updated.

  //const startIPFilter : AdhocFilter = {expressionType: 'SIMPLE', clause: 'WHERE', subject: 'start_ip_int', operator: '<=', comparator: userId == null ? '' : userId};
  // const endIPFilter : AdhocFilter = {expressionType: 'SIMPLE', clause: 'WHERE', subject: 'end_ip_int', operator: '>=', comparator: userId == null ? '' :userId};

  // Setting up newStarGeo query:
  const aadFormData : QueryFormData = JSON.parse(JSON.stringify(currentFormData));

  const userIdOperationFilter : AdhocFilter = {expressionType: 'SIMPLE', clause: 'WHERE', subject: 'operation', operator: '==', comparator: 'UserLoggedIn'};
  console.log("USER_ID: " + userId )
  const userIdFilter : AdhocFilter = {expressionType: 'SIMPLE', clause: 'WHERE', subject: 'user_id', operator: '==', comparator: userId};

  aadFormData.adhoc_filters = [userIdOperationFilter, userIdFilter];
  aadFormData.metrics = undefined; 
  aadFormData.time_range = 'Last Day'
  aadFormData.granularity = 'cbs_collection_date'
  // Datasource Id is specific to the environment. It needs to be changed for each environement as it has to match
  // the datasource id given when it was added to superset.
  aadFormData.datasource="24__table";
  aadFormData.columns = ["user_id","client_ip","client_ip_cbs_geo_country_name","operation","user_key"];

  return aadFormData;
}

const buildAadActionFormData = (currentFormData: QueryFormData, userId: string) =>{
  // Filter that will be applied to all the queries for each datasrouce. Use this statement when ip_string is available in datasource.
  // const filter : AdhocFilter = {expressionType: 'SIMPLE', clause: 'WHERE', subject: 'ip_string', operator: 'IN', comparator: [userIDString] };
  // For now, we are translating the dotted notation back to numerical and casting it into a string as the adhocFilter accepts a string as a comparator but 
  // for the mvp and when the types are put in place by 2A, the component will most like need to be updated.

  //const startIPFilter : AdhocFilter = {expressionType: 'SIMPLE', clause: 'WHERE', subject: 'start_ip_int', operator: '<=', comparator: userId == null ? '' : userId};
  // const endIPFilter : AdhocFilter = {expressionType: 'SIMPLE', clause: 'WHERE', subject: 'end_ip_int', operator: '>=', comparator: userId == null ? '' :userId};

  // Setting up newStarGeo query:
  const aadFormData : QueryFormData = JSON.parse(JSON.stringify(currentFormData));

  const userIdOperationFilter : AdhocFilter = {expressionType: 'SIMPLE', clause: 'WHERE', subject: 'operation', operator: '==', comparator: 'UserLoggedIn'};
  console.log("USER_ID: " + userId )
  const userIdFilter : AdhocFilter = {expressionType: 'SIMPLE', clause: 'WHERE', subject: 'user_id', operator: '==', comparator: userId};

  aadFormData.adhoc_filters = [userIdOperationFilter, userIdFilter];
  aadFormData.metrics = undefined; 
  aadFormData.time_range = 'Last Day'
  aadFormData.granularity = 'cbs_collection_date'
  // Datasource Id is specific to the environment. It needs to be changed for each environement as it has to match
  // the datasource id given when it was added to superset.
  aadFormData.datasource="24__table";
  aadFormData.columns = ["user_id","client_ip","client_ip_cbs_geo_country_name","operation","user_key"];

  return aadFormData;
}


/**
*   useDataApi:
*     description: Custom hook that queries the dataset.
*     parameters:
*       - name: formData
*       - type: QueryFormData
*       - required: true
*       - description: Contains all the request information that is sent to the back end.
*
*       - name: setData, 
*       - type: SetStateAction
*       - required: true
*       - description: sets the data property to the response data.  
*
*       - name: setIsinit, 
*       - type: SetStateAction
*       - required: true
*       - description: sets the appropriate data property to the response data.  
*
*       - name: setIsLoading, 
*       - type: SetStateAction
*       - required: true
*       - description: sets the appropriate isLoading property to either true or false depending on the 
*         state of the query to the back end. 
* 
*       - name: setIsError, 
*       - type: SetStateAction
*       - required: true
*       - description: sets the appropriate setIsError property to either true or false depending on the 
*         state of the query to the back end.  
*/
const useDataApi = (formData: QueryFormData, 
        setData: { (value: React.SetStateAction<never[]>): void; (value: React.SetStateAction<never[]>): void; (arg0: any): void; }, 
        setIsinit: { (value: React.SetStateAction<boolean>): void; (arg0: boolean): void; },
        setIsLoading: { (value: React.SetStateAction<boolean>): void; (value: React.SetStateAction<boolean>): void; (arg0: boolean): void; },
        setIsError: { (value: React.SetStateAction<boolean>): void; (value: React.SetStateAction<boolean>): void; (arg0: boolean): void; }) => {
  useEffect(() => {
    const fetchLookupDetails = async () => {
      try {
        const asyncChartDataRequest = getChartDataRequest({
          formData: formData,
          resultFormat: 'json',
          resultType: 'full',
          force: false, // when true, bypass the redis cache
          method: 'POST',
        });
        setIsinit(false);
        setIsLoading(true);
        setIsError(false);
        const response = await asyncChartDataRequest;
        const newData = response.json.result[0].data;
        setIsLoading(false);
        setData(newData);
      } catch (error) {
          console.log(error);
          setIsError(true);
          setIsLoading(false);
      }

      setIsLoading(false);
    };
    fetchLookupDetails();
  }, [formData]);
};


//Main Component
function AtAGlanceUserIDCore ( initialFormData: QueryFormData) {
  const [userIDString, setUserIDString] = useState('coolguy@some.com,');
  const [formData, ] = useState(initialFormData);

  //neustargeo state 
  const [aadFormData, setAadFormData] = useState(buildAadFormData(formData, userIDString));
  const [aadData, setAadData] = useState([]);
  const [isAadInit, setIsAadInit] = useState(true);
  const [isAadLoading, setIsAadLoading] = useState(false);
  const [, setIsAadError] = useState(false);

  // Query executions:
  useDataApi(aadFormData, setAadData, setIsAadInit, setIsAadLoading, setIsAadError);
  let canadianIpsList : any[] = [];
  let nonCanadianIpsList : any[] = [];

  let hasFiltered = false; 

  for (let i: number = 0; i < initialFormData.formData?.extraFormData?.filters?.length; i++) {
    let filter = initialFormData.formData.extraFormData.filters[i];
    console.log('FILTER COL' + filter.col )

    if (filter.col === "user_id") {
      const localuserID: string = filter.val[0];
      if (localuserID !== userIDString) {
        setAadFormData(buildAadFormData(initialFormData, localuserID));
        setUserIDString(localuserID);
        hasFiltered = false;
      }
      break;
    }
  }

  if (!isAadLoading || isAadInit && hasFiltered == false)
  {
    console.log("FILTERING HEGYFEGGY")
    
    canadianIpsList = aadData.filter(function(item){
      return getPayloadField("client_ip_cbs_geo_country_name", item) == 'canada';
    })
    
    nonCanadianIpsList = aadData.filter(function(item){
      return getPayloadField("client_ip_cbs_geo_country_name", item) != 'canada';
    })
   hasFiltered = true;
   console.log("FILTERING HEGYFEGGY: " + canadianIpsList)
  }

  
  return (
    <>
    <div style={styles.SectionTitle}>
      <RiGlobalFill /> <span> At a Glance </span>
    </div>
    <div style={styles.Datum}>
      <Grid fluid >
        <Row>
          <Row >
            <Col> User ID: { userIDString }</Col>
          </Row>
          <Row >
            <Col> User Key: {isAadLoading && !isAadInit ? "Loading ..." : getPayloadField("user_key", aadData[0])} </Col>
          </Row>
          <Row >
            <Col> Number of sucessfull login attempts (total): {isAadLoading && !isAadInit ? "Loading ..." : aadData.length } </Col>
          </Row>
          <Row >
            <Col> Nummber of sucessfull login attempst (Outside Canada): {isAadLoading && !isAadInit ? "Loading ..." : nonCanadianIpsList.length} </Col>
          </Row>
          <Row >
            <Col> Number of sucessfull login attempts (Inside Canada): {isAadLoading && !isAadInit ? "Loading ..." : canadianIpsList.length} </Col>
          </Row>
          <Row >
            <Col> Actions: {isAadLoading && !isAadInit ? "Loading ..." : getPayloadField("user_id", aadData[0])} </Col>
          </Row>
        </Row>
      </Grid>
    </div>
    <div style={styles.Datum}>
      <p style={styles.HostnameTitle}>Logons from canadian IPs:</p>
      <Grid fluid>
        {isAadLoading && !isAadInit ? "Loading..." : canadianIpsList.map((row: { client_ip: any; }) => <Row><Col style={styles.RowBullet}> {row.client_ip} </Col></Row>) }
      </Grid>
    </div>
    <div style={styles.Datum}>
      <p style={styles.HostnameTitle}>Logons from non canadian IPs:</p>
      <Grid fluid>
        {isAadLoading && !isAadInit ? "Loading..." : nonCanadianIpsList.map((row: { client_ip: any; }) => <Row><Col style={styles.RowBullet}> {row.client_ip} </Col></Row>) }
      </Grid>
    </div>      
    </>   
  );
};

export default AtAGlanceUserIDCore; 
