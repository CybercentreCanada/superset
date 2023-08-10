/* eslint-disable theme-colors/no-literal-colors */
/*
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

import { css, styled } from '@superset-ui/core';

export const StyledButton = styled.button`
  background-color: transparent;
  border: solid rgb(137, 137, 137);
  border-width: 0 2px 2px 0;
  display: inline-block;
  padding-right: 3px;
  padding-left: 3px;
  padding-top: 3px;
  padding-bottom: 3px;
  vertical-align: middle;
  margin-right: 10px;
  margin-left: 5px;

  .Expand {
    transform: rotate(-45deg);
    -webkit-transform: rotate(-45deg);
  }

  .Collapse {
    transform: rotate(45deg);
    -webkit-transform: rotate(45deg);
  }

  .Row-Expand {
    background-color: transparent;
    text-decoration: underline;
    vertical-align: middle;
    border: none;
    color: rgb(31, 167, 201);
  }
`;
