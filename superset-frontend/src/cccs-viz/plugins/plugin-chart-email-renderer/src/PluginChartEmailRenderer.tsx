/* eslint-disable theme-colors/no-literal-colors */
import { useState, useMemo, useEffect } from 'react';
import { SupersetClient } from '@superset-ui/core';
import { Card, Space } from '@superset-ui/core/components';
import { useTheme } from '@apache-superset/core/theme';
import { EmailRendererProps } from './types';
import { QUERY_TIMEOUT_LIMIT } from '../../plugin-chart-cccs-grid-table/src/consts';

const RETRY_ATTEMPTS = 5;

export default function PluginChartEmailRenderer(props: EmailRendererProps) {
  const { url_parameter_value, parameter_prefix, errorMessage } = props;

  const theme = useTheme();

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState<string | null>(null);

  const apiUrl = useMemo(
    () =>
      `/api/v1/clue/preview-eml/${
        parameter_prefix ? encodeURIComponent(parameter_prefix) : ''
      }${encodeURIComponent(url_parameter_value)}`,
    [parameter_prefix, url_parameter_value],
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
    };
    fetchImage();
  }, [apiUrl]);

  if (loading) {
    return (
      <Card
        style={{
          padding: theme.paddingSM,
          backgroundColor: theme.colorBgElevated,
          borderColor: theme.colorBorderBg,
        }}
      >
        <p
          style={{
            fontSize: theme.fontSizeLG,
            color: theme.colorTextLightSolid,
          }}
        >
          Loading...
        </p>
      </Card>
    );
  }

  if (errorMessage) {
    return (
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
