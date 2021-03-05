import React, { Component } from 'react';
export default class CustomTooltip extends Component {
  getReactContainerClasses() {
    return ['custom-tooltip'];
  }

  render() {
    const data = this.props.api.getDisplayedRowAtIndex(this.props.rowIndex).data;
    return /*#__PURE__*/React.createElement("div", {
      className: "custom-tooltip",
      style: {
        backgroundColor: this.props.color || 'white'
      }
    }, /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("span", null, data.athlete)), /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("span", null, "Country: "), " ", data.SRC_IP), /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("span", null, "Total: "), " ", data.SRC_PORT));
  }

}