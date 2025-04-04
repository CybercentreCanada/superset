import React from 'react';
import { Menu } from 'src/components/Menu';

import { Tooltip } from 'antd';
import AssemblyLineIcon from 'src/cccs-viz/plugins/components/AssemblyLineIcon';

interface SubmitToAssemblyLineMenuItemProps {
  label: string;
  data: string[];
  onSelection: () => void;
  key?: string;
  base_url: string;
  disabled?: boolean;
  isContextMenu?: boolean;
  contextMenuY?: number;
  tooltip?: string;
}

export default function SubmitToAssemblyLineMenuItem(
  props: SubmitToAssemblyLineMenuItemProps,
) {
  // Handler for clicking on the item
  const onClick = () => {
    // Loop through each item in the data array and open a new window for each URL
    // Using encodeURIComponent to prevents URL injection issues and ensures that special characters in the data strings are correctly interpreted by the URL
    props.data.forEach(eml_path => {
      const url = `https://${props.base_url}/submit?input=${encodeURIComponent(
        eml_path,
      )}`;
      window.open(url, '_blank'); // '_blank' to open in a new tab/window
    });
    props.onSelection(); // Call the onSelection callback after opening all windows
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
      icon={<AssemblyLineIcon disabled={props.disabled} />}
    >
      {props.tooltip ? (
        <Tooltip title={props.tooltip}>{props.label}</Tooltip>
      ) : (
        props.label
      )}
    </Menu.Item>
  );
}
