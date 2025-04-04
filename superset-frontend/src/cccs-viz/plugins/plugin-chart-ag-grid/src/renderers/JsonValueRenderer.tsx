import { RowEvent } from 'ag-grid-community';
import React, { Component } from 'react';
import { JSONTree } from 'react-json-tree';

import { safeJsonObjectParse } from 'src/cccs-viz/plugins/utils';
import '../Button.css';

// JSX which shows the JSON tree inline, and a button to collapse it
function collapseJSON(this: any, toggleExpand: any, jsonObject: any) {
  return (
    <span style={{ display: 'flex' }}>
      <div style={{ float: 'left' }}>
        <button
          className="ag-grid-btn ag-grid-btn-collapse"
          type="button"
          title="Collapse"
          onClick={toggleExpand}
        >
          {' '}
        </button>
      </div>
      <div style={{ float: 'left' }}>
        <JSONTree
          data={jsonObject}
          theme="default"
          shouldExpandNode={() => true}
        />
      </div>
    </span>
  );
}

// JSX which shows the JSON data on one line, and a button to open the JSON tree
function expandJSON(this: any, toggleExpand: any, cellData: any) {
  return (
    <>
      <button
        className="ag-grid-btn ag-grid-btn-expand"
        type="button"
        title="Expand"
        onClick={toggleExpand}
      >
        {' '}
      </button>
      {cellData}
    </>
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

  onExpandChanged = (params: RowEvent) => {
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
