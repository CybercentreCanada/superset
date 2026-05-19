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
import { PureComponent, type ReactNode } from 'react';
import { isEqualArray } from '@superset-ui/core';
import { t } from '@apache-superset/core/translation';
import { css } from '@apache-superset/core/theme';
import { Select } from '@superset-ui/core/components';
import ControlHeader from 'src/explore/components/ControlHeader';

type SelectValue = string | number | (string | number)[] | null | undefined;

interface SelectOption {
  value: string | number;
  label: string;
  [key: string]: unknown;
}

export interface SelectControlProps {
  ariaLabel?: string;
  autoFocus?: boolean;
  choices?: [string | number, string][];
  clearable?: boolean;
  description?: string | ReactNode;
  disabled?: boolean;
  freeForm?: boolean;
  isLoading?: boolean;
  mode?: string;
  multi?: boolean;
  isMulti?: boolean;
  name: string;
  onChange?: (value: SelectValue, options?: unknown[]) => void;
  onFocus?: () => void;
  onSelect?: (value: SelectValue) => void;
  onDeselect?: (value: SelectValue) => void;
  value?: SelectValue;
  default?: SelectValue;
  showHeader?: boolean;
  optionRenderer?: (option: unknown) => ReactNode;
  valueKey?: string;
  options?: { value: string | number; label: string; [key: string]: unknown }[];
  placeholder?: string;
  filterOption?: (input: unknown, option: unknown) => boolean;
  tokenSeparators?: string[];
  notFoundContent?: ReactNode;
  label?: string;
  renderTrigger?: boolean;
  validationErrors?: string[];
  rightNode?: ReactNode;
  leftNode?: ReactNode;
  onClick?: () => void;
  hovered?: boolean;
  tooltipOnClick?: () => void;
  warning?: string;
  danger?: string;
  sortComparator?: (a: SelectOption, b: SelectOption) => number;
  // CCCS props
  allowSelectAll?: boolean;
  canCopy?: boolean;
  copyOnClick?: (a: any) => Promise<void>;
  canSelectAll?: boolean;
  promptTextCreator?: (label: string) => string;
}

const defaultProps = {
  autoFocus: false,
  choices: [],
  clearable: true,
  description: null,
  disabled: false,
  freeForm: false,
  isLoading: false,
  label: null,
  multi: false,
  onChange: () => {},
  onFocus: () => {},
  showHeader: true,
  valueKey: 'value',
  allowSelectAll: true,
  promptTextCreator: (label: string) => `Create Option ${label}`,
  canCopy: false,
  copyOnClick: (v: any) => {
    navigator.clipboard.writeText(v);
  },
  canSelectAll: false,
};

interface SelectControlState {
  options: SelectOption[];
}

const numberComparator = (a: SelectOption, b: SelectOption): number =>
  (a.value as number) - (b.value as number);

export const areAllValuesNumbers = (
  items: unknown[],
  valueKey = 'value',
): boolean => {
  if (!items || items.length === 0) {
    return false;
  }
  return items.every(item => {
    if (Array.isArray(item)) {
      const [value] = item;
      return typeof value === 'number';
    }
    if (typeof item === 'object' && item !== null) {
      return typeof (item as Record<string, unknown>)[valueKey] === 'number';
    }
    return typeof item === 'number';
  });
};

type SortComparator =
  | ((a: SelectOption, b: SelectOption) => number)
  | undefined;

export const getSortComparator = (
  choices: unknown[] | undefined,
  options: unknown[] | undefined,
  valueKey: string | undefined,
  explicitComparator: SortComparator,
): SortComparator => {
  if (explicitComparator) {
    return explicitComparator;
  }

  if (
    (options && areAllValuesNumbers(options, valueKey)) ||
    (choices && areAllValuesNumbers(choices, valueKey))
  ) {
    return numberComparator;
  }

  return undefined;
};

export const innerGetOptions = (props: SelectControlProps): SelectOption[] => {
  const { choices, optionRenderer, valueKey = 'value' } = props;
  let options: SelectOption[] = [];
  if (props.options) {
    options = props.options.map(o => ({
      ...o,
      value: o[valueKey] as string | number,
      label: optionRenderer
        ? (optionRenderer(o) as string)
        : ((o.label || o[valueKey]) as string),
    }));
  } else if (choices) {
    // Accepts different formats of input
    options = choices.map(c => {
      if (Array.isArray(c)) {
        const [value, label] = c.length > 1 ? c : [c[0], c[0]];
        return {
          value,
          label: String(label),
        };
      }
      // This branch handles object-like choices, but choices are typed as tuples
      return { value: c as unknown as string | number, label: String(c) };
    });
  }
  return options;
};

export default class SelectControl extends PureComponent<
  SelectControlProps,
  SelectControlState
