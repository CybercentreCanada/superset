import {
  ICellRendererComp,
  ICellRendererParams,
  RowEvent,
} from 'ag-grid-community';
import React from 'react';
import { renderToString } from "react-dom/server"
import { JSONTree } from 'react-json-tree';

import '../Button.css';

interface JsonCellParams extends ICellRendererParams {
  expanded: boolean;
}

export default class JsonValueRenderer implements ICellRendererComp {
  eGui!: HTMLSpanElement;

  cellValue: any;

  expanded: boolean;

  expandButton: any;

  eValueContainer: any;

  expandListener!: () => void;

  rowNode: any;

  init(params: JsonCellParams) {
    this.rowNode = params.node;
    this.expanded = params.node.expanded || false;

    // create cell
    this.eGui = document.createElement('div');
    this.eGui.innerHTML = this.renderExpandButton();

    // get component references
    this.eValueContainer = this.eGui.querySelector('.ag-grid-cell-value');
    this.expandButton = this.eGui.querySelector('.ag-grid-btn-expand');

    // set value in cell
    this.cellValue = this.getValueToDisplay(params);
    this.eValueContainer.innerHTML = this.cellValue;

    // add event listener to button
    this.expandButton.addEventListener('click', this.toggleExpand);
    this.rowNode.addEventListener('expandedChanged', this.onExpandChanged);
  }

  getGui() {
    return this.eGui;
  }

  refresh(params: JsonCellParams) {
    this.rowNode = params.node;
    if (this.expanded !== this.rowNode.expanded) {
      this.toggleExpand();
    }
    this.cellValue = this.getValueToDisplay(params);
    this.eValueContainer.innerHTML = this.renderCell();
    // return true to tell the grid we refreshed successfully
    return true;
  }

  destroy() {
    if (this.expandButton) {
      this.expandButton.removeEventListener('click', this.toggleExpand);
    }
    if (this.rowNode) {
      this.rowNode.removeEventListener('expandedChanged', this.onExpandChanged);
    }
  }

  getValueToDisplay(params: JsonCellParams) {
    return params.valueFormatted ? params.valueFormatted : params.value;
  }

  // Set the current `expanded` field to the opposite of what it currently is
  toggleExpand = () => {
    this.expanded = !this.expanded;
    this.expandButton.className = this.expanded
      ? 'ag-grid-btn ag-grid-btn-collapse'
      : 'ag-grid-btn ag-grid-btn-expand';
    this.eValueContainer.innerHTML = this.renderCell();
  };

  onExpandChanged = (params: RowEvent) => {
    this.rowNode = params.node;
    if (this.expanded !== this.rowNode.expanded) {
      this.toggleExpand();
    }
  };

  setExpand(expand: boolean) {
    if (this.expanded !== expand) {
      this.toggleExpand();
    }
  }

  renderExpandButton() {
    return `
      <span>
        <button class="ag-grid-btn ag-grid-btn-expand"></button>
        <span class="ag-grid-cell-value"></span>
      </span>
    `;
  }

  renderCell(): string {
    const cellData = this.cellValue;
    const jsonObject = this.safeJsonObjectParse(cellData);

    // If there is a JSON object, either show it expanded or collapsed based
    // on the value which the `expanded` field is set to otherwise just return
    // cellData
    return jsonObject && this.expanded
      ? this.renderCellJson(jsonObject)
      : cellData;
  }

  // JSX which shows the JSON tree inline, and a button to collapse it
  renderCellJson(this: any, jsonObject: any): string {
    return `
        <div>
          ${renderToString(
            <JSONTree
              data={jsonObject}
              theme="default"
              shouldExpandNode={() => true}
            />,
          )}
        </div>
      </span>,
    `;
  }

  safeJsonObjectParse(
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
}
