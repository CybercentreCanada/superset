
import React, {
    forwardRef,
    RefObject,
    useCallback,
    useImperativeHandle,
    useState,
  } from 'react';
  import ReactDOM from 'react-dom';
  import { useSelector } from 'react-redux';
  import {
    BinaryQueryObjectFilterClause,
    FeatureFlag,
    isFeatureEnabled,
    QueryFormData,
  } from '@superset-ui/core';
  import { RootState } from 'src/dashboard/types';
  import { findPermission } from 'src/utils/findPermission';
  import { Menu } from 'src/components/Menu';
  import { AntdDropdown as Dropdown } from 'src/components';
  import { getMenuAdjustedY } from 'src/components/Chart/utils';

  export interface ChartContextMenuProps {
    id: number;
    formData: QueryFormData;
    onSelection: () => void;
    onClose: () => void;
  }
  
  export interface Ref {
    open: (
      clientX: number,
      clientY: number,
      filters?: BinaryQueryObjectFilterClause[],
      extraContextMenuItems?: any[],
    ) => void;
  }
  
  const ChartContextMenu = (
    { id, formData, onSelection, onClose }: ChartContextMenuProps,
    ref: RefObject<Ref>,
  ) => {
    const canExplore = useSelector((state: RootState) =>
      findPermission('can_explore', 'Superset', state.user?.roles),
    );
  
    const [{ clientX, clientY, extraContextMenuItems }, setState] = useState<{
      clientX: number;
      clientY: number;
      filters?: BinaryQueryObjectFilterClause[];
      extraContextMenuItems?: any[];

    }>({ clientX: 0, clientY: 0 });
  
    const menuItems: any = [];
    const showDrillToDetail =
      isFeatureEnabled(FeatureFlag.DRILL_TO_DETAIL) && canExplore;
  
    const open = useCallback(
      (
        clientX: number,
        clientY: number,
        filters?: BinaryQueryObjectFilterClause[],
        extraContextMenuItems?: any[],
      ) => {
        const itemsCount =
          [
            showDrillToDetail ? 2 : 0, // Drill to detail always has 2 top-level menu items
          ].reduce((a, b) => a + b, 0) || 1; // "No actions" appears if no actions in menu
  
        const adjustedY = getMenuAdjustedY(clientY, itemsCount);
        setState({
          clientX,
          clientY: adjustedY,
          filters,
          extraContextMenuItems,
        });
  
        // Since Ant Design's Dropdown does not offer an imperative API
        // and we can't attach event triggers to charts SVG elements, we
        // use a hidden span that gets clicked on when receiving click events
        // from the charts.
        document.getElementById(`hidden-span-${id}`)?.click();
      },
      [id, showDrillToDetail],
    );
  
    useImperativeHandle(
      ref,
      () => ({
        open,
      }),
      [open],
    );
  
    return ReactDOM.createPortal(
      <Dropdown
        overlay={
          <Menu>
            {(menuItems.length || (extraContextMenuItems || []).length )  ? (
              [...menuItems,...(extraContextMenuItems || [])]
            ) : (
              <Menu.Item disabled>No actions</Menu.Item>
            )}
          </Menu>
        }
        trigger={['click']}
        onVisibleChange={value => !value && onClose()}
      >
        <span
          id={`hidden-span-${id}`}
          css={{
            visibility: 'hidden',
            position: 'fixed',
            top: clientY,
            left: clientX,
            width: 1,
            height: 1,
          }}
        />
      </Dropdown>,
      document.body,
    );
  };

  export default forwardRef(ChartContextMenu);