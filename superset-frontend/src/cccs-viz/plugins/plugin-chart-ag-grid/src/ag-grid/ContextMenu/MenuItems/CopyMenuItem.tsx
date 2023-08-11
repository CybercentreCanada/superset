

import { Menu } from 'src/components/Menu';

import { useCallback} from 'react';
import { ExpandAltOutlined } from '@ant-design/icons';

interface CopyMenuItemProps {
    selectedData: { [key: string]: string[] };
    isContextMenu?: boolean;
    contextMenuY?: number;
    onSelection?: () => void;
}

export default function CopyMenuItem (props: CopyMenuItemProps) {

    const copyText = useCallback(
        () => {
            navigator.clipboard.writeText(JSON.stringify(props.selectedData));
        }, [props.selectedData]   
    )
    return (

        <Menu.Item 
            onItemHover={() => {}}  
            onClick={() => copyText()}
            key="drill-detail-no-filters"
            className='ant-menu-item'
            icon={<ExpandAltOutlined />}
        >Copy</Menu.Item>

    )

}