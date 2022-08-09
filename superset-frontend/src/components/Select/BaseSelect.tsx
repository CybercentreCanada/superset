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
  JSXElementConstructor,
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

const { Option } = AntdSelect;

type AntdSelectAllProps = AntdSelectProps<AntdSelectValue>;

type PickedSelectProps = Pick<
  AntdSelectAllProps,
  | 'allowClear'
  | 'autoFocus'
  | 'disabled'
  | 'filterOption'
  | 'filterSort'
  | 'labelInValue'
  | 'loading'
  | 'notFoundContent'
  | 'onChange'
  | 'onClear'
  | 'onDeselect'
  | 'onFocus'
  | 'onBlur'
  | 'onDropdownVisibleChange'
  | 'onPopupScroll'
  | 'onSearch'
  | 'onSelect'
  | 'placeholder'
  | 'showSearch'
  | 'tokenSeparators'
  | 'value'
  | 'getPopupContainer'
>;

export type OptionsType = Exclude<AntdSelectAllProps['options'], undefined>;

export type OptionsTypePage = {
  data: OptionsType;
  totalCount: number;
};

export type OptionsPagePromise = (
  search: string,
  page: number,
  pageSize: number,
) => Promise<OptionsTypePage>;


export interface BaseSelectProps extends PickedSelectProps {
  /**
   * It enables the user to create new options.
   * Can be used with standard or async select types.
   * Can be used with any mode, single or multiple.
   * False by default.
   * */
  allowNewOptions?: boolean;
  /**
   * It adds the aria-label tag for accessibility standards.
   * Must be plain English and localized.
   */
  ariaLabel: string;
  /**
   * Renders the select dropdown.
   */ 
  dropdownRender?: ((menu: ReactElement<any, string | JSXElementConstructor<any>>) => ReactElement<any, string | JSXElementConstructor<any>>) | undefined;
  /**
   * It adds a header on top of the Select.
   * Can be any ReactNode.
   */
  header?: ReactNode;
  /**
   * It defines whether the Select should allow for the
   * selection of multiple options or single.
   * Single by default.
   */
  mode?: 'single' | 'multiple';
  /**
   * Deprecated.
   * Prefer ariaLabel instead.
   */
  name?: string; // discourage usage
  /**
   * It allows to define which properties of the option object
   * should be looked for when searching.
   * By default label and value.
   */
  optionFilterProps?: string[];
  /**
   * It defines the options of the Select.
   * The options can be static, an array of options.
   * The options can also be async, a promise that returns
   * an array of options.
   */
  baseSelectOptions: OptionsType;
  /**
   * It shows a stop-outlined icon at the far right of a selected
   * option instead of the default checkmark.
   * Useful to better indicate to the user that by clicking on a selected
   * option it will be de-selected.
   * False by default.
   */
  invertSelection?: boolean;
  /**
   * Customize how filtered options are sorted while users search.
   * Will not apply to predefined `options` array when users are not searching.
   */
  sortComparator?: typeof DEFAULT_SORT_COMPARATOR;
}

const StyledContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

const StyledSelect = styled(AntdSelect)`
  ${({ theme }) => `
    && .ant-select-selector {
      border-radius: ${theme.gridUnit}px;
    }
    // Open the dropdown when clicking on the suffix
    // This is fixed in version 4.16
    .ant-select-arrow .anticon:not(.ant-select-suffix) {
      pointer-events: none;
    }
  `}
`;

const StyledStopOutlined = styled(Icons.StopOutlined)`
  vertical-align: 0;
`;

const StyledCheckOutlined = styled(Icons.CheckOutlined)`
  vertical-align: 0;
`;

const StyledSpin = styled(Spin)`
  margin-top: ${({ theme }) => -theme.gridUnit}px;
`;

const StyledLoadingText = styled.div`
  ${({ theme }) => `
    margin-left: ${theme.gridUnit * 3}px;
    line-height: ${theme.gridUnit * 8}px;
    color: ${theme.colors.grayscale.light1};
  `}
`;

const MAX_TAG_COUNT = 4;
const TOKEN_SEPARATORS = [',', '\n', '\t', ';'];
export const EMPTY_OPTIONS: OptionsType = [];

export const DEFAULT_SORT_COMPARATOR = (
  a: AntdLabeledValue,
  b: AntdLabeledValue,
  search?: string,
) => {
  let aText: string | undefined;
  let bText: string | undefined;
  if (typeof a.label === 'string' && typeof b.label === 'string') {
    aText = a.label;
    bText = b.label;
  } else if (typeof a.value === 'string' && typeof b.value === 'string') {
    aText = a.value;
    bText = b.value;
  }
  // sort selected options first
  if (typeof aText === 'string' && typeof bText === 'string') {
    if (search) {
      return rankedSearchCompare(aText, bText, search);
    }
    return aText.localeCompare(bText);
  }
  return (a.value as number) - (b.value as number);
};

