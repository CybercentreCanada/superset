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
  selector: string;
  onChange: (values: any, errors: any[]) => void;
  disabled: boolean;
}

const SelectorValueControl: React.FC<Props> = ({
  onChange,
  externalValidationErrors,
  datasource,
  multi,
  freeForm,
  selector,
  label,
  disabled,
}) => {
  const [rawValues, setRawValues] = useState([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const {
    advancedDataTypesState,
    subjectAdvancedDataType,
    fetchAdvancedDataTypeValueCallback,
  } = useAdvancedDataTypes(() => {});

  // clear selection on selector change
  useEffect(() => {
    setRawValues([]);
  }, [selector]);

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
              .filter((col: any) => col.advanced_data_type === selector)
              .map((col: any) => col.column_name),
          }
        : { data: [], columns: [] };
    onChange(data, validationErrors);
  }, [advancedDataTypesState, validationErrors]);

  useEffect(() => {
    fetchAdvancedDataTypeValueCallback(
      rawValues,
      advancedDataTypesState,
      ensureIsArray(selector)[0],
    );
  }, [selector, rawValues, subjectAdvancedDataType]);

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
          validationErrors={[...validationErrors, ...externalValidationErrors]}
          value={rawValues}
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

const themedSelectorValueControl = withTheme(SelectorValueControl);

export default connect(mapStateToProps)(themedSelectorValueControl);
