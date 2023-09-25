import { QueryFormData, css } from '@superset-ui/core';
import _ from 'lodash';
import React, { memo } from 'react';
import { JSONTree } from 'react-json-tree';
import EmitIcon from '../components/EmitIcon';
import useEmitGlobalFilter from '../hooks/useEmitGlobalFilter';

const labelStyles = (buttonActive = true) => css`
  display: grid;
  gap: 1rem;
  grid-template-columns: auto ${buttonActive && ' auto'};
  align-items: center;
  ${buttonActive && 'margin-left: calc(-16px - 1rem);'}

  button {
    padding: 0;
    opacity: 0;
    background: transparent;
    border: none;
    transition: 200ms opacity ease;
  }

  :hover button {
    opacity: 1;
  }
`;

export type PrettyPrintVisualizationProps = QueryFormData & {
  values: any[];
  errorMessage: string;
  height: number;
  width: number;
};

const JSONViewVisualization: React.FC<PrettyPrintVisualizationProps> =
  props => {
    const { values, errorMessage, height, width } = props;

    const emitGlobalFilter = useEmitGlobalFilter();

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
              labelRenderer={(keyPath, nodeType) => {
                const path = [...keyPath]
                  .reverse()
                  .filter((_, index) => index > 0)
                  .map(key => key.toString());

                const value = _.get(values, path);

                const showButton = !['Array', 'Object'].includes(nodeType);
                const buttonDisabled = nodeType === 'Null';

                return (
                  <div css={labelStyles(showButton)}>
                    {showButton && (
                      <button
                        type="button"
                        disabled={buttonDisabled}
                        onClick={() =>
                          emitGlobalFilter([[keyPath[0].toString(), value]])
                        }
                      >
                        <EmitIcon disabled={buttonDisabled} disablePadding />
                      </button>
                    )}
                    <span>{keyPath[0]}:</span>
                  </div>
                );
              }}
            />
          </div>
        )}
      </>
    );
  };

export default memo(JSONViewVisualization);
