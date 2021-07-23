import { t, ChartMetadata, ChartPlugin } from '@superset-ui/core';
import controlPanel from './controlPanel';
import transformProps from './transformProps';
import thumbnail from '../images/thumbnail.png';

export default class AssemblyLineChartPlugin extends ChartPlugin {
    constructor() {
        const metadata = new ChartMetadata({
            description: 'Assembly Line',
            name: t('Assembly Line'),
            thumbnail,
        });

        super({
            controlPanel,
            loadChart: () => import('../AssemblyLine'),
            metadata,
            transformProps,
        });
    }
}
