import { t, ChartPlugin, ChartMetadata } from '@superset-ui/core';
import thumbnail from '../images/thumbnail.png';
import buildQuery from './buildQuery';

export default class AssemblyLineChartPlugin extends ChartPlugin {
    constructor() {
        const metadata = new ChartMetadata({
            description: 'Assembly Line',
            name: t('Assembly Line'),
            thumbnail,
        });

        super({
            buildQuery,
            loadChart: () => import('../AssemblyLine'),
            metadata,
        });
    }
}