/**
 * It creates a comparator to check for a specific property.
 * Can be used with string and number property values.
 * */
export const propertyComparator =
  (property: string) => (a: AntdLabeledValue, b: AntdLabeledValue) => {
    if (typeof a[property] === 'string' && typeof b[property] === 'string') {
      return a[property].localeCompare(b[property]);
    }
    return (a[property] as number) - (b[property] as number);
  };

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
const BaseSelect = (
  {
    allowClear,
    allowNewOptions = false,
    ariaLabel,
    filterOption = true,
    filterSort,
    header = null,
    invertSelection = false,
    loading,
    labelInValue = false,
    mode = 'single',
    name,
    notFoundContent,
    dropdownRender,
    onChange,
    onClear,
    onDeselect,
    onDropdownVisibleChange,
    onPopupScroll,
    onSearch,
    onSelect,
    optionFilterProps = ['label', 'value'],
    baseSelectOptions,
    placeholder = t('Select ...'),
    showSearch = true,
    sortComparator = DEFAULT_SORT_COMPARATOR,
    tokenSeparators,
    value,
    getPopupContainer,
    ...props
  }: BaseSelectProps,
  ref: RefObject<HTMLInputElement>,
) => {
  const isSingleMode = mode === 'single';
  const [selectValue, setSelectValue] = useState(value);
  const [isLoading, setIsLoading] = useState(loading);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const mappedMode = isSingleMode
    ? undefined
    : allowNewOptions
    ? 'tags'
    : 'multiple';

  const hasCustomLabels = baseSelectOptions.some(opt => !!opt?.customLabel);

  const handleFilterOption = (search: string, option: AntdLabeledValue) => {
    if (typeof filterOption === 'function') {
      return filterOption(search, option);
    }

    if (filterOption) {
      const searchValue = search.trim().toLowerCase();
      if (optionFilterProps && optionFilterProps.length) {
        return optionFilterProps.some(prop => {
          const optionProp = option?.[prop]
            ? String(option[prop]).trim().toLowerCase()
            : '';
          return optionProp.includes(searchValue);
        });
      }
    }

    return false;
  };

  const handleOnDropdownVisibleChange = (dropdownVisible: boolean) => {
    setIsDropdownVisible(dropdownVisible);
    onDropdownVisibleChange?.(dropdownVisible);
  }

  // use a function instead of component since every rerender of the
  // Select component will create a new component
  const getSuffixIcon = () => {
    if (isLoading) {
      return <StyledSpin size="small" />;
    }
    if (showSearch && isDropdownVisible) {
      return <SearchOutlined />;
    }
    return <DownOutlined />;
  };

  const handleClear = () => {
    setSelectValue(undefined);
    if (onClear) {
      onClear();
    }
  };

  useEffect(() => {
    setSelectValue(value);
  }, [value]);

  useEffect(() => {
    if (loading !== undefined && loading !== isLoading) {
      setIsLoading(loading);
    }
  }, [isLoading, loading]);

  return (
    <StyledContainer>
      {header}
      <StyledSelect
        allowClear={!isLoading && allowClear}
        aria-label={ariaLabel || name}
        dropdownRender={dropdownRender}
        filterOption={handleFilterOption}
        filterSort={filterSort}
        getPopupContainer={
          getPopupContainer || (triggerNode => triggerNode.parentNode)
        }
        labelInValue={labelInValue}
        maxTagCount={MAX_TAG_COUNT}
        mode={mappedMode}
        notFoundContent={isLoading ? t('Loading...') : notFoundContent}
        onDeselect={onDeselect}
        onDropdownVisibleChange={handleOnDropdownVisibleChange}
        onPopupScroll={onPopupScroll}
        onSearch={onSearch}
        onSelect={onSelect}
        onClear={handleClear}
        onChange={onChange}
        options={hasCustomLabels ? undefined : baseSelectOptions}
        placeholder={placeholder}
        showSearch={showSearch}
        showArrow
        tokenSeparators={tokenSeparators || TOKEN_SEPARATORS}
        value={selectValue}
        suffixIcon={getSuffixIcon()}
        menuItemSelectedIcon={
          invertSelection ? (
            <StyledStopOutlined iconSize="m" />
          ) : (
            <StyledCheckOutlined iconSize="m" />
          )
        }
        ref={ref}
        {...props}
      >
        {hasCustomLabels &&
          baseSelectOptions.map(opt => {
            const isOptObject = typeof opt === 'object';
            const label = isOptObject ? opt?.label || opt.value : opt;
            const value = isOptObject ? opt.value : opt;
            const { customLabel, ...optProps } = opt;
            return (
              <Option {...optProps} key={value} label={label} value={value}>
                {isOptObject && customLabel ? customLabel : label}
              </Option>
            );
          })}
      </StyledSelect>
    </StyledContainer>
  );
};

export default forwardRef(BaseSelect);
