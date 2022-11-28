import React, { useState, useCallback, useEffect } from "react";
import SelectControl from 'src/explore/components/controls/SelectControl';
import { bootstrapData } from 'src/preamble';
import PopoverSection from 'src/components/PopoverSection';
import Button from 'src/components/Button';
import {
    t,
    SupersetClient,
    validateNonEmpty,
    withTheme,
  } from '@superset-ui/core';


  

interface Props {
    dashboardID: number;
    filters: any[];
    advancedDataType: string;
    error: string;
    
    close: () => void;
    addDrillActionConfig: (drillactionConfig: any) => boolean;
    removeDrillActionConfig: () => boolean
}
const useDashboardState = () => {

    const [dashboardList, setDashboardList] = useState([]);
    
    const [filterList, setFilterList] = useState([]); 

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

    const fetchFilterList =  useCallback((dashboardId: number) => {
        const endpoint = `/api/v1/dashboard/${dashboardId}`;
        if(dashboardId < 0 )
            return
        SupersetClient.get({ endpoint }).then(
            ({json}) => {
                const metadata = JSON.parse((json.result.json_metadata))

                setFilterList(metadata?.native_filter_configuration.map( (e: any) => {
                    console.log(e);
                    return {value: e.id, label: e.name, column: e?.targets[0].column?.name || "" }
                }))

            }
        ).catch(error => {});
    }, [])

    return {
        dashboardList,
        filterList,
        fetchDashboardList,
        fetchFilterList,
    }
}

const DrillActionConfig: React.FC<Props> = (props : Props) => {
    const {dashboardID, filters, advancedDataType } =  props

    const {dashboardList, filterList, fetchDashboardList, fetchFilterList} = useDashboardState()
    
    const [selectedDashboardID, setSelectedDashboardID] = useState<number>(dashboardID)
    
    const [selectedFilters, setSelectedFilters] = useState(filters?.map( (filter: any) => filter.value) || [])


    const [advancedDataTypeName, setAdvancedDataTypeName] = useState<string>(advancedDataType)

    const [state, setState] = useState({
        isNew: !props.dashboardID,
    })
    
    useEffect(() => {
        fetchDashboardList()
    },[fetchDashboardList] )

    useEffect(() => {
        fetchFilterList(selectedDashboardID)
    }, [fetchFilterList, selectedDashboardID])
    
    
    const { isNew } = state
    
    const isValidForm = () => {
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
            const selectedFiltersWithColumn = filterList.filter( (filter: any) => selectedFilters.includes(filter.value) )
            const name = `${ element?.label } | ${ advancedDataTypeName }`
            const newDrillActionConfig = {
                dashboardID: selectedDashboardID,
                filters: selectedFiltersWithColumn,
                dashBoardName: element?.label || "",
                advancedDataType: advancedDataTypeName,
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
                    ariaLabel={'Advanced Data Type Name'}
                    name="advanced-data-type-value"
                    label={'Advanced Data Type Name'}
                    showHeader
                    hovered
                    freeForm
                    placeholder=""
                    options={ bootstrapData?.common?.advanced_data_types.map(
                        ( v: { id: any; verbose_name: any; }) => ({
                          value: v.id,
                          label: v.verbose_name,
                        }))}
                    value={advancedDataTypeName}
                    onChange={setAdvancedDataTypeName}
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