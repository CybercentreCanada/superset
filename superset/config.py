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
"""The main config file for Superset

All configuration in this file can be overridden by providing a superset_config
in your PYTHONPATH as there is a ``from superset_config import *``
at the end of this file.
"""
# pylint: disable=too-many-lines
import imp  # pylint: disable=deprecated-module
import importlib.util
import json
import logging
import os
import re
import sys
from collections import OrderedDict
from datetime import date, timedelta
from typing import Any, Callable, Dict, List, Optional, Type, TYPE_CHECKING, Union

from cachelib.base import BaseCache
from celery.schedules import crontab
from dateutil import tz
from flask import Blueprint
from flask_appbuilder.security.manager import AUTH_DB
from pandas.io.parsers import STR_NA_VALUES
from werkzeug.local import LocalProxy

from superset.jinja_context import BaseTemplateProcessor
from superset.stats_logger import DummyStatsLogger
from superset.typing import CacheConfig
from superset.utils.core import is_test, parse_boolean_string
from superset.utils.encrypt import SQLAlchemyUtilsAdapter
from superset.utils.log import DBEventLogger
from superset.utils.logging_configurator import DefaultLoggingConfigurator

logger = logging.getLogger(__name__)

if TYPE_CHECKING:
    from flask_appbuilder.security.sqla import models
    from superset.connectors.sqla.models import SqlaTable
    from superset.models.core import Database

# Realtime stats logger, a StatsD implementation exists
STATS_LOGGER = DummyStatsLogger()
EVENT_LOGGER = DBEventLogger()

SUPERSET_LOG_VIEW = True

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
if "SUPERSET_HOME" in os.environ:
    DATA_DIR = os.environ["SUPERSET_HOME"]
else:
    DATA_DIR = os.path.join(os.path.expanduser("~"), ".superset")

# ---------------------------------------------------------
# Superset specific config
# ---------------------------------------------------------
VERSION_INFO_FILE = os.path.join(BASE_DIR, "static", "version_info.json")
PACKAGE_JSON_FILE = os.path.join(BASE_DIR, "static", "assets", "package.json")

# Multiple favicons can be specified here. The "href" property
# is mandatory, but "sizes," "type," and "rel" are optional.
# For example:
# {
#     "href":path/to/image.png",
#     "sizes": "16x16",
#     "type": "image/png"
#     "rel": "icon"
# },
FAVICONS = [{"href": "/static/assets/images/favicon.png"}]


def _try_json_readversion(filepath: str) -> Optional[str]:
    try:
        with open(filepath, "r") as f:
            return json.load(f).get("version")
    except Exception:  # pylint: disable=broad-except
        return None


def _try_json_readsha(filepath: str, length: int) -> Optional[str]:
    try:
        with open(filepath, "r") as f:
            return json.load(f).get("GIT_SHA")[:length]
    except Exception:  # pylint: disable=broad-except
        return None


# Depending on the context in which this config is loaded, the
# version_info.json file may or may not be available, as it is
# generated on install via setup.py. In the event that we're
# actually running Superset, we will have already installed,
# therefore it WILL exist. When unit tests are running, however,
# it WILL NOT exist, so we fall back to reading package.json
VERSION_STRING = _try_json_readversion(VERSION_INFO_FILE) or _try_json_readversion(
    PACKAGE_JSON_FILE
)

VERSION_SHA_LENGTH = 8
VERSION_SHA = _try_json_readsha(VERSION_INFO_FILE, VERSION_SHA_LENGTH)

# Build number is shown in the About section if available. This
# can be replaced at build time to expose build information.
BUILD_NUMBER = None

# default viz used in chart explorer
DEFAULT_VIZ_TYPE = "table"

# default row limit when requesting chart data
ROW_LIMIT = 50000
# default row limit when requesting samples from datasource in explore view
SAMPLES_ROW_LIMIT = 1000
# max rows retrieved by filter select auto complete
FILTER_SELECT_ROW_LIMIT = 10000
SUPERSET_WORKERS = 2  # deprecated
SUPERSET_CELERY_WORKERS = 32  # deprecated

SUPERSET_WEBSERVER_PROTOCOL = "http"
SUPERSET_WEBSERVER_ADDRESS = "0.0.0.0"
SUPERSET_WEBSERVER_PORT = 8088

# This is an important setting, and should be lower than your
# [load balancer / proxy / envoy / kong / ...] timeout settings.
# You should also make sure to configure your WSGI server
# (gunicorn, nginx, apache, ...) timeout setting to be <= to this setting
SUPERSET_WEBSERVER_TIMEOUT = int(timedelta(minutes=1).total_seconds())

# this 2 settings are used by dashboard period force refresh feature
# When user choose auto force refresh frequency
# < SUPERSET_DASHBOARD_PERIODICAL_REFRESH_LIMIT
# they will see warning message in the Refresh Interval Modal.
# please check PR #9886
SUPERSET_DASHBOARD_PERIODICAL_REFRESH_LIMIT = 0
SUPERSET_DASHBOARD_PERIODICAL_REFRESH_WARNING_MESSAGE = None

SUPERSET_DASHBOARD_POSITION_DATA_LIMIT = 65535
CUSTOM_SECURITY_MANAGER = None
SQLALCHEMY_TRACK_MODIFICATIONS = False
# ---------------------------------------------------------

# Your App secret key
SECRET_KEY = "\2\1thisismyscretkey\1\2\\e\\y\\y\\h"

# The SQLAlchemy connection string.
SQLALCHEMY_DATABASE_URI = "sqlite:///" + os.path.join(DATA_DIR, "superset.db")
# SQLALCHEMY_DATABASE_URI = 'mysql://myapp@localhost/myapp'
# SQLALCHEMY_DATABASE_URI = 'postgresql://root:password@localhost/myapp'

# In order to hook up a custom password store for all SQLACHEMY connections
# implement a function that takes a single argument of type 'sqla.engine.url',
# returns a password and set SQLALCHEMY_CUSTOM_PASSWORD_STORE.
#
# e.g.:
# def lookup_password(url):
#     return 'secret'
# SQLALCHEMY_CUSTOM_PASSWORD_STORE = lookup_password
SQLALCHEMY_CUSTOM_PASSWORD_STORE = None

#
# The EncryptedFieldTypeAdapter is used whenever we're building SqlAlchemy models
# which include sensitive fields that should be app-encrypted BEFORE sending
# to the DB.
#
# Note: the default impl leverages SqlAlchemyUtils' EncryptedType, which defaults
#  to AES-128 under the covers using the app's SECRET_KEY as key material.
#
SQLALCHEMY_ENCRYPTED_FIELD_TYPE_ADAPTER = (  # pylint: disable=invalid-name
    SQLAlchemyUtilsAdapter
)
# The limit of queries fetched for query search
QUERY_SEARCH_LIMIT = 1000

# Flask-WTF flag for CSRF
WTF_CSRF_ENABLED = True

# Add endpoints that need to be exempt from CSRF protection
WTF_CSRF_EXEMPT_LIST = ["superset.views.core.log", "superset.charts.api.data"]

# Whether to run the web server in debug mode or not
DEBUG = os.environ.get("FLASK_ENV") == "development"
FLASK_USE_RELOAD = True

# Enable profiling of Python calls. Turn this on and append ``?_instrument=1``
# to the page to see the call stack.
PROFILING = False

# Superset allows server-side python stacktraces to be surfaced to the
# user when this feature is on. This may has security implications
# and it's more secure to turn it off in production settings.
SHOW_STACKTRACE = True

# Use all X-Forwarded headers when ENABLE_PROXY_FIX is True.
# When proxying to a different port, set "x_port" to 0 to avoid downstream issues.
ENABLE_PROXY_FIX = False
PROXY_FIX_CONFIG = {"x_for": 1, "x_proto": 1, "x_host": 1, "x_port": 1, "x_prefix": 1}

# ------------------------------
# GLOBALS FOR APP Builder
# ------------------------------
# Uncomment to setup Your App name
APP_NAME = "Superset"

# Specify the App icon
APP_ICON = "/static/assets/images/superset-logo-horiz.png"
APP_ICON_WIDTH = 126

# Specify where clicking the logo would take the user
# e.g. setting it to '/' would take the user to '/superset/welcome/'
LOGO_TARGET_PATH = None

# Specify tooltip that should appear when hovering over the App Icon/Logo
LOGO_TOOLTIP = ""

# Specify any text that should appear to the right of the logo
LOGO_RIGHT_TEXT: Union[Callable[[], str], str] = ""

# Enables SWAGGER UI for superset openapi spec
# ex: http://localhost:8080/swagger/v1
FAB_API_SWAGGER_UI = True

# Druid query timezone
# tz.tzutc() : Using utc timezone
# tz.tzlocal() : Using local timezone
# tz.gettz('Asia/Shanghai') : Using the time zone with specific name
# [TimeZone List]
# See: https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
# other tz can be overridden by providing a local_config
DRUID_TZ = tz.tzutc()
DRUID_ANALYSIS_TYPES = ["cardinality"]

# Legacy Druid NoSQL (native) connector
# Druid supports a SQL interface in its newer versions.
# Setting this flag to True enables the deprecated, API-based Druid
# connector. This feature may be removed at a future date.
DRUID_IS_ACTIVE = False

# If Druid is active whether to include the links to scan/refresh Druid datasources.
# This should be disabled if you are trying to wean yourself off of the Druid NoSQL
# connector.
DRUID_METADATA_LINKS_ENABLED = True

