import { Component } from 'react';
export default class Ipv4ValueRenderer extends Component<{}, {
    cellValue: any;
}> {
    constructor(props: any);
    static getDerivedStateFromProps(nextProps: any): {
        cellValue: any;
    };
    formatIpV4(v: any): string;
    render(): JSX.Element;
    static getValueToDisplay(params: {
        valueFormatted: any;
        value: any;
    }): any;
}
//# sourceMappingURL=Ipv4ValueRenderer.d.ts.map