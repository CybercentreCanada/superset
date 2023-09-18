import { Component } from 'react';

export default class Ipv4ValueRenderer extends Component<
  {},
  { cellValue: any }
> {
  constructor(props: any) {
    super(props);

    this.state = {
      cellValue: Ipv4ValueRenderer.getValueToDisplay(props),
    };
  }

  // update cellValue when the cell's props are updated
  static getDerivedStateFromProps(nextProps: any) {
    return {
      cellValue: Ipv4ValueRenderer.getValueToDisplay(nextProps),
    };
  }

  formatIpV4(v: any) {
    const converted = `${(v >> 24) & 0xff}.${(v >> 16) & 0xff}.${
      (v >> 8) & 0xff
    }.${v & 0xff}`;
    return converted;
  }

  render() {
    return this.formatIpV4(Number(this.state.cellValue));
  }

  static getValueToDisplay(params: { valueFormatted: any; value: any }) {
    return params.valueFormatted ? params.valueFormatted : params.value;
  }
}
