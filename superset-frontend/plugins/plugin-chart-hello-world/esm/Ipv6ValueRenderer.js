import React, { Component } from 'react';
import { IPv6 } from "ip-num";
import bigInt from "big-integer";
export default class Ipv6ValueRenderer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      cellValue: Ipv6ValueRenderer.getValueToDisplay(props)
    };
  } // update cellValue when the cell's props are updated


  static getDerivedStateFromProps(nextProps) {
    return {
      cellValue: Ipv6ValueRenderer.getValueToDisplay(nextProps)
    };
  }

  render() {
    const ipv6 = IPv6.fromBigInteger(bigInt(this.state.cellValue));
    const ipString = ipv6.toString();
    return /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("a", {
      href: "http://10.162.232.22:8000/gwwk.html"
    }, ipString));
  }

  static getValueToDisplay(params) {
    return params.valueFormatted ? params.valueFormatted : params.value;
  }

}