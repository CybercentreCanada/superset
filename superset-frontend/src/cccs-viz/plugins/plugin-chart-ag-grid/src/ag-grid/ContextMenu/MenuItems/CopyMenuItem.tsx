import React, { useCallback } from 'react';

import { Menu } from 'src/components/Menu';

import { CopyFilled } from '@ant-design/icons';

interface CopyMenuItemProps {
  selectedData: { [key: string]: string[] };
  onSelection: () => void;
  isContextMenu?: boolean;
  contextMenuY?: number;
}

export default function CopyMenuItem(props: CopyMenuItemProps) {
  const copyText = useCallback(() => {
    let copiedItem = '';
    Object.entries(props.selectedData).forEach(([key, value]) => {
      copiedItem = copiedItem
        ? `${copiedItem},${value.toString()}`
        : `${value.toString()}`;

      navigator.clipboard.writeText(copiedItem);
      props.onSelection();
    });
  }, [props.selectedData]);

  return (
    <Menu.Item
      onItemHover={() => {}}
      onClick={() => copyText()}
      key="drill-detail-no-filters"
      className="ant-menu-item"
      icon={<CopyFilled />}
    >
      Copy
    </Menu.Item>
  );
}
