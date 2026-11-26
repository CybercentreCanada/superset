import { useState, useEffect, useMemo } from 'react';
import SelectControl from 'src/explore/components/controls/SelectControl';
import getBootstrapData from 'src/utils/getBootstrapData';
import { Button } from '@superset-ui/core/components';
import { SupersetClient, validateNonEmpty } from '@superset-ui/core';
import { t } from '@apache-superset/core/translation';
import { withTheme } from '@apache-superset/core/theme';
import rison from 'rison';

const bootstrapData = getBootstrapData();

interface Props {
  dashboardID: number;
  filters: any[];
  advancedDataType: string;
  error: string;
  visiblePopoverIndex: number;
  close: () => void;
  addDrillActionConfig: (drillactionConfig: any) => boolean;
  removeDrillActionConfig: () => boolean;
}

const DrillActionConfig: React.FC<Props> = (props: Props) => {
  const { dashboardID, filters, advancedDataType, visiblePopoverIndex } = props;

  const [dashboards, setDashboards] = useState<any[]>([]);
  const [filterList, setFilterList] = useState<any[]>([]);

  const [selection, setSelection] = useState({
    selectedDashboardID: dashboardID,
    selectedFilters: filters?.map((filter: any) => filter.value) || [],
    selectedAdvancedDataType: advancedDataType,
  });

  const { selectedDashboardID, selectedFilters, selectedAdvancedDataType } =
    selection;

  const dashboardList = useMemo(
    () =>
      (dashboards || [])
        .filter(
          (e: any) => JSON.parse(e.json_metadata)?.native_filter_configuration,
        )
        .map((e: any) => ({ value: e.id, label: e.dashboard_title })),
    [dashboards],
  );

  useEffect(() => {
    setSelection({
      selectedFilters: filters?.map((filter: any) => filter.value) || [],
      selectedDashboardID: dashboardID,
      selectedAdvancedDataType: advancedDataType,
    });
  }, [dashboardID, filters, advancedDataType, visiblePopoverIndex]);

  useEffect(() => {
    const endpoint = `/api/v1/jump_to_action/?q=${rison.encode({
      page_size: 1000,
    })}`;
    SupersetClient.get({ endpoint })
      .then(({ json }) => {
        setDashboards(json.result || []);
      })
      .catch(error => console.error(error));
  }, []);

  useEffect(() => {
    if (selectedDashboardID === undefined || selectedDashboardID === null) {
      setFilterList([]);
      return;
    }
    let cancelled = false;
    const endpoint = `/api/v1/dashboard/${selectedDashboardID}`;
    SupersetClient.get({ endpoint })
      .then(({ json }) => {
        if (cancelled) return;
        const metadata = JSON.parse(json.result.json_metadata);
        setFilterList(
          metadata?.native_filter_configuration?.map((e: any) => ({
            value: e.id,
            label: e.name,
            column: e?.targets[0].column?.name || '',
          })) ?? [],
        );
      })
      .catch(error => console.error(error));
    return () => {
      cancelled = true;
    };
  }, [selectedDashboardID]);

  const isValidForm = () => {
    const errors = [
      validateNonEmpty(selectedDashboardID),
      validateNonEmpty(selectedFilters),
      validateNonEmpty(selectedAdvancedDataType),
    ];
    return !errors.filter(x => x).length;
  };
  const applyDrillActionConfig = () => {
    if (isValidForm()) {
      const element: any = (dashboardList || []).find(
        (e: any) => e.value === selectedDashboardID,
      );
      const advancedDataTypeNameLabel =
        bootstrapData?.common?.advanced_data_types.find(
          (e: { id: string }) => e.id === selectedAdvancedDataType,
        )?.verbose_name || selectedAdvancedDataType;
      const selectedFiltersWithColumn = filterList.filter((filter: any) =>
        selectedFilters.includes(filter.value),
      );
      const name = `${element?.label} | ${advancedDataTypeNameLabel}`;
      const newDrillActionConfig = {
        dashboardID: selectedDashboardID,
        filters: selectedFiltersWithColumn,
        dashBoardName: element?.label || '',
        advancedDataType: selectedAdvancedDataType,
        name,
      };
      props.addDrillActionConfig(newDrillActionConfig);
      props.close();
    }
  };

  const onDashboardChange = (v: any) => {
    setSelection(prev => ({
      ...prev,
      selectedDashboardID: v,
      selectedFilters: [],
    }));
  };
  return (
    <div style={{ width: 400 }}>
      <div style={{ paddingBottom: 25 }}>
        <SelectControl
          ariaLabel={t('Annotation layer value')}
          name="annotation-layer-value"
          label={t('Dashboard')}
          showHeader
          hovered
          placeholder=""
          options={dashboardList}
          value={selectedDashboardID}
          onChange={onDashboardChange}
        />
        <SelectControl
          ariaLabel="Advanced Data Type"
          name="advanced-data-type-value"
          label="Advanced Data Type"
          showHeader
          hovered
          freeForm
          placeholder=""
          options={bootstrapData?.common?.advanced_data_types.map(
            (v: { id: any; verbose_name: any }) => ({
              value: v.id,
              label: v.verbose_name,
            }),
          )}
          value={selectedAdvancedDataType}
          onChange={(value: any) =>
            setSelection(prev => ({ ...prev, selectedAdvancedDataType: value }))
          }
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
          onChange={(value: any) =>
            setSelection(prev => ({ ...prev, selectedFilters: value }))
          }
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button buttonSize="small" onClick={() => props.close()}>
          {t('Cancel')}
        </Button>
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
    </div>
  );
};
export default withTheme(DrillActionConfig);
