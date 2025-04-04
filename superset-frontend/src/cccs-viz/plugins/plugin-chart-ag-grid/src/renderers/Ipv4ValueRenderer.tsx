import { Component } from 'react';
import { formatIpv4 } from '../types/advancedDataTypes';

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

  render() {
    return formatIpv4(Number(this.state.cellValue));
  }

  static getValueToDisplay(params: { valueFormatted: any; value: any }) {
    return params.valueFormatted ? params.valueFormatted : params.value;
  }
}
