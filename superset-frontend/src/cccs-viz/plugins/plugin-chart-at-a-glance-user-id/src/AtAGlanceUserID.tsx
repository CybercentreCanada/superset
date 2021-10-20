import React, { useEffect, useState,  } from 'react';
import { RiGlobalFill } from 'react-icons/ri';
import { getChartDataRequest } from 'src/chart/chartAction';
import { QueryFormData, AdhocFilter } from '@superset-ui/core';
import { Row, Col, Grid} from 'react-bootstrap/';
import Collapse from 'src/components/Collapse';
import styles from './styles';

type DataManager = {
  formData : QueryFormData,
  data : any[],
  isInit : boolean, 
  isLoading : boolean,
  isError : boolean
};

type sasDataManager = {
  title : string,
  table : string,
  dataManager : DataManager,
  setDataManager : React.Dispatch<React.SetStateAction<DataManager>>, 
};

type sasDatasource = {
  title : string,
  table : string,
};

const tablesList : sasDatasource[] = [
  {title : "Teams", table : "26__table"},
  {title : "Exchange", table : "30__table"},
  {title : "One Drive", table : "27__table"},
  {title : "Share Point", table : "29__table"},
] 

const IP_DASHBOARD_ID = 13;
const IP_FILTER_ID = 'DYDz2U6XL'
const SUPERSET_URL = 'http://localhost:9000'
const IP_DASHBOARD_LINK = `${ SUPERSET_URL }/superset/dashboard/${ IP_DASHBOARD_ID }/?native_filters=%28NATIVE_FILTER-${ IP_FILTER_ID }%3A%28__cache%3A%28label%3APLEASEREPLACETHIS%2CvalidateStatus%3A%21f%2Cvalue%3A%21%28PLEASEREPLACETHIS%29%29%2CextraFormData%3A%28filters%3A%21%28%28col%3Aip_string%2Cop%3AIN%2Cval%3A%21%28PLEASEREPLACETHIS%29%29%29%29%2CfilterState%3A%28label%3APLEASEREPLACETHIS%2CvalidateStatus%3A%21f%2Cvalue%3A%21%28PLEASEREPLACETHIS%29%29%2Cid%3ANATIVE_FILTER-${ IP_FILTER_ID }%2CownState%3A%28%29%29%29`;

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

  const userIdOperationFilter : AdhocFilter = {expressionType: 'SIMPLE', clause: 'WHERE', subject: 'operation', operator: 'IN', comparator: ['UserLoggedIn', 'UserLoginFailed']};
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