> {
  static defaultProps = defaultProps;

  private selectRef: HTMLDivElement | null = null;

  constructor(props: SelectControlProps) {
    super(props);
    this.state = {
      options: this.getOptions(props),
    };
    this.onChange = this.onChange.bind(this);
    this.handleFilterOptions = this.handleFilterOptions.bind(this);
  }

  componentDidUpdate(prevProps: SelectControlProps) {
    if (
      !isEqualArray(this.props.choices, prevProps.choices) ||
      !isEqualArray(this.props.options, prevProps.options)
    ) {
      const options = this.getOptions(this.props);
      this.setState({ options });
    }
  }

  // --------- CCCS code block
  componentDidMount() {
    if (this.selectRef) {
      this.selectRef.addEventListener('copy', this.handleCopy.bind(this));
      this.selectRef.addEventListener('keydown', this.handleKeyDown.bind(this));
    }
  }

  componentWillUnmount() {
    if (this.selectRef) {
      this.selectRef.removeEventListener('copy', this.handleCopy.bind(this));
      this.selectRef.removeEventListener(
        'keydown',
        this.handleKeyDown.bind(this),
      );
    }
  }
  // --------- end CCCS code block

  // Beware: This is acting like an on-click instead of an on-change
  // (firing every time user chooses vs firing only if a new option is chosen).
  onChange(val: SelectValue | SelectOption | SelectOption[]) {
    // will eventually call `exploreReducer`: SET_FIELD_VALUE
    const { valueKey = 'value' } = this.props;
    let onChangeVal: SelectValue = val as SelectValue;

    if (Array.isArray(val)) {
      const values = val.map(v =>
        typeof v === 'object' &&
        v !== null &&
        (v as SelectOption)[valueKey] !== undefined
          ? (v as SelectOption)[valueKey]
          : v,
      );
      onChangeVal = values as (string | number)[];
    }
    if (
      typeof val === 'object' &&
      val !== null &&
      !Array.isArray(val) &&
      (val as SelectOption)[valueKey] !== undefined
    ) {
      onChangeVal = (val as SelectOption)[valueKey] as string | number;
    }
    this.props.onChange?.(onChangeVal, []);
  }

  // --------- CCCS code block
  isMetaSelectAllOption(o: SelectOption) {
    return o.meta && o.meta === true && o.label === 'Select all';
  }

  optionsIncludesSelectAll(o: SelectOption[]) {
    return o.findIndex(o => this.isMetaSelectAllOption(o)) >= 0;
  }

  handleCopy() {
    if (this.props.copyOnClick) {
      this.props.copyOnClick(this.props.value);
    }
  }

  selectAllOnClick() {
    this.onChange(this.props.options);
  }

  handleKeyDown = (event: KeyboardEvent) => {
    if (event.ctrlKey === false) {
      return;
    }
    if (event.key === 'a') {
      this.selectAllOnClick();
    }
  };
  // --------- end CCCS code block

  getOptions(props: SelectControlProps) {
    return innerGetOptions(props);
  }

  handleFilterOptions(text: string, option: SelectOption) {
    const { filterOption } = this.props;
    return filterOption?.({ data: option }, text) ?? true;
  }

  render() {
    const {
      ariaLabel,
      autoFocus,
      clearable,
      disabled,
      filterOption,
      freeForm,
      isLoading,
      isMulti,
      label,
      multi,
      name,
      notFoundContent,
      onFocus,
      onSelect,
      onDeselect,
      placeholder,
      showHeader,
      tokenSeparators,
      value,
      // ControlHeader props
      description,
      renderTrigger,
      rightNode,
      leftNode,
      validationErrors,
      onClick,
      hovered,
      tooltipOnClick,
      warning,
      danger,
      // CCCS props
      allowSelectAll,
      canCopy,
      canSelectAll,
    } = this.props;

    const getValue = () => {
      const currentValue =
        value ??
        (this.props.default !== undefined ? this.props.default : undefined);

      // safety check - the value is intended to be undefined but null was used
      if (
        currentValue === null &&
        !this.state.options.some(o => o.value === null)
      ) {
        return undefined;
      }
      return currentValue;
    };

    const headerProps = {
      name,
      label,
      description,
      renderTrigger,
      rightNode,
      leftNode,
      validationErrors,
      onClick,
      hovered,
      tooltipOnClick,
      warning,
      danger,
      // CCCS props
      canCopy,
      copyOnClick: () => {
        if (this.props.copyOnClick) {
          this.props.copyOnClick(getValue());
        }
      },
      canSelectAll,
      selectAllOnClick: () => {
        this.onChange(this.props.options);
      },
    };

    const selectProps = {
      allowNewOptions: freeForm,
      allowSelectAll,
      autoFocus,
      ariaLabel:
        ariaLabel || (typeof label === 'string' ? label : t('Select ...')),
      allowClear: clearable,
      disabled,
      filterOption:
        filterOption && typeof filterOption === 'function'
          ? this.handleFilterOptions
          : true,
      header: showHeader && <ControlHeader {...headerProps} />,
      loading: isLoading,
      mode: this.props.mode || (isMulti || multi ? 'multiple' : 'single'),
      name: `select-${name}`,
      onChange: this.onChange,
      onFocus,
      onSelect,
      onDeselect,
      options: this.state.options,
      placeholder,
      sortComparator: getSortComparator(
        this.props.choices,
        this.props.options,
        this.props.valueKey,
        this.props.sortComparator,
      ),
      value: getValue(),
      tokenSeparators,
      notFoundContent,
    };

    return (
      <div
        css={theme => css`
          .type-label {
            margin-right: ${theme.sizeUnit * 2}px;
          }
          .Select__multi-value__label > span,
          .Select__option > span,
          .Select__single-value > span {
            display: flex;
            align-items: center;
          }
        `}
        ref={elem => {
          this.selectRef = elem;
        }}
      >
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <Select {...(selectProps as any)} />
      </div>
    );
  }
}
