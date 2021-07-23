import React from 'react';
import { styled } from '@superset-ui/core';

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
    result: string;
    image: any;
    link: string;
    title: string;
}

export default function GenericComponent(props: GenericComponentProps) {
    return (
        <Container>
            <ResultImageContainer>
                <Result>{props.result}</Result>
                <Image src={props.image} />
            </ResultImageContainer>
            <br/><br/>
            <ALLink href={props.link}>{props.title}</ALLink>
        </Container>
    );
}