# ----------------------------------------------------
# AUTHENTICATION CONFIG
# ----------------------------------------------------
# The authentication type
# AUTH_OID : Is for OpenID
# AUTH_DB : Is for database (username/password)
# AUTH_LDAP : Is for LDAP
# AUTH_REMOTE_USER : Is for using REMOTE_USER from web server
AUTH_TYPE = AUTH_DB

# Uncomment to setup Full admin role name
# AUTH_ROLE_ADMIN = 'Admin'

# Uncomment to setup Public role name, no authentication needed
# AUTH_ROLE_PUBLIC = 'Public'

# Will allow user self registration
# AUTH_USER_REGISTRATION = True

# The default user self registration role
# AUTH_USER_REGISTRATION_ROLE = "Public"

# When using LDAP Auth, setup the LDAP server
# AUTH_LDAP_SERVER = "ldap://ldapserver.new"

# Uncomment to setup OpenID providers example for OpenID authentication
# OPENID_PROVIDERS = [
#    { 'name': 'Yahoo', 'url': 'https://open.login.yahoo.com/' },
#    { 'name': 'Flickr', 'url': 'https://www.flickr.com/<username>' },

# ---------------------------------------------------
# Roles config
# ---------------------------------------------------
# Grant public role the same set of permissions as for a selected builtin role.
# This is useful if one wants to enable anonymous users to view
# dashboards. Explicit grant on specific datasets is still required.
PUBLIC_ROLE_LIKE: Optional[str] = None

# ---------------------------------------------------
# Babel config for translations
# ---------------------------------------------------
# Setup default language
BABEL_DEFAULT_LOCALE = "en"
# Your application default translation path
BABEL_DEFAULT_FOLDER = "superset/translations"
# The allowed translation for you app
LANGUAGES = {
    "en": {"flag": "us", "name": "English"},
    "es": {"flag": "es", "name": "Spanish"},
    "it": {"flag": "it", "name": "Italian"},
    "fr": {"flag": "fr", "name": "French"},
    "zh": {"flag": "cn", "name": "Chinese"},
    "ja": {"flag": "jp", "name": "Japanese"},
    "de": {"flag": "de", "name": "German"},
    "pt": {"flag": "pt", "name": "Portuguese"},
    "pt_BR": {"flag": "br", "name": "Brazilian Portuguese"},
    "ru": {"flag": "ru", "name": "Russian"},
    "ko": {"flag": "kr", "name": "Korean"},
    "sl": {"flag": "si", "name": "Slovenian"},
}
# Turning off i18n by default as translation in most languages are
# incomplete and not well maintained.
LANGUAGES = {}

# ---------------------------------------------------
# Feature flags
# ---------------------------------------------------
# Feature flags that are set by default go here. Their values can be
# overwritten by those specified under FEATURE_FLAGS in superset_config.py
# For example, DEFAULT_FEATURE_FLAGS = { 'FOO': True, 'BAR': False } here
# and FEATURE_FLAGS = { 'BAR': True, 'BAZ': True } in superset_config.py
# will result in combined feature flags of { 'FOO': True, 'BAR': True, 'BAZ': True }
DEFAULT_FEATURE_FLAGS: Dict[str, bool] = {
    # allow dashboard to use sub-domains to send chart request
    # you also need ENABLE_CORS and
    # SUPERSET_WEBSERVER_DOMAINS for list of domains
    "ALLOW_DASHBOARD_DOMAIN_SHARDING": True,
    # Experimental feature introducing a client (browser) cache
    "CLIENT_CACHE": False,
    "DISABLE_DATASET_SOURCE_EDIT": False,
    # When using a recent version of Druid that supports JOINs turn this on
    "DRUID_JOINS": False,
    "DYNAMIC_PLUGINS": False,
    # For some security concerns, you may need to enforce CSRF protection on
    # all query request to explore_json endpoint. In Superset, we use
    # `flask-csrf <https://sjl.bitbucket.io/flask-csrf/>`_ add csrf protection
    # for all POST requests, but this protection doesn't apply to GET method.
    # When ENABLE_EXPLORE_JSON_CSRF_PROTECTION is set to true, your users cannot
    # make GET request to explore_json. explore_json accepts both GET and POST request.
    # See `PR 7935 <https://github.com/apache/superset/pull/7935>`_ for more details.
    "ENABLE_EXPLORE_JSON_CSRF_PROTECTION": False,
    "ENABLE_TEMPLATE_PROCESSING": True,
    "ENABLE_TEMPLATE_REMOVE_FILTERS": True,
    "KV_STORE": False,
    # When this feature is enabled, nested types in Presto will be
    # expanded into extra columns and/or arrays. This is experimental,
    # and doesn't work with all nested types.
    "PRESTO_EXPAND_DATA": False,
    # Exposes API endpoint to compute thumbnails
    "THUMBNAILS": False,
    "DASHBOARD_CACHE": False,
    "REMOVE_SLICE_LEVEL_LABEL_COLORS": False,
    "SHARE_QUERIES_VIA_KV_STORE": False,
    "TAGGING_SYSTEM": False,
    "SQLLAB_BACKEND_PERSISTENCE": False,
    "LISTVIEWS_DEFAULT_CARD_VIEW": False,
    # Enables the replacement React views for all the FAB views (list, edit, show) with
    # designs introduced in https://github.com/apache/superset/issues/8976
    # (SIP-34). This is a work in progress so not all features available in FAB have
    # been implemented.
    "ENABLE_REACT_CRUD_VIEWS": True,
    # When True, this flag allows display of HTML tags in Markdown components
    "DISPLAY_MARKDOWN_HTML": True,
    # When True, this escapes HTML (rather than rendering it) in Markdown components
    "ESCAPE_MARKDOWN_HTML": False,
    "DASHBOARD_NATIVE_FILTERS": True,
    "DASHBOARD_CROSS_FILTERS": False,
    "DASHBOARD_NATIVE_FILTERS_SET": False,
    "DASHBOARD_FILTERS_EXPERIMENTAL": False,
    "GLOBAL_ASYNC_QUERIES": False,
    "VERSIONED_EXPORT": False,
    # Note that: RowLevelSecurityFilter is only given by default to the Admin role
    # and the Admin Role does have the all_datasources security permission.
    # But, if users create a specific role with access to RowLevelSecurityFilter MVC
    # and a custom datasource access, the table dropdown will not be correctly filtered
    # by that custom datasource access. So we are assuming a default security config,
    # a custom security config could potentially give access to setting filters on
    # tables that users do not have access to.
    "ROW_LEVEL_SECURITY": True,
    # Enables Alerts and reports new implementation
    "ALERT_REPORTS": False,
    # Enable experimental feature to search for other dashboards
    "OMNIBAR": False,
    "DASHBOARD_RBAC": False,
    "ENABLE_EXPLORE_DRAG_AND_DROP": False,
    "ENABLE_DND_WITH_CLICK_UX": False,
    # Enabling ALERTS_ATTACH_REPORTS, the system sends email and slack message
    # with screenshot and link
    # Disables ALERTS_ATTACH_REPORTS, the system DOES NOT generate screenshot
    # for report with type 'alert' and sends email and slack message with only link;
    # for report with type 'report' still send with email and slack message with
    # screenshot and link
    "ALERTS_ATTACH_REPORTS": True,
    # FORCE_DATABASE_CONNECTIONS_SSL is depreciated.
    "FORCE_DATABASE_CONNECTIONS_SSL": False,
    # Enabling ENFORCE_DB_ENCRYPTION_UI forces all database connections to be
    # encrypted before being saved into superset metastore.
    "ENFORCE_DB_ENCRYPTION_UI": False,
    # Allow users to export full CSV of table viz type.
    # This could cause the server to run out of memory or compute.
    "ALLOW_FULL_CSV_EXPORT": False,
    "UX_BETA": False,
}

# Feature flags may also be set via 'SUPERSET_FEATURE_' prefixed environment vars.
DEFAULT_FEATURE_FLAGS.update(
    {
        k[len("SUPERSET_FEATURE_") :]: parse_boolean_string(v)
        for k, v in os.environ.items()
        if re.search(r"^SUPERSET_FEATURE_\w+", k)
    }
)

# This is merely a default.
FEATURE_FLAGS: Dict[str, bool] = {}

# A function that receives a dict of all feature flags
# (DEFAULT_FEATURE_FLAGS merged with FEATURE_FLAGS)
# can alter it, and returns a similar dict. Note the dict of feature
# flags passed to the function is a deepcopy of the dict in the config,
# and can therefore be mutated without side-effect
#
# GET_FEATURE_FLAGS_FUNC can be used to implement progressive rollouts,
# role-based features, or a full on A/B testing framework.
#
# from flask import g, request
# def GET_FEATURE_FLAGS_FUNC(feature_flags_dict: Dict[str, bool]) -> Dict[str, bool]:
#     if hasattr(g, "user") and g.user.is_active:
#         feature_flags_dict['some_feature'] = g.user and g.user.get_id() == 5
#     return feature_flags_dict
GET_FEATURE_FLAGS_FUNC: Optional[Callable[[Dict[str, bool]], Dict[str, bool]]] = None
# A function that receives a feature flag name and an optional default value.
# Has a similar utility to GET_FEATURE_FLAGS_FUNC but it's useful to not force the
# evaluation of all feature flags when just evaluating a single one.
#
# Note that the default `get_feature_flags` will evaluate each feature with this
# callable when the config key is set, so don't use both GET_FEATURE_FLAGS_FUNC
# and IS_FEATURE_ENABLED_FUNC in conjunction.
IS_FEATURE_ENABLED_FUNC: Optional[Callable[[str, Optional[bool]], bool]] = None
# A function that expands/overrides the frontend `bootstrap_data.common` object.
# Can be used to implement custom frontend functionality,
# or dynamically change certain configs.
#
# Values in `bootstrap_data.common` should have these characteristics:
# - They are not specific to a page the user is visiting
# - They do not contain secrets
#
# Takes as a parameter the common bootstrap payload before transformations.
# Returns a dict containing data that should be added or overridden to the payload.
COMMON_BOOTSTRAP_OVERRIDES_FUNC: Callable[
    [Dict[str, Any]], Dict[str, Any]
] = lambda data: {}  # default: empty dict

