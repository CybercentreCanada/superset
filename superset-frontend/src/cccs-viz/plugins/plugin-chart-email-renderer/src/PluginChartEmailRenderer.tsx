/* eslint-disable theme-colors/no-literal-colors */
import { useState, useMemo, useCallback } from 'react';
import { Alert } from '@apache-superset/core/components';
import { SupersetClient } from '@superset-ui/core';
import { EmailRendererProps } from './types';
import { QUERY_TIMEOUT_LIMIT } from '../../plugin-chart-cccs-grid-table/src/consts';

const RETRY_ATTEMPTS = 5;

export default function PluginChartEmailRenderer(props: EmailRendererProps) {
  const {
    url_parameter_value: urlParameterValue,
    parameter_prefix: parameterPrefix,
    errorMessage,
  } = props;

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  const apiUrl = useMemo(
    () =>
      `/api/v1/clue/preview-eml/${
        parameterPrefix ? encodeURIComponent(parameterPrefix) : ''
      }${encodeURIComponent(urlParameterValue)}`,
    [parameterPrefix, urlParameterValue],
  );

  useCallback(async () => {
    if (parameterPrefix) {
      let attempts = 0;

      while (attempts < RETRY_ATTEMPTS) {
        setLoading(true);
        try {
          // eslint-disable-next-line no-await-in-loop
          const { json } = await SupersetClient.get({
            endpoint: apiUrl,
            timeout: QUERY_TIMEOUT_LIMIT,
            // fetchRetryOptions: {
            //   retries: RETRY_ATTEMPTS,
            //   retryDelay: 3000,
            // },
          });

          if (!json?.result.image) {
            throw new Error('No image in response');
          }

          setImageUrl(json.result.image); // json.result.image is a base64 data URL
          setImageError(null);
          break; // Break the loop on success
        } catch (error) {
          setImageError(
            error.message || 'Clue trouble fetching image, retry in process.',
          );
          attempts += 1;
        } finally {
          setLoading(attempts >= RETRY_ATTEMPTS);
        }
      }
      if (attempts >= RETRY_ATTEMPTS) {
        setLoading(false);
        setImageError(
          'An unexpected error has occurred.  The image cannot be fetched at this time.',
        );
      }
    }
  }, [apiUrl]);

  if (loading) {
    return (
      <Alert
        type="info"
        message="Loading..."
        closable={false}
        showIcon={false}
      />
    );
  }

  // Display fetching error if set, or validation message from transform props
  if (imageError || errorMessage) {
    return (
      <Alert
        type="error"
        message={imageError ?? errorMessage}
        closable={false}
      />
    );
  }

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: '10px',
        width: '98%',
        height: '100%',
        overflow: 'auto',
      }}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt="Email Visualization"
          style={{ width: '100%', height: 'auto' }}
        />
      ) : (
        <div>Image not available.</div>
      )}
    </div>
  );
}
