import {
  ChartDataResponseResult,
  ChartProps,
  QueryFormData,
} from '@superset-ui/core';

export type EmailRendererFormData = QueryFormData & {
  url_parameter_value: string;
  parameter_prefix: string;
  errorMessage: string;
  groupby: any;
};

export type EmailRenderChartProps = ChartProps & {
  formData: EmailRendererFormData;
  queriesData: EmailRendererResponseResult[];
};

export interface EmailRendererResponseResult extends ChartDataResponseResult {
  fissionUrl: string;
}

export type EmailRendererProps = {
  url_parameter_value: string;
  parameter_prefix: string;
  errorMessage: string;
  fissionUrl: string;
};
