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
  AppSection,
  DataMask,
  DataRecordValue,
  ensureIsArray,
  ExtraFormData,
  GenericDataType,
  getColumnLabel,
  JsonObject,
  smartDateDetailedFormatter,
  t,
  tn,
} from '@superset-ui/core';
import { LabeledValue as AntdLabeledValue } from 'antd/lib/select';
import React, {
  useCallback,
  useEffect,
  useState,
  useMemo,
  useRef,
} from 'react';
import { Select } from 'src/components';
import debounce from 'lodash/debounce';
import { SLOW_DEBOUNCE } from 'src/constants';
import { useImmerReducer } from 'use-immer';
import { propertyComparator } from 'src/components/Select/Select';
import { Input, InputRef, Tag, Tooltip } from 'antd';
import { PluginFilterMultiSelectProps, SelectValue } from './types';
import { StyledFormItem, FilterPluginStyle, StatusMessage } from '../common';
import { getDataRecordFormatter, getSelectExtraFormData } from '../../utils';
import { PlusOutlined } from '@ant-design/icons';

type DataMaskAction =
  | { type: 'ownState'; ownState: JsonObject }
  | {
      type: 'filterState';
      __cache: JsonObject;
      extraFormData: ExtraFormData;
      filterState: { value: SelectValue; label?: string };
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

export default function PluginFilterMultiSelect(
  props: PluginFilterMultiSelectProps,
) {
  const {
    coltypeMap,
    data,
    filterState,
    formData,
    height,
    isRefreshing,
    width,
    setDataMask,
    setFocusedFilter,
    unsetFocusedFilter,
    setFilterActive,
    appSection,
    showOverflow,
    parentRef,
    inputRef,
  } = props;
  const { showSearch } = formData;
  const groupby = useMemo(
    () => ensureIsArray(formData.groupby).map(getColumnLabel),
    [formData.groupby],
  );
  const [col] = groupby;
  const [initialColtypeMap] = useState(coltypeMap);
  const [dataMask, dispatchDataMask] = useImmerReducer(reducer, {
    extraFormData: {},
    filterState,
  });
  const datatype: GenericDataType = coltypeMap[col];
  const labelFormatter = useMemo(
    () =>
      getDataRecordFormatter({
        timeFormatter: smartDateDetailedFormatter,
      }),
    [],
  );

  const updateDataMask = useCallback(
    (values: SelectValue) => {
      const emptyFilter = !values?.length;

      const suffix = values?.length ? t(' (excluded)') : '';

      dispatchDataMask({
        type: 'filterState',
        __cache: filterState,
        extraFormData: getSelectExtraFormData(col, values, emptyFilter),
        filterState: {
          ...filterState,
          label: values?.length
            ? `${(values || [])
                .map(value => labelFormatter(value, datatype))
                .join(', ')}${suffix}`
            : undefined,
          value:
            appSection === AppSection.FILTER_CONFIG_MODAL ? undefined : values,
        },
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      appSection,
      col,
      datatype,
      dispatchDataMask,
      JSON.stringify(filterState),
      labelFormatter,
    ],
  );

  useEffect(() => {
    updateDataMask(filterState.value);
  }, [JSON.stringify(filterState.value)]);

  const isDisabled = appSection === AppSection.FILTER_CONFIG_MODAL;

  const debouncedOwnStateFunc = useCallback(
    debounce((val: string) => {
      dispatchDataMask({
        type: 'ownState',
        ownState: {
          coltypeMap: initialColtypeMap,
          search: val,
        },
      });
    }, SLOW_DEBOUNCE),
    [],
  );

  const handleBlur = useCallback(() => {
    unsetFocusedFilter();
  }, [unsetFocusedFilter]);

  const handleChange = useCallback(
    (value?: SelectValue | number | string) => {
      const values = value === null ? [null] : ensureIsArray(value);

      if (values.length === 0) {
        updateDataMask(null);
      } else {
        updateDataMask(values);
      }
    },
    [updateDataMask],
  );

  useEffect(() => {
    if (filterState.value === undefined) {
      // initialize to first value if set to default to first item
      const firstItem: SelectValue = data[0]
        ? (groupby.map(col => data[0][col]) as string[])
        : null;
      // firstItem[0] !== undefined for a case when groupby changed but new data still not fetched
      // TODO: still need repopulate default value in config modal when column changed
      if (firstItem && firstItem[0] !== undefined) {
        updateDataMask(firstItem);
      }
    } else if (isDisabled) {
      // empty selection if filter is disabled
      updateDataMask(null);
    } else {
      // reset data mask based on filter state
      updateDataMask(filterState.value);
    }
  }, [
    col,
    isDisabled,
    updateDataMask,
    data,
    groupby,
    JSON.stringify(filterState),
  ]);

  useEffect(() => {
    setDataMask(dataMask);
  }, [JSON.stringify(dataMask)]);

  const placeholderText =
    data.length === 0
      ? t('No data')
      : tn('%s option', '%s options', data.length, data.length);

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

  const EditTagsInput = () => {
    const [tags, setTags] = useState<string[]>(filterState.value || []);
    const [inputVisible, setInputVisible] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [editInputIndex, setEditInputIndex] = useState(-1);
    const [editInputValue, setEditInputValue] = useState('');
    const inputRef = useRef<InputRef>(null);
    const editInputRef = useRef<InputRef>(null);

    useEffect(() => {
      if (inputVisible) {
        inputRef.current?.focus();
      }
    }, [inputVisible]);

    useEffect(() => {
      editInputRef.current?.focus();
    }, [inputValue]);

    const handleClose = (removedTag: string) => {
      const newTags = tags.filter(tag => tag !== removedTag);
      setTags(newTags);
      handleChange(newTags);
    };

    const showInput = () => {
      if (!isDisabled) {
        setInputVisible(true);
      }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setInputValue(e.target.value);
    };

    const handleInputConfirm = () => {
      if (inputValue && tags.indexOf(inputValue) === -1) {
        let newTags = [inputValue];
        if (inputValue.includes(',')) {
          newTags = inputValue.split(',').map(tag => tag.trim());
        }
        setTags([...tags, ...newTags]);
        handleChange([...tags, ...newTags]);
      }
      setInputVisible(false);
      setInputValue('');
    };

    const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setEditInputValue(e.target.value);
    };

    const handleEditInputConfirm = () => {
      let newTags = [];
      if (editInputValue.includes(',')) {
        newTags = [
          ...tags.slice(0, editInputIndex),
          ...editInputValue.split(',').map(tag => tag.trim()),
          ...tags.slice(editInputIndex + 1, tags.length),
        ];
      } else {
        newTags = [...tags];
        newTags[editInputIndex] = editInputValue;
      }
      setTags(newTags);
      handleChange(newTags);
      setEditInputIndex(-1);
      setInputValue('');
    };

    return (
      <div
        onBlur={handleBlur}
        onMouseEnter={setFocusedFilter}
        onMouseLeave={unsetFocusedFilter}
      >
        {tags.map((tag, index) => {
          if (editInputIndex === index) {
            return (
              <Input
                ref={editInputRef}
                key={tag}
                size="small"
                className="tag-input"
                value={editInputValue}
                onChange={handleEditInputChange}
                onBlur={handleEditInputConfirm}
                onPressEnter={handleEditInputConfirm}
              />
            );
          }

          const isLongTag: boolean = tag.length > 20;

          const tagElem = (
            <Tag
              className="edit-tag"
              key={tag}
              closable
              onClose={() => handleClose(tag)}
            >
              <span
                onDoubleClick={e => {
                  setEditInputIndex(index);
                  setEditInputValue(tag);
                  e.preventDefault();
                }}
              >
                {isLongTag ? `${tag.slice(0, 20)}...` : tag}
              </span>
            </Tag>
          );
          return isLongTag ? (
            <Tooltip title={tag} key={tag}>
              {tagElem}
            </Tooltip>
          ) : (
            tagElem
          );
        })}
        {inputVisible && (
          <Input
            ref={inputRef}
            type="text"
            size="small"
            className="tag-input"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputConfirm}
            onPressEnter={handleInputConfirm}
          />
        )}
        {!inputVisible && (
          <Tag className="site-tag-plus" onClick={showInput}>
            <PlusOutlined /> New Value
          </Tag>
        )}
      </div>
    );
  };

  return (
    <FilterPluginStyle height={height} width={width}>
      <StyledFormItem
        validateStatus={filterState.validateStatus}
        extra={formItemExtra}
      >
        <EditTagsInput />
        {/*
          // @ts-ignore
          onChange={handleChange}
        /> */}
      </StyledFormItem>
    </FilterPluginStyle>
  );
}
