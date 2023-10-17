import React from 'react';

import { FundOutlined } from '@ant-design/icons';
import rison from 'rison';
import { Menu } from 'src/components/Menu';
import { subMenuStyles } from '../ContextMenu/MenuItems/ExportMenu';

const generateNativeFilterUrlString = (
  nativefilterID: string,
  urlSelectedData: any[],
  column = '',
) => {
  const stringSelectedData = urlSelectedData.map(e => `${e.toString()}`);
  const nativeFilter = {
    __cache: {
      label: stringSelectedData,
      validateStatus: false,
      value: stringSelectedData,
    },
    extraFormData: {
      filters: [{ col: column, op: 'IN', val: stringSelectedData }],
    },
    filterState: {
      label: stringSelectedData,
      validateStatus: false,
      value: stringSelectedData,
    },
    id: nativefilterID,
    ownState: {},
  };
  return nativeFilter;
};

export const getJumpToDashboardContextMenuItems = (
  jumpActionConfigs: any[],
  selectedData: { [key: string]: string[] },
  disableOveride?: boolean,
) => {
  const sub_menu: any = [];
  jumpActionConfigs.forEach(advancedDataTypeNativeFilters => {
    const nativeFilterUrls: any = {};
    const jumpActionName = advancedDataTypeNativeFilters.name;
    const { advancedDataType } = advancedDataTypeNativeFilters;
    const { filters } = advancedDataTypeNativeFilters;
    const selectedDataForUrl = selectedData[advancedDataType];

    if (selectedDataForUrl && filters) {
      filters.forEach(
        (filter: { value: string; column: string | undefined }) => {
          nativeFilterUrls[filter.value] = generateNativeFilterUrlString(
            filter.value,
            selectedDataForUrl,
            filter.column,
          );
        },
      );
    }

    if (Object.keys(nativeFilterUrls).length !== 0) {
      const action = () => {
        const baseUrl = `${location.protocol}//${location.host}`;
        const url = `${baseUrl}/superset/dashboard/${
          advancedDataTypeNativeFilters.dashboardID
        }/?native_filters=${rison.encode(nativeFilterUrls)}`;
        window.open(url, '_blank');
      };

      const DashboardMenuItem = (
        <Menu.Item onClick={action} className="ant-dropdown-menu-item">
          {jumpActionName}
        </Menu.Item>
      );

      sub_menu.push(DashboardMenuItem);
    }
  });

  const menu = (
    <Menu.SubMenu
      icon={<FundOutlined />}
      title="Jump To Dashboard"
      css={subMenuStyles}
      disabled={disableOveride}
      className={
        disableOveride
          ? 'ant-dropdown-menu-item-disabled'
          : 'ant-dropdown-menu-item'
      }
    >
      {sub_menu}
    </Menu.SubMenu>
  );
  return menu;
};
