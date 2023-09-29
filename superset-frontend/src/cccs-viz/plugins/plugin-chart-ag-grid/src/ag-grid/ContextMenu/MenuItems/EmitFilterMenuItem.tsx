import { Menu } from 'src/components/Menu';
import React, { ReactNode } from 'react';

interface EmitFilterMenuItemProps {
  label: string;
  onClick: () => void;
  onSelection: () => void;
  icon: ReactNode;
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
      onItemHover={() => {}}
      onClick={() => onClick()}
      key="drill-detail-no-filters"
      className={
        props.disabled
          ? 'ant-dropdown-menu-item ant-dropdown-menu-item-disabled'
          : 'ant-dropdown-menu-item'
      }
      disabled={props.disabled}
      icon={[props.icon]}
    >
      {props.label}
    </Menu.Item>
  );
}
