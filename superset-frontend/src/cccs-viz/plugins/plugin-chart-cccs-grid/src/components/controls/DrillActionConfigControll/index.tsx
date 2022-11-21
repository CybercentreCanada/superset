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

import React, { useState } from 'react';
import CustomListItem from 'src/explore/components/controls/CustomListItem';
import { t, withTheme } from '@superset-ui/core';
import AsyncEsmComponent from 'src/components/AsyncEsmComponent';
import { List } from 'src/components';
import ControlPopover from 'src/explore/components/controls/ControlPopover/ControlPopover'
import { connect } from 'react-redux';


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
    onChange: (a: any) => void,
};
  

const DrillActionConfig = AsyncEsmComponent(
  () => import('./DrillActionConfig'),
  // size of overlay inner content
  () => <div style={{ width: 450, height: 368 }} />,
);


 const DrillActionConfigControl: React.FC<Props> = (
  {
    colorScheme,
    annotationError,
    annotationQuery,
    vizType,
    theme,
    validationErrors,
    name,
    actions,
    onChange,
    label,
    value = [],
    ...props
  }
 ) => 
 {
    // Need to bind function 
    // Need to preload 
    const [state, setState] = useState({
      handleVisibleChange: {},
        addedDrillActionConfigIndex: -1,
      });
    
    const [visiblePopoverIndex, setVisiblePopoverindex] = useState<string | number>(-1)

    const addDrillActionConfig = (originalDrillActionConfig: any, newDrillActionConfig: any) =>
    {
        let drillActionConfigs = value;
        if (drillActionConfigs.includes(originalDrillActionConfig)) {
          drillActionConfigs = drillActionConfigs.map(anno =>
            anno === originalDrillActionConfig ? newDrillActionConfig : anno,
          );
        } else {
          drillActionConfigs = [...drillActionConfigs, newDrillActionConfig];
          setState({...state, addedDrillActionConfigIndex: drillActionConfigs.length - 1 });
        }
        onChange(drillActionConfigs);
    }


    const handleVisibleChange = (visible: any, popoverKey: string | number) => {
      setVisiblePopoverindex(visible ? popoverKey: -1)
      }
    
    const removeDrillActionConfig = (drillActionConfig: any) => {
        const annotations = value.filter(anno => anno !== drillActionConfig);
        onChange(annotations);
    }
    const renderPopover = (popoverKey: string | number, drillActionConfig: any, error: string = "") => {
      const id = drillActionConfig?.name || '_new';
  
      return (
        <div id={`annotation-pop-${id}`} data-test="popover-content">
          <DrillActionConfig
            {...drillActionConfig}
            error={error}
            addDrillActionConfig={(newAnnotation: any) =>
              addDrillActionConfig(drillActionConfig, newAnnotation)
            }
            removeDrillActionConfig={() => removeDrillActionConfig(drillActionConfig)}
            close={() => {
              handleVisibleChange(false, popoverKey);
              setState({...state, addedDrillActionConfigIndex: -1 });
            }}
          />
        </div>
      );
    }
  
    const renderInfo = (drillActionConfig: any) => {
      if (!drillActionConfig.show) {
        return <span style={{ color: theme.colors.error.base }}> Hidden </span>;
      }
      return '';
    }

    const { addedDrillActionConfigIndex } = state;
    const addedDrillActionConfig = value[addedDrillActionConfigIndex];

    const drillactionConfigs = value.map((anno: any, i) => (
      <ControlPopover
        key={i}
        trigger="click"
        title={t('Edit Drill Action Config')}
        css={theme => ({
          '&:hover': {
            cursor: 'pointer',
            backgroundColor: theme.colors.grayscale.light4,
          },
        })}
        content={renderPopover(
          i,
          anno,
        )}
        visible={visiblePopoverIndex === i}
        onVisibleChange={visible => handleVisibleChange(visible, i)}
      >
        <CustomListItem selectable>
          <span>{anno.name}</span>
          <span style={{ float: 'right' }}>{renderInfo(anno)}</span>
        </CustomListItem>
      </ControlPopover>
    ));

    const addLayerPopoverKey = 'add';
    return (
      <div>
        <List bordered css={theme => ({ borderRadius: theme.gridUnit })}>
          {drillactionConfigs}
          <ControlPopover
            trigger="click"
            content={renderPopover(addLayerPopoverKey, addedDrillActionConfig)}
            title={t('Add Drill Action Config')}
            visible={visiblePopoverIndex === addLayerPopoverKey}
            destroyTooltipOnHide
            onVisibleChange={visible =>
              handleVisibleChange(visible, addLayerPopoverKey)
            }
          >
            <CustomListItem selectable>
              <i
                data-test="add-annotation-layer-button"
                className="fa fa-plus"
              />{' '}
              &nbsp; {t('Add Drill Action Config')}
            </CustomListItem>
          </ControlPopover>
        </List>
      </div>
    );
 }


// Tried to hook this up through stores/control.jsx instead of using redux
// directly, could not figure out how to get access to the color_scheme
function mapStateToProps({ charts, explore }: any) {
  return {
    // eslint-disable-next-line camelcase
    colorScheme: explore.controls?.color_scheme?.value,
    vizType: explore.controls.viz_type.value,
  };
}



const themedDrillActionConfigControl = withTheme(DrillActionConfigControl);

export default connect(
  mapStateToProps,
)(themedDrillActionConfigControl);
