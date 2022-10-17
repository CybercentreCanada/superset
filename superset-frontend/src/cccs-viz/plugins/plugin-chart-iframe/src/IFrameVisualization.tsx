import React from 'react';
import { IFrameVisualizationProps } from './types';


export default function IFrameVisualization(props: IFrameVisualizationProps) {
  const { url, url_parameter_value, parameter_name } = props
  console.log(`${url}?${parameter_name}=${url_parameter_value}`)
  return (
    <iframe src={`${url}?${parameter_name}${url_parameter_value}`} style={{ position: 'absolute', left:0, top: '50px', width:'95%', height:'100%' }}></iframe>
  );
}
