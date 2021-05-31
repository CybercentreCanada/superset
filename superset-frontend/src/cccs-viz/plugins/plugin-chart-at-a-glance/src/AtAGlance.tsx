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
import React, { useEffect, createRef } from 'react';

import { AtAGlanceProps, AtAGlanceStylesProps } from './types';
import { Grid, makeStyles, Typography, useTheme } from '@material-ui/core';
import { RiGlobalFill } from 'react-icons/ri';

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

/**
 * ******************* WHAT YOU CAN BUILD HERE *******************
 *  In essence, a chart is given a few key ingredients to work with:
 *  * Data: provided via `props.data`
 *  * A DOM element
 *  * FormData (your controls!) provided as props by transformProps.ts
 */

 export interface AtAGlanceIpCoreProps {
  ip: string;
  country: string;
  carrier: string;
  asn: string;
  organisation: string;
  connection_type: string;
  decimal: string;
  virusTotalCount: string; 
  assosiatedHostNames: string[];  
  city: string;
  trinoLoaded: boolean;
  farsightLoaded: boolean;
}

export default function AtAGlance(props: AtAGlanceProps) {
  // height and width are the height and width of the DOM element as it exists in the dashboard.
  // There is also a `data` prop, which is, of course, your DATA 🎉
  const { data, height, width } = props;

  const rootElem = createRef<HTMLDivElement>();

  // Often, you just want to get a hold of the DOM and go nuts.
  // Here, you can do that with createRef, and the useEffect hook.
  useEffect(() => {
    const root = rootElem.current as HTMLElement;
    console.log('Plugin element', root);
  });

  console.log('Plugin props', props);
  console.log('data', data);
  const theme = useTheme();
  const classes = useStyles();
  
  const flightsList = data.map((items, index)=>{
    return (
        <div>
          <ol>
            {Object.entries(items).map(([key,value])=>{
              return (
                <li>{key} : {value ? value.toString() : "No value returned"}</li>
              );
            })}
          </ol>
        </div>
    );
  })

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
                            <div>{flightsList}</div> 
                          </Typography>
                        </Grid>
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