# EXTRA_CATEGORICAL_COLOR_SCHEMES is used for adding custom categorical color schemes
# example code for "My custom warm to hot" color scheme
# EXTRA_CATEGORICAL_COLOR_SCHEMES = [
#     {
#         "id": 'myVisualizationColors',
#         "description": '',
#         "label": 'My Visualization Colors',
#         "isDefault": True,
#         "colors":
#          ['#006699', '#009DD9', '#5AAA46', '#44AAAA', '#DDAA77', '#7799BB', '#88AA77',
#          '#552288', '#5AAA46', '#CC7788', '#EEDD55', '#9977BB', '#BBAA44', '#DDCCDD']
#     }]

# This is merely a default
EXTRA_CATEGORICAL_COLOR_SCHEMES: List[Dict[str, Any]] = []

# THEME_OVERRIDES is used for adding custom theme to superset
# example code for "My theme" custom scheme
# THEME_OVERRIDES = {
#   "borderRadius": 4,
#   "colors": {
#     "primary": {
#       "base": 'red',
#     },
#     "secondary": {
#       "base": 'green',
#     },
#     "grayscale": {
#       "base": 'orange',
#     }
#   }
# }

THEME_OVERRIDES: Dict[str, Any] = {}

# EXTRA_SEQUENTIAL_COLOR_SCHEMES is used for adding custom sequential color schemes
# EXTRA_SEQUENTIAL_COLOR_SCHEMES =  [
#     {
#         "id": 'warmToHot',
#         "description": '',
#         "isDiverging": True,
#         "label": 'My custom warm to hot',
#         "isDefault": True,
#         "colors":
#          ['#552288', '#5AAA46', '#CC7788', '#EEDD55', '#9977BB', '#BBAA44', '#DDCCDD',
#          '#006699', '#009DD9', '#5AAA46', '#44AAAA', '#DDAA77', '#7799BB', '#88AA77']
#     }]

# This is merely a default
EXTRA_SEQUENTIAL_COLOR_SCHEMES: List[Dict[str, Any]] = []

# ---------------------------------------------------
# Thumbnail config (behind feature flag)
# Also used by Alerts & Reports
# ---------------------------------------------------
THUMBNAIL_SELENIUM_USER = "admin"
THUMBNAIL_CACHE_CONFIG: CacheConfig = {
    "CACHE_TYPE": "null",
    "CACHE_NO_NULL_WARNING": True,
}

# Time before selenium times out after trying to locate an element on the page and wait
# for that element to load for a screenshot.
SCREENSHOT_LOCATE_WAIT = int(timedelta(seconds=10).total_seconds())
# Time before selenium times out after waiting for all DOM class elements named
# "loading" are gone.
SCREENSHOT_LOAD_WAIT = int(timedelta(minutes=1).total_seconds())
# Selenium destroy retries
SCREENSHOT_SELENIUM_RETRIES = 5
# Give selenium an headstart, in seconds
SCREENSHOT_SELENIUM_HEADSTART = 3
# Wait for the chart animation, in seconds
SCREENSHOT_SELENIUM_ANIMATION_WAIT = 5

# ---------------------------------------------------
# Image and file configuration
# ---------------------------------------------------
# The file upload folder, when using models with files
UPLOAD_FOLDER = BASE_DIR + "/app/static/uploads/"
UPLOAD_CHUNK_SIZE = 4096

# The image upload folder, when using models with images
IMG_UPLOAD_FOLDER = BASE_DIR + "/app/static/uploads/"

# The image upload url, when using models with images
IMG_UPLOAD_URL = "/static/uploads/"
# Setup image size default is (300, 200, True)
# IMG_SIZE = (300, 200, True)

# Default cache timeout, applies to all cache backends unless specifically overridden in
# each cache config.
CACHE_DEFAULT_TIMEOUT = int(timedelta(days=1).total_seconds())

# Default cache for Superset objects
CACHE_CONFIG: CacheConfig = {"CACHE_TYPE": "null"}

# Cache for datasource metadata and query results
DATA_CACHE_CONFIG: CacheConfig = {"CACHE_TYPE": "null"}

# store cache keys by datasource UID (via CacheKey) for custom processing/invalidation
STORE_CACHE_KEYS_IN_METADATA_DB = False

# CORS Options
ENABLE_CORS = False
CORS_OPTIONS: Dict[Any, Any] = {}

# Chrome allows up to 6 open connections per domain at a time. When there are more
# than 6 slices in dashboard, a lot of time fetch requests are queued up and wait for
# next available socket. PR #5039 is trying to allow domain sharding for Superset,
# and this feature will be enabled by configuration only (by default Superset
# doesn't allow cross-domain request).
SUPERSET_WEBSERVER_DOMAINS = None

# Allowed format types for upload on Database view
EXCEL_EXTENSIONS = {"xlsx", "xls"}
CSV_EXTENSIONS = {"csv", "tsv", "txt"}
COLUMNAR_EXTENSIONS = {"parquet", "zip"}
ALLOWED_EXTENSIONS = {*EXCEL_EXTENSIONS, *CSV_EXTENSIONS, *COLUMNAR_EXTENSIONS}

# CSV Options: key/value pairs that will be passed as argument to DataFrame.to_csv
# method.
# note: index option should not be overridden
CSV_EXPORT = {"encoding": "utf-8"}

# ---------------------------------------------------
# Time grain configurations
# ---------------------------------------------------
# List of time grains to disable in the application (see list of builtin
# time grains in superset/db_engine_specs.builtin_time_grains).
# For example: to disable 1 second time grain:
# TIME_GRAIN_DENYLIST = ['PT1S']
TIME_GRAIN_DENYLIST: List[str] = []

# Additional time grains to be supported using similar definitions as in
# superset/db_engine_specs.builtin_time_grains.
# For example: To add a new 2 second time grain:
# TIME_GRAIN_ADDONS = {'PT2S': '2 second'}
TIME_GRAIN_ADDONS: Dict[str, str] = {}

# Implementation of additional time grains per engine.
# The column to be truncated is denoted `{col}` in the expression.
# For example: To implement 2 second time grain on clickhouse engine:
# TIME_GRAIN_ADDON_EXPRESSIONS = {
#     'clickhouse': {
#         'PT2S': 'toDateTime(intDiv(toUInt32(toDateTime({col})), 2)*2)'
#     }
# }
TIME_GRAIN_ADDON_EXPRESSIONS: Dict[str, Dict[str, str]] = {}

# ---------------------------------------------------
# List of viz_types not allowed in your environment
# For example: Disable pivot table and treemap:
#  VIZ_TYPE_DENYLIST = ['pivot_table', 'treemap']
# ---------------------------------------------------

VIZ_TYPE_DENYLIST: List[str] = []

# ---------------------------------------------------
# List of data sources not to be refreshed in druid cluster
# ---------------------------------------------------

DRUID_DATA_SOURCE_DENYLIST: List[str] = []

# --------------------------------------------------
# Modules, datasources and middleware to be registered
# --------------------------------------------------
DEFAULT_MODULE_DS_MAP = OrderedDict(
    [
        ("superset.connectors.sqla.models", ["SqlaTable"]),
        ("superset.connectors.druid.models", ["DruidDatasource"]),
    ]
)
ADDITIONAL_MODULE_DS_MAP: Dict[str, List[str]] = {}
ADDITIONAL_MIDDLEWARE: List[Callable[..., Any]] = []

# 1) https://docs.python-guide.org/writing/logging/
# 2) https://docs.python.org/2/library/logging.config.html

# Default configurator will consume the LOG_* settings below
LOGGING_CONFIGURATOR = DefaultLoggingConfigurator()

# Console Log Settings

LOG_FORMAT = "%(asctime)s:%(levelname)s:%(name)s:%(message)s"
LOG_LEVEL = "DEBUG"

# ---------------------------------------------------
# Enable Time Rotate Log Handler
# ---------------------------------------------------
# LOG_LEVEL = DEBUG, INFO, WARNING, ERROR, CRITICAL

ENABLE_TIME_ROTATE = False
TIME_ROTATE_LOG_LEVEL = "DEBUG"
FILENAME = os.path.join(DATA_DIR, "superset.log")
ROLLOVER = "midnight"
INTERVAL = 1
BACKUP_COUNT = 30

# Custom logger for auditing queries. This can be used to send ran queries to a
# structured immutable store for auditing purposes. The function is called for
# every query ran, in both SQL Lab and charts/dashboards.
# def QUERY_LOGGER(
#     database,
#     query,
#     schema=None,
#     user=None,
#     client=None,
#     security_manager=None,
#     log_params=None,
# ):
#     pass
QUERY_LOGGER = None

# Set this API key to enable Mapbox visualizations
MAPBOX_API_KEY = os.environ.get("MAPBOX_API_KEY", "")

# Set this license key to validate Ag Grid visualizations
AG_GRID_LICENSE_KEY = os.environ.get("AG_GRID_LICENSE_KEY", "")

