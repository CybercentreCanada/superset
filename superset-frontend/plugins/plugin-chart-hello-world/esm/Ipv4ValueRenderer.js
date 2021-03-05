import React, { Component } from 'react';
export default class Ipv4ValueRenderer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      cellValue: Ipv4ValueRenderer.getValueToDisplay(props)
    };
  } // update cellValue when the cell's props are updated


  static getDerivedStateFromProps(nextProps) {
    return {
      cellValue: Ipv4ValueRenderer.getValueToDisplay(nextProps)
    };
  }

  formatIpV4(v) {
    var converted = (v >> 24 & 0xff) + '.' + (v >> 16 & 0xff) + '.' + (v >> 8 & 0xff) + '.' + (v & 0xff);
    return converted;
  }

  render() {
    const ipString = this.formatIpV4(this.state.cellValue);
    return /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("a", {
      href: "http://10.162.232.22:8000/gwwk.html"
    }, ipString));
  }

  static getValueToDisplay(params) {
    return params.valueFormatted ? params.valueFormatted : params.value;
  }

}