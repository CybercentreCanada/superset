import React from 'react';
import { Menu } from 'src/components/Menu';
import Icon from '@ant-design/icons';
import AlSvg from '../../../cccs-grid/images/al.svg';

interface OpenInAssemblyLineMenuItemProps {
  label: string;
  data: string[];
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
    let url = 'https://malware-pb.cyber.gc.ca/search/submission?query=';
    url += props.data.join('+');
    window.open(url);
    props.onSelection();
  };

  return (
    <Menu.Item
      onClick={onClick}
      className={
        props.disabled
          ? 'ant-menu-item ant-dropdown-menu-item-disabled'
          : 'ant-menu-item'
      }
      disabled={props.disabled}
      icon={<Icon component={AlSvg} />}
    >
      {props.label}
    </Menu.Item>
  );
}
