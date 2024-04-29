import React from 'react';
import { Menu } from 'src/components/Menu';
import Icon from '@ant-design/icons';
import AlSvg from '../../../cccs-grid/images/al.svg';

interface SubmitToAssemblyLineMenuItemProps {
  label: string;
  data: string;
  onSelection: () => void;
  key?: string;
  disabled?: boolean;
  isContextMenu?: boolean;
  contextMenuY?: number;
}

export default function SubmitToAssemblyLineMenuItem(
  props: SubmitToAssemblyLineMenuItemProps,
) {
  const onClick = () => {
    let url = `https://malware-stg.cyber.gc.ca/submit?input=${props.data}&classification=TLP:CLEAR`;
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
      icon={<Icon component={AlSvg} />}
    >
      {props.label}
    </Menu.Item>
  );
}
