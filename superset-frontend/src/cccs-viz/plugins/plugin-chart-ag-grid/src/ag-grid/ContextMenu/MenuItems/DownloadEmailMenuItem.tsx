import { SupersetClient } from '@superset-ui/core';
import React from 'react';
import { Menu } from 'src/components/Menu';
import { useDispatch } from 'react-redux';
import {
  addInfoToast,
  addDangerToast,
} from 'src/components/MessageToasts/actions';
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
  const dispatch = useDispatch();
  const onClick = () => {
    const endpoint = `/api/v1/fission/get-eml?file=${props.data}`;
    const timeout = 180000; // 3 minutes
    dispatch(
      addInfoToast(
        'Download started',),);
    SupersetClient.get({ endpoint, timeout })
      .then(({ json }) => {
        window.open(json.result, '_blank');
        })
      .catch(error => {
        dispatch(
          addDangerToast(
            'Download failed.',
          ),
        );
     });

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