# Maximum number of rows returned from a database
# in async mode, no more than SQL_MAX_ROW will be returned and stored
# in the results backend. This also becomes the limit when exporting CSVs
SQL_MAX_ROW = 100000

# Maximum number of rows displayed in SQL Lab UI
# Is set to avoid out of memory/localstorage issues in browsers. Does not affect
# exported CSVs
DISPLAY_MAX_ROW = 10000

# Default row limit for SQL Lab queries. Is overridden by setting a new limit in
# the SQL Lab UI
DEFAULT_SQLLAB_LIMIT = 1000

# Maximum number of tables/views displayed in the dropdown window in SQL Lab.
MAX_TABLE_NAMES = 3000

# Adds a warning message on sqllab save query and schedule query modals.
SQLLAB_SAVE_WARNING_MESSAGE = None
SQLLAB_SCHEDULE_WARNING_MESSAGE = None


# Default celery config is to use SQLA as a broker, in a production setting
# you'll want to use a proper broker as specified here:
# http://docs.celeryproject.org/en/latest/getting-started/brokers/index.html


class CeleryConfig:  # pylint: disable=too-few-public-methods
    BROKER_URL = "sqla+sqlite:///celerydb.sqlite"
    CELERY_IMPORTS = ("superset.sql_lab", "superset.tasks")
    CELERY_RESULT_BACKEND = "db+sqlite:///celery_results.sqlite"
    CELERYD_LOG_LEVEL = "DEBUG"
    CELERYD_PREFETCH_MULTIPLIER = 1
    CELERY_ACKS_LATE = False
    CELERY_ANNOTATIONS = {
        "sql_lab.get_sql_results": {"rate_limit": "100/s"},
        "email_reports.send": {
            "rate_limit": "1/s",
            "time_limit": int(timedelta(seconds=120).total_seconds()),
            "soft_time_limit": int(timedelta(seconds=150).total_seconds()),
            "ignore_result": True,
        },
    }
    CELERYBEAT_SCHEDULE = {
        "email_reports.schedule_hourly": {
            "task": "email_reports.schedule_hourly",
            "schedule": crontab(minute=1, hour="*"),
        },
        "reports.scheduler": {
            "task": "reports.scheduler",
            "schedule": crontab(minute="*", hour="*"),
        },
        "reports.prune_log": {
            "task": "reports.prune_log",
            "schedule": crontab(minute=0, hour=0),
        },
    }


CELERY_CONFIG = CeleryConfig  # pylint: disable=invalid-name

# Set celery config to None to disable all the above configuration
# CELERY_CONFIG = None

# Additional static HTTP headers to be served by your Superset server. Note
# Flask-Talisman applies the relevant security HTTP headers.
#
# DEFAULT_HTTP_HEADERS: sets default values for HTTP headers. These may be overridden
# within the app
# OVERRIDE_HTTP_HEADERS: sets override values for HTTP headers. These values will
# override anything set within the app
DEFAULT_HTTP_HEADERS: Dict[str, Any] = {}
OVERRIDE_HTTP_HEADERS: Dict[str, Any] = {}
HTTP_HEADERS: Dict[str, Any] = {}

# The db id here results in selecting this one as a default in SQL Lab
DEFAULT_DB_ID = None

# Timeout duration for SQL Lab synchronous queries
SQLLAB_TIMEOUT = int(timedelta(seconds=30).total_seconds())

# Timeout duration for SQL Lab query validation
SQLLAB_VALIDATION_TIMEOUT = int(timedelta(seconds=10).total_seconds())

# SQLLAB_DEFAULT_DBID
SQLLAB_DEFAULT_DBID = None

# The MAX duration a query can run for before being killed by celery.
SQLLAB_ASYNC_TIME_LIMIT_SEC = int(timedelta(hours=6).total_seconds())

# Some databases support running EXPLAIN queries that allow users to estimate
# query costs before they run. These EXPLAIN queries should have a small
# timeout.
SQLLAB_QUERY_COST_ESTIMATE_TIMEOUT = int(timedelta(seconds=10).total_seconds())
# The feature is off by default, and currently only supported in Presto and Postgres.
# It also need to be enabled on a per-database basis, by adding the key/value pair
# `cost_estimate_enabled: true` to the database `extra` attribute.
ESTIMATE_QUERY_COST = False
# The cost returned by the databases is a relative value; in order to map the cost to
# a tangible value you need to define a custom formatter that takes into consideration
# your specific infrastructure. For example, you could analyze queries a posteriori by
# running EXPLAIN on them, and compute a histogram of relative costs to present the
# cost as a percentile:
#
# def postgres_query_cost_formatter(
#     result: List[Dict[str, Any]]
# ) -> List[Dict[str, str]]:
#     # 25, 50, 75% percentiles
#     percentile_costs = [100.0, 1000.0, 10000.0]
#
#     out = []
#     for row in result:
#         relative_cost = row["Total cost"]
#         percentile = bisect.bisect_left(percentile_costs, relative_cost) + 1
#         out.append({
#             "Relative cost": relative_cost,
#             "Percentile": str(percentile * 25) + "%",
#         })
#
#     return out
#
# FEATURE_FLAGS = {
#     "ESTIMATE_QUERY_COST": True,
#     "QUERY_COST_FORMATTERS_BY_ENGINE": {"postgresql": postgres_query_cost_formatter},
# }

# Flag that controls if limit should be enforced on the CTA (create table as queries).
SQLLAB_CTAS_NO_LIMIT = False

# This allows you to define custom logic around the "CREATE TABLE AS" or CTAS feature
# in SQL Lab that defines where the target schema should be for a given user.
# Database `CTAS Schema` has a precedence over this setting.
# Example below returns a username and CTA queries will write tables into the schema
# name `username`
# SQLLAB_CTAS_SCHEMA_NAME_FUNC = lambda database, user, schema, sql: user.username
# This is move involved example where depending on the database you can leverage data
# available to assign schema for the CTA query:
# def compute_schema_name(database: Database, user: User, schema: str, sql: str) -> str:
#     if database.name == 'mysql_payments_slave':
#         return 'tmp_superset_schema'
#     if database.name == 'presto_gold':
#         return user.username
#     if database.name == 'analytics':
#         if 'analytics' in [r.name for r in user.roles]:
#             return 'analytics_cta'
#         else:
#             return f'tmp_{schema}'
# Function accepts database object, user object, schema name and sql that will be run.
SQLLAB_CTAS_SCHEMA_NAME_FUNC: Optional[
    Callable[["Database", "models.User", str, str], str]
] = None

# If enabled, it can be used to store the results of long-running queries
# in SQL Lab by using the "Run Async" button/feature
RESULTS_BACKEND: Optional[BaseCache] = None

# Use PyArrow and MessagePack for async query results serialization,
# rather than JSON. This feature requires additional testing from the
# community before it is fully adopted, so this config option is provided
# in order to disable should breaking issues be discovered.
RESULTS_BACKEND_USE_MSGPACK = True

# The S3 bucket where you want to store your external hive tables created
# from CSV files. For example, 'companyname-superset'
CSV_TO_HIVE_UPLOAD_S3_BUCKET = None

# The directory within the bucket specified above that will
# contain all the external tables
CSV_TO_HIVE_UPLOAD_DIRECTORY = "EXTERNAL_HIVE_TABLES/"
# Function that creates upload directory dynamically based on the
# database used, user and schema provided.
def CSV_TO_HIVE_UPLOAD_DIRECTORY_FUNC(  # pylint: disable=invalid-name
    database: "Database",
    user: "models.User",  # pylint: disable=unused-argument
    schema: Optional[str],
) -> str:
    # Note the final empty path enforces a trailing slash.
    return os.path.join(
        CSV_TO_HIVE_UPLOAD_DIRECTORY, str(database.id), schema or "", ""
    )


# The namespace within hive where the tables created from
# uploading CSVs will be stored.
UPLOADED_CSV_HIVE_NAMESPACE: Optional[str] = None

# Function that computes the allowed schemas for the CSV uploads.
# Allowed schemas will be a union of schemas_allowed_for_csv_upload
# db configuration and a result of this function.

# mypy doesn't catch that if case ensures list content being always str
ALLOWED_USER_CSV_SCHEMA_FUNC: Callable[["Database", "models.User"], List[str]] = (
    lambda database, user: [UPLOADED_CSV_HIVE_NAMESPACE]
    if UPLOADED_CSV_HIVE_NAMESPACE
    else []
)

# Values that should be treated as nulls for the csv uploads.
CSV_DEFAULT_NA_NAMES = list(STR_NA_VALUES)

# A dictionary of items that gets merged into the Jinja context for
# SQL Lab. The existing context gets updated with this dictionary,
# meaning values for existing keys get overwritten by the content of this
# dictionary. Exposing functionality through JINJA_CONTEXT_ADDONS has security
# implications as it opens a window for a user to execute untrusted code.
# It's important to make sure that the objects exposed (as well as objects attached
# to those objets) are harmless. We recommend only exposing simple/pure functions that
# return native types.
JINJA_CONTEXT_ADDONS: Dict[str, Callable[..., Any]] = {}

# A dictionary of macro template processors (by engine) that gets merged into global
# template processors. The existing template processors get updated with this
# dictionary, which means the existing keys get overwritten by the content of this
# dictionary. The customized addons don't necessarily need to use Jinja templating
# language. This allows you to define custom logic to process templates on a per-engine
# basis. Example value = `{"presto": CustomPrestoTemplateProcessor}`
CUSTOM_TEMPLATE_PROCESSORS: Dict[str, Type[BaseTemplateProcessor]] = {}

