import React, { ReactNode } from 'react';
import { Menu } from 'src/components/Menu';

interface EmitFilterMenuItemProps {
  label: string;
  onClick: () => void;
  onSelection: () => void;
  icon: ReactNode;
  key?: string;
  disabled?: boolean;
  isContextMenu?: boolean;
  contextMenuY?: number;
}

export default function EmitFilterMenuItem(props: EmitFilterMenuItemProps) {
  const onClick = () => {
    props.onClick();
    props.onSelection();
  };

  return (
    <Menu.Item
      onClick={() => onClick()}
      className={
        props.disabled
          ? 'ant-dropdown-menu-item ant-dropdown-menu-item-disabled'
          : 'ant-dropdown-menu-item'
      }
      disabled={props.disabled}
      icon={props.icon}
    >
      {props.label}
    </Menu.Item>
  );
}
