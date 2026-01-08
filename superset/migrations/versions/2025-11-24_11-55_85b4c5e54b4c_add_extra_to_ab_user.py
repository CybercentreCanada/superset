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
"""add_extra_to_ab_user

Revision ID: 85b4c5e54b4c
Revises: 48cbb571fa3a
Create Date: 2025-11-24 11:55:41.584903

"""

from alembic import op
import sqlalchemy as sa


from superset.migrations.shared.utils import table_has_column

# revision identifiers, used by Alembic.
revision = '85b4c5e54b4c'
down_revision = '48cbb571fa3a'

table_name = "ab_user"
column_name = "extra"

def upgrade():
    # ### Adjusted Alembic commands ###
    if not table_has_column(table_name, column_name):
        op.add_column(
            table_name,
            sa.Column(
                column_name,
                sa.String(length=256),
                nullable=True
            )
        )
    # ### end Alembic commands ###


def downgrade():
    # ### Adjusted Alembic commands ###
    if table_has_column(table_name, column_name):
        op.drop_column(table_name, column_name)
    # ### end Alembic commands ###
