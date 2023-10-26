import React, { Component } from 'react';

export default class DomainValueRenderer extends Component<
  {},
  { cellValue: any }
> {
  constructor(props: any) {
    super(props);

    this.state = {
      cellValue: DomainValueRenderer.getValueToDisplay(props),
    };
  }

  // update cellValue when the cell's props are updated
  static getDerivedStateFromProps(nextProps: any) {
    return {
      cellValue: DomainValueRenderer.getValueToDisplay(nextProps),
    };
  }

  render() {
    return <span>{this.state.cellValue}</span>;
  }

  static getValueToDisplay(params: { valueFormatted: any; value: any }) {
    return params.valueFormatted ? params.valueFormatted : params.value;
  }
}
