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
import { FC, ReactNode } from 'react';
import { t } from '@apache-superset/core/translation';
import { css, useTheme, SupersetTheme } from '@apache-superset/core/theme';
import {
  Flex,
  FormLabel,
  InfoTooltip,
  Tooltip,
} from '@superset-ui/core/components';
import { Icons } from '@superset-ui/core/components/Icons';

type ValidationError = string;

export type ControlHeaderProps = {
  name?: string;
  label?: ReactNode;
  description?: ReactNode;
  validationErrors?: ValidationError[];
  renderTrigger?: boolean;
  rightNode?: ReactNode;
  leftNode?: ReactNode;
  onClick?: () => void;
  hovered?: boolean;
  tooltipOnClick?: () => void;
  warning?: string;
  danger?: string;
  canCopy?: boolean;
  copyOnClick?: () => void;
  canSelectAll?: boolean;
  selectAllOnClick?: () => void;
};

const iconStyles = css`
  &.anticon {
    font-size: unset;
    overflow: visible;
    display: inline-block;
    vertical-align: middle;
    line-height: 1;
    padding-bottom: 0.1em;
    .anticon {
      line-height: unset;
      vertical-align: unset;
      overflow: visible;
    }
  }
`;

const ControlHeader: FC<ControlHeaderProps> = ({
  name,
  label,
  description,
  validationErrors = [],
  renderTrigger = false,
  rightNode,
  leftNode,
  onClick,
  hovered = false,
  tooltipOnClick = () => {},
  warning,
  danger,
  canCopy,
  copyOnClick,
  canSelectAll,
  selectAllOnClick,
}) => {
  const theme = useTheme();

  if (!label) {
    return null;
  }

  const renderOptionalIcons = () => {
    if (!hovered) {
      return null;
    }

    return (
      <span
        css={() => css`
          position: absolute;
          top: 50%;
          right: 0;
          padding-left: ${theme.sizeUnit}px;
          transform: translate(100%, -50%);
          white-space: nowrap;
        `}
      >
        {description && (
          <span>
            <Tooltip
              id="description-tooltip"
              title={description}
              placement="top"
            >
              <Icons.InfoCircleOutlined
                css={iconStyles}
                onClick={tooltipOnClick}
              />
            </Tooltip>{' '}
          </span>
        )}
        {renderTrigger && (
          <span>
            <InfoTooltip
              label={t('bolt')}
              tooltip={t('Changing this control takes effect instantly')}
              placement="top"
              type="notice"
            />{' '}
          </span>
        )}
      </span>
    );
  };

  const renderOptionalActionIcons = () => (
    <div style={{ marginBottom: `${theme.sizeUnit * 0.5}px` }}>
      {canSelectAll && (
        <span>
          <Tooltip
            id="select-all-tooltip"
            title={t('Select All (ctl+a)')}
            placement="top"
          >
            <Icons.UpCircleFilled css={iconStyles} onClick={selectAllOnClick} />
          </Tooltip>{' '}
        </span>
      )}
      {canCopy && (
        <span>
          <Tooltip
            id="copy-tooltip"
            title={t('Copy the content of this control')}
            placement="top"
          >
            <Icons.CopyFilled css={iconStyles} onClick={copyOnClick} />
          </Tooltip>
        </span>
      )}
    </div>
  );

  return (
    <div
      className="ControlHeader"
      data-test={`${name}-header`}
      style={{ width: '100%' }}
    >
      <Flex align="flex-end" justify="space-between">
        <FormLabel
          css={(theme: SupersetTheme) => css`
            margin-bottom: ${theme.sizeUnit * 0.5}px;
            position: relative;
            font-size: ${theme.fontSizeSM}px;
            overflow: visible;
            padding-bottom: 0.1em;
          `}
          htmlFor={name}
        >
          {leftNode && <span>{leftNode} </span>}
          <span
            role="button"
            tabIndex={0}
            onClick={onClick}
            style={{ cursor: onClick ? 'pointer' : '' }}
          >
            {label}
          </span>{' '}
          {warning && (
            <span>
              <Tooltip id="error-tooltip" placement="top" title={warning}>
                <Icons.WarningOutlined
                  iconColor={theme.colorWarning}
                  css={css`
                    vertical-align: baseline;
                  `}
                  iconSize="s"
                />
              </Tooltip>{' '}
            </span>
          )}
          {danger && (
            <span>
              <Tooltip id="error-tooltip" placement="top" title={danger}>
                <Icons.CloseCircleOutlined
                  iconColor={theme.colorErrorText}
                  iconSize="s"
                />
              </Tooltip>{' '}
            </span>
          )}
          {validationErrors?.length > 0 && (
            <span
              data-test="error-tooltip"
              css={css`
                cursor: pointer;
              `}
            >
              <Tooltip
                id="error-tooltip"
                placement="top"
                title={validationErrors?.join(' ')}
              >
                <Icons.ExclamationCircleOutlined iconColor={theme.colorError} />
              </Tooltip>{' '}
            </span>
          )}
          {renderOptionalIcons()}
        </FormLabel>
        {!rightNode && renderOptionalActionIcons()}
        {rightNode && <div className="pull-right">{rightNode}</div>}
      </Flex>
    </div>
  );
};

export default ControlHeader;
