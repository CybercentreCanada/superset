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
import EmailSvg from '../../../cccs-grid/images/email.svg';

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
          // Check for base64 encoding
          if (contentParts[0].indexOf('base64') !== -1) {
            const b64Data = contentParts[1];
            const contentType = 'application/octet-stream'; // MIME type for generic binary data
            const blob = b64ToBlob(b64Data, contentType);

            // Assume the unique title is available in json.result.title
            const uniqueTitle = json.result.title || 'default_download';
            const fileName = `${uniqueTitle}.cart`; // Use the unique title for the filename

            saveAs(blob, fileName); // Uses FileSaver to save the blob with the unique title as filename
          } else {
            dispatch(addDangerToast('Invalid file format.'));
          }
        } else {
          dispatch(addDangerToast('No content to download.'));
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
      // Ensure you have the correct icon component or replace it accordingly
      icon={<Icon component={EmailSvg} />}
    >
      {props.label}
    </Menu.Item>
  );
}

// The helper function to convert base64 data to a Blob remains unchanged
function b64ToBlob(b64Data: string, contentType = '', sliceSize = 512) {
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

  const blob = new Blob(byteArrays, { type: contentType });
  return blob;
}