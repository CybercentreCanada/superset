import React, { useState, useCallback, useEffect } from "react";
import SelectControl from 'src/explore/components/controls/SelectControl';
import TextControl from 'src/explore/components/controls/TextControl';
import PopoverSection from 'src/components/PopoverSection';
import { StartEditingCellParams } from "@ag-grid-enterprise/all-modules";
import Button from 'src/components/Button';
import {
    t,
    SupersetClient,
    getCategoricalSchemeRegistry,
    getChartMetadataRegistry,
    validateNonEmpty,
    isValidExpression,
    styled,
    withTheme,
  } from '@superset-ui/core';


  

interface Props {
    dashboardID: number;
    filterIDs: string[];
    advancedDataTypeName: string;
    error: string;
    
    close: () => void;
    addDrillActionConfig: (drillactionConfig: any) => boolean;
    removeDrillActionConfig: () => boolean
}
const useDashboardState = () => {

    const [dashboardList, setDashboardList] = useState();
    
    const [filterList, setFilterList] = useState(); 

    const fetchDashboardList = useCallback(() => {
        const endpoint = `/api/v1/dashboard`;
        SupersetClient.get({ endpoint }).then(
            ({json}) => {
                console.log(json)
                const dashboards = json.result.filter( (e: any) => {          
                    return JSON.parse((e.json_metadata))?.native_filter_configuration
                })
                .map( (e: any) => {
                    return {value: e.id, label: e.dashboard_title }
                })
                setDashboardList(dashboards)
            }
        ).catch(error => {});
    }, [])

    const fetchFilterList = (dashboardId: number) => {
        const endpoint = `/api/v1/dashboard/${dashboardId}`;
        if(dashboardId < 0 )
            return
        SupersetClient.get({ endpoint }).then(
            ({json}) => {
                const metadata = JSON.parse((json.result.json_metadata))

                setFilterList(metadata?.native_filter_configuration.map( (e: any) => {
                    return {value: e.id, label: e.name }
                }))

            }
        ).catch(error => {});
    }

    return {
        dashboardList,
        filterList,
        fetchDashboardList,
        fetchFilterList,
    }
}

const DrillActionConfig: React.FC<Props> = (props : Props) => {
    const {dashboardID, filterIDs, } =  props

    const {dashboardList, filterList, fetchDashboardList, fetchFilterList} = useDashboardState()
    
    const [selectedDashboardID, setSelectedDashboardID] = useState<number>(dashboardID)
    
    const [selectedFilters, setSelectedFilters] = useState(filterIDs)

    const [state, setState] = useState({
        advancedDataTypeName: props.advancedDataTypeName,
        isNew: !props.dashboardID,
    })
    
    useEffect(() => {
        fetchDashboardList()
    },[fetchDashboardList] )

    useEffect(() => {
        fetchFilterList(selectedDashboardID)
    }, [fetchFilterList, selectedDashboardID])
    
    
    const {advancedDataTypeName, isNew } = state
    
    const isValidForm = () => {
        const {
          advancedDataTypeName,
        } = state;
        const errors = [
          validateNonEmpty(selectedDashboardID),
          validateNonEmpty(selectedFilters),
          validateNonEmpty(advancedDataTypeName),
        ];
        return !errors.filter(x => x).length;
      }
    const applyDrillActionConfig = () => {

        if (isValidForm()) {
            const element: any = (dashboardList || []).find(
                (e: any) => e.value === selectedDashboardID
            )
            const name = `${ element?.label } | ${ advancedDataTypeName }`
            const newDrillActionConfig = {
                dashboardID: selectedDashboardID,
                filterIDs: selectedFilters,
                advancedDataTypeName: state["advancedDataTypeName"],
                name
            }
            props.addDrillActionConfig(newDrillActionConfig)
            setState({...state, isNew: false})
            props.close()
        }
    }

    const deleteDrillActionConfig = () => {
        props.removeDrillActionConfig();
        props.close();
    }
    
    return(
        <>
        <div style={{ marginRight: '2rem' }}>
            <PopoverSection
            isSelected
            title={'Configure'}
            info={'Configure the basics of your Drill action.'}
            >
                <SelectControl
                    ariaLabel={t('Annotation layer value')}
                    name="annotation-layer-value"
                    label={t('DashBoard')}
                    showHeader
                    hovered
                    placeholder=""
                    options={dashboardList}
                    value={selectedDashboardID}
                    onChange={setSelectedDashboardID}
                />
                <SelectControl
                    ariaLabel={t('Annotation layer value')}
                    name="annotation-layer-value"
                    label={t('Filters')}
                    showHeader
                    hovered
                    multi
                    placeholder=""
                    options={filterList}
                    value={selectedFilters}
                    onChange={setSelectedFilters}
                />
                <TextControl
                    label={'Advanced Data Type Name'}
                    placeholder=""
                    value={advancedDataTypeName}
                    onChange={(v, e) => { setState({...state, advancedDataTypeName: v }); return {} }}
                />
            </PopoverSection>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            {isNew ? (
            <Button buttonSize="small" onClick={() => props.close()}>
                {t('Cancel')}
            </Button>
            ) : (
            <Button buttonSize="small" onClick={deleteDrillActionConfig}>
                {t('Remove')}
            </Button>
            )}
            <div>

                <Button
                    buttonSize="small"
                    buttonStyle="primary"
                    disabled={!isValidForm()}
                    onClick={applyDrillActionConfig}
                >
                    {t('OK')}
                </Button>
            </div>
        </div>
        </>
    );

}
export default withTheme(DrillActionConfig);