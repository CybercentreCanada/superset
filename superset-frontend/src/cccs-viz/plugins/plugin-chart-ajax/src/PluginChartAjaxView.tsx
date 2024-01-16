import React, { useState, useEffect } from 'react';
import { SupersetClient } from '@superset-ui/core';
import { AjaxVisualizationProps } from './types';

export default function PluginChartAjaxView(props: AjaxVisualizationProps) {
  const {
    url,
    url_parameter_value,
    parameter_name,
    parameter_prefix,
    errorMessage,
  } = props;

  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchImage = async () => {
      const endpoint = `${url}?${parameter_name}=${parameter_prefix}${url_parameter_value}`;
      try {
        const { json } = await SupersetClient.get({ endpoint });

        if (!json || !json.image) {
          throw new Error('No image in response');
        }

        setImageUrl(json.image);  // json.image is a base64 data URL
      } catch (error) {
        console.error('Fetch error:', error);
        setImageUrl(null);
      } finally {
        setLoading(false);
      }
    };

    fetchImage();
  }, [url, url_parameter_value, parameter_name, parameter_prefix]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (errorMessage) {
    return <div>{errorMessage}</div>;
  }

  return (
    <div 
      style={{
        position: 'absolute',
        left: 0,
        top: '50px',
        width: '95%',
        height: '100%',
        overflow: 'auto',
      }}
    >
      {imageUrl ? <img src={imageUrl} alt="Ajax Email Render Visualization" style={{ width: '100%', height: 'auto' }} /> : <div>Image not available</div>}
    </div>
  );
}
