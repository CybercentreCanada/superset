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
"""add user tour info

Revision ID: 064f006e1752
Revises: 58df9d617f14
Create Date: 2022-07-06 15:52:05.652006

"""

# revision identifiers, used by Alembic.
revision = '064f006e1752'
down_revision = '58df9d617f14'

from alembic import op
import sqlalchemy as sa


def upgrade():
    op.create_table(
        "user_tour",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=True),
        sa.Column("last_tour", sa.JSON(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["ab_user.id"]),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade():
    op.drop_table("user_tour")
