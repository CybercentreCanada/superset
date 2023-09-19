import { QueryFormData } from '@superset-ui/core';
import React, { memo } from 'react';
import { JSONTree } from 'react-json-tree';

export type PrettyPrintVisualizationProps = QueryFormData & {
  values: any[];
  errorMessage: string;
  height: number;
  width: number;
};

const JSONViewVisualization: React.FC<PrettyPrintVisualizationProps> =
  props => {
    const { values, errorMessage, height, width } = props;

    return (
      <>
        {errorMessage ? (
          // eslint-disable-next-line theme-colors/no-literal-colors
          <span style={{ color: 'red', fontWeight: 'bold' }}>
            {errorMessage}
          </span>
        ) : (
          <div
            style={{
              maxHeight: `${height}px`,
              maxWidth: `${width}px`,
              overflow: 'auto',
            }}
          >
            <JSONTree
              data={values}
              theme="default"
              shouldExpandNode={() => true}
            />
          </div>
        )}
      </>
    );
  };

export default memo(JSONViewVisualization);
