import React, { Component } from 'react';
export default class DomainValueRenderer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      cellValue: DomainValueRenderer.getValueToDisplay(props)
    };
  } // update cellValue when the cell's props are updated


  static getDerivedStateFromProps(nextProps) {
    return {
      cellValue: DomainValueRenderer.getValueToDisplay(nextProps)
    };
  }

  render() {
    return /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("a", {
      href: "http://10.162.232.22:8000/gwwk.html"
    }, this.state.cellValue));
  }

  static getValueToDisplay(params) {
    return params.valueFormatted ? params.valueFormatted : params.value;
  }

}