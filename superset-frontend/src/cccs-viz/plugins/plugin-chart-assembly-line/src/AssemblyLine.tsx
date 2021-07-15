import React, { useState, useEffect } from 'react';
import { AssemblyLineProps } from './types';
import { default as dummy } from './plugin/dummy';
import GenericComponent from './plugin/GenericComponent';

const useDataApi = (initialIP: string, initialData: number | undefined): number | undefined => {
    const [data, setData] = useState(initialData);
    const [ip, setIP] = useState(initialIP);
    const [isLoading, setIsLoading] = useState(false);
    const [isError, setIsError] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setIsError(false);
            setIsLoading(true);

            try {
                const result = await dummy();
                
                if (typeof result === "string") {
                    const jsonData = JSON.parse(JSON.parse(result));
                    setData(jsonData["api_response"]["items"].length);
                }
                else {
                    setData(undefined);
                }

            } catch (error) {
                setIsError(true);
            }

            setIsLoading(false);
        };

        fetchData();
    }, [ip]);

    return data;
};

export default function AssemblyLine(props: AssemblyLineProps) {

    let totalTimesSeen = useDataApi(
        props.ipAddress,
        undefined,
    );

    let finalTotalTimesSeen: number = totalTimesSeen ? totalTimesSeen : 0;

    return (
        <GenericComponent totalTimesSeen={finalTotalTimesSeen} ipAddress={props.ipAddress} />
    );
}