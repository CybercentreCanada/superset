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
    dispatch(addInfoToast('Download started'));

    SupersetClient.get({ endpoint, timeout: 180000 }) // 3 minutes
      .then(({ json }) => {
        if (json.result && json.result.content) {
          // Check for base64 encoding
          if (json.result.content.indexOf('base64') !== -1) {
            const b64Data = json.result.content.split(',')[1];
            const contentType = 'message/rfc822'; // Correct MIME type for EML files

            // Convert base64 data to a blob with the appropriate MIME type
            const blob = b64ToBlob(b64Data, contentType);

            // Derive file name from the title or use a default name, ensuring it ends with .eml
            const uniqueTitle = json.result.title ? `${json.result.title}.eml` : 'default_download.eml';

            // Use FileSaver or a similar library to trigger the file download
            saveAs(blob, uniqueTitle);
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
      icon={<Icon component={EmailSvg} />}
    >
      {props.label}
    </Menu.Item>
  );
}

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