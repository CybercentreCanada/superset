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
import { CccsTableChartProps, CccsTableFormData } from '../../types';
import thumbnail from '../images/thumbnail.png';
import example1 from '../images/Table1.png';
import buildQuery from './buildQuery';
import controlPanel from './controlPanel';
import transformProps from './transformProps';

export default class CccsTableChartPlugin extends ChartPlugin<
  CccsTableFormData,
  CccsTableChartProps
> {
  /**
   * The constructor is used to pass relevant metadata and callbacks that get
   * registered in respective registries that are used throughout the library
   * and application. A more thorough description of each property is given in
   * the respective imported file.
   *
   * It is worth noting that `buildQuery` and is optional, and only needed for
   * advanced visualizations that require either post processing operations
   * (pivoting, rolling aggregations, sorting etc) or submitting multiple queries.
   */
  constructor() {
    const metadata = new ChartMetadata({
      description: t('CCCS Table: An AG Grid control for Hogwarts data.'),
      name: t('CCCS Table'),
      category: t('Table'),
      tags: [
        t('CCCS'),
        t('Table'),
        t('Grid'),
        t('Popular'),
        t('Report'),
        t('Tabular'),
      ],
      exampleGallery: [{ url: example1 }],
      thumbnail,
      behaviors: [Behavior.InteractiveChart],
    });

    super({
      buildQuery,
      controlPanel,
      loadChart: () => import('../../ag-grid/AGGridViz'),
      metadata,
      transformProps,
    });
  }
}
