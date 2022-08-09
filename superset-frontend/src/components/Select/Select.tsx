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
import React, {
  forwardRef,
  ReactElement,
  ReactNode,
  RefObject,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from 'react';
import { ensureIsArray, styled, t } from '@superset-ui/core';
import AntdSelect, {
  SelectProps as AntdSelectProps,
  SelectValue as AntdSelectValue,
  LabeledValue as AntdLabeledValue,
} from 'antd/lib/select';
import { DownOutlined, SearchOutlined } from '@ant-design/icons';
import { Spin } from 'antd';
import { isEqual } from 'lodash';
import Icons from 'src/components/Icons';
import { rankedSearchCompare } from 'src/utils/rankedSearchCompare';
import { getValue, hasOption, isLabeledValue } from './utils';
import BaseSelect, { BaseSelectProps, DEFAULT_SORT_COMPARATOR, OptionsType } from './BaseSelect';

const { Option } = AntdSelect;

export interface SelectProps extends BaseSelectProps {
  /**
   * It defines the options of the Select.
   * The options can be static, an array of options.
   * an array of options.
   */
  options: OptionsType;
}

/**
 * This component is a customized version of the Antdesign 4.X Select component
 * https://ant.design/components/select/.
 * The aim of the component was to combine all the instances of select components throughout the
 * project under one and to remove the react-select component entirely.
 * This Select component provides an API that is tested against all the different use cases of Superset.
 * It limits and overrides the existing Antdesign API in order to keep their usage to the minimum
 * and to enforce simplification and standardization.
 * It is divided into two macro categories, Static and Async.
 * The Static type accepts a static array of options.
 * The Async type accepts a promise that will return the options.
 * Each of the categories come with different abilities. For a comprehensive guide please refer to
 * the storybook in src/components/Select/Select.stories.tsx.
 */
const Select = (
  {
    allowClear,
    allowNewOptions = false,
    ariaLabel,
    filterOption = true,
    header = null,
    invertSelection = false,
    labelInValue = false,
    loading,
    mode = 'single',
    name,
    notFoundContent,
    onChange,
    onClear,
    onDropdownVisibleChange,
    optionFilterProps = ['label', 'value'],
    options,
    placeholder = t('Select ...'),
    showSearch = true,
    sortComparator = DEFAULT_SORT_COMPARATOR,
    tokenSeparators,
    value,
    getPopupContainer,
    ...props
  }: SelectProps,
  ref: RefObject<HTMLInputElement>,
) => {
  const isSingleMode = mode === 'single';
  const [selectValue, setSelectValue] = useState(value);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(loading);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);

  const sortSelectedFirst = useCallback(
    (a: AntdLabeledValue, b: AntdLabeledValue) =>
      selectValue && a.value !== undefined && b.value !== undefined
        ? Number(hasOption(b.value, selectValue)) -
          Number(hasOption(a.value, selectValue))
        : 0,
    [selectValue],
  );
  const sortComparatorWithSearch = useCallback(
    (a: AntdLabeledValue, b: AntdLabeledValue) =>
      sortSelectedFirst(a, b) || sortComparator(a, b, inputValue),
    [inputValue, sortComparator, sortSelectedFirst],
  );

  const initialOptions = useMemo(
    () => (options && Array.isArray(options) ? options.slice() : EMPTY_OPTIONS),
    [options],
  );
  const initialOptionsSorted = useMemo(
    () => initialOptions.slice().sort(sortSelectedFirst),
    [initialOptions, sortSelectedFirst],
  );

  const [selectOptions, setSelectOptions] =
    useState<OptionsType>(initialOptionsSorted);

  // add selected values to options list if they are not in it
  const fullSelectOptions = useMemo(() => {
    const missingValues: OptionsType = ensureIsArray(selectValue)
      .filter(opt => !hasOption(getValue(opt), selectOptions))
      .map(opt =>
        isLabeledValue(opt) ? opt : { value: opt, label: String(opt) },
      );
    return missingValues.length > 0
      ? missingValues.concat(selectOptions)
      : selectOptions;
  }, [selectOptions, selectValue]);

  const handleOnSelect = (
    selectedItem: string | number | AntdLabeledValue | undefined,
  ) => {
    if (isSingleMode) {
      setSelectValue(selectedItem);
    } else {
      setSelectValue(previousState => {
        const array = ensureIsArray(previousState);
        const value = getValue(selectedItem);
        // Tokenized values can contain duplicated values
        if (!hasOption(value, array)) {
          const result = [...array, selectedItem];
          return isLabeledValue(selectedItem)
            ? (result as AntdLabeledValue[])
            : (result as (string | number)[]);
        }
        return previousState;
      });
    }
    setInputValue('');
  };

  const handleOnDeselect = (
    value: string | number | AntdLabeledValue | undefined,
  ) => {
    if (Array.isArray(selectValue)) {
      if (isLabeledValue(value)) {
        const array = selectValue as AntdLabeledValue[];
        setSelectValue(array.filter(element => element.value !== value.value));
      } else {
        const array = selectValue as (string | number)[];
        setSelectValue(array.filter(element => element !== value));
      }
    }
    setInputValue('');
  };

  const handleOnSearch = (search: string) => {
    const searchValue = search.trim();
    if (allowNewOptions && isSingleMode) {
      const newOption = searchValue &&
        !hasOption(searchValue, fullSelectOptions, true) && {
          label: searchValue,
          value: searchValue,
          isNewOption: true,
        };
      const cleanSelectOptions = fullSelectOptions.filter(
        opt => !opt.isNewOption || hasOption(opt.value, selectValue),
      );
      const newOptions = newOption
        ? [newOption, ...cleanSelectOptions]
        : cleanSelectOptions;
      setSelectOptions(newOptions);
    }
    setInputValue(search);
  };

  const handleOnDropdownVisibleChange = (isDropdownVisible: boolean) => {
    setIsDropdownVisible(isDropdownVisible);

    // if no search input value, force sort options because it won't be sorted by
    // `filterSort`.
    if (isDropdownVisible && !inputValue && selectOptions.length > 1) {
      if (!isEqual(initialOptionsSorted, selectOptions)) {
        setSelectOptions(initialOptionsSorted);
      }
    }
    if (onDropdownVisibleChange) {
      onDropdownVisibleChange(isDropdownVisible);
    }
  };

  const dropdownRender = (
    originNode: ReactElement & { ref?: RefObject<HTMLElement> },
  ) => {
    if (!isDropdownVisible) {
      originNode.ref?.current?.scrollTo({ top: 0 });
    }
    if (isLoading && fullSelectOptions.length === 0) {
      return <StyledLoadingText>{t('Loading...')}</StyledLoadingText>;
    }
    return originNode;
  };

  useEffect(() => {
    // when `options` list is updated from component prop, reset states
    setSelectOptions(initialOptions);
  }, [initialOptions]);

  useEffect(() => {
    if (loading !== undefined && loading !== isLoading) {
      setIsLoading(loading);
    }
  }, [isLoading, loading]);

  return (
    <BaseSelect
      header={header}
      ariaLabel={ariaLabel}
      dropdownRender={dropdownRender}
      filterOption={filterOption}
      filterSort={sortComparatorWithSearch}
      getPopupContainer={getPopupContainer}
      loading={isLoading}
      labelInValue
      name={name}
      notFoundContent={notFoundContent}
      onDeselect={handleOnDeselect}
      onDropdownVisibleChange={handleOnDropdownVisibleChange}
      onSearch={showSearch ? handleOnSearch : undefined}
      onSelect={handleOnSelect}
      onChange={onChange}
      placeholder={placeholder}
      showSearch={showSearch}
      value={selectValue}
      ref={ref}
      {...props}
      baseSelectOptions={fullSelectOptions}
    />
  );
};

export default forwardRef(Select);
