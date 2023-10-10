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
      onItemHover={() => {}}
      onClick={props.onClick}
      key="drill-detail-no-filters"
      className="ant-dropdown-menu-item"
      icon={<CopyFilled />}
    >
      Copy With Headers
    </Menu.Item>
  );
}
