/* eslint-disable no-restricted-syntax */
/* eslint-disable no-console */
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
/* eslint-disable no-param-reassign */
import {
  DataMask,
  ExtraFormData,
  JsonObject,
  smartDateDetailedFormatter,
  SupersetClient,
  t,
} from '@superset-ui/core';
import {
  buildTimeRangeString,
  formatTimeRange,
  SEPARATOR,
} from 'src/explore/components/controls/DateFilterControl/utils';
import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { useImmerReducer } from 'use-immer';
// eslint-disable-next-line import/no-unresolved
import { addDangerToast } from 'src/components/MessageToasts/actions';
// eslint-disable-next-line import/no-unresolved
import { cacheWrapper } from 'src/utils/cacheWrapper';
// eslint-disable-next-line import/no-unresolved
import { getClientErrorObject } from 'src/utils/getClientErrorObject';
// eslint-disable-next-line import/no-unresolved
import { useChangeEffect } from 'src/hooks/useChangeEffect';
import DatasetSelect from 'src/dashboard/components/nativeFilters/FiltersConfigModal/FiltersConfigForm/DatasetSelect';
import { Select } from 'src/components';
import { Input } from 'antd';
import rison from 'rison';
import { DEFAULT_TIME_RANGE } from 'src/explore/constants';
import { useDebouncedEffect } from 'src/explore/exploreUtils';
import { SLOW_DEBOUNCE } from 'src/constants';
import { PluginFilterDatasetProps } from './types';
import { StyledFormItem, FilterPluginStyle, StatusMessage } from '../common';
import { getDataRecordFormatter, getDrilldownExtraFormData } from '../../utils';

type DataMaskAction =
  | { type: 'ownState'; ownState: JsonObject }
  | {
      type: 'filterState';
      __cache: JsonObject;
      extraFormData: ExtraFormData;
    };

function reducer(
  draft: DataMask & { __cache?: JsonObject },
  action: DataMaskAction,
) {
  switch (action.type) {
    case 'ownState':
      draft.ownState = {
        ...draft.ownState,
        ...action.ownState,
      };
      return draft;
    case 'filterState':
      draft.extraFormData = action.extraFormData;
      // eslint-disable-next-line no-underscore-dangle
      draft.__cache = action.__cache;
      draft.filterState = { ...draft.filterState };
      return draft;
    default:
      return draft;
  }
}

