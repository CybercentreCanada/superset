import { ICellRendererParams } from 'ag-grid-community';
import React from 'react';
import { renderToStaticMarkup, renderToString } from "react-dom/server"
import { JSONTree } from 'react-json-tree';

import { ICellRendererComp } from '@ag-grid-community';
import { StyledButton } from '../styles';
import { utcThursday } from 'd3-time';

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

  init(params: JsonCellParams) {
    this.expanded = params.expanded || false;

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
    this.expandButton.addEventListener('click', this.reverseState);
  }

  getGui() {
    return this.eGui;
  }

  refresh(params: JsonCellParams) {
    // set value into cell again
    this.expanded = params.expanded || false;
    this.cellValue = this.getValueToDisplay(params);
    this.eValueContainer.innerHTML = this.renderCell();
    // return true to tell the grid we refreshed successfully
    return true;
  }

  destroy() {
    if (this.expandButton) {
      this.expandButton.removeEventListener('click', this.reverseState);
    }
  }

  getValueToDisplay(params: JsonCellParams) {
    return params.valueFormatted ? params.valueFormatted : params.value;
  }

  // Set the current `expanded` field to the opposite of what it currently is
  reverseState = () => {
    this.expanded = !this.expanded;
    this.eValueContainer.innerHTML = this.renderCell();
  };

  renderExpandButton() {
    return `
      <span>
        <button class="ag-grid-btn-expand"></button>
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
