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
// eslint-disable-next-line import/no-unresolved
import { addDangerToast } from 'src/components/MessageToasts/actions';
// eslint-disable-next-line import/no-unresolved
import { cacheWrapper } from 'src/utils/cacheWrapper';
// eslint-disable-next-line import/no-unresolved
import { getClientErrorObject } from 'src/utils/getClientErrorObject';
// eslint-disable-next-line import/no-unresolved
import { useChangeEffect } from 'src/hooks/useChangeEffect';
import { PluginFilterDatasetProps } from './types';
import MemoizedSelect from 'src/dashboard/components/nativeFilters/FiltersConfigModal/FiltersConfigForm/DatasetSelect';
import {
  StyledFormItem,
  FilterPluginStyle,
  StatusMessage,
  ControlContainer,
} from '../common';
import { getDataRecordFormatter, getAdhocExtraFormData, getDatasetExtraFormData } from '../../utils';
import { string } from 'yargs';


type DatasetFilter = { label: string, value: number };

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
      draft.filterState = { ...draft.filterState, ...action.filterState };
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
  const { enableEmptyFilter, inverseSelection, defaultToFirstItem } = formData;

  const [datasetDetails, setDatasetDetails] = useState<Record<string, any>>();
  const [columns, setColumns] = useState();
  const [dataMask, dispatchDataMask] = useImmerReducer(reducer, {
    extraFormData: {},
    filterState: {},
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


  const updateDataMask = useCallback(
    (dataset: {label: string, value: number}) => {
      console.log(dataset);
      // debugger;
      dispatchDataMask({
        type: 'filterState',
        __cache: filterState,
        extraFormData: getDatasetExtraFormData(dataset || {label: "None", value: -1}),
      });
    },
    [
      appSection,
      defaultToFirstItem,
      dispatchDataMask,
    ]
  )

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
          <MemoizedSelect
            onChange={(value: { label: string; value: number }) => {
              console.log(value.label, value.value);
              updateDataMask(value);
            }}
            value={{label: 'None', value: -1}}
          />
      </StyledFormItem>
    </FilterPluginStyle>
  );
}
