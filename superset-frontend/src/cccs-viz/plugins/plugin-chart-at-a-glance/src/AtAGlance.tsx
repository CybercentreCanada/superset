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

const getPayloadField = (field: string, payload: any) => {
  try{
    console.log("In getPayloadFields");
    console.log(payload);
    console.log("field " + field);
    const value = payload[field];
    console.log("value: " + value);
    if (value !== undefined) {
        console.log("found it")
        return value;
    }
  } catch (e)
  {
    console.log(e);
    return "Something went wrong";
  }
  return "Unknown";
};

const useDataApi = (initialFormData: QueryFormData, initialIPString : String) => {
  const [data, setData] = useState({});
  const [isInit, setIsinit] = useState(true)
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
    
  useEffect(() => {
    console.log("initialFormData" + initialFormData);
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
        setIsError(false);
        setIsLoading(true);
        const response = await asyncChartDataRequest;
        console.log("response" + response);
        const newData = response.result[0].data[0];
        setData(newData);
      } catch (error) {

        console.log(error);
        setIsinit(false);
        setIsError(true);
        setIsLoading(false);
      }

      setIsLoading(false);
    };

    fetchLookupDetails();
  }, [initialIPString]);
  console.log("data in api call" + data);
  return [{ data, isLoading, isError, isInit }, setFormData] as const;
};

function AtAGlanceCore ( formData: QueryFormData) {
  console.log("In At A Glance");
  const [ipString, setIpString] = useState('34.214.200.224');
  const numericalIP = IPAddressUtil.textToNumericFormatV4(ipString);

  // Filter that will be applied to all the queries for each datasrouce. Use this statement when ip_string is available in datasource.
  // const filter : AdhocFilter = {expressionType: 'SIMPLE', clause: 'WHERE', subject: 'ip_string', operator: 'IN', comparator: [ipString] };
  const startIPFilter : AdhocFilter = {expressionType: 'SIMPLE', clause: 'WHERE', subject: 'start_ip_int', operator: '<=', comparator: numericalIP.toString(10) };
  const endIPFilter : AdhocFilter = {expressionType: 'SIMPLE', clause: 'WHERE', subject: 'end_ip_int', operator: '>=', comparator: numericalIP.toString(10)};
 
  // Setting up newStarGeo query:
  const newStarGeoFormData : QueryFormData = JSON.parse(JSON.stringify(formData));
  newStarGeoFormData.adhoc_filters = [startIPFilter, endIPFilter];
  newStarGeoFormData.metrics = undefined;
  newStarGeoFormData.datasource="60__table";
  newStarGeoFormData.columns = ["asn", "carrier", "city", "connection_type", "country", "organization"];

  // Setting up farsight query:
  // const farsightFormData : QueryFormData = JSON.parse(JSON.stringify(formData));
  // const rdataFilter =  AdhocFilter = {expressionType: 'SQL', clause: 'WHERE', sqlExpression:"where start_ip_int = 217384448 OR end_ip_int = 217384448"};
  // farsightFormData.metrics = undefined;
  // farsightFormData.columns = ["rrname"];
  // farsightFormData.datasource = "58__table";
  // //farsightFormData.adhoc_filters  = [filter];

  // Query executions:
  const [{ data : geoData, isLoading: isGeoLoading, isInit : isGeoInit, isError: isGeoError}] = useDataApi(newStarGeoFormData, ipString);
  //const [{ data: farsightData, isLoading: isFarsightLoading, isError: isFarsightError }] = useDataApi(farsightFormData);

  // const [inputValue, setInputValue] = useState(ipString);
  // const submit = event => {
  //   event.preventDefault();
  //   console.log("event value" + inputValue);
  //   setIpString(inputValue);
  //   setInputValue('');
  // };

  return (
    <>
    <div style={styles.SectionTitle}>
      <RiGlobalFill /> <span> At a Glance </span>
    </div>
    {/* <div style={styles.Datum}>
      <form autoComplete="off" onSubmit={submit}>
          <label>
            IP:
            <input type="text" value={ipString} onChange={event => setInputValue(event.target.value)} />
          </label>
          <input type="submit" value="Submit" />
        </form>
    </div> */}
    <div style={styles.Datum}>
      <Grid fluid >
        <Row >
          <Col> ASN: {isGeoLoading && !isGeoInit ? "Loading ..." : getPayloadField("asn", geoData)} </Col>
        </Row>
        <Row >
          <Col> CARRIER: {isGeoLoading && !isGeoInit ? "Loading ..." : getPayloadField("carrier", geoData)} </Col>
        </Row>
        <Row >
          <Col> CONNECTION TYPE: {isGeoLoading && !isGeoInit ? "Loading ..." :  getPayloadField("connection_type", geoData)} </Col>
        </Row>
        <Row >
          <Col> ORGANIZATION: {isGeoLoading && !isGeoInit ? "Loading ..." : getPayloadField("organization", geoData)} </Col>
        </Row>
        <Row >
          <Col> CITY: {isGeoLoading && !isGeoInit ? "Loading ..." : getPayloadField("city", geoData)} </Col>
        </Row>
        <Row >
          <Col> COUNTRY: {isGeoLoading && !isGeoInit ? "Loading ..." : getPayloadField("country", geoData)} </Col>
        </Row>
        <Row >
          <Col> DECIMAL: {isGeoLoading && !isGeoInit ? "Loading ..." : getPayloadField("decimal", geoData)} </Col>
        </Row>
        <Row >
          <Col> VIRUSTOTAL COUNT: {isGeoLoading && !isGeoInit ? "Loading ..." : "Not yet available"} </Col>
        </Row>
        <Row >
          <Col> ASSOCIATED HOSTNAMES: {isGeoLoading && !isGeoInit ? "Loading ..." : "Not yet available"} </Col>
        </Row>
      </Grid>
    </div>   
    </> 
  );
};

export default AtAGlanceCore;