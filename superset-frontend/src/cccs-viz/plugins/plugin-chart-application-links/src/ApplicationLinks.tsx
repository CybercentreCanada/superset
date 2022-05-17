import React, { useEffect, useState } from 'react';
import { ApplicationLink, ApplicationsProps } from './types';
import styles from './styles';

export default function ApplicationLinks(props: ApplicationsProps) {
  const { applinks } = props;
  const [assemblylineCount, setAssemblylineCount] = useState(-1);
  const [alfredCount] = useState(-1);

  // TODO: this can be re added CLDN-929
  const callback_url = 'ip_string';
  useEffect(() => {
    applinks.map((applink: ApplicationLink) => {
      // assembly line
      if (applink.app_name === 'Assemblyline') {
        fetch(
          // eslint-disable-next-line no-restricted-globals
          `//${location.host}/api/v1/proxy/${callback_url}/${applink.value}`,
        )
          .then(res => res.json())
          .then(response => {
            if (response !== null && response.payload?.err !== true) {
              setAssemblylineCount(response.payload.data?.data?.length);
            }
          });
        // eslint-disable-next-line no-param-reassign
        if (assemblylineCount > 0) {
          // eslint-disable-next-line no-param-reassign
          applink.description = (
            <p style={styles.InlineText}>
              Assembly Line has seen this {applink.info_type} {assemblylineCount} time(s). Search the{' '}
              <a href={applink.api_url} target="_blank" rel="noreferrer">
                Alfred
              </a>{' '}
              knowledge base.
            </p>
          );
        } else {
          // eslint-disable-next-line no-param-reassign
          applink.description = (
            <p style={styles.InlineText}>
              Assembly Line has not seen this {applink.info_type}. Search the{' '}
              <a href={applink.api_url} target="_blank" rel="noreferrer">
                Alfred
              </a>{' '}
              knowledge base.
            </p>
          );
        }
      } else if (applink.app_name === 'Alfred') {
        if (alfredCount > 0) {
          // eslint-disable-next-line no-param-reassign
          applink.description = (
            <p style={styles.InlineText}>
              Alfred has seen this {applink.info_type} {alfredCount} time(s). Search the{' '}
              <a href={applink.api_url} target="_blank" rel="noreferrer">
                Alfred
              </a>{' '}
              knowledge base.
            </p>
          );
        } else {
          // eslint-disable-next-line no-param-reassign
          applink.description = (
            <p style={styles.InlineText}>
              Alfred has not seen this {applink.info_type}. Search the{' '}
              <a href={applink.api_url} target="_blank" rel="noreferrer">
                Alfred
              </a>{' '}
              knowledge base.
            </p>
          );
        }
      }
      return 0;
    });
  });

  return (
    <div style={styles.Container}>
      {applinks.map((applink: ApplicationLink) => (
        <div style={styles.AppContainer}>
          <div style={styles.Thumbnail}>
            <a
              href={applink.url}
              target="_blank"
              rel="noreferrer"
              style={styles.InlineImg}
            >
              <img
                height="34"
                width="60"
                alt={applink.app_name}
                src={applink.thumbnail_src}
              />
            </a>
          </div>
          <div style={styles.Container}>
            <h5 style={styles.Header}>{applink.app_name}</h5>
            <div style={styles.InlineBlock}>{applink.description}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
