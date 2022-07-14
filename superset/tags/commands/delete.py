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
from typing import Optional

from flask_appbuilder.models.sqla import Model
from flask_appbuilder.security.sqla.models import User

from superset.commands.base import BaseCommand
from superset.connectors.sqla.models import TableColumn
from superset.dao.exceptions import DAODeleteFailedError
from superset.superset.models.tags import Tag
from superset.tags.commands.exceptions import (
    TagDeleteFailedError,
    TagInvalidError,
    TagForbiddenError,
    TagNotFoundError,
)
from superset.tags.dao import TagDAO
from superset.exceptions import SupersetSecurityException
from superset.views.base import check_ownership

logger = logging.getLogger(__name__)


class DeleteTagCommand(BaseCommand):
    def __init__(self, user: User, dataset_id: int, model_id: int):
        self._actor = user
        self._dataset_id = dataset_id
        self._model_id = model_id
        self._model: Optional[Tag] = None

    def run(self) -> Model:
        self.validate()
        try:
            if not self._model:
                raise TagNotFoundError()
            tag = TagDAO.delete_tagged_objects(self._object_type, self._object_id, self._properties)
            return tag
        except DAODeleteFailedError as ex:
            logger.exception(ex.exception)
            raise TagDeleteFailedError() from ex

    def validate(self) -> None:
        # Validate/populate model exists
        self._model = TagDAO.find_by_id(self._dataset_id, self._model_id)
        if not self._model:
            raise TagNotFoundError()
        # Check ownership
        try:
            check_ownership(self._model)
        except SupersetSecurityException as ex:
            raise TagForbiddenError() from ex
