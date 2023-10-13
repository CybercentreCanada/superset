import { SupersetClient } from '@superset-ui/core';
import React from 'react';
import { Menu } from 'src/components/Menu';
import { useDispatch } from 'react-redux';
import {
  addInfoToast,
  addDangerToast,
} from 'src/components/MessageToasts/actions';
import { RiseOutlined } from '@ant-design/icons';

interface RetainEmlMenuItemProps {
  label: string;
  data: string[];
  onSelection: () => void;
  key?: string;
  disabled?: boolean;
  isContextMenu?: boolean;
  contextMenuY?: number;
}

export default function RetainEmlMenuItem(props: RetainEmlMenuItemProps) {
  const dispatch = useDispatch();

  const onClick = () => {
    const endpoint = `/api/v1/fission/retain-eml-record?cbs_email_ids=${props.data}`;
    dispatch(
      addInfoToast(
        'Retention started. A new tab will open upon successful retention',
      ),
    );
    SupersetClient.get({ endpoint })
      .then(({ json }) => {
        window.open(json.result, '_blank');
      })
      .catch(error => {
        dispatch(
          addDangerToast(
            'Retention Failed. The records you attempted to retain we not retained.',
          ),
        );
      });

    props.onSelection();
  };

  return (
    <Menu.Item
      onItemHover={() => {}}
      onClick={() => onClick()}
      className={
        props.disabled
          ? 'ant-menu-item ant-dropdown-menu-item-disabled'
          : 'ant-menu-item'
      }
      disabled={props.disabled}
      icon={<RiseOutlined />}
    >
      {props.label}
    </Menu.Item>
  );
}
