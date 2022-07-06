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
from superset import db
from superset.models.tags import ObjectTypes, Tag, TagTypes, TaggedObject

def add_tags(
    tags,
    dataset_id
):  # pylint: disable=no-self-use
    """
    Add new tags to the dataset
    tags: 
        list of tags (what is a tag in this context?)
    dataset_id: 
        id of dataset that the tags will be attached to
    """
    
    if dataset_id == 0:
        return # need to raise an exception

    tagged_objects = []
    for tag_str in tags:
        if ":" in tag_str:
            type_name = tag_str.split(":", 1)[0]
            type_ = TagTypes[type_name]
        else:
            type_ = TagTypes.custom

        tag = db.session.query(Tag).filter_by(name=tag_str, type=type_).first()
        if not tag:
            tag = Tag(name=tag_str, type=type_)

        tagged_objects.append(
            TaggedObject(object_id=dataset_id, object_type=ObjectTypes.dataset, tag=tag)
        )

    db.session.add_all(tagged_objects)
    db.session.commit()
    # is there any need to return something?
