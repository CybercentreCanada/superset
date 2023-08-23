

import { Menu } from 'src/components/Menu';

import { ExpandAltOutlined } from '@ant-design/icons';


interface EmiteFilterMenuItemProps {
    label: string;
    onClick: () => void;
    disabled?: boolean;
    isContextMenu?: boolean;
    contextMenuY?: number;
    onSelection?: () => void;
}

export default function EmiteFilterMenuItem (props: EmiteFilterMenuItemProps) {
    

    return (

        <Menu.Item 
        onItemHover={() => {}}  
        onClick={() => props.onClick()}
        key="drill-detail-no-filters"
        className={props.disabled ? "ant-menu-item ant-dropdown-menu-item-disabled" : 'ant-menu-item'} 
        disabled={props.disabled}
        icon={<ExpandAltOutlined />}
        >
          {props.label}
        </Menu.Item>

    )

}