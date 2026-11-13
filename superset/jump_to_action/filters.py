# Licensed to the Apache Software Foundation (ASF) under one
# or more contributor license agreements.  See the NOTICE file
# distributed with this work for additional information
# regarding copyright ownership.  The ASF licenses this file
# to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance
# with the License.  You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing,
# software distributed under the License is distributed on an
# "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
# KIND, either express or implied.  See the License for the
# specific language governing permissions and limitations
# under the License.
import logging
from typing import Any

from flask_babel import lazy_gettext as _
from sqlalchemy.orm.query import Query

from superset.models.dashboard import Dashboard
from sqlalchemy import or_
from superset.views.base import BaseFilter

logger = logging.getLogger(__name__)

class DashboardHasNativeFilterConfigurationFilter(  # pylint: disable=too-few-public-methods
    BaseFilter
):
    """
    Custom filter for the GET list that filters dashboards by whether their
    json_metadata contains a "native_filter_configuration" key.

    json_metadata is stored as text, so the quoted key is matched as a substring.
    Dashboards with NULL json_metadata never match.
    """

    name = _("Has native filter configuration")
    arg_name = "dashboard_has_native_filter_configuration"

    def apply(self, query: Query, value: Any) -> Query:
        condition = Dashboard.json_metadata.like('%"native_filter_configuration"%')
        if value is True:
            return query.filter(condition)
        if value is False:
            return query.filter(or_(~condition, Dashboard.json_metadata.is_(None)))
        return query
