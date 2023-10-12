import React, { useCallback } from 'react';

import { SupersetTheme, css } from '@superset-ui/core';
import { Menu } from 'src/components/Menu';

import {
  DownloadOutlined,
  FileExcelOutlined,
  FileOutlined,
} from '@ant-design/icons';
import { GridApi, ProcessCellForExportParams } from 'ag-grid-community';

interface ExportMenuProps {
  api: GridApi;
}

// For some reason, the CSS on the submenu doesn't match the rest of the menu.
// So we manually override it
export const subMenuStyles = (theme: SupersetTheme) => css`
  .ant-dropdown-menu-submenu-title {
    padding-right: 40px;
    height: 32px;
    display: flex;
    align-items: center;

    &:hover {
      background-color: initial;
      color: ${theme.colors.primary.base};
    }
  }

  .anticon > svg {
    height: 16px;
    width: 16px;
  }
`;

const ExportMenu: React.FC<ExportMenuProps> = props => {
  const exportData = useCallback(
    (exportType: 'excel' | 'csv') => {
      if (exportType === 'csv') {
        props.api.exportDataAsCsv();
      } else {
        props.api.exportDataAsExcel({
          processCellCallback(params: ProcessCellForExportParams) {
            const { value } = params;
            return params.formatValue(value);
          },
          processRowGroupCallback(params) {
            return `row group: ${params.node.key}`;
          },
        });
      }
    },
    [props.api],
  );

  return (
    <Menu.SubMenu
      icon={<DownloadOutlined />}
      title="Export"
      key="export-submenu"
      {...{ ...props, api: undefined }}
      css={subMenuStyles}
    >
      <Menu.Item
        onClick={() => exportData('csv')}
        className="ant-menu-item"
        key="export-csv-submenu-item"
        icon={<FileOutlined />}
      >
        CSV Export
      </Menu.Item>
      <Menu.Item
        onClick={() => exportData('excel')}
        className="ant-menu-item"
        key="export-excel-submenu-item"
        icon={<FileExcelOutlined />}
      >
        Excel Export
      </Menu.Item>
    </Menu.SubMenu>
  );
};

export default ExportMenu;
