import React from 'react';
import { Menu } from 'src/components/Menu';
import Icon from '@ant-design/icons';
import AlSvg from '../../../cccs-grid/images/al.svg';

interface DownloadEmailMenuItemProps {
  label: string;
  data: string;
  onSelection: () => void;
  key?: string;
  disabled?: boolean;
  isContextMenu?: boolean;
  contextMenuY?: number;
}

export default function DownloadEmailMenuItem(
  props: DownloadEmailMenuItemProps,
) {
  const onClick = () => {
    let url = props.data;

    props.onSelection();
  };

  return (
    <Menu.Item
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
