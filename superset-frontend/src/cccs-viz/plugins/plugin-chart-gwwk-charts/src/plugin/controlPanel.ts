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
import { t, validateNonEmpty } from '@superset-ui/core';
import { ControlPanelConfig } from '@superset-ui/chart-controls';
import { Mode } from './gwwkUtils'

const config: ControlPanelConfig = {
  // For control input types, see: superset-frontend/src/explore/components/controls/index.js
  controlPanelSections: [
    {
      label: t('Query'),
      expanded: true,
      controlSetRows: [
        ['adhoc_filters']],
    },
    {
      label: t('Controls'),
      expanded: true,
      controlSetRows: [
        [
          {
            name: 'mode',
            config: {
              type: 'SelectControl',
              label: t('Mode'),
              default: 'charts',
              choices: [
                // [value, label]
                [Mode.DATASETS, Mode.DATASETS],
                [Mode.CHARTS, Mode.CHARTS],
                [Mode.DASHBOARDS, Mode.DASHBOARDS],
              ],
              renderTrigger: true,
              description: t('The links to render'),
            },
          },
        ],
      ],
    },
  ],

  controlOverrides: {
    series: {
      validators: [validateNonEmpty],
      clearable: false,
    },
    row_limit: {
      default: 1000,
    },
  },
};

export default config;
