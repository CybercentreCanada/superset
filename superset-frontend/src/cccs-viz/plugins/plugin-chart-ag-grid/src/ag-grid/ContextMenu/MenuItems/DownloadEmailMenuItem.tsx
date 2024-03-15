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
        if (json.result && json.result.content) {
          const contentParts = json.result.content.split(',');
          if (contentParts[0].indexOf('base64') !== -1) {
            const b64Data = contentParts[1];
            const contentType = 'message/rfc822'; // MIME type for .eml files
            const blob = b64ToBlob(b64Data, contentType);
            const fileName = 'email.eml';

            saveAs(blob, fileName); // Uses FileSaver to save the blob as an .eml file
          }
        }
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

// Helper function to convert base64 data to a Blob
function b64ToBlob(b64Data: string, contentType='', sliceSize=512) {
  const byteCharacters = atob(b64Data);
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);

    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  const blob = new Blob(byteArrays, {type: contentType});
  return blob;
}
