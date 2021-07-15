import { t } from '@superset-ui/core';
import { ControlPanelConfig } from '@superset-ui/chart-controls';

const config: ControlPanelConfig = {
    controlPanelSections: [
        {
            label: t('Query'),
            expanded: true,
            controlSetRows: [['metrics'], ['columns']],
        },
        {
            label: t('IP Address'),
            expanded: true,
            controlSetRows: [
                [
                    {
                        name: 'ip_address',
                        config: {
                            type: 'TextControl',
                            default: '',
                            renderTrigger: true,
                            label: t('IP Address Count'),
                            description: t('Returns the number of times Assembly Line has seen a given IP address.'),
                        },
                    },
                ],
            ],
        },
    ],
};

export default config;