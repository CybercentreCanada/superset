

import { Menu } from 'src/components/Menu';

import { CopyOutlined } from '@ant-design/icons';


interface EmiteFilterMenuItemProps {
    label: string;
    onClick: () => void;
    onSelection: () => void;
    disabled?: boolean;
    isContextMenu?: boolean;
    contextMenuY?: number;
}

export default function EmiteFilterMenuItem (props: EmiteFilterMenuItemProps) {
    const onClick = () => {
        props.onClick()
        props.onSelection()
    }

    return (

        <Menu.Item 
        onItemHover={() => {}}  
        onClick={() => onClick()}
        key="drill-detail-no-filters"
        className={props.disabled ? "ant-menu-item ant-dropdown-menu-item-disabled" : 'ant-menu-item'} 
        disabled={props.disabled}
        icon={<CopyOutlined />}
        >
          {props.label}
        </Menu.Item>

    )

}