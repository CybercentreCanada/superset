import React, { useState, useMemo, useEffect } from 'react';
import { SupersetClient } from '@superset-ui/core';
import { AjaxVisualizationProps } from './types';

const QUERY_TIMEOUT_LIMIT = 10000;

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
  //const [imageError, setImageError] = useState(false);

    // We encode the parameter value (including its prefix)
  // so the Fission proxy doesn't break on parameters that contain, for example, URLs.
  const encodedUrl:string = useMemo(
    () =>
      `${url}?${parameter_name}=${
        parameter_prefix ? encodeURIComponent(parameter_prefix) : ''
      }${encodeURIComponent(url_parameter_value)}`,
    [parameter_name, parameter_prefix, url, url_parameter_value],
  );

  useEffect(() => {
    const fetchImage = async () => {
      try {
        const { json } = await SupersetClient.get({ endpoint: encodedUrl,
        timeout: QUERY_TIMEOUT_LIMIT });

       // if (!json || !json.image) {
       //   throw new Error('No image in response');
       // }

        setImageUrl(JSON.stringify(json));  // json.image is a base64 data URL
      } catch (error) {
        console.error('Fetch error:', error);
        setImageUrl(JSON.stringify(error));
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
    <div>{`Response: ${imageUrl}`}</div>
    </div>
  );
}
