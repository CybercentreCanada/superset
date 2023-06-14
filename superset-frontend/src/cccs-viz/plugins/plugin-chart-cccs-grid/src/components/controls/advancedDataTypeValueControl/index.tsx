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
  const [rawValues, setRawValues] = useState([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [currentAdvancedDataType, setCurrentAdvancedDataType] =
    useState<string>();

  const {
    advancedDataTypesState,
    subjectAdvancedDataType,
    fetchAdvancedDataTypeValueCallback,
  } = useAdvancedDataTypes(() => {});

  // clear selection on advancedDataType change
  useEffect(() => {
    const rawData = value[0] ? value[0].rawData : [];
    setRawValues(
      (currentAdvancedDataType &&
        currentAdvancedDataType !== advancedDataType) ||
        !advancedDataType
        ? []
        : rawData,
    );
    setCurrentAdvancedDataType(advancedDataType);
  }, [advancedDataType]);

  const onChangeWrapper = (selection: any) => {
    setValidationErrors([...validationErrors, 'Validation in progress']);
    setRawValues(selection);
  };

  useEffect(() => {
    const data =
      advancedDataTypesState.parsedAdvancedDataType.length > 0 &&
      advancedDataTypesState.parsedAdvancedDataType.split(',').length > 0
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
    fetchAdvancedDataTypeValueCallback(
      rawValues,
      advancedDataTypesState,
      ensureIsArray(advancedDataType)[0],
    );
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
      description={description}
      value={rawValues}
      validationErrors={[...validationErrors, ...externalValidationErrors]}
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
