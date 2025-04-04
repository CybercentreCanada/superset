import { QueryFormData, SupersetTheme, css } from '@superset-ui/core';
import { get, isEmpty, isObject } from 'lodash';
import { ChangeEvent, memo, useCallback, useState } from 'react';
import { JSONTree } from 'react-json-tree';

const errorStyles = (theme: SupersetTheme) => css`
  color: ${theme.colors.error.base};
  font-weight: bold;
`;

const wrapperStyles = (height: number, width: number) => css`
  max-height: ${height}px;
  max-width: ${width}px;
  overflow: auto;

  ul li {
    padding-top: 0px !important;
  }

  ul li > label {
    padding-top: 0.25rem;
  }

  label:empty {
    display: none !important;
  }
`;

const searchStyles = (theme: SupersetTheme) => css`
  display: flex;
  flex-direction: row;
  align-items: center;

  margin-top: 0.5rem;

  span {
    margin-right: 1rem;
  }

  input {
    border-radius: ${theme.borderRadius}px;
    margin-right: 0.5rem;
  }
`;

const labelStyles = (buttonActive = false) => css`
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
  enableSearch: boolean;
  compactView: boolean;
  sliceId: number;
};

const JSONViewVisualization: React.FC<PrettyPrintVisualizationProps> = ({
  values,
  errorMessage,
  height,
  width,
  enableSearch,
  compactView,
  sliceId,
}) => {
  const [searchValue, setSearchValue] = useState('');

  const setSearch = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();

    setSearchValue(e.target.value);
  }, []);

  return (
    <>
      {errorMessage ? (
        <span css={errorStyles}>{errorMessage}</span>
      ) : (
        <div css={wrapperStyles(height, width)}>
          {enableSearch && (
            <div css={searchStyles}>
              <span>Search</span>
              <input
                className="form-control input-sm"
                placeholder="Search values"
                value={searchValue}
                onChange={setSearch}
              />
            </div>
          )}
          <JSONTree
            data={values}
            theme="default"
            hideRoot={compactView}
            shouldExpandNode={() => true}
            labelRenderer={(keyPath, nodeType) => {
              const path = [...keyPath]
                .reverse()
                .filter((_, index) => compactView || index > 0)
                .map(key => key.toString());

              const isComplex = ['Array', 'Object', 'Custom'].includes(
                nodeType,
              );
              const value = get(values, path);

              if (compactView && isComplex && isEmpty(value)) {
                return null;
              }

              if (
                searchValue &&
                !isComplex &&
                !path
                  .join('.')
                  .toLowerCase()
                  .includes(searchValue.toLowerCase()) &&
                !(value ?? 'null')
                  .toString()
                  .toLowerCase()
                  .includes(searchValue.toLowerCase())
              ) {
                return null;
              }

              return (
                <div css={labelStyles()}>
                  <span>{keyPath[0]}:</span>
                </div>
              );
            }}
            valueRenderer={(value, _, ...keyPath) => {
              if (compactView && isObject(value) && isEmpty(value)) {
                return null;
              }

              const path = [...keyPath]
                .reverse()
                .filter((_, index) => index > 0)
                .map(key => key.toString())
                .join('.')
                .toLowerCase();

              const valueAsString = value.toString().toLowerCase();

              if (
                !path.includes(searchValue.toLowerCase()) &&
                !valueAsString.includes(searchValue.toLowerCase())
              ) {
                return null;
              }

              return value;
            }}
            isCustomNode={value =>
              compactView && isObject(value) && isEmpty(value)
            }
          />
        </div>
      )}
    </>
  );
};

export default memo(JSONViewVisualization);
