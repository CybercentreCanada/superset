import React from 'react';

import { Menu } from 'src/components/Menu';
import { CopyFilled } from '@ant-design/icons';

interface CopyMenuItemProps {
  onClick: () => void;
  isContextMenu?: boolean;
  contextMenuY?: number;
}

export default function CopyMenuItem(props: CopyMenuItemProps) {
  return (
    <Menu.Item
      {...props}
      onClick={props.onClick}
      key="copy-with-headers-menu-item"
      className="ant-dropdown-menu-item"
      icon={<CopyFilled />}
    >
      Copy With Headers
    </Menu.Item>
  );
}
