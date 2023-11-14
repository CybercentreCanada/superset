import {
  DataMaskStateWithId,
  Filter,
  ensureIsArray,
  isNativeFilter,
} from '@superset-ui/core';
import { useDispatch, useSelector } from 'react-redux';
import { updateDataMask } from 'src/dataMask/actions';
import {
  OPERATOR_ENUM_TO_OPERATOR_TYPE,
  Operators,
} from 'src/explore/constants';

import { useCallback } from 'react';
import { RootState } from 'src/dashboard/types';
import {
  CLAUSES,
  EXPRESSION_TYPES,
} from 'src/explore/components/controls/FilterControl/AdhocFilter';
import { safeJsonObjectParse } from '../utils';

const useEmitGlobalFilter = () => {
  const dispatch = useDispatch();
  const adhocFilters = useSelector<RootState, Filter[]>(
    state =>
      Object.values(state.nativeFilters.filters).filter(
        f => isNativeFilter(f) && f.filterType === 'filter_adhoc',
      ) as Filter[],
  );
  const dataMasks = useSelector<RootState, DataMaskStateWithId>(
    ({ dataMask }) => dataMask,
  );

  return useCallback(
    (sliceId: number, groupBy: [string, any][]) => {
      // Iterate through all the ad hoc filters that have the current chart in scope,
      // and add another ad hoc entry. Note that this may have unintended consequences.
      // User feedback may make it so we want to allow them to choose which adhoc
      // filter to emit to, instead of just applying it to all of them.
      adhocFilters
        .filter(f => f.chartsInScope?.includes(sliceId))
        .map(f => dataMasks[f.id])
        .forEach(filter => {
          const newFilters = groupBy
            .map(([col, _val]) => {
              const rawValue =
                Array.isArray(_val) && _val.length < 2
                  ? // If the value is an array of a single entry, strip it to just the underlying value.
                    _val[0]
                  : // Otherwise, preserve (note this applies to non-array values too)
                    _val;

              // Since some values are nested JSON (i.e. the string "['test', 'test2']"), we need to try and parse this out.
              const processedValue = Array.isArray(rawValue)
                ? // If it's an array, we flatMap and try to parse every entry
                  rawValue.flatMap(entry =>
                    ensureIsArray(safeJsonObjectParse(entry) ?? entry),
                  )
                : // If it's not an array, we just parse the single raw value
                  safeJsonObjectParse(rawValue) ?? rawValue;

              const op = Array.isArray(processedValue)
                ? Operators.IN
                : Operators.EQUALS;

              // I reverse-engineered this from the redux store. There's probably a better way to do this,
              // but this is what works for now.
              return {
                expressionType: EXPRESSION_TYPES.SIMPLE,
                subject: col,
                operator: OPERATOR_ENUM_TO_OPERATOR_TYPE[op].operation,
                operatorId: op,
                comparator: processedValue,
                clause: CLAUSES.WHERE,
                sqlExpression: null,
                isExtra: false,
                isNew: true,
                datasourceWarning: false,
                filterOptionName: `filter_${Math.random()
                  .toString(36)
                  .substring(2, 15)}_${Math.random()
                  .toString(36)
                  .substring(2, 15)}`,
              };
            })
            .filter(f => {
              const adhoc_filters = (filter.extraFormData?.adhoc_filters ||
                []) as any[];
              const res =
                f.subject !== 'undefined' &&
                !adhoc_filters.some(
                  a =>
                    a.subject === f.subject &&
                    a.operator === f.operator &&
                    a.comparator === f.comparator &&
                    a.operatorId === f.operatorId,
                );
              return res;
            });

          const newFilterList = [
            ...((filter.extraFormData?.adhoc_filters as any[]) ?? []),
            ...newFilters,
          ];

          if (newFilterList.length === 0) {
            return;
          }

          const newLabel = newFilterList
            .map(
              f =>
                `${f.subject} ${f.operator} ${
                  Array.isArray(f.comparator)
                    ? f.comparator.join(', ')
                    : f.comparator
                }`,
            )
            .join(', ');

          // This adds the new filter to the data mask. No idea if all these fields are necessary?
          // TODO: Test removing these fields to see if things break
          const newMask = {
            id: filter.id,
            extraFormData: {
              adhoc_filters: newFilterList,
            },
            filterState: {
              label: newLabel,
              value: newFilterList,
              filters: newFilterList,
            },
            ownState: {},
            __cache: {
              value: newFilterList,
              filters: newFilterList,
            },
          };

          dispatch(updateDataMask(filter.id, newMask));
        });
    },
    [adhocFilters, dataMasks, dispatch],
  );
};

export default useEmitGlobalFilter;
