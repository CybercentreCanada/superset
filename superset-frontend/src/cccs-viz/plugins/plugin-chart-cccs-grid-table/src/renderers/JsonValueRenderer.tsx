import { ExpandedChangedEvent } from 'ag-grid-community';
import { Component } from 'react';
import { JSONTree } from 'react-json-tree';

import { safeJsonObjectParse } from 'src/cccs-viz/plugins/utils';
import './Button.css';

// JSX which shows the JSON tree inline, and a button to collapse it
function collapseJSON(this: any, toggleExpand: any, jsonObject: any) {
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
}

// JSX which shows the JSON data on one line, and a button to open the JSON tree
function expandJSON(this: any, toggleExpand: any, cellData: any) {
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
}

export default class JsonValueRenderer extends Component<
  { valueFormatted?: string; value: string },
  { cellValue: any; expanded: boolean; rowNode: any }
> {
  constructor(props: any) {
    super(props);

    this.state = {
      cellValue: JsonValueRenderer.getValueToDisplay(props),
      expanded: props.node.expanded,
      rowNode: props.node,
    };
    this.state.rowNode.addEventListener(
      'expandedChanged',
      this.onExpandChanged,
    );
  }

  // update cellValue when the cell's props are updated
  static getDerivedStateFromProps(nextProps: any) {
    return {
      cellValue: JsonValueRenderer.getValueToDisplay(nextProps),
    };
  }

  // Set the current `expanded` field to the opposite of what it currently is
  toggleExpand = () => {
    this.setState(prevState => ({
      ...prevState,
      expanded: !prevState.expanded,
    }));
  };

  // Take the boolean value passed in and set the `expanded` field equal to it
  updateState = (newFlag: any) => {
    this.setState(prevState => ({ ...prevState, expanded: newFlag }));
  };

  // Return whether 'expanded' is set to true or false
  getExpandedValue = () => this.state.expanded;

  onExpandChanged = (params: ExpandedChangedEvent) => {
    this.setState(prevState => ({
      ...prevState,
      rowNode: params.node,
    }));
    if (this.state.expanded !== this.state.rowNode.expanded) {
      this.toggleExpand();
    }
  };

  render() {
    const cellData = this.state.cellValue;
    const jsonObject = safeJsonObjectParse(this.state.cellValue);

    // If there is a JSON object, either show it expanded or collapsed based
    // on the value which the `expanded` field is set to
    if (jsonObject) {
      if (this.state.expanded === false) {
        return expandJSON(this.toggleExpand, cellData);
      }
      return collapseJSON(this.toggleExpand, jsonObject);
    }
    // If the cellData is set to 'null' or undefined, return null
    return cellData !== 'null' && cellData !== undefined ? cellData : null;
  }

  static getValueToDisplay(params: { valueFormatted: any; value: any }) {
    return params.valueFormatted ? params.valueFormatted : params.value;
  }
}
