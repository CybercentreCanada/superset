import React, { useEffect, useState } from 'react';
import { SLOW_DEBOUNCE, SupersetClient, t, withTheme } from '@superset-ui/core';
import {
  buildTimeRangeString,
  formatTimeRange,
  COMMON_RANGE_VALUES_SET,
  CALENDAR_RANGE_VALUES_SET,
  FRAME_OPTIONS,
  customTimeRangeDecode,
} from 'src/explore/components/controls/DateFilterControl/utils';
import { Input } from 'src/components/Input';
import { InfoTooltipWithTrigger } from '@superset-ui/chart-controls';
import { FrameComponentProps } from 'src/explore/components/controls/DateFilterControl/types';
import DateFunctionTooltip from 'src/explore/components/controls/DateFilterControl/components/DateFunctionTooltip';
import { connect } from 'react-redux';
import rison from 'rison';
import { getClientErrorObject } from 'src/utils/getClientErrorObject';
import { useDebouncedEffect } from 'src/explore/exploreUtils';



export interface Props {
    colorScheme: string;
    annotationError: object;
    annotationQuery: object;
    vizType: string;
    theme: any;
    validationErrors: string[];
    name: string;
    actions: object;
    label: string;
    value?: object[];
    onChange: (a: any) => void;
    default: string;
  }

const SEPARATOR = " : "
const fetchTimeRange = async (timeRange: string) => {
  const query = rison.encode_uri(timeRange);
  const endpoint = `/api/v1/time_range/?q=${query}`;
  try {
    const response = await SupersetClient.get({ endpoint });
    const timeRangeString = buildTimeRangeString(
      response?.json?.result?.since || '',
      response?.json?.result?.until || '',
    );
    return {
      value: formatTimeRange(timeRangeString),
    };
  } catch (response) {
    const clientError = await getClientErrorObject(response);
    return {
      error: clientError.message || clientError.error,
    };
  }
};


const DatetimeControl: React.FC<Props>  = (props) => {

    const [timeRange, setTimeRange ] = useState(props.default); 
    
    const [since, until] = timeRange.split(SEPARATOR);

    function onChange(control: 'since' | 'until', value: string) {
        if (control === 'since') {
            setTimeRange(`${value}${SEPARATOR}${until}`);
        } else {
            setTimeRange(`${since}${SEPARATOR}${value}`);
        }
    }
    useEffect(() => {
        props.onChange(timeRange)
    }, [timeRange])
    useDebouncedEffect(() => {
      fetchTimeRange(timeRange).then( value =>
        console.log(value)
      )
    },SLOW_DEBOUNCE,[timeRange])
    return (
        <>
          <div className="control-label">
            {t('START (INCLUSIVE)')}{' '}
            <InfoTooltipWithTrigger
              tooltip={t('Start date included in time range')}
              placement="right"
            />
          </div>
          <Input
            key="since"
            value={since}
            onChange={e => onChange('since', e.target.value)}
          />
          <div className="control-label">
            {t('END (EXCLUSIVE)')}{' '}
            <InfoTooltipWithTrigger
              tooltip={t('End date excluded from time range')}
              placement="right"
            />
          </div>
          <Input
            key="until"
            value={until}
            onChange={e => onChange('until', e.target.value)}
          />
        </>
      );
}


// Tried to hook this up through stores/control.jsx instead of using redux
// directly, could not figure out how to get access to the color_scheme
function mapStateToProps({ charts, explore }: any) {
    return {
      // eslint-disable-next-line camelcase
      colorScheme: explore.controls?.color_scheme?.value,
      vizType: explore.controls.viz_type.value,
    };
  }
  
  const themedDrillActionConfigControl = withTheme(DatetimeControl);
  
  export default connect(mapStateToProps)(themedDrillActionConfigControl);
  