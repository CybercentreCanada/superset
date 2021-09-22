import React, { useEffect, useState } from 'react';
import { RiGlobalFill } from 'react-icons/ri';
import { getChartDataRequest } from 'src/chart/chartAction';
import { QueryFormData, AdhocFilter } from '@superset-ui/core';
import { Row, Col, Grid} from 'react-bootstrap/';
import styles from './styles';
import IPAddressUtil from './IpAddressUtil';

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
  newStarGeoFormData.datasource="28__table";
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
  farsightFormData.datasource = "31__table";
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
        const newData = response.result[0].data;
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
function AtAGlanceCore ( initialFormData: QueryFormData) {
  console.log("In At A Glance");
  const [ipString, setIpString] = useState('3.251.148.10');
  const [formData, setFormData] = useState(initialFormData);

  //neustargeo state
  const [geoFormData, setNewStarGeoFormData] = useState(buildGeoFormData(formData, ipString));
  const [geoData, setGeoData] = useState([]);
  const [isGeoInit, setIsGeoinit] = useState(true);
  const [isGeoLoading, setIsGeoLoading] = useState(false);
  const [isGeoError, setIsGeoError] = useState(false);

  //farsight state 
  const [farsightFormData, setFarsightFormData] = useState(buildFarsightFormData(formData, ipString));
  const [farsightData, setFarsightData] = useState([]);
  const [isFarsightInit, setIsFarsightinit] = useState(true) 
  const [isFarsightLoading, setIsFarsightLoading] = useState(false);
  const [isFarsightError, setIsFarsightError] = useState(false);

  // Query executions:
  useDataApi(geoFormData, setGeoData, setIsGeoinit, setIsGeoLoading, setIsGeoError);
  useDataApi(farsightFormData, setFarsightData, setIsFarsightinit, setIsFarsightLoading, setIsFarsightError);


  //form submit handler
  const [inputIp, setInputIp] = useState(ipString);
  const submit = (event: { preventDefault: () => void; }) => {
    if (inputIp.trim() == "")  
       alert("IP can't be empty");
    else
      event.preventDefault();
      setNewStarGeoFormData(buildGeoFormData(formData, inputIp));
      setFarsightFormData(buildFarsightFormData(formData, inputIp));
      setIpString(inputIp);
  };

  if (isPayloadUndefined(geoData) && !isGeoLoading)
    return (
    <>  
    <div style={styles.SectionTitle}>
      <RiGlobalFill /> <span> At a Glance </span>
    </div>
    <div style={styles.Datum}>
      <form autoComplete="off" onSubmit={submit}>
          <label>
            IP:
            <input type="text" value={inputIp} onChange={e => {setInputIp(e.target.value); console.log( "e value" + e.target.value )} }/>
          </label>
          <input type="submit" value="Submit" />
        </form>
    </div>
      <h3>No data found for this identifier </h3>
    </>
    );

  return (
    <>
    <div style={styles.SectionTitle}>
      <RiGlobalFill /> <span> At a Glance </span>
    </div>
    <div style={styles.Datum}>
      <form autoComplete="off" onSubmit={submit}>
          <label>
            IP:
            <input type="text" value={inputIp} onChange={e => {setInputIp(e.target.value); console.log( "e value" + e.target.value )} }/>
          </label>
          <input type="submit" value="Submit" />
        </form>
    </div>
    <div style={styles.Datum}>
      <Grid fluid >
        <Row >
          <Col> ASN: {isGeoLoading && !isGeoInit ? "Loading ..." : getPayloadField("asn", geoData[0])} </Col>
        </Row>
        <Row >
          <Col> CARRIER: {isGeoLoading && !isGeoInit ? "Loading ..." : getPayloadField("carrier", geoData[0])} </Col>
        </Row>
        <Row >
          <Col> CONNECTION TYPE: {isGeoLoading && !isGeoInit ? "Loading ..." :  getPayloadField("connection_type", geoData[0])} </Col>
        </Row>
        <Row >
          <Col> ORGANIZATION: {isGeoLoading && !isGeoInit ? "Loading ..." : getPayloadField("organization", geoData[0])} </Col>
        </Row>
        <Row >
          <Col> CITY: {isGeoLoading && !isGeoInit ? "Loading ..." : getPayloadField("city", geoData[0])} </Col>
        </Row>
        <Row >
          <Col> COUNTRY: {isGeoLoading && !isGeoInit ? "Loading ..." : getPayloadField("country", geoData[0])} </Col>
        </Row>
        <Row >
          <Col> DECIMAL: {isGeoLoading && !isGeoInit ? "Loading ..." : getPayloadField("decimal", geoData[0])} </Col>
        </Row>
      </Grid>
    </div>
    <div style={styles.Datum}>
      <h5>ASSOCIATED HOSTNAMES:</h5>
        <ul style={styles.HostList}>  
          {isFarsightLoading && !isFarsightInit ? "Loading ..." :  getHostnames(farsightData).map((hostname: string) =>  <li>{hostname}</li>)  } 
        </ul> 
      </div>    
    </> 
  );
};

export default AtAGlanceCore; 
