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

from flask_appbuilder.api import expose, permission_name, protect, safe, BaseApi
from flask_appbuilder.models.sqla.interface import SQLAInterface

from superset.constants import MODEL_API_RW_METHOD_PERMISSION_MAP, RouteMethod
from superset.extensions import event_logger
from superset.jump_to_action.filters import DashboardHasNativeFilterConfigurationFilter
from superset.models.dashboard import Dashboard
from superset.views.base_api import BaseSupersetModelRestApi, FlaskResponse, handle_api_exception

logger = logging.getLogger(__name__)


class JumpToDashboardActionRestApi(BaseSupersetModelRestApi):
    datamodel = SQLAInterface(Dashboard)

    resource_name = "jump_to_action"
    allow_browser_login = True

    include_route_methods = {RouteMethod.GET}
    class_permission_name = "Dashboard"
    method_permission_name = MODEL_API_RW_METHOD_PERMISSION_MAP
    
    list_columns = ["id", "dashboard_title", "url", "json_metadata"]
    order_columns = ["published", "changed_on", "id"]
    # Apply the filter to include dashboards with native filter configurations
    base_filters = [
        ["json_metadata", DashboardHasNativeFilterConfigurationFilter, True],
    ]

    openapi_spec_tag = "Jump To Dashboard Actions"

    @expose("/", methods=("GET",))
    @protect()
    @safe
    @event_logger.log_this_with_context(
        action=lambda self, *args, **kwargs: f"{self.__class__.__name__}.get",
        log_to_statsd=False,
    )
    def get(self) -> FlaskResponse:
        """Get possible dashboard IDs for a "jump to dashboard" action.
        """

        return super().get_list()
