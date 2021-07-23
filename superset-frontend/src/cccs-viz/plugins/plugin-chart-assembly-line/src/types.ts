import { QueryFormData, supersetTheme, TimeseriesDataRecord } from "@superset-ui/core";

export interface AssemblyLineStyleProps {
    height: number;
    width: number;
    headerFontSize: keyof typeof supersetTheme.typography.sizes;
    boldText: boolean;
}

interface AssemblyLineCustomizeProps {
    headerText: string;
}

export type AssemblyLineQueryFormData = QueryFormData &
    AssemblyLineStyleProps &
    AssemblyLineCustomizeProps;

export type AssemblyLineProps = AssemblyLineStyleProps &
    AssemblyLineCustomizeProps & {
        data: TimeseriesDataRecord[];
        ipAddress: string;
    };
