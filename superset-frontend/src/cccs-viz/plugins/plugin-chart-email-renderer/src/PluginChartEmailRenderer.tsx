import React, { useState, useMemo, useEffect } from 'react';
import { SupersetClient } from '@superset-ui/core';
import { EmailRendererProps } from './types';

const QUERY_TIMEOUT_LIMIT = 180000; // Timeout limit in milliseconds

export default function PluginChartEmailRenderer(props: EmailRendererProps) {
  const {
    url_parameter_value,
    parameter_name,
    parameter_prefix,
    errorMessage,
  } = props;

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState<string | null>(null);

  const apiUrl = useMemo(
    () =>
      `/api/v1/fission/emailpreview?${parameter_name}=${
        parameter_prefix ? encodeURIComponent(parameter_prefix) : ''
      }${encodeURIComponent(url_parameter_value)}`,
    [parameter_name, parameter_prefix, url_parameter_value],
  );

  useEffect(() => {
    const fetchImage = async () => {
      let attempts = 0;

      while (attempts < 5) {
        try {
          const { json } = await SupersetClient.get({ endpoint: apiUrl, timeout: QUERY_TIMEOUT_LIMIT });

          if (!json || !json.result.image) {
            throw new Error('No image in response');
          }

          setImageUrl(json.result.image); // json.result.image is a base64 data URL
          setImageError(null);
          break; // Break the loop on success
        } catch (error) {
          setImageError(error.message || 'Fission function trouble fetching image, retry in process.');
          attempts++;
        } finally {
          setLoading(attempts >= 5);
        }
      }
      if (attempts >= 5) {
        setLoading(false)
        setImageError('Image cannot be fetched at this time due to network issues.');
      }
    };
    fetchImage();
  }, [apiUrl]);

  if (loading) {
    return (
      <div style={{ padding: '20px', backgroundColor: '#f0f0f0', margin: '20px', textAlign: 'center', borderRadius: '8px' }}>
        <span style={{ fontSize: '16px', color: '#555' }}>Loading...</span>
      </div>
    );
  }
  
  if (errorMessage) {
    return (
      <div style={{ padding: '20px', border: '1px solid red', borderRadius: '8px', backgroundColor: '#ffcccc', margin: '20px', textAlign: 'center' }}>
        <span style={{ fontSize: '14px', color: 'red' }}>
          <strong>Error:</strong> {errorMessage}
        </span>
      </div>
    );
  }

  if (imageError) {
    return (
      <div style={{ padding: '20px', border: '1px solid red', borderRadius: '8px', backgroundColor: '#ffcccc', margin: '20px', textAlign: 'center' }}>
        <span style={{ fontSize: '16px', color: 'red' }}>
          <strong>Error:</strong> {imageError}
        </span>
        <p style={{ marginTop: '15px', fontSize: '14px' }}>
          Please click on the following{' '}
          <a href={apiUrl} target="_blank" rel="noreferrer" style={{ textDecoration: 'underline', color: 'blue' }}>
            link
          </a>{' '}
          to view the visualization in a new window.
        </p>
      </div>
    );
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
      {imageUrl ? <img src={imageUrl} alt="Email Visualization" style={{ width: '100%', height: 'auto' }} /> : <div>Image not available...</div>}
    </div>
  );
}

