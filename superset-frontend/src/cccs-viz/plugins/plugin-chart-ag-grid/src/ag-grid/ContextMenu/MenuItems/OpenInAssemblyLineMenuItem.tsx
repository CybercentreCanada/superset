import React from 'react';
import { Menu } from 'src/components/Menu';
import AssemblyLineIcon from 'src/cccs-viz/plugins/components/AssemblyLineIcon';

interface OpenInAssemblyLineMenuItemProps {
  label: string;
  data: string[];
  base_url: string;
  onSelection: () => void;
  key?: string;
  disabled?: boolean;
  isContextMenu?: boolean;
  contextMenuY?: number;
}

export default function OpenInAssemblyLineMenuItem(
  props: OpenInAssemblyLineMenuItemProps,
) {
  const onClick = () => {
    let url = `https://${props.base_url}/search/submission?query=`;
    url += props.data.join('+');
    window.open(url);
    props.onSelection();
  };

  return (
    <Menu.Item
      {...props}
      onClick={onClick}
      className={
        props.disabled
          ? 'ant-dropdown-menu-item ant-dropdown-menu-item-disabled'
          : 'ant-dropdown-menu-item'
      }
      disabled={props.disabled}
      icon={<AssemblyLineIcon />}
    >
      {props.label}
    </Menu.Item>
  );
}
