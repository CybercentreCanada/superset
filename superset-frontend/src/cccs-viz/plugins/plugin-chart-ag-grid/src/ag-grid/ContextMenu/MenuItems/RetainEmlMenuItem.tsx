import { SupersetClient } from '@superset-ui/core';
import { Menu } from 'src/components/Menu';
import { useDispatch } from 'react-redux';
import {
  addInfoToast,
  addDangerToast,
} from 'src/components/MessageToasts/actions';
import AlfredIcon from 'src/cccs-viz/plugins/components/AlfredIcon';
import { Tooltip } from 'antd';

interface RetainEmlMenuItemProps {
  label: string;
  data: any;
  onSelection: () => void;
  key?: string;
  disabled?: boolean;
  isContextMenu?: boolean;
  contextMenuY?: number;
  tooltip?: string;
}

export default function RetainEmlMenuItem(props: RetainEmlMenuItemProps) {
  const dispatch = useDispatch();

  const onClick = () => {
    const endpoint = `/api/v1/alfred/retain-eml-record`;
    const jsonPayload = props.data;
    const timeout = 180000; // 3 minutes
    // format dates into datestrings that look like Y-m-d
    let allDates = [];
    try {
      allDates = props.data.dates.map((d: string) => {
        let date = new Date(Date.parse(d));
        if (Number.isNaN(date.getTime())) {
          date = new Date(d);
        }
        const day = date.getDate();
        const month = date.getMonth() + 1; // months are labelled 0-11;
        const year = date.getFullYear();
        return `${year}-${month}-${day}`;
      });
    } catch (error) {
      console.error(`Error parsing dates, ignoring date columns: ${error}`);
      allDates = [];
    }

    jsonPayload.dates = [...new Set(allDates)];

    dispatch(
      addInfoToast(
        'Retention started. A new tab will open upon successful retention.',
      ),
    );
    SupersetClient.post({ endpoint, jsonPayload, timeout })
      .then(({ json }) => {
        window.open(json.result, '_blank');
      })
      .catch(error => {
        dispatch(
          addDangerToast(
            'Retention failed. The records you attempted to retain were not retained.',
          ),
        );
      });

    props.onSelection();
  };

  return (
    <Menu.Item
      {...props}
      onItemHover={() => {}}
      onClick={() => onClick()}
      className={
        props.disabled
          ? 'ant-dropdown-menu-item ant-dropdown-menu-item-disabled'
          : 'ant-dropdown-menu-item'
      }
      disabled={props.disabled}
      icon={<AlfredIcon disabled={props.disabled} />}
    >
      {props.tooltip ? (
        <Tooltip title={props.tooltip}>{props.label}</Tooltip>
      ) : (
        props.label
      )}
    </Menu.Item>
  );
}
