"use strict";

exports.__esModule = true;
exports.default = void 0;

var _react = _interopRequireWildcard(require("react"));

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

class DomainValueRenderer extends _react.Component {
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
    return /*#__PURE__*/_react.default.createElement("span", null, /*#__PURE__*/_react.default.createElement("a", {
      href: "http://10.162.232.22:8000/gwwk.html"
    }, this.state.cellValue));
  }

  static getValueToDisplay(params) {
    return params.valueFormatted ? params.valueFormatted : params.value;
  }

}

exports.default = DomainValueRenderer;