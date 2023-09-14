import { Menu } from 'src/components/Menu';

import React, { useCallback } from 'react';
import { CopyFilled } from '@ant-design/icons';

interface CopyMenuItemProps {
  selectedData: { [key: string]: string[] };
  onSelection: () => void;
  isContextMenu?: boolean;
  contextMenuY?: number;
}

export default function CopyMenuItem(props: CopyMenuItemProps) {
  const copyText = useCallback(() => {
    navigator.clipboard.writeText(JSON.stringify(props.selectedData));

    props.onSelection();
  }, [props.selectedData]);
  return (
    <Menu.Item
      onItemHover={() => {}}
      onClick={() => copyText()}
      key="drill-detail-no-filters"
      className="ant-menu-item"
      icon={<CopyFilled />}
    >
      Copy With Header
    </Menu.Item>
  );
}