# Roles that are controlled by the API / Superset and should not be changes
# by humans.
ROBOT_PERMISSION_ROLES = ["Public", "Gamma", "Alpha", "Admin", "sql_lab"]

CONFIG_PATH_ENV_VAR = "SUPERSET_CONFIG_PATH"

# If a callable is specified, it will be called at app startup while passing
# a reference to the Flask app. This can be used to alter the Flask app
# in whatever way.
# example: FLASK_APP_MUTATOR = lambda x: x.before_request = f
FLASK_APP_MUTATOR = None

# Set this to false if you don't want users to be able to request/grant
# datasource access requests from/to other users.
ENABLE_ACCESS_REQUEST = False

# smtp server configuration
EMAIL_NOTIFICATIONS = False  # all the emails are sent using dryrun
SMTP_HOST = "localhost"
SMTP_STARTTLS = True
SMTP_SSL = False
SMTP_USER = "superset"
SMTP_PORT = 25
SMTP_PASSWORD = "superset"
SMTP_MAIL_FROM = "superset@superset.com"

ENABLE_CHUNK_ENCODING = False

# Whether to bump the logging level to ERROR on the flask_appbuilder package
# Set to False if/when debugging FAB related issues like
# permission management
SILENCE_FAB = True

FAB_ADD_SECURITY_VIEWS = True
FAB_ADD_SECURITY_PERMISSION_VIEW = False
FAB_ADD_SECURITY_VIEW_MENU_VIEW = False
FAB_ADD_SECURITY_PERMISSION_VIEWS_VIEW = False

# The link to a page containing common errors and their resolutions
# It will be appended at the bottom of sql_lab errors.
TROUBLESHOOTING_LINK = ""

# CSRF token timeout, set to None for a token that never expires
WTF_CSRF_TIME_LIMIT = int(timedelta(weeks=1).total_seconds())

# This link should lead to a page with instructions on how to gain access to a
# Datasource. It will be placed at the bottom of permissions errors.
PERMISSION_INSTRUCTIONS_LINK = ""

# Integrate external Blueprints to the app by passing them to your
# configuration. These blueprints will get integrated in the app
BLUEPRINTS: List[Blueprint] = []

# Provide a callable that receives a tracking_url and returns another
# URL. This is used to translate internal Hadoop job tracker URL
# into a proxied one
TRACKING_URL_TRANSFORMER = lambda x: x

# Interval between consecutive polls when using Hive Engine
HIVE_POLL_INTERVAL = int(timedelta(seconds=5).total_seconds())

# Interval between consecutive polls when using Presto Engine
# See here: https://github.com/dropbox/PyHive/blob/8eb0aeab8ca300f3024655419b93dad926c1a351/pyhive/presto.py#L93  # pylint: disable=line-too-long,useless-suppression
PRESTO_POLL_INTERVAL = int(timedelta(seconds=1).total_seconds())

# Allow for javascript controls components
# this enables programmers to customize certain charts (like the
# geospatial ones) by inputing javascript in controls. This exposes
# an XSS security vulnerability
ENABLE_JAVASCRIPT_CONTROLS = False

# The id of a template dashboard that should be copied to every new user
DASHBOARD_TEMPLATE_ID = None

# A callable that allows altering the database connection URL and params
# on the fly, at runtime. This allows for things like impersonation or
# arbitrary logic. For instance you can wire different users to
# use different connection parameters, or pass their email address as the
# username. The function receives the connection uri object, connection
# params, the username, and returns the mutated uri and params objects.
# Example:
#   def DB_CONNECTION_MUTATOR(uri, params, username, security_manager, source):
#       user = security_manager.find_user(username=username)
#       if user and user.email:
#           uri.username = user.email
#       return uri, params
#
# Note that the returned uri and params are passed directly to sqlalchemy's
# as such `create_engine(url, **params)`
DB_CONNECTION_MUTATOR = None

# A function that intercepts the SQL to be executed and can alter it.
# The use case is can be around adding some sort of comment header
# with information such as the username and worker node information
#
#    def SQL_QUERY_MUTATOR(sql, user_name, security_manager, database):
#        dttm = datetime.now().isoformat()
#        return f"-- [SQL LAB] {username} {dttm}\n{sql}"
def SQL_QUERY_MUTATOR(  # pylint: disable=invalid-name,unused-argument
    sql: str,
    user_name: Optional[str],
    security_manager: LocalProxy,
    database: "Database",
) -> str:
    return sql


# Enable / disable scheduled email reports
#
# Warning: This config key is deprecated and will be removed in version 2.0.0"
ENABLE_SCHEDULED_EMAIL_REPORTS = False

# Enable / disable Alerts, where users can define custom SQL that
# will send emails with screenshots of charts or dashboards periodically
# if it meets the criteria
#
# Warning: This config key is deprecated and will be removed in version 2.0.0"
ENABLE_ALERTS = False

# ---------------------------------------------------
# Alerts & Reports
# ---------------------------------------------------
# Used for Alerts/Reports (Feature flask ALERT_REPORTS) to set the size for the
# sliding cron window size, should be synced with the celery beat config minus 1 second
ALERT_REPORTS_CRON_WINDOW_SIZE = 59
ALERT_REPORTS_WORKING_TIME_OUT_KILL = True
# if ALERT_REPORTS_WORKING_TIME_OUT_KILL is True, set a celery hard timeout
# Equal to working timeout + ALERT_REPORTS_WORKING_TIME_OUT_LAG
ALERT_REPORTS_WORKING_TIME_OUT_LAG = int(timedelta(seconds=10).total_seconds())
# if ALERT_REPORTS_WORKING_TIME_OUT_KILL is True, set a celery hard timeout
# Equal to working timeout + ALERT_REPORTS_WORKING_SOFT_TIME_OUT_LAG
ALERT_REPORTS_WORKING_SOFT_TIME_OUT_LAG = int(timedelta(seconds=1).total_seconds())
# If set to true no notification is sent, the worker will just log a message.
# Useful for debugging
ALERT_REPORTS_NOTIFICATION_DRY_RUN = False

# A custom prefix to use on all Alerts & Reports emails
EMAIL_REPORTS_SUBJECT_PREFIX = "[Report] "

# Slack API token for the superset reports, either string or callable
SLACK_API_TOKEN: Optional[Union[Callable[[], str], str]] = None
SLACK_PROXY = None

# If enabled, certain features are run in debug mode
# Current list:
# * Emails are sent using dry-run mode (logging only)
#
# Warning: This config key is deprecated and will be removed in version 2.0.0"
SCHEDULED_EMAIL_DEBUG_MODE = False

# This auth provider is used by background (offline) tasks that need to access
# protected resources. Can be overridden by end users in order to support
# custom auth mechanisms
MACHINE_AUTH_PROVIDER_CLASS = "superset.utils.machine_auth.MachineAuthProvider"

# Email reports - minimum time resolution (in minutes) for the crontab
#
# Warning: This config key is deprecated and will be removed in version 2.0.0"
EMAIL_REPORTS_CRON_RESOLUTION = 15

# The MAX duration (in seconds) a email schedule can run for before being killed
# by celery.
#
# Warning: This config key is deprecated and will be removed in version 2.0.0"
EMAIL_ASYNC_TIME_LIMIT_SEC = int(timedelta(minutes=5).total_seconds())

# Send bcc of all reports to this address. Set to None to disable.
# This is useful for maintaining an audit trail of all email deliveries.
#
# Warning: This config key is deprecated and will be removed in version 2.0.0"
EMAIL_REPORT_BCC_ADDRESS = None

# User credentials to use for generating reports
# This user should have permissions to browse all the dashboards and
# slices.
# TODO: In the future, login as the owner of the item to generate reports
#
# Warning: This config key is deprecated and will be removed in version 2.0.0"
EMAIL_REPORTS_USER = "admin"

# The webdriver to use for generating reports. Use one of the following
# firefox
#   Requires: geckodriver and firefox installations
#   Limitations: can be buggy at times
# chrome:
#   Requires: headless chrome
#   Limitations: unable to generate screenshots of elements
WEBDRIVER_TYPE = "firefox"

# Window size - this will impact the rendering of the data
WEBDRIVER_WINDOW = {"dashboard": (1600, 2000), "slice": (3000, 1200)}

# An optional override to the default auth hook used to provide auth to the
# offline webdriver
WEBDRIVER_AUTH_FUNC = None

# Any config options to be passed as-is to the webdriver
WEBDRIVER_CONFIGURATION: Dict[Any, Any] = {"service_log_path": "/dev/null"}

# Additional args to be passed as arguments to the config object
# Note: these options are Chrome-specific. For FF, these should
# only include the "--headless" arg
WEBDRIVER_OPTION_ARGS = ["--headless", "--marionette"]

# The base URL to query for accessing the user interface
WEBDRIVER_BASEURL = "http://0.0.0.0:8080/"
# The base URL for the email report hyperlinks.
WEBDRIVER_BASEURL_USER_FRIENDLY = WEBDRIVER_BASEURL
# Time selenium will wait for the page to load and render for the email report.
EMAIL_PAGE_RENDER_WAIT = int(timedelta(seconds=30).total_seconds())

# Send user to a link where they can report bugs
BUG_REPORT_URL = None

# Send user to a link where they can read more about Superset
DOCUMENTATION_URL = None
DOCUMENTATION_TEXT = "Documentation"
DOCUMENTATION_ICON = None  # Recommended size: 16x16

# What is the Last N days relative in the time selector to:
# 'today' means it is midnight (00:00:00) in the local timezone
# 'now' means it is relative to the query issue time
# If both start and end time is set to now, this will make the time
# filter a moving window. By only setting the end time to now,
# start time will be set to midnight, while end will be relative to
# the query issue time.
DEFAULT_RELATIVE_START_TIME = "today"
DEFAULT_RELATIVE_END_TIME = "today"

