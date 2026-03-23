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
import { Behavior, ChartMetadata, ChartPlugin, t } from '@superset-ui/core';
import { CccsTableChartProps, CccsTableFormData } from './types';
import thumbnail from './images/thumbnail.png';
import example1 from './images/Table1.png';
import buildQuery from './buildQuery';
import controlPanel from './controlPanel';
import transformProps from './transformProps';

const metadata = new ChartMetadata({
  behaviors: [Behavior.InteractiveChart],
  category: t('Table'),
  description: t('CCCS Table: An AG Grid control for Aurora data.'),
  name: t('CCCS Table'),
  exampleGallery: [{ url: example1 }],
  tags: [
    t('CCCS'),
    t('Table'),
    t('Grid'),
    t('Popular'),
    t('Report'),
    t('Tabular'),
  ],
  thumbnail,
  suppressContextMenu: true,
});

export default class CccsTableChartPlugin extends ChartPlugin<
  CccsTableFormData,
  CccsTableChartProps
> {
  constructor() {
    super({
      buildQuery,
      controlPanel,
      loadChart: () => import('./CccsGridTable'),
      metadata,
      transformProps,
    });
  }
}
