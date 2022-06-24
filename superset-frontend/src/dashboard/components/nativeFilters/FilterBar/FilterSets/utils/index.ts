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

import shortid from 'shortid';
import { DataMaskState, FilterSet, t } from '@superset-ui/core';
import { areObjectsEqual } from 'src/reduxUtils';

export const generateFiltersSetId = () => `FILTERS_SET-${shortid.generate()}`;

export const APPLY_FILTERS_HINT = t('Please apply filter changes');

export const getFilterValueForDisplay = (
  value?: string[] | null | string | number | object,
): string => {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'string' || typeof value === 'number') {
    return `${value}`;
  }
  if (Array.isArray(value)) {
    return value.join(', ');
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return t('Unknown value');
};

export const getFilterValueForDisplayWithColumn = (
  value?: string[] | null | string | number | object,
  column?: string[] | string | null,
): string => {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'string' || typeof value === 'number') {
    return `Magical columns: ${column} -- ${value}`;
  }
  if (Array.isArray(value) && column !== null && column !== undefined) {
    if (typeof column === 'string') {
      // return 'column string array of values';
      return `Columns: ${column} Values: ${value.join(', ')}`;
    }
    if (Array.isArray(column)) {
      return `Columns: ${column.join(', ')} Values: ${value.join(', ')}`;
    }
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return t('Unknown value');
};

export const findExistingFilterSet = ({
  filterSetFilterValues,
  dataMaskSelected,
}: {
  filterSetFilterValues: FilterSet[];
  dataMaskSelected: DataMaskState;
}) =>
  filterSetFilterValues.find(({ dataMask: dataMaskFromFilterSet = {} }) => {
    const dataMaskSelectedEntries = Object.entries(dataMaskSelected);
    return dataMaskSelectedEntries.every(([id, filterFromSelectedFilters]) => {
      const isEqual = areObjectsEqual(
        filterFromSelectedFilters.filterState,
        dataMaskFromFilterSet?.[id]?.filterState,
        { ignoreUndefined: true, ignoreNull: true },
      );
      const hasSamePropsNumber =
        dataMaskSelectedEntries.length ===
        Object.keys(dataMaskFromFilterSet ?? {}).length;
      return isEqual && hasSamePropsNumber;
    });
  });