# Configure which SQL validator to use for each engine
SQL_VALIDATORS_BY_ENGINE = {
    "presto": "PrestoDBSQLValidator",
    "postgresql": "PostgreSQLValidator",
}

# A list of preferred databases, in order. These databases will be
# displayed prominently in the "Add Database" dialog. You should
# use the "engine_name" attribute of the corresponding DB engine spec
# in `superset/db_engine_specs/`.
PREFERRED_DATABASES: List[str] = [
    "PostgreSQL",
    "Presto",
    "MySQL",
    "SQLite",
    # etc.
]

# Do you want Talisman enabled?
TALISMAN_ENABLED = False
# If you want Talisman, how do you want it configured??
TALISMAN_CONFIG = {
    "content_security_policy": None,
    "force_https": True,
    "force_https_permanent": False,
}

# It is possible to customize which tables and roles are featured in the RLS
# dropdown. When set, this dict is assigned to `add_form_query_rel_fields` and
# `edit_form_query_rel_fields` on `RowLevelSecurityFiltersModelView`. Example:
#
# from flask_appbuilder.models.sqla import filters
# RLS_FORM_QUERY_REL_FIELDS = {
#     "roles": [["name", filters.FilterStartsWith, "RlsRole"]]
#     "tables": [["table_name", filters.FilterContains, "rls"]]
# }
RLS_FORM_QUERY_REL_FIELDS: Optional[Dict[str, List[List[Any]]]] = None

#
# Flask session cookie options
#
# See https://flask.palletsprojects.com/en/1.1.x/security/#set-cookie-options
# for details
#
SESSION_COOKIE_HTTPONLY = True  # Prevent cookie from being read by frontend JS?
SESSION_COOKIE_SECURE = False  # Prevent cookie from being transmitted over non-tls?
SESSION_COOKIE_SAMESITE = "Lax"  # One of [None, 'None', 'Lax', 'Strict']

# Cache static resources.
SEND_FILE_MAX_AGE_DEFAULT = int(timedelta(days=365).total_seconds())

# URI to database storing the example data, points to
# SQLALCHEMY_DATABASE_URI by default if set to `None`
SQLALCHEMY_EXAMPLES_URI = None

# Some sqlalchemy connection strings can open Superset to security risks.
# Typically these should not be allowed.
PREVENT_UNSAFE_DB_CONNECTIONS = True

# Path used to store SSL certificates that are generated when using custom certs.
# Defaults to temporary directory.
# Example: SSL_CERT_PATH = "/certs"
SSL_CERT_PATH: Optional[str] = None

# SIP-15 should be enabled for all new Superset deployments which ensures that the time
# range endpoints adhere to [start, end). For existing deployments admins should provide
# a dedicated period of time to allow chart producers to update their charts before
# mass migrating all charts to use the [start, end) interval.
#
# Note if no end date for the grace period is specified then the grace period is
# indefinite.
SIP_15_ENABLED = True
SIP_15_GRACE_PERIOD_END: Optional[date] = None  # exclusive
SIP_15_DEFAULT_TIME_RANGE_ENDPOINTS = ["unknown", "inclusive"]
SIP_15_TOAST_MESSAGE = (
    "Action Required: Preview then save your chart using the "
    'new time range endpoints <a target="_blank" href="{url}" '
    'class="alert-link">here</a>.'
)

# Turn this key to False to disable ownership check on the old dataset MVC and
# datasource API /datasource/save.
#
# Warning: This config key is deprecated and will be removed in version 2.0.0"
OLD_API_CHECK_DATASET_OWNERSHIP = True

# SQLA table mutator, every time we fetch the metadata for a certain table
# (superset.connectors.sqla.models.SqlaTable), we call this hook
# to allow mutating the object with this callback.
# This can be used to set any properties of the object based on naming
# conventions and such. You can find examples in the tests.
SQLA_TABLE_MUTATOR = lambda table: table

# Global async query config options.
# Requires GLOBAL_ASYNC_QUERIES feature flag to be enabled.
GLOBAL_ASYNC_QUERIES_REDIS_CONFIG = {
    "port": 6379,
    "host": "127.0.0.1",
    "password": "",
    "db": 0,
    "ssl": False,
}
GLOBAL_ASYNC_QUERIES_REDIS_STREAM_PREFIX = "async-events-"
GLOBAL_ASYNC_QUERIES_REDIS_STREAM_LIMIT = 1000
GLOBAL_ASYNC_QUERIES_REDIS_STREAM_LIMIT_FIREHOSE = 1000000
GLOBAL_ASYNC_QUERIES_JWT_COOKIE_NAME = "async-token"
GLOBAL_ASYNC_QUERIES_JWT_COOKIE_SECURE = False
GLOBAL_ASYNC_QUERIES_JWT_COOKIE_DOMAIN = None
GLOBAL_ASYNC_QUERIES_JWT_SECRET = "test-secret-change-me"
GLOBAL_ASYNC_QUERIES_TRANSPORT = "polling"
GLOBAL_ASYNC_QUERIES_POLLING_DELAY = int(
    timedelta(milliseconds=500).total_seconds() * 1000
)
GLOBAL_ASYNC_QUERIES_WEBSOCKET_URL = "ws://127.0.0.1:8080/"

# A SQL dataset health check. Note if enabled it is strongly advised that the callable
# be memoized to aid with performance, i.e.,
#
#    @cache_manager.cache.memoize(timeout=0)
#    def DATASET_HEALTH_CHECK(datasource: SqlaTable) -> Optional[str]:
#        if (
#            datasource.sql and
#            len(sql_parse.ParsedQuery(datasource.sql, strip_comments=True).tables) == 1
#        ):
#            return (
#                "This virtual dataset queries only one table and therefore could be "
#                "replaced by querying the table directly."
#            )
#
#        return None
#
# Within the FLASK_APP_MUTATOR callable, i.e., once the application and thus cache have
# been initialized it is also necessary to add the following logic to blow the cache for
# all datasources if the callback function changed.
#
#    def FLASK_APP_MUTATOR(app: Flask) -> None:
#        name = "DATASET_HEALTH_CHECK"
#        func = app.config[name]
#        code = func.uncached.__code__.co_code
#
#        if cache_manager.cache.get(name) != code:
#            cache_manager.cache.delete_memoized(func)
#            cache_manager.cache.set(name, code, timeout=0)
#
DATASET_HEALTH_CHECK: Optional[Callable[["SqlaTable"], str]] = None

# Do not show user info or profile in the menu
MENU_HIDE_USER_INFO = False

# SQLalchemy link doc reference
SQLALCHEMY_DOCS_URL = "https://docs.sqlalchemy.org/en/13/core/engines.html"
SQLALCHEMY_DISPLAY_TEXT = "SQLAlchemy docs"

import os
import logging
import re
from typing import Any, List
import requests
import urllib
import json
from sqlalchemy.engine.base import Connection
from sqlalchemy.orm.mapper import Mapper
from sqlalchemy.sql import text
from flask import session
from flask_login import current_user
import msal

from superset.security import SupersetSecurityManager

from flask_appbuilder.security.sqla.models import (
    PermissionView,
    assoc_permissionview_role,
)



log = logging.getLogger(__name__)

GAMMA_PLUS = "GammaPlus"


