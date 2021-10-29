import React, { useEffect, useState } from 'react';
import { RiGlobalFill } from 'react-icons/ri';
import { getChartDataRequest } from 'src/chart/chartAction';
import { QueryFormData, AdhocFilter } from '@superset-ui/core';
import { Row, Col, Grid} from 'react-bootstrap/';
import styles from './styles';
import IPAddressUtil from './IpAddressUtil';
import Collapse from 'src/components/Collapse';

type DataManager = {
  formData : QueryFormData,
  data: any[],
  isInit: boolean,
  isLoading: boolean,
  isError: boolean
}

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

function getHostnames (payload: any) {
  let resultset = []
  resultset = payload.map((a: { rrname: any; }) => a.rrname)
  const uniqueSet = new Set(resultset);
  const result = [...uniqueSet];
  return result;
}

/**
*   buildGeoFormData:
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
const buildGeoFormData = (currentFormData: QueryFormData, ip: string) =>{
  const numericalIP = IPAddressUtil.textToNumericFormatV4(ip);

  // Filter that will be applied to all the queries for each datasrouce. Use this statement when ip_string is available in datasource.
  // const filter : AdhocFilter = {expressionType: 'SIMPLE', clause: 'WHERE', subject: 'ip_string', operator: 'IN', comparator: [ipString] };
  // For now, we are translating the dotted notation back to numerical and casting it into a string as the adhocFilter accepts a string as a comparator but 
  // for the mvp and when the types are put in place by 2A, the component will most like need to be updated.

  const startIPFilter : AdhocFilter = {expressionType: 'SIMPLE', clause: 'WHERE', subject: 'start_ip_int', operator: '<=', comparator: numericalIP == null ? '' : numericalIP.toString(10) };
  const endIPFilter : AdhocFilter = {expressionType: 'SIMPLE', clause: 'WHERE', subject: 'end_ip_int', operator: '>=', comparator: numericalIP == null ? '' : numericalIP.toString(10)};

  // Setting up newStarGeo query:
  const newStarGeoFormData : QueryFormData = JSON.parse(JSON.stringify(currentFormData));
  newStarGeoFormData.adhoc_filters = [startIPFilter, endIPFilter];
  newStarGeoFormData.metrics = undefined; 
  // Datasource Id is specific to the environment. It needs to be changed for each environement as it has to match
  // the datasource id given when it was added to superset.
  newStarGeoFormData.datasource="27__table";
  newStarGeoFormData.columns = ["asn", "carrier", "city", "connection_type", "country", "organization"];

  return newStarGeoFormData;
}

/**
*   buildFarsightFormData:
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
const buildFarsightFormData = (currentFormData: QueryFormData, ip: string) =>{
  const farsightFormData : QueryFormData = JSON.parse(JSON.stringify(currentFormData));

  // Setting up the filter
  const IPFilter : AdhocFilter = {expressionType: 'SIMPLE', clause: 'WHERE', subject: 'rdata', operator: 'IN', comparator: [ip] };

  farsightFormData.adhoc_filters  = [IPFilter];
  farsightFormData.metrics = undefined;
  farsightFormData.columns = ["rrname"];
  // Datasource Id is specific to the environment. It needs to be changed for each environement as it has to match
  // the datasource id given when it was added to superset
  farsightFormData.datasource = "30__table";
  farsightFormData.row_limit = 10;
  return farsightFormData;
}

/**
*   isPayloadUndefined:
*     description: Check if payload is null or undefined.
*     parameter:
*       - name: payload
*       - type: any
*       - required: true
*       - description: data we need to verify.  
*     returns:
*       value:
*         description: Returns true or false.
*/
const isPayloadUndefined = (payload : any) =>{
  return payload == null;
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
// const useDataApi = (formData: QueryFormData, 
//         setData: { (value: React.SetStateAction<never[]>): void; (value: React.SetStateAction<never[]>): void; (arg0: any): void; }, 
//         setIsinit: { (value: React.SetStateAction<boolean>): void; (arg0: boolean): void; },
//         setIsLoading: { (value: React.SetStateAction<boolean>): void; (value: React.SetStateAction<boolean>): void; (arg0: boolean): void; },
//         setIsError: { (value: React.SetStateAction<boolean>): void; (value: React.SetStateAction<boolean>): void; (arg0: boolean): void; }) => {

const useDataApi = (dataManager : DataManager, setDataManager: { (value: React.SetStateAction<DataManager>): void; (arg0: DataManager): void; }) =>{
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
            isInit: true,
            isLoading: true,
            isError: false
          }
        );
        console.log("Set Loading to true");
        const response = await asyncChartDataRequest;
        const newData = response.json.result[0].data;
        setDataManager(
          {
            ...dataManager,
            data: newData,
            isLoading: false
          }
        );
        console.log("Set Loading to false, no error");
      } catch (error) {
          console.log(error);
          setDataManager(
            {
              ...dataManager,
              isError: true,
              isLoading: false,
            }
          );
          console.log("Set loading to false, with error");
      }
      // setIsLoading(false);
    };
    fetchLookupDetails();
  }, [dataManager.formData]);
};

