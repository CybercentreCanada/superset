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
import { Chip, Grid, ListItem, ListItemText, makeStyles, Typography, useTheme, List, CircularProgress  } from '@material-ui/core';
import React, { useEffect, createRef, useState } from 'react';

import { AtAGlanceFarsightProps, AtAGlanceGeoProps } from './types';
import { RiGlobalFill } from 'react-icons/ri';
import { getChartDataRequest } from 'src/chart/chartAction';
import { Skeleton } from 'src/common/components';
import { QueryFormData } from '@superset-ui/core';

const useStyles = makeStyles(theme => ({
  datum: {
    border: '1px solid',
    borderColor: theme.palette.type === 'dark' ? theme.palette.grey[800] : theme.palette.grey[300],
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(1),
    padding: theme.spacing(1)
  },
  datumLink: {
    marginTop: theme.spacing(1)
  },
  sectionTitle: {
    display: 'flex',
    alignItems: 'center',
    padding: theme.spacing(1)
  },
  urlList: {
    hight: '100%',
    width: '100%',
    maxWidth: 360,
    overflow: 'auto',
    maxHeight: 100,
    float: 'left',
  },
  urlListItem: {
    backgroundColor: 'inherit',
    padding: 0,
  },
}));

const getPayloadField = (field: string, payload: any) => {
  try{
    const index = payload.columns.findIndex(e => e['name'] === field);
    if (index !== -1) {
        console.log("IndexFoundIs")
        return payload.rows[0][index];
    }
  } catch (e)
  {
    return "Unknown"
  }
  return undefined;
};