class DynamicRoleSecurityManager(SupersetSecurityManager):

    AUTH_ROLES_SYNC_AT_LOGIN = True
    
    azureClient = msal.ConfidentialClientApplication( 
        client_credential='fcW7Q~NP5q5P4u2xVZl-G4-nMapXKYlh.tTXU',
        client_id='9857feba-e79f-4e57-b587-92fd33fd0389',
        authority='https://login.microsoftonline.com/da9cbe40-ec1e-4997-afb3-17d87574571a'
    )


    def __init__(self, appbuilder) -> None:
        super().__init__(appbuilder)

        self.included_roles: List[str] = self.appbuilder.app.config.get("INCLUDED_ROLES", [])

        # [db_name].[schema_name] or [db_name].[datasource_name]
        self.view_name_pattern = re.compile('\[(.+)\]\.\[(.+)]')
        # [db_name].(database_id)
        self.db_view_name_pattern = re.compile('\[(.+)\]\.\((.+)\)')
        # Datasources which match this pattern will be available to all GammaPlus users, regardless of schema
        # or database level permissions.
        self.shared_pattern = re.compile('shared_.+')

    # Additional permissions to be granted to GammaPlus users which are not user defined permissions
    # (see _is_user_defined_permission() )
    GAMMA_PLUS_PERMISSION_VIEWS = {
            "can_write": "Dataset",
            "can_save": "Datasource",
            "can_function_names": "Database"
        }

    def oauth_user_info(self, provider, resp):
        if provider == "azure":
            log.debug("Azure response received : {0}".format(resp))
            id_token = resp["id_token"]
            log.debug(str(id_token))
            me = self._azure_jwt_token_parse(id_token)
            log.info("Parse JWT token : {0}".format(me))
            # Refresh and cache tokens in msal
            self.azureClient.acquire_token_by_refresh_token(refresh_token=resp["refresh_token"], scopes=[''])

            graph_access_token = self.msal_fetch_access_token_silent(scopes=['User.Read'], flask_user=me["oid"])
            
            member_objects_response = requests.post('https://graph.microsoft.com/v1.0/users/{0}/getMemberObjects'.format(me["oid"]),
                headers={
                    "Authorization": "Bearer {0}".format(graph_access_token),
                    "Content-Type": "application/json"
                },
                data = json.dumps({ "securityEnabledOnly": True }))
            member_objects_response.raise_for_status()
            user_membership = member_objects_response.json()["value"]
            log.debug("User memberships: {0}".format(user_membership))

            return {
                "name": me["name"],
                # Note that for 'email' to be returned as part of the token, the optional claim must be added to the App Registration in Azure
                "email": me["email"],
                "first_name": me.get("given_name", ""), # Optional claim may not be present (e.g. for guest accounts)
                "last_name": me.get("family_name", ""), # Optional claim may not be present (e.g. for guest accounts)
                "id": me["oid"],
                "username": me["oid"],
                "groups": user_membership,
                # This is for the AUTH_ROLES_MAPPING
                "role_keys": user_membership,
            }
        else:
            return {}
    
    def msal_fetch_access_token_silent(self, flask_user, scopes=[]):
        response = self.msal_fetch_response_silent(flask_user, scopes)
        token = ''

        if response: 
            oauth_provider = session['oauth_provider']
            token = response[self.get_oauth_token_key_name(oauth_provider)]
        
        return token
    
    def msal_fetch_response_silent(self, flask_user, scopes):
        account = self.msal_fetch_user_account(flask_user)
        try:
            return self.azureClient.acquire_token_silent(account=account, scopes=scopes)
        except Exception as e:
            log.error("MSAL error obtaining silent token: {0}".format(e) , exc_info=1)
            return {}


    def msal_fetch_user_account(self, flask_user):
        log.info("FETCHING THE USER")
        log.info(self.azureClient.get_accounts())
        log.info(flask_user)
        accounts = [x for x in self.azureClient.get_accounts() if x["local_account_id"] == flask_user]
        if not accounts:
            raise Exception("User not found")
        elif len(accounts) > 1:
            raise Exception("Multiple users found")
        return accounts[0]

    def auth_user_oauth(self, userinfo):
        user = super().auth_user_oauth(userinfo)
        # If user has changes, update the user
        # Note is is not needed to check for roles as that is handeled by super().auth_user_oauth(userinfo)
        print("THE USER")
        print(user.__dict__)
        if ( userinfo.get("username", "") != user.username 
            or userinfo.get("first_name", "") != user.first_name 
            or userinfo.get("last_name", "") != user.last_name 
            or userinfo.get("email", "") != user.email 
        ):
            user.username = userinfo.get("username", "")
            user.first_name = userinfo.get("first_name", "")
            user.last_name = userinfo.get("last_name", "")
            user.email = userinfo.get("email", "")
            self.update_user(user)
        return user
CUSTOM_SECURITY_MANAGER = DynamicRoleSecurityManager


AUTH_USER_REGISTRATION = True
from flask_appbuilder.security.manager import AUTH_OAUTH
AUTH_TYPE = AUTH_OAUTH
OAUTH_PROVIDERS = [
    {
        "name": "azure",
        "icon": "fa-windows",
        "token_key": "access_token",
        "remote_app": {
            "client_id": '9857feba-e79f-4e57-b587-92fd33fd0389',
            "client_secret": 'fcW7Q~NP5q5P4u2xVZl-G4-nMapXKYlh.tTXU',
            "api_base_url": "https://login.microsoftonline.com/{0}/oauth2/v2.0".format('da9cbe40-ec1e-4997-afb3-17d87574571a'),
            "client_kwargs": {
                "scope": "{0}/.default profile openid email offline_access".format('9857feba-e79f-4e57-b587-92fd33fd0389')
            },
            "request_token_url": None,
            "access_token_url": "https://login.microsoftonline.com/{0}/oauth2/v2.0/token".format('da9cbe40-ec1e-4997-afb3-17d87574571a'),
            "authorize_url": "https://login.microsoftonline.com/{0}/oauth2/v2.0/authorize".format('da9cbe40-ec1e-4997-afb3-17d87574571a'),
        },
    },
]



import logging
import json
import os
import requests
import urllib
from flask_login import current_user
from trino.auth import JWTAuthentication


logger = logging.getLogger(__name__)

def mutate_db_connection(uri, params, username, security_manager, source):
    """Mutates any Trino database connection to include the required fields for user impersonation.

    This implementation will set params['connect_args']['user'] to the user's e-mail
    address or, if the user doesn't have an e-mail address, their username. If both of those fields
    are None, this function makes sure that no user impersonation will occur.

    For more information, see Superset's template config.py file
    (https://github.com/apache/superset/blob/7697bc297c5da16069713e248fe16574dff40dfc/superset/config.py#L888)
    """
    if uri.drivername == 'trino':
        # TODO If provider not auzre do somthing else:
        connect_args = params.setdefault('connect_args', dict())
        trino_scope = 'api://2d1c8df8-f208-49ff-9004-ba77565cfccc/user_impersonation'
        user = current_user
        logger.info("THIS IS MY SUER FLASK")
        logger.info(current_user.__dict__)
        if trino_scope and user:
            try:

                trino_token = security_manager.msal_fetch_access_token_silent(flask_user=user.username,scopes=[trino_scope])
                logger.info("THIS IS MY TOKEN")
                logger.info(trino_token)
                if not trino_token:
                    raise Exception("Unable to fetch token")
                connect_args['auth'] = JWTAuthentication(trino_token)
            except requests.exceptions.HTTPError as err:
                logger.error("Error obtaining on-behalf-of Trino token: %s" % err)
            except Exception as e:
                logger.error("Error obtaining on-behalf-of Trino token: %s" % e)
        
        # TODO: When fission is used again re add this token
        #fission_token = security_manager.get_on_behalf_of_access_token('{0}/default'.format(fission_client_id))
        fission_token = ''


        if user:
            db_username = user.email if user.email else user.username
            if db_username:
                connect_args['user'] = db_username
            else:
                connect_args.pop('user')
            if fission_token:
                connect_args['http_headers'] = {'X-Trino-Extra-Credential': f"access-token={fission_token}"}

        logger.info("IM DONE")
    return uri, params

DB_CONNECTION_MUTATOR = mutate_db_connection









import ipaddress
import logging
import socket
import struct
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple

from superset.utils.core import FilterOperator

logger = logging.getLogger(__name__)


def ipv4str_to_number(addr):
    """
    Return the numerical representation of the provided ip string.

    :param addr: The ip string
    :returns: numerical value
    """
    if type(addr) == int:
        return addr
    else:
        return struct.unpack("!I", socket.inet_aton(addr.strip()))[0]


def render_ipv4_between_number_columns(filters, start, end) -> str:
    """
    Return a WHERE clause for ip addresses converted to integer value across
    two columns in a table.

    :param filters: The filters passed in from a superset function call
    :param start: Column containing start integer IP addresses
    :param end: Column containing end integer IP addresses
    :returns: proper WHERE clause for start and end OR a blank response which
              will have no impact on the original query
    """
    added_condition = False
    sql = " AND ("
    for flt in filters:
        if added_condition:
            sql += " OR "
        val = flt.get("val")
        sql += _render_ipv4_between_number_columns(start, end, val)
        added_condition = True
    sql += ")"
    return sql if added_condition else ""


def render_ipv4_between_number_columns_or_nothing(filters, start, end) -> str:
    """
    Return a WHERE clause for ip addresses convert to integer value across two
    columns in a table.  If a valid clause can't be generated then return a
    clause that will render no results.

    :param filters: The filters passed in from a superset function call
    :param start: Column containing start integer IP addresses
    :param end: Column containing end integer IP addresses
    :returns: proper WHERE clause for start and end OR a WHERE clause that will
              not return results (no filter value passed in)
    """
    sql = render_ipv4_between_number_columns(filters, start, end)
    return sql if sql != "" else " AND 1 = 2"


def _render_ipv4_between_number_columns(start, end, val) -> str:
    """
    Return the rendering of an ip string value falling between a low
        and high ip column.

    :param low_col: The name of the low column.
    :param high_col: The name of the high column.
    :param val: An array of ip string values.
    :returns: SQL.
    """
    conditions = []
    for cidr in val:
        if type(cidr) == int:
            ip = cidr
            conditions.append(f"({start} <= {ip} AND {end} >= {ip})")
        else:
            ips = ipaddress.IPv4Network(cidr.strip(), strict=False)
            if ips.num_addresses > 1:
                # regex prevents calling this function with cidr values
                # if we ever want to support such values we would do it here.
                low = ipv4str_to_number(str(ips[0]))
                high = ipv4str_to_number(str(ips[ips.num_addresses - 1]))
                cond = f"""( ({start} <= {low} AND {end} >= {low})
                    OR ({start} <= {high} AND {end} >= {high})
                    OR ({low} <= {start} AND {end} <= {high}) )"""
                conditions.append(cond)
            else:
                ip = ipv4str_to_number(str(ips[0]))
                conditions.append(f"({start} <= {ip} AND {end} >= {ip})")
    # ("START_IP" >= 16777216 AND "END_IP" <= 16777216)
    # OR ("START_IP" >= 16777216 AND "END_IP" <= 3332232)
    # OR ("START_IP" >= 45689644 AND "END_IP" <= 45689644)
    return " OR ".join(conditions)


