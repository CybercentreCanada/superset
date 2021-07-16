/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */


// The following Styles component is a <div> element, which has been styled using Emotion
// For docs, visit https://emotion.sh/docs/styled

// Theming variables are provided for your use via a ThemeProvider
// imported from @superset-ui/core. For variables available, please visit
// https://github.com/apache-superset/superset-ui/blob/master/packages/superset-ui-core/src/style/index.ts

// const Styles = styled.div<AtAGlanceStylesProps>`
//   background-color: ${({ theme }) => theme.colors.secondary.light2};
//   padding: ${({ theme }) => theme.gridUnit * 4}px;
//   border-radius: ${({ theme }) => theme.gridUnit * 2}px;
//   height: ${({ height }) => height};
//   width: ${({ width }) => width};
//   overflow-y: scroll;

//   h3 {
//     /* You can use your props to control CSS! */
//     font-size: ${({ theme, headerFontSize }) => theme.typography.sizes[headerFontSize]};
//     font-weight: ${({ theme, boldText }) => theme.typography.weights[boldText ? 'bold' : 'normal']};
//   }
// `;


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
  const uniqueSet = new Set(payload.map(a => a.rrname));
  const result = [...uniqueSet];
  console.log("payload: "  + JSON.stringify(payload));
  console.log("hostnames: "  + JSON.stringify(result));
  return result;
  // if (props.isFarsightLoading && !props.isFarsightInit) { 
  //   return "Loading ...";
  // }
  // return getPayloadField("rrdata", props.farsightData).map((hostname) => console.log);
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
     
  const startIPFilter : AdhocFilter = {expressionType: 'SIMPLE', clause: 'WHERE', subject: 'start_ip_int', operator: '<=', comparator: numericalIP.toString(10) };
  const endIPFilter : AdhocFilter = {expressionType: 'SIMPLE', clause: 'WHERE', subject: 'end_ip_int', operator: '>=', comparator: numericalIP.toString(10)};
 
  // Setting up newStarGeo query:
  const newStarGeoFormData : QueryFormData = JSON.parse(JSON.stringify(currentFormData));
  newStarGeoFormData.adhoc_filters = [startIPFilter, endIPFilter];
  newStarGeoFormData.metrics = undefined;
  newStarGeoFormData.datasource="60__table";
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
  
  // Setting up the filters
  const IPFilter : AdhocFilter = {expressionType: 'SIMPLE', clause: 'WHERE', subject: 'rdata', operator: 'IN', comparator: [ip] };

  farsightFormData.adhoc_filters  = [IPFilter];
  farsightFormData.metrics = undefined;
  farsightFormData.columns = ["rrname"];
  farsightFormData.datasource = "58__table";
  farsightFormData.limit = 10;
  return farsightFormData;
}

const isPayloadUndefined = (payload : any) =>{
  return payload == null;
}

const useDataApi = (formData: QueryFormData) => {
  const [data, setData] = useState([]); 
  const [isInit, setIsinit] = useState(true)
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  console.log("In useDataApi beginning- formData: " + JSON.stringify(formData));
  console.log("In useDataApi beginning - data: " + JSON.stringify(data));
   
  useEffect(() => {
    console.log("isInit: " + isInit);
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
  return [{ data, isLoading, isError, isInit }] as const;
};

function AtAGlanceCore ( initialFormData: QueryFormData) {
  console.log("In At A Glance");
  const [ipString, setIpString] = useState('3.251.148.10');
  const [formData, setFormData] = useState(initialFormData);
  const [newStarGeoFormData, setNewStarGeoFormData] = useState(buildGeoFormData(formData, ipString));
  const [farsightFormData, setFarsightFormData] = useState(buildFarsightFormData(formData, ipString));
 
  // Query executions:
  const [{ data : geoData, isLoading: isGeoLoading, isInit : isGeoInit, isError: isGeoError}] = useDataApi(newStarGeoFormData);
  //console.log("geoData: " + JSON.stringify(geoData));

  const [{ data: farsightData, isLoading: isFarsightLoading, isError: isFarsightError }] = useDataApi(farsightFormData);
  //console.log("farsightData: "  + JSON.stringify(farsightData));


  const [inputIp, setInputIp] = useState(ipString);
  const submit = event => {
    if (inputIp == "")  
       alert("IP can't be empty");
    else
      event.preventDefault();
      console.log("event value: " + inputIp);
      setNewStarGeoFormData(buildGeoFormData(formData, inputIp));
      setFarsightFormData(buildFarsightFormData(formData, inputIp));
      setIpString(inputIp);
      console.log("ipstring in submit event" + ipString);
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
        <Row >
          <Col> VIRUSTOTAL COUNT: {isGeoLoading && !isGeoInit ? "Loading ..." : "Not yet available"} </Col>
        </Row>
        <Row >
          <Col> ASSOCIATED HOSTNAMES: {isGeoLoading && !isGeoInit ? "Loading ..." : "Not yet available"} </Col>
        </Row>
      </Grid>
    </div>
    <div>
      <h3>ASSOCIATE HOSTNAMES</h3>
      <ul> 
        {isGeoLoading && !isGeoInit ? "Loading ..." :  getHostnames(farsightData).map((hostname) =>  <li>{hostname}</li>)  } 
      </ul> 
    </div>    
    </> 
  );
};

export default AtAGlanceCore;