import { SupersetClient } from '@superset-ui/core';
import { saveAs } from 'file-saver';
import { Menu } from 'src/components/Menu';
import { useDispatch } from 'react-redux';
import {
  addInfoToast,
  addDangerToast,
} from 'src/components/MessageToasts/actions';
import EmailIcon from 'src/cccs-viz/plugins/components/EmailIcon';
import { Tooltip } from 'antd';

const QUERY_TIMEOUT_LIMIT = 180000; // 3 minutes

interface DownloadEmailMenuItemProps {
  label: string;
  data: string[];
  onSelection: () => void;
  key?: string;
  disabled?: boolean;
  isContextMenu?: boolean;
  contextMenuY?: number;
  tooltip?: string;
}

export default function DownloadEmailMenuItem(
  props: DownloadEmailMenuItemProps,
) {
  const dispatch = useDispatch();

  const onClick = () => {
    props.data.forEach(fileName => {
      const endpoint = `/api/v1/fission/get-eml?file=${fileName}`;
      dispatch(addInfoToast('Download started'));

      SupersetClient.get({ endpoint, timeout: QUERY_TIMEOUT_LIMIT })
        .then(({ json }) => {
          if (json.result?.content?.indexOf('base64') !== -1) {
            // Check for base64 encoding
            const b64Data = json.result.content.split(',')[1];
            const contentType = 'message/rfc822'; // Correct MIME type for EML files

            // Convert base64 data to a blob with the appropriate MIME type
            const blob = b64ToBlob(b64Data, contentType);

            // Derive file name from the title or use a default name, ensuring it ends with .eml
            const uniqueTitle = json.result.title
              ? `${json.result.title}.eml`
              : `${fileName}.eml`;

            // Use FileSaver or a similar library to trigger the file download
            saveAs(blob, uniqueTitle);
          } else if (json.result?.content) {
            dispatch(addDangerToast('Invalid file format.'));
          } else if (json.result?.Error) {
            dispatch(addDangerToast(`Download failed. ${json.result.Error}`));
          } else {
            dispatch(addDangerToast('No content to download.'));
          }
        })
        .catch(_error => {
          dispatch(
            addDangerToast(
              `Download failed for ${fileName}: EML file could not be found.`,
            ),
          );
        });
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
      icon={<EmailIcon disabled={props.disabled} />}
    >
      {props.tooltip ? (
        <Tooltip title={props.tooltip}>{props.label}</Tooltip>
      ) : (
        props.label
      )}
    </Menu.Item>
  );
}

function b64ToBlob(b64Data: string, contentType = '', sliceSize = 512) {
  const byteCharacters = atob(b64Data);
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);

    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i += 1) {
      byteNumbers[i] = slice.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  const blob = new Blob(byteArrays, { type: contentType });
  return blob;
}
