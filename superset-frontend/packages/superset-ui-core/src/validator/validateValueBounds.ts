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

import { t } from '../translation';

export default function validateValueBounds(v: unknown) {
  if (!Array.isArray(v) || v.length !== 2) {
    return t('Expected array with length 2.');
  }

  if (Array.isArray(v) && v.length === 2) {
    // If min is greater than max (assuming that an empty value is interpreted as 0)
    if (
      (v[0] == null && v[1] < 0) ||
      (v[0] > 0 && v[1] == null) ||
      (v[0] != null && v[1] != null && v[0] > v[1])
    ) {
      return t('Max value must be greater than Min.');
    }
  }
  return false;
}
