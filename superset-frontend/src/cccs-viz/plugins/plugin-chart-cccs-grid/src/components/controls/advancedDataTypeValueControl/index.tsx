import React, { useEffect, useState } from 'react';
import { ensureIsArray, withTheme } from '@superset-ui/core';
import { connect } from 'react-redux';
import SelectControl from 'src/explore/components/controls/SelectControl';
import { Tooltip } from 'src/components/Tooltip';
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
    setRawValues(
      currentAdvancedDataType && currentAdvancedDataType !== advancedDataType
        ? []
        : value[0].rawData || [],
    );
    setCurrentAdvancedDataType(advancedDataType);
  }, [advancedDataType]);

  const onChangeWrapper = (selection: any) => {
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
    <Tooltip
      title={
        advancedDataTypesState.errorMessage ||
        advancedDataTypesState.parsedAdvancedDataType
      }
    >
      <>
        <SelectControl
          description={advancedDataTypesState.parsedAdvancedDataType}
          value={rawValues}
          validationErrors={[...validationErrors, ...externalValidationErrors]}
          onChange={onChangeWrapper}
          multi={multi}
          freeForm={disabled ? false : freeForm}
          label={label}
          disabled={disabled}
        />
      </>
    </Tooltip>
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
