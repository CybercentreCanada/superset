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
from flask_babel import lazy_gettext as _
from marshmallow.validate import ValidationError


class DatasetTagsNotFoundValidationError(ValidationError):
    """
    Marshmallow validation error when dataset tag for update does not exist
    """

    def __init__(self) -> None:
        super().__init__([_("One or more tags do not exist")], field_name="tags")


class DatasetTagsDuplicateValidationError(ValidationError):
    """
    Marshmallow validation error when dataset tags have a duplicate on the list
    """

    def __init__(self) -> None:
        super().__init__([_("One or more tags are duplicated")], field_name="tags")


class DatasetTagsExistsValidationError(ValidationError):
    """
    Marshmallow validation error when dataset tags already exist
    """

    def __init__(self) -> None:
        super().__init__([_("One or more tags already exist")], field_name="tags")
