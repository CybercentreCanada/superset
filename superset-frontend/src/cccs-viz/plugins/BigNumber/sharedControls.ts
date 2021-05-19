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

// These are control configurations that are shared ONLY within the BigNumber viz plugin repo.
import { t } from '@superset-ui/core';
import { CustomControlItem } from '@superset-ui/chart-controls';

export const headerFontSize: CustomControlItem = {
    name: 'header_font_size',
    config: {
        type: 'SelectControl',
        label: t('Big Number Font Size'),
        renderTrigger: true,
        clearable: false,
        default: 0.4,
        // Values represent the percentage of space a header should take
        options: [
            {
                label: t('Tiny'),
                value: 0.2,
            },
            {
                label: t('Small'),
                value: 0.3,
            },
            {
                label: t('Normal'),
                value: 0.4,
            },
            {
                label: t('Large'),
                value: 0.5,
            },
            {
                label: t('Huge'),
                value: 0.6,
            },
        ],
    },
};

export const subheaderFontSize: CustomControlItem = {
    name: 'subheader_font_size',
    config: {
        type: 'SelectControl',
        label: t('Subheader Font Size'),
        renderTrigger: true,
        clearable: false,
        default: 0.15,
        // Values represent the percentage of space a subheader should take
        options: [
            {
                label: t('Tiny'),
                value: 0.125,
            },
            {
                label: t('Small'),
                value: 0.15,
            },
            {
                label: t('Normal'),
                value: 0.2,
            },
            {
                label: t('Large'),
                value: 0.3,
            },
            {
                label: t('Huge'),
                value: 0.4,
            },
        ],
    },
};

export const numberOfDecimalPlaces: CustomControlItem = {
    name: 'number_decimal_places',
    config: {
        type: 'SelectControl',
        label: t('Number of Decimal Places'),
        renderTrigger: true,
        clearable: false,
        default: 1,
        // Value representing the number of decimal places to display
        options: [
            { 
                label: '0',
                value: 0,
            },
            {
                label: '1',
                value: 1,
            },
            {
                label: '2',
                value: 2,
            },
        ],
    },
};

export const currency: CustomControlItem = {
    name: 'currency',
    config: {
        type: 'SelectControl',
        label: t('Currency'),
        renderTrigger: true,
        clearable: false,
        default: '$',
        // Symbol representing the currency to display
        options: [
            {
                label: '$',
                value: '$',
            },
            {
                label: '£',
                value: '£',
            },
            {
                label: '€',
                value: '€',
            },
            {
                label: '฿',
                value: '฿',
            },
        ],
    },
};