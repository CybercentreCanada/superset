import React from 'react';
import { IFrameVisualizationProps } from './types';

export default function IFrameVisualization(props: IFrameVisualizationProps) {
  const {
    url,
    url_parameter_value,
    parameter_name,
    parameter_prefix,
    errorMessage,
  } = props;

  // We encode the parameter value (including its prefix)
  // so the Fission proxy doesn't break on parameters that contain, for example, URLs.
  const encodedUrl = `${url}?${parameter_name}=${
    parameter_prefix ? encodeURIComponent(parameter_prefix) : ''
  }${encodeURIComponent(url_parameter_value)}`;

  return (
    <>
      {errorMessage ? (
        <>{errorMessage}</>
      ) : (
        <iframe
          src={encodedUrl}
          style={{
            position: 'absolute',
            left: 0,
            top: '50px',
            width: '95%',
            height: '100%',
          }}
        ></iframe>
      )}
    </>
  );
}
