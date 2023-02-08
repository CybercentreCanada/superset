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

function minimizeJSON(this: any, updateState: any, jsonObject: any) {
  return (
    <span>
      <button type="button" onClick={updateState}>
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

function expandJSON(this: any, updateState: any, cellData: any) {
  return (
    <>
      <button type="button" onClick={updateState}>
        EXPAND
      </button>
      {cellData}
    </>
  );
}

export default class JsonValueRenderer extends Component<
  {},
  { cellValue: any; expanded: boolean }
> {
  constructor(props: any) {
    super(props);

    this.state = {
      cellValue: JsonValueRenderer.getValueToDisplay(props),
      expanded: false,
    };
  }

  // update cellValue when the cell's props are updated
  static getDerivedStateFromProps(nextProps: any) {
    return {
      cellValue: JsonValueRenderer.getValueToDisplay(nextProps),
    };
  }

  reverseState = () => {
    this.setState(prevState => ({
      ...prevState,
      expanded: !prevState.expanded,
    }));
  };

  updateState = (newFlag: any) => {
    this.setState(prevState => ({
      ...prevState,
      expanded: newFlag,
    }));
  };

  render() {
    const cellData = this.state.cellValue;
    const jsonObject = safeJsonObjectParse(this.state.cellValue);
    if (jsonObject) {
      if (this.state.expanded === false) {
        return expandJSON(this.reverseState, cellData);
      }
      return minimizeJSON(this.reverseState, jsonObject);
    }
    return cellData ?? null;
  }

  static getValueToDisplay(params: { valueFormatted: any; value: any }) {
    return params.valueFormatted ? params.valueFormatted : params.value;
  }
}
