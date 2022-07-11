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

import { SupersetClient, t } from '@superset-ui/core';
import React, { useEffect, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { ShepherdTourContext } from 'react-shepherd';
import semver from 'semver';
import withToasts from 'src/components/MessageToasts/withToasts';
import { getSteps } from 'src/tour';
import { createErrorHandler } from 'src/views/CRUD/utils';

interface TourLauncherProps {
  addDangerToast: (msg: string) => void;
  version: string;
  location?: string;
}

function TourLauncher({
  addDangerToast,
  version,
  location,
}: TourLauncherProps) {
  const tour = useContext(ShepherdTourContext);
  if (!location) {
    const routerLocation = useLocation();
    useEffect(() => {
      location = routerLocation.pathname;
    }, [routerLocation.pathname]);
  }

  useEffect(() => {
    SupersetClient.get({
      endpoint: '/api/v1/tour/',
    })
      .then(response => {
        if (response.response.status !== 200) {
          return;
        }

        const lastTour = response.json.result.last_tour;
        let startingVersion = new semver.SemVer('0.0.0');
        if (lastTour[location ?? '']) {
          startingVersion =
            semver.parse(lastTour[location ?? '']) ??
            new semver.SemVer('0.0.0');
        }
        const steps = getSteps(location ?? '', {
          start: startingVersion,
          end: new semver.SemVer(version),
        });
        if (!steps || steps.length === 0) {
          return;
        }
        tour?.steps.forEach(step => tour?.removeStep(step.id));
        tour?.addSteps(steps);
        ['complete', 'cancel'].forEach(event =>
          tour?.on(event, () => {
            SupersetClient.put({
              endpoint: '/api/v1/tour/',
              jsonPayload: {
                last_tour: {
                  ...lastTour,
                  [location ?? '']: version,
                },
              },
            });
          }),
        );
        tour?.start();
      })
      .catch(
        createErrorHandler(errMsg =>
          addDangerToast(
            t('An error occurred while fetching tour data: %s', errMsg),
          ),
        ),
      );
  }, [tour, location]);

  return <></>;
}

export default withToasts(TourLauncher);
