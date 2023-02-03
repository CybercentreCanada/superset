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
  ensureIsArray,
  ExtraFormData,
  JsonObject,
  JsonResponse,
  smartDateDetailedFormatter,
  SupersetApiError,
  SupersetClient,
  t,
} from '@superset-ui/core';
import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { useImmerReducer } from 'use-immer';
import AdhocFilterControl from 'src/explore/components/controls/FilterControl/AdhocFilterControl';
import AdhocFilter from 'src/explore/components/controls/FilterControl/AdhocFilter';
// eslint-disable-next-line import/no-unresolved
import { addDangerToast } from 'src/components/MessageToasts/actions';
// eslint-disable-next-line import/no-unresolved
import { cacheWrapper } from 'src/utils/cacheWrapper';
// eslint-disable-next-line import/no-unresolved
import { getClientErrorObject } from 'src/utils/getClientErrorObject';
// eslint-disable-next-line import/no-unresolved
import { useChangeEffect } from 'src/hooks/useChangeEffect';
import { PluginFilterAdhocProps } from './types';
import { StyledFormItem, FilterPluginStyle, StatusMessage } from '../common';
import { getDataRecordFormatter, getAdhocExtraFormData } from '../../utils';
import { AdhocControlContainer } from './styles';

type DataMaskAction =
  | { type: 'ownState'; ownState: JsonObject }
  | {
      type: 'filterState';
      __cache: JsonObject;
      extraFormData: ExtraFormData;
      filterState: {
        label?: string;
        filters?: AdhocFilter[];
        value?: AdhocFilter[];
      };
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
      draft.filterState = { ...draft.filterState, ...action.filterState };
      return draft;
    default:
      return draft;
  }
}

export default function PluginFilterAdhoc(props: PluginFilterAdhocProps) {
  const {
    filterState,
    formData,
    height,
    width,
    setDataMask,
    setFocusedFilter,
    unsetFocusedFilter,
    appSection,
    inputRef,
  } = props;
  const { enableEmptyFilter, inverseSelection, defaultToFirstItem } = formData;
  const datasetId = useMemo(
    () => formData.datasource.split('_')[0],
    [formData.datasource],
  );
  const [datasetDetails, setDatasetDetails] = useState<Record<string, any>>();
  const [columns, setColumns] = useState();
  const [dataMask, dispatchDataMask] = useImmerReducer(reducer, {
    extraFormData: {},
    filterState,
  });
  const labelFormatter = useMemo(
    () =>
      getDataRecordFormatter({
        timeFormatter: smartDateDetailedFormatter,
      }),
    [],
  );

  const localCache = new Map<string, any>();

  const cachedSupersetGet = cacheWrapper(
    SupersetClient.get,
    localCache,
    ({ endpoint }) => endpoint || '',
  );

  useChangeEffect(datasetId, () => {
    if (datasetId) {
      cachedSupersetGet({
        endpoint: `/api/v1/dataset/${datasetId}`,
      })
        .then((response: JsonResponse) => {
          const dataset = response.json?.result;
          // modify the response to fit structure expected by AdhocFilterControl
          dataset.type = dataset.datasource_type;
          // setting filter_select to false will disable suggestions
          dataset.filter_select = false;
          setDatasetDetails(dataset);
        })
        .catch((response: SupersetApiError) => {
          addDangerToast(response.message);
        });
    }
  });

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

  const labelString: (props: AdhocFilter) => string = (props: AdhocFilter) => {
    if (ensureIsArray(props.comparator).length >= 2) {
      return `${props.subject} ${props.operator} (${props.comparator.join(
        ', ',
      )})`;
    }
    return `${props.subject} ${props.operator} ${props.comparator}`;
  };

  const updateDataMask = useCallback(
    (adhoc_filters: AdhocFilter[]) => {
      const emptyFilter =
        enableEmptyFilter && !inverseSelection && !adhoc_filters?.length;

      dispatchDataMask({
        type: 'filterState',
        __cache: filterState,
        extraFormData: getAdhocExtraFormData(
          adhoc_filters,
          emptyFilter,
          inverseSelection,
        ),
        filterState: {
          ...filterState,
          label: adhoc_filters?.length
            ? (adhoc_filters || [])
                .map(f =>
                  f.sqlExpression ? String(f.sqlExpression) : labelString(f),
                )
                .join(', ')
            : undefined,
          value: adhoc_filters?.length ? adhoc_filters : undefined,
          filters: adhoc_filters?.length ? adhoc_filters : undefined,
        },
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      appSection,
      defaultToFirstItem,
      dispatchDataMask,
      enableEmptyFilter,
      inverseSelection,
      JSON.stringify(filterState),
      labelFormatter,
    ],
  );

  useEffect(() => {
    updateDataMask(filterState.value);
  }, [JSON.stringify(filterState.value)]);

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
        validateStatus={filterState.validateStatus}
        extra={formItemExtra}
      >
        <AdhocControlContainer
          tabIndex={-1}
          ref={inputRef}
          validateStatus={filterState.validateStatus}
          onFocus={setFocusedFilter}
          onBlur={unsetFocusedFilter}
          onMouseEnter={setFocusedFilter}
          onMouseLeave={unsetFocusedFilter}
        >
          <AdhocFilterControl
            columns={columns || []}
            savedMetrics={[]}
            datasource={datasetDetails}
            onChange={(filters: AdhocFilter[]) => {
              // New Adhoc Filters Selected
              updateDataMask(filters);
            }}
            label={' '}
            value={filterState.filters || []}
          />
        </AdhocControlContainer>
      </StyledFormItem>
    </FilterPluginStyle>
  );
}
