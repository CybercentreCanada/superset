import { css, SupersetTheme } from '@superset-ui/core';
import React, { useMemo } from 'react';
import { IFrameVisualizationProps } from './types';

const errorStyles = (theme: SupersetTheme) => css`
  color: ${theme.colors.error.base};
  font-weight: bold;
`;

export default function IFrameVisualization(props: IFrameVisualizationProps) {
  const {
    errorMessage,
    url,
    url_parameter_value,
    parameter_name,
    parameter_prefix,
  } = props;

  // We encode the parameter value (including its prefix)
  // so the Fission proxy doesn't break on parameters that contain, for example, URLs.
  const encodedUrl = useMemo(
    () =>
      `${url}?${parameter_name}=${
        parameter_prefix ? encodeURIComponent(parameter_prefix) : ''
      }${encodeURIComponent(url_parameter_value)}`,
    [parameter_name, parameter_prefix, url, url_parameter_value],
  );

  return (
    <>
      {errorMessage ? (
        errorMessage !== 'fission-incompat' ? (
          <span css={errorStyles}>{errorMessage}</span>
        ) : (
          <span css={errorStyles}>
            Fission endpoints are not supported in{' '}
            {navigator.userAgent.includes('Edg/')
              ? 'Microsoft Edge'
              : 'Google Chrome'}
            . Open{' '}
            <a href={encodedUrl} target="_blank" rel="noreferrer">
              this link
            </a>{' '}
            to view the visualization, or open this dashboard in Firefox.
          </span>
        )
      ) : (
        <iframe
          title={`Rendering of ${url}`}
          src={encodedUrl}
          style={{
            position: 'absolute',
            left: 0,
            top: '50px',
            width: '95%',
            height: '100%',
          }}
        />
      )}
    </>
  );
}
