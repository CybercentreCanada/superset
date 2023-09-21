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
  const { onSelection, selectedData } = props;

  const copyText = useCallback(() => {
    let copiedItem = '';
    Object.values(selectedData).forEach(value => {
      copiedItem = copiedItem
        ? `${copiedItem},${value.toString()}`
        : `${value.toString()}`;

      navigator.clipboard.writeText(copiedItem);
      onSelection();
    });
  }, [onSelection, selectedData]);

  return (
    <Menu.Item
      onItemHover={() => {}}
      onClick={() => copyText()}
      className="ant-menu-item"
      icon={<CopyFilled />}
    >
      Copy
    </Menu.Item>
  );
}
