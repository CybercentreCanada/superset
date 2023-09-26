import { DataMaskWithId, isNativeFilter } from '@superset-ui/core';
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

const useEmitGlobalFilter = () => {
  const dispatch = useDispatch();
  const adhocFilters = useSelector<RootState, DataMaskWithId[]>(state =>
    Object.values(state.nativeFilters.filters)
      .filter(f => isNativeFilter(f) && f.filterType === 'filter_adhoc')
      .map(f => state.dataMask[f.id]),
  );

  return useCallback(
    (groupBy: [string, any][]) => {
      // Iterate through all the ad hoc filters, and add another ad hoc entry.
      // Note that this may have unintended consequences. User feedback may make
      // it so we want to allow them to choose which adhoc filter to emit to, instead
      // of just applying it to all of them.
      adhocFilters.forEach(filter => {
        const newFilters = groupBy.map(([col, _val]) => {
          const val = Array.isArray(_val) && _val.length < 2 ? _val[0] : _val;
          const op = Array.isArray(val)
            ? Operators.IN
            : // Check to see if the value is a number or not
            /^\d+(\.\d+)?$/.test(val?.toString())
            ? Operators.EQUALS
            : Operators.ILIKE;

          // I reverse-engineered this from the redux store. There's probably a better way to do this,
          // but this is what works for now.
          return {
            expressionType: EXPRESSION_TYPES.SIMPLE,
            subject: col,
            operator: OPERATOR_ENUM_TO_OPERATOR_TYPE[op].operation,
            operatorId: op,
            comparator: op !== Operators.ILIKE ? val : `%${val}%`,
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
        });

        const newFilterList = [
          ...((filter.extraFormData?.adhoc_filters as any[]) ?? []),
          ...newFilters,
        ];

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
    [adhocFilters, dispatch],
  );
};

export default useEmitGlobalFilter;
