import { SupersetClient } from '@superset-ui/core';
import React from 'react';
import { saveAs } from 'file-saver';
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

export default function DownloadEmailMenuItem(props: DownloadEmailMenuItemProps) {
  const dispatch = useDispatch();
  const onClick = () => {
    const endpoint = `/api/v1/fission/get-eml?file=${props.data}`;
    const timeout = 180000; // 3 minutes
    dispatch(addInfoToast('Download started'));

    SupersetClient.get({ endpoint, timeout })
      .then(({ json }) => {
        let blob;
        let fileName = 'download'; // Default file name base

        if (json.content && json.content.startsWith('data:')) {
          const contentParts = json.content.split(',');
          const contentType = contentParts[0].split(':')[1].split(';')[0];
          const b64Data = contentParts[1];
          const byteCharacters = atob(b64Data);
          const byteArrays = [];

          for (let offset = 0; offset < byteCharacters.length; offset += 512) {
            const slice = byteCharacters.slice(offset, offset + 512);
            const byteNumbers = new Array(slice.length);
            for (let i = 0; i < slice.length; i++) {
              byteNumbers[i] = slice.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            byteArrays.push(byteArray);
          }

          blob = new Blob(byteArrays, { type: contentType });
          
          // Attempt to determine a more specific extension, default to '.bin' for 'application/octet-stream'
          const extension = contentType === 'application/octet-stream' ? 'bin' : contentType.split('/')[1].split(';')[0];
          fileName += `.${extension}`;
        } else {
          // For text-based content types, directly create a blob from the JSON response
          blob = new Blob([JSON.stringify(json)], { type: 'application/json' });
          fileName += '.json';
        }

        saveAs(blob, fileName); // Uses FileSaver to save the blob with the determined file name
      })
      .catch(error => {
        dispatch(addDangerToast('Download failed.'));
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