import { QueryFormData, TimeseriesDataRecord } from '@superset-ui/core';

export type IFrameVisualizationProps = QueryFormData & {
  url_parameter_value: string;
  parameter_name: string;
  url: string;
};
