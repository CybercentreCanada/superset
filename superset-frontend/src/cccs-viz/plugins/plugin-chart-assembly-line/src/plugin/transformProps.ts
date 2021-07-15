import { ChartProps, TimeseriesDataRecord } from '@superset-ui/core';

export default function transformProps(chartProps: ChartProps) {
    const { width, height, formData, queriesData } = chartProps;
    const { boldText, headerFontSize, headerText, ipAddress } = formData;
    const data = queriesData[0].data as TimeseriesDataRecord[];

    return {
        width,
        height,
        boldText,
        data,
        ipAddress,
        headerFontSize,
        headerText,
    };
}