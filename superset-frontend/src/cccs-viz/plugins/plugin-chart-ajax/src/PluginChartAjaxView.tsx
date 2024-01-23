import React, { useState, useMemo, useEffect } from 'react';
import { SupersetClient } from '@superset-ui/core';
import { AjaxVisualizationProps } from './types';

const QUERY_TIMEOUT_LIMIT = 180000; // Example timeout limit in milliseconds

export default function PluginChartAjaxView(props: AjaxVisualizationProps) {
  const {
    url,
    url_parameter_value,
    parameter_name,
    parameter_prefix,
    errorMessage,
  } = props;

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [response, setResponse] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  const encodedUrl = useMemo(
    () =>
      `/api/v1/fission/emailpreview?${parameter_name}=${
        parameter_prefix ? encodeURIComponent(parameter_prefix) : ''
      }${encodeURIComponent(url_parameter_value)}`,
    [parameter_name, parameter_prefix, url, url_parameter_value],
  );

  useEffect(() => {
    const fetchImage = async () => {
      let attempts = 0;

      while (attempts < 4) {
        try {
          const { json } = await SupersetClient.get({ endpoint: encodedUrl, timeout: QUERY_TIMEOUT_LIMIT });
          setResponse(JSON.stringify(json));

          if (!json || !json.result.image) {
            throw new Error('No image in response');
          }

          setImageUrl(json.result.image); // json.result.image is a base64 data URL
          setImageError(null);
          break; // Break the loop on success
        } catch (error) {
          setResponse(JSON.stringify(error));
          setImageError(error.message || 'Fission Function Trouble Fetching Image');
          attempts++;
        } finally {
          setLoading(attempts >= 4);
        }
      }
    };
    fetchImage();
  }, [encodedUrl]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (errorMessage) {
    return <div>Error: {errorMessage}</div>;
  }

  if (imageError) {
    return <div>
      Error: {imageError}
      <div>{`Response: ${response}`}</div>
      </div>;
  }

  return (
    <div 
      style={{
        position: 'absolute',
        left: 0,
        top: '50px',
        width: '98%',
        height: '100%',
        overflow: 'auto',
      }}
    >
      {imageUrl ? <img src={imageUrl} alt="Visualization" style={{ width: '100%', height: 'auto' }} /> : <div>Image not available...</div>}
      <div>{`Response: ${response}`}</div>
    </div>
  );
}

