/* eslint-disable react/no-unused-state */
import React, { Component } from 'react';
import JSONTree from 'react-json-tree';

const JSON_TREE_THEME = {
  scheme: 'monokai',
  base00: '#272822',
  base01: '#383830',
  base02: '#49483e',
  base03: '#75715e',
  base04: '#a59f85',
  base05: '#f8f8f2',
  base06: '#f5f4f1',
  base07: '#f9f8f5',
  base08: '#f92672',
  base09: '#fd971f',
  base0A: '#f4bf75',
  base0B: '#a6e22e',
  base0C: '#a1efe4',
  base0D: '#66d9ef',
  base0E: '#ae81ff',
  base0F: '#cc6633',
};

function safeJsonObjectParse(
  data: unknown,
): null | unknown[] | Record<string, unknown> {
  // First perform a cheap proxy to avoid calling JSON.parse on data that is clearly not a
  // JSON object or an array
  if (
    typeof data !== 'string' ||
    ['{', '['].indexOf(data.substring(0, 1)) === -1
  ) {
    return null;
  }

  // We know 'data' is a string starting with '{' or '[', so try to parse it as a valid object
  try {
    const jsonData = JSON.parse(data);
    if (jsonData && typeof jsonData === 'object') {
      return jsonData;
    }
    return null;
  } catch (_) {
    return null;
  }
}

// JSX which shows the JSON tree inline, and a button to collapse it
function minimizeJSON(this: any, reverseState: any, jsonObject: any) {
  return (
    <span>
      <button type="button" onClick={reverseState}>
        MINIMIZE
      </button>
      <JSONTree
        data={jsonObject}
        theme={JSON_TREE_THEME}
        shouldExpandNode={() => true}
      />
    </span>
  );
}

// JSX which shows the JSON data on one line, and a button to open the JSON tree
function expandJSON(this: any, reverseState: any, cellData: any) {
  return (
    <>
      <button type="button" onClick={reverseState}>
        EXPAND
      </button>
      {cellData}
    </>
  );
}

export default class JsonValueRenderer extends Component<
  {},
  {
    cellValue: any;
    expanded: boolean;
    colId: string;
    rowIndex: number;
    getJSONCells: any;
    setJSONCell: any;
  }
> {
  constructor(props: any) {
    super(props);

    this.state = {
      cellValue: JsonValueRenderer.getValueToDisplay(props),
      expanded: false,
      colId: props.colDef.colId,
      rowIndex: props.rowIndex,
      getJSONCells: props.getJSONCells,
      setJSONCell: props.setJSONCell,
    };
  }

  // update cellValue when the cell's props are updated
  static getDerivedStateFromProps(nextProps: any) {
    return {
      cellValue: JsonValueRenderer.getValueToDisplay(nextProps),
    };
  }

  // Set the current `expanded` field to the opposite of what it currently is
  reverseState = () => {
    const jsonCellArray = this.state.getJSONCells();

    console.log(jsonCellArray);

    this.setState(prevState => ({
      ...prevState,
      expanded: !prevState.expanded,
    }));
  };

  // Take the boolean value passed in and set the `expanded` field equal to it
  updateState = (newFlag: any) => {
    this.setState(prevState => ({
      ...prevState,
      expanded: newFlag,
    }));
  };

  getCellStatus = () => {
    const jsonCellArray = this.state.getJSONCells();

    // console.log(jsonCellArray);

    try {
      return jsonCellArray[this.state.rowIndex][this.state.colId];
    } catch (e) {
      // console.log(e);
      return false;
    }
  };

  render() {
    const cellData = this.state.cellValue;
    const jsonObject = safeJsonObjectParse(this.state.cellValue);

    // If there is a JSON object, either show it expanded or minimized based
    // on the value which the `expanded` field is set to
    if (jsonObject) {
      if (this.getCellStatus()) {
        return minimizeJSON(this.reverseState, jsonObject);
      }
      return expandJSON(this.reverseState, cellData);
    }
    return cellData ?? null;
  }

  static getValueToDisplay(params: { valueFormatted: any; value: any }) {
    return params.valueFormatted ? params.valueFormatted : params.value;
  }
}