const buildSASWorkloadCount = (currentFormData: QueryFormData, userId: string, table : string) =>{
  // Filter that will be applied to all the queries for each datasrouce. Use this statement when ip_string is available in datasource.
  // const filter : AdhocFilter = {expressionType: 'SIMPLE', clause: 'WHERE', subject: 'ip_string', operator: 'IN', comparator: [userIDString] };
  // For now, we are translating the dotted notation back to numerical and casting it into a string as the adhocFilter accepts a string as a comparator but 
  // for the mvp and when the types are put in place by 2A, the component will most like need to be updated.

  //const startIPFilter : AdhocFilter = {expressionType: 'SIMPLE', clause: 'WHERE', subject: 'start_ip_int', operator: '<=', comparator: userId == null ? '' : userId};
  // const endIPFilter : AdhocFilter = {expressionType: 'SIMPLE', clause: 'WHERE', subject: 'end_ip_int', operator: '>=', comparator: userId == null ? '' :userId};

  // Setting up newStarGeo query:
  const sasFormData : QueryFormData = JSON.parse(JSON.stringify(currentFormData));

  const userIdFilter : AdhocFilter = {expressionType: 'SIMPLE', clause: 'WHERE', subject: 'userid', operator: '==', comparator: userId};

  sasFormData.adhoc_filters = [userIdFilter];
  sasFormData.metrics = ['count']; 
  sasFormData.time_range = 'Last Week'
  sasFormData.granularity = 'cbs_collection_date'
  // Datasource Id is specific to the environment. It needs to be changed for each environement as it has to match
  // the datasource id given when it was added to superset.
  sasFormData.datasource= table;
  sasFormData.columns = ["operation"];
  sasFormData.extra_filters

  sasFormData
  return sasFormData;
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

const useDataApi = (dataManager : DataManager, setDataManager : { (value: React.SetStateAction<DataManager>): void; (arg0: DataManager): void; }) => {
  useEffect(() => {
    const fetchLookupDetails = async () => {
      try {
        const asyncChartDataRequest = getChartDataRequest({
          formData: dataManager.formData,
          resultFormat: 'json',
          resultType: 'full',
          force: false, // when true, bypass the redis cache
          method: 'POST',
        });
        setDataManager(
          { ...dataManager,
            isInit : true,
            isLoading : true,
            isError : false
          });
        const response = await asyncChartDataRequest;
        const newData = response.json.result[0].data;
        setDataManager(
          { ...dataManager,
            data : newData,
            isLoading : false,
          });
    } catch (error) {
        console.log(error);
        setDataManager(
          { ...dataManager,
            isError : true,
            isLoading : false,
          });
        }
    };
  fetchLookupDetails();
  }, [dataManager.formData]);
};

//Main Component
function AtAGlanceUserIDCore ( initialFormData: QueryFormData) {
  const [userIDString, setUserIDString] = useState('coolguy@some.com,');
  const [formData, ] = useState(initialFormData);

  let canadianIpsList : any[] = [];
  let nonCanadianIpsList : any[] = [];
  let nonSucsessfulCanadianIpsList : any[] = [];
  let nonSucsessfulNonCanadianIpsList : any[] = [];
  let  sasDatamanagerList : sasDataManager[] = [];


  const [aadDataManager, setAadDataManger] = useState<DataManager>({
    formData : buildAadFormData(formData, userIDString),
    data : [],
    isInit: false,
    isLoading: false,
    isError: false
  });

  sasDatamanagerList = tablesList.flatMap( (function (value : sasDatasource) {
    const [dataManager, setDataManager] = useState<DataManager>({
      formData : buildSASWorkloadCount(formData, userIDString, value.table),
      data : [],
      isInit: false,
      isLoading: false,
      isError: false
    });
    return { title: value.title, table : value.table, dataManager : dataManager, setDataManager : setDataManager }
  })); 


  // Query executions:
  useDataApi(aadDataManager, setAadDataManger);
  sasDatamanagerList.forEach( function (value : sasDataManager) {
    useDataApi(value.dataManager, value.setDataManager);
  });

  let hasFiltered = false; 

  for (let i: number = 0; i < initialFormData.formData?.extraFormData?.filters?.length; i++) {
    let filter = initialFormData.formData.extraFormData.filters[i];
    if (filter.col === "user_id") {
      const localuserID: string = filter.val[0];
      if (localuserID !== userIDString) {
        setAadDataManger({
          ...aadDataManager,
          formData :  buildAadFormData(initialFormData, localuserID)
        });
        sasDatamanagerList.forEach( function (value : sasDataManager) {
          value.setDataManager({
            ...value.dataManager,
            formData :  buildSASWorkloadCount(initialFormData, localuserID, value.table)
          })
        });
        setUserIDString(localuserID);
        hasFiltered = false;
      }
      break;
    }
  }

  if (!aadDataManager.isLoading || aadDataManager.isInit && hasFiltered == false)
  {    
    canadianIpsList = aadDataManager.data.filter(function(item){
      return getPayloadField("client_ip_cbs_geo_country_name", item) == 'canada' && getPayloadField("operation", item) == "UserLoggedIn" ;
    })
    
    nonCanadianIpsList = aadDataManager.data.filter(function(item){
      return getPayloadField("client_ip_cbs_geo_country_name", item) != 'canada' && getPayloadField("operation", item) == "UserLoggedIn";
    })

    nonSucsessfulCanadianIpsList = aadDataManager.data.filter(function(item){
      return getPayloadField("client_ip_cbs_geo_country_name", item) == 'canada' && getPayloadField("operation", item) != "UserLoggedIn" ;
    })
    
    nonSucsessfulNonCanadianIpsList = aadDataManager.data.filter(function(item){
      return getPayloadField("client_ip_cbs_geo_country_name", item) != 'canada' && getPayloadField("operation", item) != "UserLoggedIn";
    })
    
   hasFiltered = true;
  }

  
  return (
    <>
    <div style={styles.SectionTitle}>
      <RiGlobalFill /> <span> At a Glance </span>
    </div>
    <div style={styles.DatumTop}>
    <Grid fluid >
    <Row >
      <Col style={styles.DatumTopElement} >
            User Email: { userIDString }
      </Col>
      <Col style={styles.DatumTopElement}>
            User ID:  {aadDataManager.isLoading ? "Loading" :  getPayloadField("user_key", aadDataManager.data[0]) }
      </Col>
    </Row>
    </Grid>
    </div>
    <div style={styles.Datum}>
      <Grid fluid >
        <Row>
          <Collapse
          bordered
          expandIconPosition="left"
          ghost
          >
          <Collapse.Panel 
            header={<span className="header"> Number of Sucessful Canadian Login Attempts : {aadDataManager.isLoading ? "Loading" : canadianIpsList.length } </span>}
            key="1"
          >
            {aadDataManager.isLoading && !aadDataManager.isInit ?
            <></> :
            <ul>
              {canadianIpsList.map((a: { client_ip: string; }) => (
                    <li><a href={IP_DASHBOARD_LINK.replaceAll("PLEASEREPLACETHIS", `'${ a.client_ip }'`)}>{a.client_ip}</a></li>
            ))}
            </ul>}
          </Collapse.Panel>
          <Collapse.Panel 
            header={<span className="header"> Number of Sucessful non Canadian Login Attempts : {aadDataManager.isLoading ? "Loading" : nonCanadianIpsList.length } </span>}
            key="2"
          >
            {aadDataManager.isLoading && !aadDataManager.isInit ?
            <></> :
            <ul>
              {nonCanadianIpsList.map((a: { client_ip: string; }) => (
                  <li>{a.client_ip}</li>
            ))}
            </ul>}
          </Collapse.Panel>
          <Collapse.Panel 
            header={<span className="header"> Number of Unsucessful Canadian Login Attempts : {aadDataManager.isLoading ? "Loading" : nonSucsessfulCanadianIpsList.length } </span>}
            key="3"
          >
            {aadDataManager.isLoading && !aadDataManager.isInit ?
            <></> :
            <ul>
              {nonSucsessfulCanadianIpsList.map((a: { client_ip: string; }) => (
                  <li>{a.client_ip}</li>
            ))}
            </ul>}
          </Collapse.Panel>
          <Collapse.Panel 
            header={<span className="header"> Number of Unsucessful non Canadian Login Attempts : {aadDataManager.isLoading ? "Loading" : nonSucsessfulNonCanadianIpsList.length } </span>}
            key="4"
          >
            {aadDataManager.isLoading && !aadDataManager.isInit ?
            <></> :
            <ul>
              {nonSucsessfulNonCanadianIpsList.map((a: { client_ip: string; }) => (
                  <li>{a.client_ip}</li>
            ))}
            </ul>}
          </Collapse.Panel>
        </Collapse>
        </Row>
      </Grid>
    </div>
    <div style={styles.Datum}>
      <Grid fluid >
        <Row>
          <Collapse
          bordered
          expandIconPosition="left"
          ghost
          >
            {sasDatamanagerList.map((a: sasDataManager) => (
                <Collapse.Panel 
                header={<span className="header"> {a.title} : {a.dataManager.isLoading ? "Loading.." : a.dataManager.data.length } </span>}
                key={a.title}
              >
                {a.dataManager.isLoading && !a.dataManager.isInit ?
                <></> :
                <ul>
                  {a.dataManager.data.map((a: { operation: string, count: number }) => (
                      <li>{a.operation} : {a.count}</li>
                ))}
                </ul>}
              </Collapse.Panel>
            ))}
        </Collapse>
        </Row>
      </Grid>
    </div>    
    </>   
  );
};

export default AtAGlanceUserIDCore; 

