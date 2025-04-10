import { useCallback } from 'react';

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
      {...props}
      icon={<DownloadOutlined />}
      title="Export"
      key="export-submenu"
      {...{ ...props, api: undefined }}
    >
      <Menu.Item
        {...props}
        onClick={() => exportData('csv')}
        className="ant-dropdown-menu-item"
        key="export-csv-submenu-item"
        icon={<FileOutlined />}
      >
        CSV export
      </Menu.Item>
      <Menu.Item
        {...props}
        onClick={() => exportData('excel')}
        className="ant-dropdown-menu-item"
        key="export-excel-submenu-item"
        icon={<FileExcelOutlined />}
      >
        Excel export
      </Menu.Item>
    </Menu.SubMenu>
  );
};

export default ExportMenu;
