import { ExpandedChangedEvent } from 'ag-grid-community';
import { useEffect, useState } from 'react';
import { JSONTree } from 'react-json-tree';

import { safeJsonObjectParse } from 'src/cccs-viz/plugins/utils';
import './Button.css';

// JSX which shows the JSON tree inline, and a button to collapse it
const collapseJSON = (toggleExpand: any, jsonObject: any) => {
  return (
    <span style={{ display: 'flex' }}>
      <span className="ag-group-contracted">
        <span
          className="ag-icon ag-icon-tree-open"
          role="presentation"
          unselectable="on"
          onClick={toggleExpand}
        />
      </span>
      <span style={{ width: '100%' }}>
        <JSONTree
          data={jsonObject}
          theme="default"
          shouldExpandNodeInitially={() => true}
        />
      </span>
    </span>
  );
};

// JSX which shows the JSON data on one line, and a button to open the JSON tree
const expandJSON = (toggleExpand: () => void, cellData: any) => {
  return (
    <span className="ag-group-expanded">
      <span
        className="ag-icon ag-icon-tree-closed"
        style={{ display: 'inline-block' }}
        role="presentation"
        unselectable="on"
        onClick={toggleExpand}
      />
      <span style={{ width: '100%' }}>{cellData}</span>
    </span>
  );
};

export default function JsonValueRenderer(props: {
  valueFormatted?: string;
  value: string;
  node: any;
}) {
  const cellData = props.valueFormatted || props.value;
  const [expanded, setExpanded] = useState<boolean>(!!props.node.expanded);

  useEffect(() => {
    const onExpandChanged = (params: ExpandedChangedEvent) => {
      setExpanded(params.node.expanded);
    };

    props.node.addEventListener('expandedChanged', onExpandChanged);
    setExpanded(props.node.expanded);
    return () => {
      props.node.removeEventListener('expandedChanged', onExpandChanged);
    };
  }, [props.node]);

  const toggleExpand = () => setExpanded(previousExpanded => !previousExpanded);
  const jsonObject = safeJsonObjectParse(cellData);

  // If there is a JSON object, either show it expanded or collapsed based
  // on the value which the `expanded` field is set to
  if (jsonObject) {
    if (!expanded) {
      return expandJSON(toggleExpand, cellData);
    }
    return collapseJSON(toggleExpand, jsonObject);
  }
  // If the cellData is set to 'null' or undefined, return null
  return cellData !== 'null' && cellData !== undefined ? cellData : null;
}
