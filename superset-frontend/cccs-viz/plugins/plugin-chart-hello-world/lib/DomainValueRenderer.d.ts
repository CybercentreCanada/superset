import { Component } from 'react';
export default class DomainValueRenderer extends Component<{}, {
    cellValue: any;
}> {
    constructor(props: any);
    static getDerivedStateFromProps(nextProps: any): {
        cellValue: any;
    };
    render(): JSX.Element;
    static getValueToDisplay(params: {
        valueFormatted: any;
        value: any;
    }): any;
}
//# sourceMappingURL=DomainValueRenderer.d.ts.map