def render_in_conditions(ip_array, ip_column_name) -> str:
    """
    Return the rendering of an ip string value on the provided column.

    :param ip_column_name: Name of the column.
    :param ip_array: A list of ip string values. These can include CIDR ranges.
    :returns: List of conditions to OR.
    """
    conditions = []
    for cidr in ip_array:
        if type(cidr) == int:
            ip = cidr
            conditions.append(f"({ip_column_name} = {ip})")
        else:
            ips = ipaddress.IPv4Network(cidr.strip(), strict=False)
            if ips.num_addresses > 1:
                low = ipv4str_to_number(str(ips[0]))
                high = ipv4str_to_number(str(ips[ips.num_addresses - 1]))
                conditions.append(
                    f"({ip_column_name} >= {low} AND {ip_column_name} <= {high})"
                )
            else:
                ip = ipv4str_to_number(str(ips[0]))
                conditions.append(f"({ip_column_name} = {ip})")
    return conditions


def render_ipv4_number_column(filters, col: str) -> str:
    sql = ""
    for flt in filters:
        op = flt.get("op")
        val = flt.get("val")
        sql += " AND (" + _render_ipv4_number_column(col, op, val) + ")"
    return sql


def _render_ipv4_number_column(col: str, op: str, val: Any) -> str:
    """
    Return the rendering of an ip string value.


    :param col: The name of the column.
    :param op: The operator to render.
    :param val: Ip string value.
    :returns: SQL.
    """
    # SRC_IP = 122344
    # DST_IP <= 122344
    # IP <> 122344
    if op == FilterOperator.IN.value:
        return " OR ".join(render_in_conditions(val, col))
    elif op == FilterOperator.EQUALS.value:
        ipnumvalue = ipv4str_to_number(val)
        return f"{col} = {ipnumvalue}"
    else:
        ipnumvalue = ipv4str_to_number(val)
        return f"{col} {op} {ipnumvalue}"


def render_ipv4_either_number_columns(filters, src_col: str, dst_col: str) -> str:
    sql = ""
    for flt in filters:
        val = flt.get("val")
        sql += (
            " AND (" + _render_ipv4_either_number_columns(src_col, dst_col, val) + ")"
        )
    return sql


def _render_ipv4_either_number_columns(src_col, dst_col, val) -> str:
    """
    Return the rendering of an ip string value matching either directions.

    :param src_col: The name of the source column.
    :param dst_col: The name of the destination column.
    :param val: A list of ip string values. These can include CIDR ranges.
    :returns: SQL.
    """
    # ('1.1.1.1', '2.0.0.0/24')
    # is replaced with an OR filter on both SRC_IP and DST_IP
    # ( SRC_IP = 22345 OR (SRC_IP >= 10000 AND SRC_IP <= 20000) )
    # OR
    # ( DST_IP = 22345 OR (DST_IP >= 10000 AND DST_IP <= 20000) )
    return " OR ".join(
        render_in_conditions(val, src_col) + render_in_conditions(val, dst_col)
    )


def render_ip_array_filter(filters, col, ignore_cidr=False) -> str:
    """
    Return the sql for an ARRAY statement with an IP address.

    :param filters: passed in filters from jinja expression
    :param col: the column name to generate the filter for
    :param ignore_cidr: the cidr range is ignored and 2 = 2 is appended to the query
    :returns: SQL
    """
    sql = ""
    added_condition = False
    if len(filters) > 0:
        for flt in filters:
            vals = flt.get('val')
            if len(vals) > 0:
                ips = ipaddress.IPv4Network(vals[0], False)
                if ips.num_addresses == 1:
                    # if a single ip address is sent in (not a CIDR) then build
                    # the sql based on that single value
                    sql = f" AND {col} IN (ARRAY['{str(ips[0])}'])"
                    added_condition = True
                elif ips.num_addresses > 1:
                    added_condition = True
                    if ignore_cidr:
                        sql = " AND 2 = 2"
                    else:
                        sql = f" AND {col} BETWEEN ARRAY['{str(ips[0])}'] AND ARRAY['{str(ips[ips.num_addresses - 1])}']"
                # if num_addresses <= 0 then don't generate anything
    return sql if added_condition else " AND 1 = 1"


def render_ip_array_filter_or_nothing(filters, col, ignore_cidr=False) -> str:
    """
    Return a valid SQL WHERE clause condition or a condition that will render
    no results.

    :param filters: passed in filters from jinja expression
    :param col: the column name to generate the expression for
    :param ignore_cidr: the cidr range is ignored and 2 = 2 is appended to the query
    :returns: SQL
    """
    sql = render_ip_array_filter(filters, col, ignore_cidr=ignore_cidr)
    return sql if sql != " AND 1 = 1" else " AND 1 = 2"


def dashboard_link(link_label, dashboard_id, src_column, target_column) -> str:
    """
    Experimental feature for linking to other dashboards
    """
    # FIXME: Experimenting with linking to other dashboards.
    prefix = (
        '<a href="http://10.162.232.22:8088/superset/dashboard/'
        + str(dashboard_id)
        + "/?preselect_filters={%22160%22:{%22"
        + target_column
        + "%22:[%22"
    )
    suffix = '%22]}}">' + link_label + "</a>"
    return f" concat('{prefix}', {target_column}, '{suffix}' ) "


def _render_in_conditions_string_ips(ip_array, ip_column_name) -> str:
    """
    Return the rendering of an ip string value on the provided column.

    :param ip_column_name: Name of the column.
    :param ip_array: A list of ip string values. These can include CIDR ranges.
    :returns: List of conditions to OR.
    """
    conditions = []
    for cidr in ip_array:
        ips = ipaddress.IPv4Network(cidr.strip(), False)
        if ips.num_addresses > 1:
            low =str(ips[0])
            high = str(ips[ips.num_addresses - 1])
            conditions.append(
                f"({ip_column_name} >= '{low}' AND {ip_column_name} <= '{high}')"
            )
        else:
            ip = str(ips[0])
            conditions.append(f"({ip_column_name} = '{ip}')")
    return conditions


def _render_ipv4_string_column(col: str, op: str, val: Any) -> str:
    """
    Return the rendering of an ip string value.

    :param col: The name of the column.
    :param op: The operator to render.
    :param val: Ip string value.
    :returns: SQL.
    """
    # SRC_IP equals 1.22.3.44
    # DST_IP <= 1.22.3.44
    # IP <> 1.22.3.44
    if op == FilterOperator.IN.value:
        return " OR ".join(_render_in_conditions_string_ips(val, col))
    elif op == FilterOperator.EQUALS.value:
        return f"{col} = '{val}'"
    else:
        return f"{col} {op} '{val}'"


def render_ipv4_string_columns(filters, col: str) -> str:
    """
    Return SQL for multiple ipv4 strings

    :param filters - passed in filters from jinja expression
    :param col - column name to generate expression for
    """
    sql = ""
    op = ""
    val = ""
    for flt in filters:
        op = flt.get("op")
        val = flt.get("val")
        sql += " AND " + _render_ipv4_string_column(col, op, val) + " "
    return sql


def set_default_dttm(dttm_val, dttm_type: str, op: str, col: str) -> str:
    """
    Returns SQL with default dates if passed in 'to_dttm' or 'from_dttm' jinja variable
    is type: None

    :param dttm_val - passed in Jinja variable from Jinja expression, will either
    be a 'from_dttm' or a 'to_dttm' object
    :param dttm_type - passed in sring representation of jinja variable
    :param op - operation to be used within generated SQL
    :param col - column name to generate expression for
    """
    sql = " AND {col} {op} from_iso8601_timestamp('{dttm}')"
    if dttm_val is None:
        today = datetime.now()
        yesterday = datetime.now() - timedelta(1)
        if dttm_type == "from_dttm":
            dttm = str(datetime.strftime(yesterday, '%Y-%m-%dT%H:%M:%S'))
        else:
            dttm = str(datetime.strftime(today, '%Y-%m-%dT%H:%M:%S'))
    else:
        dttm = dttm_val
    return sql.format(col = col, op = op, dttm = dttm)


# Register operator rendering functions
JINJA_CONTEXT_ADDONS = {
    "render_ipv4_between_number_columns": render_ipv4_between_number_columns,
    "render_ipv4_between_number_columns_or_nothing": render_ipv4_between_number_columns_or_nothing,
    "render_ipv4_either_number_columns": render_ipv4_either_number_columns,
    "render_ipv4_number_column": render_ipv4_number_column,
    "render_ipv4_string_columns": render_ipv4_string_columns,
    "render_ip_array_filter": render_ip_array_filter,
    "render_ip_array_filter_or_nothing": render_ip_array_filter_or_nothing,
    "dashboard_link": dashboard_link,
    "set_default_dttm": set_default_dttm,
}



# -------------------------------------------------------------------
# *                WARNING:  STOP EDITING  HERE                    *
# -------------------------------------------------------------------
# Don't add config values below this line since local configs won't be
# able to override them.
if CONFIG_PATH_ENV_VAR in os.environ:
    # Explicitly import config module that is not necessarily in pythonpath; useful
    # for case where app is being executed via pex.
    try:
        cfg_path = os.environ[CONFIG_PATH_ENV_VAR]
        module = sys.modules[__name__]
        override_conf = imp.load_source("superset_config", cfg_path)
        for key in dir(override_conf):
            if key.isupper():
                setattr(module, key, getattr(override_conf, key))

        print(f"Loaded your LOCAL configuration at [{cfg_path}]")
    except Exception:
        logger.exception(
            "Failed to import config for %s=%s", CONFIG_PATH_ENV_VAR, cfg_path
        )
        raise
elif importlib.util.find_spec("superset_config") and not is_test():
    try:
        import superset_config  # pylint: disable=import-error
        from superset_config import *  # type: ignore # pylint: disable=import-error,wildcard-import

        print(f"Loaded your LOCAL configuration at [{superset_config.__file__}]")
    except Exception:
        logger.exception("Found but failed to import local superset_config")
        raise
