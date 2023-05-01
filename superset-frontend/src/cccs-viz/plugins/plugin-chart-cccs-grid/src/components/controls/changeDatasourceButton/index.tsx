import React, { useState } from 'react';
import {
    ChangeDatasourceModal,
    DatasourceModal,
  } from 'src/components/Datasource';
import { t, withTheme } from '@superset-ui/core';
import { connect, useSelector, useDispatch } from 'react-redux';
import Button from 'src/components/Button'
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
    ...props
}) => {

    const state = useSelector(state => state);
    const dispatch = useDispatch();
    const [showChangeDatasourceModal, setShowChangeDatasourceModal] = useState<Boolean>(false);

    const toggleChangeDatasourceModal = ()  => {
        setShowChangeDatasourceModal(!showChangeDatasourceModal);
    }
    const onDatasourceSave = (datasource: any) => {
        dispatch(setDatasource(datasource));
    }
    const onChangeWrapper = (a: any) => {
        onChange(a);
    }
    
    return (

        <>
            <Button
            buttonStyle="primary"
            onClick={() => setShowChangeDatasourceModal(true)}
            >
                {('Change dataset')}
            </Button>
            {showChangeDatasourceModal && (
            <ChangeDatasourceModal
                onDatasourceSave={onDatasourceSave}
                onHide={toggleChangeDatasourceModal}
                show={showChangeDatasourceModal}
                onChange={onChangeWrapper}
            />
        )}
        
        
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
