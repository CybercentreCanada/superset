"use strict";

exports.__esModule = true;
exports.default = void 0;

var _react = _interopRequireWildcard(require("react"));

var _core = require("@superset-ui/core");

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
// The following Styles component is a <div> element, which has been styled using Emotion
// For docs, visit https://emotion.sh/docs/styled
// Theming variables are provided for your use via a ThemeProvider
// imported from @superset-ui/core. For variables available, please visit
// https://github.com/apache-superset/superset-ui/blob/master/packages/superset-ui-core/src/style/index.ts
const Styles = _core.styled.div`
  background-color: ${({
  theme
}) => theme.colors.secondary.light2};
  padding: ${({
  theme
}) => theme.gridUnit * 4}px;
  border-radius: ${({
  theme
}) => theme.gridUnit * 2}px;
  height: ${({
  height
}) => height};
  width: ${({
  width
}) => width};
  overflow-y: scroll;

  h3 {
    /* You can use your props to control CSS! */
    font-size: ${({
  theme,
  headerFontSize
}) => theme.typography.sizes[headerFontSize]};
    font-weight: ${({
  theme,
  boldText
}) => theme.typography.weights[boldText ? 'bold' : 'normal']};
  }
`;
/**
 * ******************* WHAT YOU CAN BUILD HERE *******************
 *  In essence, a chart is given a few key ingredients to work with:
 *  * Data: provided via `props.data`
 *  * A DOM element
 *  * FormData (your controls!) provided as props by transformProps.ts
 */

class Assemblyline extends _react.PureComponent {
  constructor(...args) {
    super(...args);
    this.rootElem = /*#__PURE__*/(0, _react.createRef)();
  }

  componentDidMount() {
    const root = this.rootElem.current;
    console.log('Plugin element', root);
  }

  render() {
    // height and width are the height and width of the DOM element as it exists in the dashboard.
    // There is also a `data` prop, which is, of course, your DATA 🎉
    console.log('Approach 1 props', this.props);
    const {
      ip,
      height,
      width
    } = this.props;
    console.log('Plugin props', this.props);
    const url = "https://malware.cyber.gc.ca/next/search?query=" + ip;
    return /*#__PURE__*/_react.default.createElement(Styles, {
      ref: this.rootElem,
      boldText: this.props.boldText,
      headerFontSize: this.props.headerFontSize,
      height: height,
      width: width
    }, /*#__PURE__*/_react.default.createElement("iframe", {
      width: "600",
      height: "400",
      seamless: true,
      frameBorder: "0",
      scrolling: "no",
      src: url
    }));
  }

}

exports.default = Assemblyline;