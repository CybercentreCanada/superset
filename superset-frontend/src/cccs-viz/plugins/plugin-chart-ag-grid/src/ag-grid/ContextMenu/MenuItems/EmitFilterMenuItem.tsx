

import { Menu } from 'src/components/Menu';

import {
    SetDataMaskHook, ensureIsArray,
  } from '@superset-ui/core';
import { useCallback, useEffect, useState } from 'react';
import { ExpandAltOutlined } from '@ant-design/icons';

interface EmiteFilterMenuItemProps {
    selectedData: { [key: string]: string[] };
    setDataMask: SetDataMaskHook;
    isContextMenu?: boolean;
    contextMenuY?: number;
    onSelection?: () => void;
}

export default function EmiteFilterMenuItem (props: EmiteFilterMenuItemProps) {
    const [selectedData,setSelectedData ] = useState<{ [key: string]: string[] }>(props.selectedData);
    
    useEffect(() => {
        setSelectedData(props.selectedData)
    }, [props.selectedData])

    const emitFilter = useCallback(
        Data => {
          const groupBy = Object.keys(Data);
          const groupByValues = Object.values(Data);
          props.setDataMask({
            extraFormData: {
              filters:
                groupBy.length === 0
                  ? []
                  : groupBy.map(col => {
                      const val = ensureIsArray(Data?.[col]);
                      if (val === null || val === undefined)
                        return {
                          col,
                          op: 'IS NULL',
                        };
                      return {
                        col,
                        op: 'IN',
                        val,
                      };
                    }),
            },
            filterState: {
              value: groupByValues.length ? groupByValues : null,
            },
          });
        },
        [props.setDataMask],
      ); // only take relevant page size options

    return (

        <Menu.Item 
        onItemHover={() => {}}  
        onClick={() => emitFilter(selectedData)}
        key="drill-detail-no-filters"
        className='ant-menu-item'
        icon={<ExpandAltOutlined />}
        >EMIT</Menu.Item>

    )

}