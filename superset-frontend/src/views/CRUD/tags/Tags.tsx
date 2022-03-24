/**
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
import React, { useEffect, useState } from 'react';
import { styled } from '@superset-ui/core';
import { User } from 'src/types/bootstrapTypes';
import {
  getFromLocalStorage,
  setInLocalStorage,
} from 'src/utils/localStorageHelpers';
import ListViewCard from 'src/components/ListViewCard';
import withToasts from 'src/components/MessageToasts/withToasts';
import { mq, CardContainer, loadingCardCount } from 'src/views/CRUD/utils';
import { FeatureFlag, isFeatureEnabled } from 'src/featureFlags';
import { Switch } from 'src/common/components';
import SelectControl from 'src/explore/components/controls/SelectControl';
import { fetchSuggestions } from 'src/tags';
import TagsTable from './TagsTable';

interface Tag {
  id: number;
  type: string;
  name: string;
}

interface TagsProps {
  user: User;
  addDangerToast: (arg0: string) => void;
}

export interface ActivityData {
  Created?: Array<object>;
  Edited?: Array<object>;
  Viewed?: Array<object>;
  Examples?: Array<object>;
}

interface LoadingProps {
  cover?: boolean;
}

// const OWNED_BY_ME = 'owner:{{ current_user_id() }}';
const OWNED_BY_ME = 'DEFAULT_TAG';

const TagsContainer = styled.div`
  background-color: ${({ theme }) => theme.colors.grayscale.light4};
  .ant-row.menu {
    margin-top: -15px;
    background-color: ${({ theme }) => theme.colors.grayscale.light4};
    &:after {
      content: '';
      display: block;
      border: 1px solid ${({ theme }) => theme.colors.grayscale.light2};
      margin: 0px ${({ theme }) => theme.gridUnit * 6}px;
      position: relative;
      width: 100%;
      ${mq[1]} {
        margin-top: 5px;
        margin: 0px 2px;
      }
    }
    .ant-menu.ant-menu-light.ant-menu-root.ant-menu-horizontal {
      padding-left: ${({ theme }) => theme.gridUnit * 8}px;
    }
    button {
      padding: 3px 21px;
    }
  }
  .ant-card-meta-description {
    margin-top: ${({ theme }) => theme.gridUnit}px;
  }
  .ant-card.ant-card-bordered {
    border: 1px solid ${({ theme }) => theme.colors.grayscale.light2};
  }
  .ant-collapse-item .ant-collapse-content {
    margin-bottom: ${({ theme }) => theme.gridUnit * -6}px;
  }
  div.ant-collapse-item:last-child.ant-collapse-item-active
    .ant-collapse-header {
    padding-bottom: ${({ theme }) => theme.gridUnit * 3}px;
  }
  div.ant-collapse-item:last-child .ant-collapse-header {
    padding-bottom: ${({ theme }) => theme.gridUnit * 9}px;
  }
  .loading-cards {
    margin-top: ${({ theme }) => theme.gridUnit * 8}px;
    .ant-card-cover > div {
      height: 168px;
    }
  }
`;

const TagsNav = styled.div`
  height: 50px;
  background-color: white;
  .navbar-brand {
    margin-left: ${({ theme }) => theme.gridUnit * 2}px;
    font-weight: ${({ theme }) => theme.typography.weights.bold};
  }
  .switch {
    float: right;
    margin: ${({ theme }) => theme.gridUnit * 5}px;
    display: flex;
    flex-direction: row;
    span {
      display: block;
      margin: ${({ theme }) => theme.gridUnit * 1}px;
      line-height: 1;
    }
  }
`;

export const LoadingCards = ({ cover }: LoadingProps) => (
  <CardContainer showThumbnails={cover} className="loading-cards">
    {[...new Array(loadingCardCount)].map(() => (
      <ListViewCard cover={cover ? false : <></>} description="" loading />
    ))}
  </CardContainer>
);

function Tags({ user, addDangerToast }: TagsProps) {
  const userid = user.userId;
  const id = userid.toString();
  const userKey = getFromLocalStorage(id, null);
  let defaultChecked = false;
  if (isFeatureEnabled(FeatureFlag.THUMBNAILS)) {
    defaultChecked =
      userKey?.thumbnails === undefined ? true : userKey?.thumbnails;
  }
  const [checked, setChecked] = useState(defaultChecked);
  const [tagSearch, setTagSearch] = useState<string>(OWNED_BY_ME);
  const [tagSuggestions, setTagSuggestions] = useState<string[]>();

  const handleToggle = () => {
    setChecked(!checked);
    setInLocalStorage(id, { thumbnails: !checked });
  };

  useEffect(() => {
    fetchSuggestions({ includeTypes: false }, (suggestions: Tag[]) => {
      const tagSuggestions = [...suggestions.map(tag => tag.name)];
      setTagSuggestions(tagSuggestions);
    });
  }, []);

  const onTagSearchChange = (tags: Tag[]) => {
    const tagSearch = tags.join(',');
    setTagSearch(tagSearch);
    // updateURL('tags', tagSearch);
  };

  return (
    <TagsContainer>
      <TagsNav>
        <span className="navbar-brand">Tags</span>
        {isFeatureEnabled(FeatureFlag.THUMBNAILS) ? (
          <div className="switch">
            <Switch checked={checked} onChange={handleToggle} />
            <span>Thumbnails</span>
          </div>
        ) : null}
      </TagsNav>
      <div className="select-control">
        <SelectControl
          name="tags"
          value={tagSearch.split(',')}
          multi
          onChange={onTagSearchChange}
          choices={tagSuggestions}
        />
      </div>
      <TagsTable search={tagSearch} />
    </TagsContainer>
  );
}

export default withToasts(Tags);