//Main Component
function AtAGlanceCore ( initialFormData: QueryFormData) {
  const DEFAULT_IP_STRING: string = '3.251.148.10';
  const [ipString, setIpString] = useState(DEFAULT_IP_STRING);
  const [formData, setFormData] = useState(initialFormData);

  //neustargeo state
  const [geoFormData, setNewStarGeoFormData] = useState<DataManager>({
    formData : buildGeoFormData(formData, ipString),
    data: [],
    isInit: false,
    isLoading: false,
    isError: false
  });

  //farsight state 
  const [farsightFormData, setFarsightFormData] = useState<DataManager>({
    formData : buildFarsightFormData(formData, ipString),
    data: [],
    isInit: false,
    isLoading: false,
    isError: false
  });

  // Query executions:
  console.log("useDataApi start for geoFormData");
  useDataApi(geoFormData, setNewStarGeoFormData);
  console.log("end useDataApi for geoFormData\n\nuseDataApi start for farsightFormData");
  useDataApi(farsightFormData, setFarsightFormData);
  console.log("end useDataApi for farsightFormData");
  
  for (let i: number = 0; i < initialFormData.formData?.extraFormData?.filters?.length; i++) {
    let filter = initialFormData.formData.extraFormData.filters[i];
    if (filter.col === "ip_string") {
      const localip: string = filter.val[0];
      if (localip !== ipString) {
        setNewStarGeoFormData({
          ...geoFormData,
          formData: buildGeoFormData(initialFormData, localip)
        });
        setFarsightFormData({
          ...farsightFormData,
          formData: buildFarsightFormData(initialFormData, localip)
        });
        setIpString(localip);
      }
      break;
    }
  }

  if (Object.keys(initialFormData.formData.extraFormData).length === 0 && ipString !== DEFAULT_IP_STRING) {
    setIpString(DEFAULT_IP_STRING);
    setNewStarGeoFormData({
      ...geoFormData,
      formData: buildGeoFormData(initialFormData, DEFAULT_IP_STRING)
    });
    setFarsightFormData({
      ...farsightFormData,
      formData: buildFarsightFormData(initialFormData, DEFAULT_IP_STRING)
    });

  }

  return (
    <>
    <div style={styles.SectionTitle}>
      <RiGlobalFill /> <span> At a Glance </span>
    </div>
    <div style={styles.Datum}>
      <Grid fluid >
        <Row >
          <Col style={styles.ColList}> IP: { ipString }</Col>
        </Row>
        <Row >
          <Col style={styles.ColList}> ASN: {geoFormData.isLoading ? "Loading ..." : getPayloadField("asn", geoFormData.data[0])} </Col>
        </Row>
        <Row >
          <Col style={styles.ColList}> CARRIER: {geoFormData.isLoading ? "Loading ..." : getPayloadField("carrier", geoFormData.data[0])} </Col>
        </Row>
        <Row >
          <Col style={styles.ColList}> CONNECTION TYPE: {geoFormData.isLoading ? "Loading ..." :  getPayloadField("connection_type", geoFormData.data[0])} </Col>
        </Row>
        <Row >
          <Col style={styles.ColList}> ORGANIZATION: {geoFormData.isLoading ? "Loading ..." : getPayloadField("organization", geoFormData.data[0])} </Col>
        </Row>
        <Row >
          <Col style={styles.ColList}> CITY: {geoFormData.isLoading ? "Loading ..." : getPayloadField("city", geoFormData.data[0])} </Col>
        </Row>
        <Row >
          <Col style={styles.ColList}> COUNTRY: {geoFormData.isLoading ? "Loading ..." : getPayloadField("country", geoFormData.data[0])} </Col>
        </Row>
        <Row >
          <Col> DECIMAL: {geoFormData.isLoading ? "Loading ..." : getPayloadField("decimal", geoFormData.data[0])} </Col>
        </Row>
      </Grid>
    </div>
    <div style={styles.Datum}>
      <p style={styles.HostnameTitle}>ASSOCIATED HOSTNAMES: {farsightFormData.isLoading ? "Loading..." : farsightFormData.data.length }</p>
      <Grid fluid>
        {farsightFormData.isLoading ? "" : getHostnames(farsightFormData.data).map((hostname: string) => <Row><Col style={styles.RowBullet}>{hostname}</Col></Row>) }
      </Grid>
    </div>    
    </> 
  );
};

export default AtAGlanceCore; 
