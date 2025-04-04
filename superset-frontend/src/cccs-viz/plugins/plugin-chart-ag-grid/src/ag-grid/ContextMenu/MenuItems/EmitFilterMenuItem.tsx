import { Tooltip } from 'antd';
import { ReactNode } from 'react';
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
  tooltip?: string;
}

export default function EmitFilterMenuItem(props: EmitFilterMenuItemProps) {
  const onClick = () => {
    props.onClick();
    props.onSelection();
  };

  return (
    <Menu.Item
      {...props}
      onClick={() => onClick()}
      className={
        props.disabled
          ? 'ant-dropdown-menu-item ant-dropdown-menu-item-disabled'
          : 'ant-dropdown-menu-item'
      }
      disabled={props.disabled}
      key={props.key}
      icon={props.icon}
    >
      {props.tooltip ? (
        <Tooltip title={props.tooltip}>{props.label}</Tooltip>
      ) : (
        props.label
      )}
    </Menu.Item>
  );
}
