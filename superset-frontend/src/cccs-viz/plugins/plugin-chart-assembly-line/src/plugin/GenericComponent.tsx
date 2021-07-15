import React from 'react';
import { styled } from '@superset-ui/core';
import AssemblyLineRobot from '../images/Assemblyline_robot.png';

const Container = styled.div`
    border: 2px solid black;
    height: 100px;
`;

const ResultImageContainer = styled.div`
    padding-top: 10px;
`;

const Result = styled.strong`
    padding-left: 10px;
`;

const Image = styled.img`
    padding-right: 10px;
    float: right;
    height: 50px;
    width: 50px;
`;

const ALLink = styled.a`
    padding-left: 10px;
    padding-bottom: 10px;
`;

interface GenericComponentProps {
    totalTimesSeen: number;
    ipAddress: string;
}

export default function GenericComponent(props: GenericComponentProps) {
    return (
        <Container>
            <ResultImageContainer>
                <Result>Assembly Line has seen this IP address {props.totalTimesSeen} times.</Result>
                <Image src={AssemblyLineRobot} />
            </ResultImageContainer>
            <br/><br/>
            <ALLink href={"https://malware.cyber.gc.ca/search?query=" + props.ipAddress}>Assembly Line</ALLink>
        </Container>
    );
}