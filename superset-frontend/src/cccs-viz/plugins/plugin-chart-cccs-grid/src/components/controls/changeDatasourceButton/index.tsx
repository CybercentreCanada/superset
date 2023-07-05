import React, { useState } from 'react';
import { ChangeDatasourceModal } from 'src/components/Datasource';
import { withTheme } from '@superset-ui/core';
import { connect, useDispatch } from 'react-redux';
import Button from 'src/components/Button';
import { updateFormDataByDatasource } from 'src/explore/actions/exploreActions';

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
  onChange: (a: any) => void;
}

const ChangeDatasourceButtonControll: React.FC<Props> = ({
  onChange,
  datasource,
}) => {
  const dispatch = useDispatch();
  const [showChangeDatasourceModal, setShowChangeDatasourceModal] =
    useState<Boolean>(false);

  const toggleChangeDatasourceModal = () => {
    setShowChangeDatasourceModal(!showChangeDatasourceModal);
  };
  const onDatasourceSave = (new_datasource: any) => {
    dispatch(updateFormDataByDatasource(datasource, new_datasource));
  };
  const onChangeWrapper = (a: any) => {
    onChange(a);
  };

  return (
    <>
      <Button
        buttonStyle="primary"
        onClick={() => setShowChangeDatasourceModal(true)}
      >
        Swap dataset
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
};

function mapStateToProps({ explore }: any) {
  return {
    // eslint-disable-next-line camelcase
    colorScheme: explore.controls?.color_scheme?.value,
    vizType: explore.controls.viz_type.value,
  };
}

const themedChangeDatasourceButtonControll = withTheme(
  ChangeDatasourceButtonControll,
);

export default connect(mapStateToProps)(themedChangeDatasourceButtonControll);
