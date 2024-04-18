import { SupersetClient } from '@superset-ui/core';
import React from 'react';
import { Menu } from 'src/components/Menu';
import { useDispatch } from 'react-redux';
import {
  addInfoToast,
  addDangerToast,
} from 'src/components/MessageToasts/actions';
import Icon from '@ant-design/icons';
import EmailSvg from '../../../cccs-grid/images/email.svg';

interface SubmitToAssemblyLineMenuItemProps {
    label: string;
    data: string;
    onSelection: () => void;
    key?: string;
    disabled?: boolean;
    isContextMenu?: boolean;
    contextMenuY?: number;
  }

  export default function SubmitToAssemblyLineMenuItem(props: SubmitToAssemblyLineMenuItemProps) {
    const dispatch = useDispatch();

    const fetchDataAndDisplayJson = async () => {
      const endpoint = `/api/v1/fission/submitassemblyline?file=${props.data}`;
      try {
        dispatch(addInfoToast('Submission started'));
        const response = await SupersetClient.get({ endpoint, timeout: 180000 }); // 3 minutes
        const json = response.json;

        // Ensure there's JSON data to display
        if (json) {
          const jsonBlob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
          const jsonDataUrl = window.URL.createObjectURL(jsonBlob);
          window.open(jsonDataUrl, '_blank');
        } else {
          dispatch(addDangerToast('No content to display.'));
        }
      } catch (error) {
        // Log the error or send it to a monitoring service
        console.error('Failed to submit to AssemblyLine due to: ', error);
        dispatch(addDangerToast('Failed to submit to AssemblyLine.'));
      }
    };

    const onClick = () => {
      fetchDataAndDisplayJson();
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
        icon={<Icon component={EmailSvg} />}
      >
        {props.label}
      </Menu.Item>
    );
  }