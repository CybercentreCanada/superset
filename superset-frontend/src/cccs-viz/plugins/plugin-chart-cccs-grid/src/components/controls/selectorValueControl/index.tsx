import React, { useState } from 'react';
import {
    ChangeDatasourceModal,
    DatasourceModal,
  } from 'src/components/Datasource';
import { t, withTheme } from '@superset-ui/core';
import { connect, useSelector, useDispatch } from 'react-redux';
import SelectControl from 'src/explore/components/controls/SelectControl';
import { setDatasource } from 'src/explore/actions/exploreActions';





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
    value?: object[];
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


    const onChangeWrapper = (selection: any) => {
    
        const data =  selection.length > 0 ?  {
            "data": selection,
            "columns": datasource.columns.filter((col: any) => {
                return col.advanced_data_type === selector
            }).map((col: any) => {
                return col.column_name
            }) 
        } : {"data": [], "columns": []}
        onChange(data);
    }
    
    return (
        <>
            <SelectControl
                onChange={onChangeWrapper}
                multi={multi}
                freeForm={freeForm}
                label={label}
            />
        
        </>
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
