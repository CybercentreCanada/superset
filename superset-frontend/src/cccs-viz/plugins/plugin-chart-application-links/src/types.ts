import { QueryFormData, TimeseriesDataRecord } from '@superset-ui/core';

export type ApplicationsProps = QueryFormData & {
  data: TimeseriesDataRecord[];
  application: string;
  appVal: string;
  appType: string;
};

export type ApplicationLink = {
  app_name: string;
  url: string;
  info_type: string;
  thumbnail_src: string;
  api_url: string;
  value: string;
  description: JSX.Element;
};
