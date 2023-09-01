import { Menu } from 'src/components/Menu';
import { useCallback } from 'react';

import { ExpandAltOutlined } from '@ant-design/icons';

interface DownloadEMLFilterMenuItemProps {
  label: string;
  selectedData: { [key: string]: string[] };
  disabled?: boolean;
  isContextMenu?: boolean;
  contextMenuY?: number;
  onSelection?: () => void;
}

export default function DownloadEMLFilterMenuItem(
  props: DownloadEMLFilterMenuItemProps,
) {
  const downloadEMLFile = useCallback(async () => {
    if (props.selectedData.eml_path) {
      const emlPath = props.selectedData.eml_path;
      const fissionUrl = `https://fission.hogwarts.pb.azure.chimera.cyber.gc.ca/get-eml?file=${emlPath}`;

      window.open(fissionUrl);
    }
  }, [props.selectedData]);

  return (
    <Menu.Item
      onItemHover={() => {}}
      onClick={() => downloadEMLFile()}
      key="download-eml-file"
      className={
        props.disabled
          ? 'ant-menu-item ant-dropdown-menu-item-disabled'
          : 'ant-menu-item'
      }
      disabled={props.disabled}
      icon={<ExpandAltOutlined />}
    >
      {props.label}
    </Menu.Item>
  );
}
