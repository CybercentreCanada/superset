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
import React from 'react';
import PropTypes from 'prop-types';
import ReactTags from 'react-tag-autocomplete';
import { Button } from 'react-bootstrap';
import { t } from '@superset-ui/core';
import Icons from 'src/components/Icons';
import { Tooltip } from 'src/components/Tooltip';

import './ObjectTags.css';

const propTypes = {
  fetchTags: PropTypes.func,
  fetchSuggestions: PropTypes.func,
  deleteTag: PropTypes.func,
  addTag: PropTypes.func,
  editable: PropTypes.bool,
  onChange: PropTypes.func,
};

const defaultProps = {
  fetchTags: callback => {
    callback([]);
  },
  fetchSuggestions: callback => {
    callback([]);
  },
  deleteTag: (tag, callback) => {
    callback();
  },
  addTag: (tag, callback) => {
    callback();
  },
  editable: true,
  onChange: () => {},
};

export function Tag({ tag, onDelete }) {
  return (
    <Button variant="info" size="sm">
      <a href={`/superset/welcome?tags=${tag.name}#tags`} className="deco-none">
        {tag.name}
      </a>
      <Tooltip id="remove-tooltip" title={t('Click to remove tag')}>
        <Icons.CancelX onClick={onDelete} iconSize="m" />
      </Tooltip>
    </Button>
  );
}

export default class ObjectTags extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      tags: [],
      suggestions: [],
    };

    this.handleDelete = this.handleDelete.bind(this);
    this.handleAddition = this.handleAddition.bind(this);
  }

  componentDidMount() {
    this.props.fetchTags(tags => this.setState({ tags }));
    this.props.fetchSuggestions(suggestions => this.setState({ suggestions }));
  }

  handleDelete(i) {
    const tags = this.state.tags.slice(0);
    const tag = tags.splice(i, 1)[0].name;
    this.props.deleteTag(tag, () => this.setState({ tags }));
    this.props.onChange(tags);
  }

  handleAddition(tag) {
    const tags = [...this.state.tags, tag];
    this.props.addTag(tag.name, () => this.setState({ tags }));
    this.props.onChange(tags);
  }

  renderEditableTags() {
    const {
      fetchTags,
      fetchSuggestions,
      deleteTag,
      addTag,
      editable,
      onChange,
      ...rest
    } = this.props;
    return (
      <ReactTags
        {...rest}
        tags={this.state.tags}
        suggestions={this.state.suggestions}
        onDelete={this.handleDelete}
        onAddition={this.handleAddition}
        allowNew
        placeholderText={t('Add tag')}
        tagComponent={Tag}
      />
    );
  }

  renderReadOnlyTags() {
    return (
      <div className="react-tags-rw">
        {this.state.tags.map(tag => (
          <Button variant="info" size="sm">
            <a
              href={`/superset/welcome?tags=${tag.name}#tags`}
              className="deco-none"
            >
              {tag.name}
            </a>
          </Button>
        ))}
      </div>
    );
  }

  render() {
    if (this.props.editable) {
      return this.renderEditableTags();
    }
    return this.renderReadOnlyTags();
  }
}

ObjectTags.propTypes = propTypes;
ObjectTags.defaultProps = defaultProps;