function AtAGlanceCore ( formData: QueryFormData) {

  const [geoState, setGeoState] = useState<AtAGlanceGeoProps>(
    {
      ip: '34.214.200.224' ,
      country: "", 
      carrier: "",
      asn: "",
      organisation: "",
      connection_type: "",
      decimal: "",
      virusTotalCount: "NotAvailabe",
      city: ""
    });

    const [farsightState, setFarsightState] = useState<AtAGlanceFarsightProps>(
      {
        associatedHostNames: []
      });

  const useDataApi = (initalDatasource: string, formData: any) => {
    const [data, setData] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [isError, setIsError] = useState(false);
    const [datasource, setDataSource] = useState(initalDatasource);

  
    useEffect(() => {
      console.log("useDataApi invoked");
      const fetchLookupDetails = async () => {
        setIsError(false);
        setIsLoading(true);
  
        try {
          const asyncChartDataRequest = getChartDataRequest({
            formData,
            resultFormat: 'json',
            resultType: 'full',
            force: false, // when true, bypass the redis cache
            method: 'POST',
          });
  
          const response = await asyncChartDataRequest;
          const newData = response.result[0].data[0];
          setData(newData);
        } catch (error) {
          setIsError(true);
        }
  
        setIsLoading(false);
      };
  
      fetchLookupDetails();
    }, [formData]);
  
    return [{ data, isLoading, isError }, setDataSource];
  };

  const theme = useTheme();
  const classes = useStyles();
  formData.metrics = undefined;
  const newStarGeoFormData : QueryFormData = formData;
  newStarGeoFormData.columns = ["asn", "carrier", "city", "connection_type", "country", "organization"];
  const farsightFormData : QueryFormData = formData;
  farsightFormData.columns = ["rrnames"];

  const [{ geoData, isGeoLoading, isGeoError }, notUsed] = useDataApi("134__table", newStarGeoFormData);
  const [{ farsightData, isFarsightLoading, isFarsightError }, unUsed] = useDataApi("134__table", newStarGeoFormData);
  return (
    <>
    <div className={classes.sectionTitle}>
            <Typography variant="h5" style={{ display: 'flex', alignItems: 'center' }}>
              <RiGlobalFill /> <span style={{ marginLeft: theme.spacing(1) }}>At a glance</span>
            </Typography>
    </div>
    <div className={classes.datum}>
      <div style={{ padding: theme.spacing(1) }}>
          <Grid container>
            <Grid item xs={12} md={6} lg={4} xl={3}>
              <Grid container spacing={1}>
                <Grid item xs={12}>
                  <Grid container>
                    <Grid item xs={3}>
                      <Typography color="textSecondary">IP</Typography>
                    </Grid>
                    <Grid item xs={9}>
                      <Typography color="textSecondary">
                        { isGeoLoading ? state.ip : <Skeleton />}  
                      </Typography>
                    </Grid>
                  </Grid>
                </Grid>
                <Grid item xs={12}>
                  <Grid container>
                    <Grid item xs={3}>
                      <Typography color="textSecondary">Decimal</Typography>
                    </Grid>
                    <Grid item xs={9}>
                      <Typography color="textSecondary">
                        { isGeoLoading ? <Skeleton /> : state.decimal }  
                      </Typography>
                    </Grid>
                  </Grid>
                </Grid>

                <Grid item xs={12}>
                  <Grid container>
                    <Grid item xs={3}>
                      <Typography color="textSecondary">ASN</Typography>
                    </Grid>
                    <Grid item xs={9}>
                      <Typography color="textSecondary">
                        { isGeoLoading ? <Skeleton /> : state.asn }
                      </Typography>
                    </Grid>
                  </Grid>
                </Grid>

                <Grid item xs={12}>
                  <Grid container>
                    <Grid item xs={3}>
                      <Typography color="textSecondary">Carrier</Typography>
                    </Grid>
                    <Grid item xs={9}>
                      <Typography color="textSecondary">
                        { isGeoLoading ? <Skeleton /> : state.carrier }
                      </Typography>
                    </Grid>
                  </Grid>
                </Grid>

                <Grid item xs={12}>
                  <Grid container>
                    <Grid item xs={3}>
                      <Typography color="textSecondary">Country</Typography>
                    </Grid>
                    <Grid item xs={9}>
                      <Typography color="textSecondary">
                      { isGeoLoading ? <Skeleton /> : state.country }
                      </Typography>
                    </Grid>
                  </Grid>
                </Grid>

                <Grid item xs={12}>
                  <Grid container>
                    <Grid item xs={3}>
                      <Typography color="textSecondary">City</Typography>
                    </Grid>
                    <Grid item xs={9}>
                      <Typography color="textSecondary">
                      {  isGeoLoading ? <Skeleton /> : state.city }
                      </Typography>
                    </Grid>
                  </Grid>
                </Grid>

                <Grid item xs={12}>
                  <Grid container>
                    <Grid item xs={3}>
                      <Typography color="textSecondary">Virus Total</Typography>
                    </Grid>
                    <Grid item xs={9}>
                      <Typography color="textSecondary">
                            <Chip label="Not Yet Available" color="secondary" size="small" /> 
                      </Typography>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
            <Grid item xs={8}>
                <Grid item xs={12}>
                  <Grid container>
                    <Grid item xs={2}>
                    <ListItem>
                          <Typography color="textSecondary">Associated Domain names</Typography>
                    </ListItem>
                    </Grid>
                    <Grid item xs={10}>
                    { 
                     isFarsightLoading ? <CircularProgress/> : 
                    <List className={classes.urlList}>
                      {
                        state.associatedHostNames.map(name => (
                        <ListItem button component="a" href="https://www.google.com" key={name} className={classes.urlListItem}>
                          <ListItemText>
                            <Typography color="textSecondary">{name}</Typography>
                          </ListItemText>
                        </ListItem>
                        ))
                      }
                      </List>
                    }
                    </Grid>
                  </Grid>
                </Grid>
                <Grid item xs={12}>
                  <Grid container>
                    <Grid item xs={5}>
                      <ListItem>
                          <Typography color="textSecondary">Blocked By</Typography>
                      </ListItem>
                    </Grid>
                    <Grid item xs={6}>
                    </Grid>
                  </Grid>
                </Grid>
            </Grid>
          </Grid>
        </div>
      </div>
    </>
  );
};


export default AtAGlanceCore;