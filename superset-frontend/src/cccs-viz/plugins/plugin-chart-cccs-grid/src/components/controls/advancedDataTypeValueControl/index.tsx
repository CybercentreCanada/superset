import React, { useEffect, useState } from 'react';
import { ensureIsArray, withTheme } from '@superset-ui/core';
import { connect } from 'react-redux';
import SelectControl from 'src/explore/components/controls/SelectControl';
import useAdvancedDataTypes from 'src/explore/components/controls/FilterControl/AdhocFilterEditPopoverSimpleTabContent/useAdvancedDataTypes';

export interface Props {
  colorScheme: string;
  annotationError: object;
  annotationQuery: object;
  vizType: string;
  theme: any;
  validationErrors: string[];
  externalValidationErrors: string[];
  name: string;
  actions: object;
  label: string;
  value?: any[] | any;
  datasource: any;
  multi: boolean;
  freeForm: boolean;
  advancedDataType: string;
  onChange: (values: any, errors: any[]) => void;
  disabled: boolean;
  description: any;
}

const AdvancedDataTypeValueControlValueControl: React.FC<Props> = ({
  onChange,
  externalValidationErrors,
  datasource,
  multi,
  freeForm,
  advancedDataType,
  label,
  disabled,
  value = [],
  description,
}) => {
  const [rawValues, setRawValues] = useState(
    value && ensureIsArray(value).length === 1 ? value[0].rawData : [],
  );
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [currentAdvancedDataType, setCurrentAdvancedDataType] =
    useState<string>(advancedDataType);

  const default_advanced_data_type_state = {
    parsedAdvancedDataType: '',
    advancedDataTypeOperatorList: [],
    errorMessage: '',
    useDefaultOperators: false,
    values: value && ensureIsArray(value).length === 1 ? value[0].data : [],
  };

  const {
    advancedDataTypesState,
    subjectAdvancedDataType,
    fetchAdvancedDataTypeValueCallback,
  } = useAdvancedDataTypes(() => {}, default_advanced_data_type_state);

  const onChangeWrapper = (selection: any) => {
    setValidationErrors(
      selection.length > 0
        ? [...validationErrors, 'Validation in progress']
        : [...validationErrors],
    );
    setRawValues(selection);
  };

  // clear selection on advancedDataType change
  useEffect(() => {
    const rawData = value[0] ? value[0].rawData : [];
    onChangeWrapper(
      (currentAdvancedDataType &&
        currentAdvancedDataType !== advancedDataType) ||
        !advancedDataType
        ? []
        : rawData,
    );
    setCurrentAdvancedDataType(advancedDataType);
  }, [advancedDataType]);

  useEffect(() => {
    const data =
      advancedDataTypesState.values.length > 0
        ? {
            data: advancedDataTypesState.values,
            columns: datasource.columns
              .filter((col: any) => col.advanced_data_type === advancedDataType)
              .map((col: any) => col.column_name),
            rawData: rawValues,
          }
        : { data: [], columns: [], rawData: [] };
    onChange(data, validationErrors);
  }, [advancedDataTypesState, validationErrors]);

  useEffect(() => {
    if (rawValues.length > 0) {
      fetchAdvancedDataTypeValueCallback(
        rawValues,
        advancedDataTypesState,
        ensureIsArray(advancedDataType)[0],
      );
    }
  }, [advancedDataType, rawValues, subjectAdvancedDataType]);

  useEffect(() => {
    setValidationErrors(
      advancedDataTypesState.errorMessage
        ? [advancedDataTypesState.errorMessage]
        : [],
    );
  }, [advancedDataTypesState]);

  return (
    <SelectControl
      hovered
      description={advancedDataTypesState.parsedAdvancedDataType || description}
      value={rawValues}
      validationErrors={ensureIsArray(
        [...validationErrors, ...externalValidationErrors].at(0),
      )}
      onChange={onChangeWrapper}
      multi={multi}
      freeForm={disabled ? false : freeForm}
      label={label}
      disabled={disabled}
    />
  );
};

function mapStateToProps({ charts, explore }: any) {
  return {
    // eslint-disable-next-line camelcase
    colorScheme: explore.controls?.color_scheme?.value,
    vizType: explore.controls.viz_type.value,
  };
}

const themedAdvancedDataTypeValueControlValueControl = withTheme(
  AdvancedDataTypeValueControlValueControl,
);

export default connect(mapStateToProps)(
  themedAdvancedDataTypeValueControlValueControl,
);
