import { QueryFormData } from '@superset-ui/core';

export type EmailRendererProps = QueryFormData & {
  url: string;
  url_parameter_value: string;
  parameter_name: string;
  parameter_prefix: string;
  errorMessage: string;
};
