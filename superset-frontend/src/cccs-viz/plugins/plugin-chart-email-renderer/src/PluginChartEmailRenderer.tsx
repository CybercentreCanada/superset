/* eslint-disable theme-colors/no-literal-colors */
import { useState, useMemo, useEffect } from 'react';
import { SupersetClient, useTheme } from '@superset-ui/core';
import { EmailRendererProps } from './types';
import { Card, Space } from '@superset-ui/core/components';
import { QUERY_TIMEOUT_LIMIT } from '../../plugin-chart-cccs-grid-table/src/consts';

const RETRY_ATTEMPTS = 5;

export default function PluginChartEmailRenderer(props: EmailRendererProps) {
  const { url_parameter_value, parameter_prefix, errorMessage, fissionUrl } =
    props;

  const theme = useTheme();

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState<string | null>(null);

  const apiUrl = useMemo(
    () =>
      `/api/v1/fission/emailpreview?eml=${
        parameter_prefix ? encodeURIComponent(parameter_prefix) : ''
      }${encodeURIComponent(url_parameter_value)}`,
    [parameter_prefix, url_parameter_value],
  );

  const linkUrl = useMemo(
    () =>
      `${fissionUrl}/emailpreview?eml=${
        parameter_prefix ? encodeURIComponent(parameter_prefix) : ''
      }${encodeURIComponent(url_parameter_value)}`,
    [fissionUrl, parameter_prefix, url_parameter_value],
  );

  useEffect(() => {
    const fetchImage = async () => {
      let attempts = 0;

      while (attempts < RETRY_ATTEMPTS) {
        try {
          // eslint-disable-next-line no-await-in-loop
          const { json } = await SupersetClient.get({
            endpoint: apiUrl,
            timeout: QUERY_TIMEOUT_LIMIT,
          });

          if (!json?.result.image) {
            throw new Error('No image in response');
          }

          setImageUrl(json.result.image); // json.result.image is a base64 data URL
          setImageError(null);
          break; // Break the loop on success
        } catch (error) {
          setImageError(
            error.message ||
              'Fission function trouble fetching image, retry in process.',
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
    };
    fetchImage();
  }, [apiUrl]);

  if (loading) {
    return (
      <div
        style={{
          padding: '20px',
          backgroundColor: '#f0f0f0',
          margin: '20px',
          textAlign: 'center',
          borderRadius: '8px',
        }}
      >
        <span style={{ fontSize: '16px', color: '#555' }}>Loading...</span>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <>
        <Card
          style={{
            padding: theme.paddingSM,
            backgroundColor: theme.colorInfoBg,
            borderColor: theme.colorInfoBorder,
          }}
        >
          <p>
            <strong>Info:</strong> {errorMessage}
          </p>
        </Card>
      </>
    );
  }

  if (imageError) {
    return (
      <Card
        style={{
          padding: theme.paddingSM,
          backgroundColor: theme.colorErrorBg,
          borderColor: theme.colorErrorBorder,
        }}
      >
        <Space align="center" direction="vertical" style={{ display: 'flex' }}>
          <span
            style={{ fontSize: theme.fontSizeLG, color: theme.colorErrorText }}
          >
            <strong>Error:</strong> {imageError}
          </span>

          <p>
            Please click on the following{' '}
            <a href={linkUrl} target="_blank" rel="noreferrer">
              link
            </a>{' '}
            to view the visualization in a new window.
          </p>
        </Space>
      </Card>
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
