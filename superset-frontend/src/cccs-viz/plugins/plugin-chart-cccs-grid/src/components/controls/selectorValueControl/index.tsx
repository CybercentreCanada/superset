import React, { useEffect, useState } from 'react';
import { withTheme } from '@superset-ui/core';
import { connect} from 'react-redux';
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
    name: string;
    actions: object;
    label: string;
    value?: any[] | any;
    datasource: any;
    multi: boolean;
    freeForm: boolean;
    selector: string;
    onChange: (a: any) => void;
}


const ChangeDatasourceButtonControll: React.FC<Props> = ({
    colorScheme,
    annotationError,
    annotationQuery,
    vizType,
    theme,
    validationErrors,
    name,
    actions,
    onChange,
    value = [],
    datasource,
    multi,
    freeForm,
    selector,
    label,
    ...props
}) => {
    const [rawValues, setRawValues] = useState([]);

    const {
        advancedDataTypesState,
        subjectAdvancedDataType,
        fetchAdvancedDataTypeValueCallback,
      } = useAdvancedDataTypes(() => {});

    const onChangeWrapper = (selection: any) => {
        setRawValues(selection)
    }
    
    useEffect( () => {
        const data =  advancedDataTypesState.parsedAdvancedDataType.length > 0 && advancedDataTypesState.parsedAdvancedDataType.split(",").length > 0 ?  {
            "data":  advancedDataTypesState.values,
            "columns": datasource.columns.filter((col: any) => {
                return col.advanced_data_type === selector
            }).map((col: any) => {
                return col.column_name
            }) 
        } : {"data": [], "columns": []}
        onChange(data);
    }, [advancedDataTypesState])

    useEffect(() => {
        fetchAdvancedDataTypeValueCallback(
            Array.isArray(rawValues) ? rawValues : [rawValues],
            advancedDataTypesState,
            Array.isArray(selector) ? selector[0] : selector,
        );
      }, [selector, rawValues, subjectAdvancedDataType]);
    
      
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
                    validationErrors={advancedDataTypesState.errorMessage ? [advancedDataTypesState.errorMessage] : []}
                    onChange={onChangeWrapper}
                    multi={multi}
                    freeForm={freeForm}
                    label={label}
                />
            
            </>
        </Tooltip>
    );
}

function mapStateToProps({ charts, explore }: any) {
    return {
      // eslint-disable-next-line camelcase
      colorScheme: explore.controls?.color_scheme?.value,
      vizType: explore.controls.viz_type.value,
    };
  }
  
  const themedChangeDatasourceButtonControll = withTheme(ChangeDatasourceButtonControll);
  
  export default connect(mapStateToProps)(themedChangeDatasourceButtonControll);