export default function PluginFilterDataset(props: PluginFilterDatasetProps) {
  const {
    filterState,
    formData,
    height,
    width,
    setDataMask,
    setFocusedFilter,
    unsetFocusedFilter,
    appSection,
  } = props;
  const { defaultToFirstItem } = formData;
  const [datasetId, setDatasetId] = useState<number>(-1);
  const [selectorType, setSelectorType] = useState<string>('');
  const [selectorValue, setSelectorValue] = useState<string>('');
  const [since, setSince] = useState<string>('');
  const [until, setUntil] = useState<string>('');
  const [retSince, setRetSince] = useState<string>('');
  const [retUntil, setRetUntil] = useState<string>('');

  const [columns, setColumns] = useState<[{ advanced_data_type: string }]>();
  const [dataMask, dispatchDataMask] = useImmerReducer(reducer, {
    extraFormData: {},
    filterState: {},
  });

  useEffect(() => {
    // Hacky way to set filterState, to update the "Apply Filters" button

    // Had issues with "Object is not extensible" when "since" and "until" are filled at the same time
    if (
      filterState.value !== undefined &&
      !Object.isExtensible(filterState.value)
    )
      return;

    filterState.value = {
      datasetId,
      selectorType,
      selectorValue,
      retSince,
      retUntil,
    };
  }, [datasetId, selectorType, selectorValue, retSince, retUntil]);

  const [lastFetchedTimeRange, setLastFetchedTimeRange] =
    useState(DEFAULT_TIME_RANGE);
  const [evalResponse, setEvalResponse] = useState<string>('-∞ ≤ col < ∞');

  const localCache = new Map<string, any>();

  const cachedSupersetGet = cacheWrapper(
    SupersetClient.get,
    localCache,
    ({ endpoint }) => endpoint || '',
  );

  useChangeEffect(datasetId, () => {
    if (datasetId != null) {
      cachedSupersetGet({
        endpoint: `/api/v1/dataset/${datasetId}`,
      }).then(
        ({ json: { result } }) => {
          setColumns(result.columns);
        },
        async badResponse => {
          const { error, message } = await getClientErrorObject(badResponse);
          let errorText = message || error || t('An error has occurred');
          if (message === 'Forbidden') {
            errorText = t('You do not have permission to edit this dashboard');
          }
          addDangerToast(errorText);
        },
      );
    }
  });

  const selectorTypes = useMemo(() => {
    if (columns == null) return [];

    const selectorTypes = new Set();
    for (const c of columns) {
      const adt = c.advanced_data_type;
      if (adt == null) continue;
      selectorTypes.add({ label: adt, value: adt });
    }
    const out = Array.from(selectorTypes);
    return out;
  }, [columns]);

  const timeRangeValue = useMemo(
    () => `${since} ${SEPARATOR} ${until}`,
    [since, until],
  );

  const updateDataMask = useCallback(() => {
    dispatchDataMask({
      type: 'filterState',
      __cache: filterState,
      extraFormData: getDrilldownExtraFormData(
        datasetId || -1,
        selectorType || '',
        selectorValue || '',
        timeRangeValue,
      ),
    });
  }, [
    dispatchDataMask,
    filterState,
    datasetId,
    selectorType,
    selectorValue,
    timeRangeValue,
    retSince,
    retUntil,
  ]);

  const fetchTimeRange = async (timeRange: string) => {
    const query = rison.encode_uri(timeRange);
    const endpoint = `/api/v1/time_range/?q=${query}`;
    try {
      const response = await SupersetClient.get({ endpoint });
      const timeRangeString = buildTimeRangeString(
        response?.json?.result?.since || '',
        response?.json?.result?.until || '',
      );
      if (response?.json?.result?.since) {
        setRetSince(response.json.result.since);
      }
      if (response?.json?.result?.until) {
        setRetUntil(response.json.result.until);
      }
      return {
        value: formatTimeRange(timeRangeString),
      };
    } catch (response) {
      const clientError = await getClientErrorObject(response);
      return {
        error: clientError.message || clientError.error,
      };
    }
  };

  useDebouncedEffect(
    () => {
      if (lastFetchedTimeRange !== timeRangeValue) {
        fetchTimeRange(timeRangeValue).then(({ value: actualRange, error }) => {
          if (error) {
            setEvalResponse(error || '');
          } else {
            setEvalResponse(actualRange || '');
          }
          setLastFetchedTimeRange(timeRangeValue);
        });
      }
    },
    SLOW_DEBOUNCE,
    [timeRangeValue],
  );

  useEffect(() => {
    updateDataMask();
  }, [
    JSON.stringify(filterState.value),
    datasetId,
    selectorType,
    selectorValue,
    retSince,
    retUntil,
  ]);

  useEffect(() => {
    setDataMask(dataMask);
  }, [JSON.stringify(dataMask)]);

  const formItemExtra = useMemo(() => {
    if (filterState.validateMessage) {
      return (
        <StatusMessage status={filterState.validateStatus}>
          {filterState.validateMessage}
        </StatusMessage>
      );
    }
    return undefined;
  }, [filterState.validateMessage, filterState.validateStatus]);

  return (
    <FilterPluginStyle height={height} width={width}>
      <StyledFormItem
        label="Dataset"
        validateStatus={filterState.validateStatus}
        extra={formItemExtra}
      >
        <DatasetSelect
          onChange={(value: { label: string; value: number }) => {
            setDatasetId(value.value);
          }}
          value={{ label: 'None', value: -1 }}
        />
      </StyledFormItem>
      <StyledFormItem
        label="Time Range"
        validateStatus={filterState.validateStatus}
        extra={formItemExtra}
      >
        <Input
          onChange={e => setSince(e.target.value)}
          style={{ width: 'calc(50% - 2px)', marginRight: '2px' }}
        />
        <Input
          onChange={e => setUntil(e.target.value)}
          style={{ width: 'calc(50% - 2px)', marginLeft: '2px' }}
        />
        <div style={{ textAlign: 'center' }}>{evalResponse}</div>
      </StyledFormItem>
      <StyledFormItem
        label="Selector Type"
        validateStatus={filterState.validateStatus}
        extra={formItemExtra}
        required={false}
      >
        <Select
          ariaLabel=""
          options={selectorTypes}
          onChange={e => {
            setSelectorType(e);
          }}
        />
      </StyledFormItem>
      <StyledFormItem
        label="Selector"
        validateStatus={filterState.validateStatus}
        extra={formItemExtra}
      >
        <Input
          onChange={e => {
            setSelectorValue(e.target.value);
          }}
        />
      </StyledFormItem>
    </FilterPluginStyle>
  );
}
