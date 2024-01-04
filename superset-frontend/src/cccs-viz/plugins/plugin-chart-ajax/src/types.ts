import { QueryFormData } from '@superset-ui/core';

export type AjaxVisualizationProps = QueryFormData & {
  url_parameter_value: string;
  parameter_name: string;
  url: string;
  parameter_prefix: string;
  errorMessage: string;
};
