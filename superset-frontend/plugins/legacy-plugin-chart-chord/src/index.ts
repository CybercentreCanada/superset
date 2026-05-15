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
import { t } from '@apache-superset/core/translation';
import { ChartMetadata, ChartPlugin } from '@superset-ui/core';
import transformProps from './transformProps';
import example from './images/chord.jpg';
import exampleDark from './images/chord-dark.jpg';
import thumbnail from './images/thumbnail.png';
import thumbnailDark from './images/thumbnail-dark.png';
import controlPanel from './controlPanel';
import buildQuery from './buildQuery';
import { EchartsChartPlugin } from '../types';
import thumbnail from './images/thumbnail.png';
import example1 from './images/example1.png';
import example2 from './images/example2.png';

const metadata = new ChartMetadata({
  category: t('Flow'),
  credits: ['https://github.com/d3/d3-chord'],
  description: t(
    'Showcases the flow or link between categories using thickness of chords. The value and corresponding thickness can be different for each side.',
  ),
  exampleGallery: [
    {
      url: example,
      urlDark: exampleDark,
      caption: t('Relationships between community channels'),
    },
  ],
  name: t('Chord Diagram'),
  tags: [t('Circular'), t('Legacy'), t('Proportional'), t('Relational')],
  thumbnail,
  thumbnailDark,
  useLegacyApi: true,
});

export default class ChordChartPlugin extends ChartPlugin {
  constructor() {
    super({
      loadChart: () => import('./ReactChord'),
      metadata,
      transformProps,
      controlPanel,
      loadChart: () => import('./EchartsGantt'),
      metadata: {
        behaviors: [
          Behavior.InteractiveChart,
          Behavior.DrillToDetail,
          Behavior.DrillBy,
        ],
        credits: ['https://echarts.apache.org'],
        name: t('Gantt Chart'),
        description: t(
          'Gantt chart visualizes important events over a time span. ' +
            'Every data point displayed as a separate event along a ' +
            'horizontal line.',
        ),
        tags: [t('ECharts'), t('Featured'), t('Timeline'), t('Time')],
        thumbnail,
        exampleGallery: [{ url: example1 }, { url: example2 }],
      },
      transformProps,
    });
  }
}
