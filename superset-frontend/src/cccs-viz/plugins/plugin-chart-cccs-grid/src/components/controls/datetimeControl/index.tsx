import React, { useEffect, useState } from 'react';
import {
  NO_TIME_RANGE,
  SLOW_DEBOUNCE,
  SupersetClient,
  t,
  withTheme,
} from '@superset-ui/core';
import {
  buildTimeRangeString,
  formatTimeRange,
} from 'src/explore/components/controls/DateFilterControl/utils';
import { Input } from 'src/components/Input';
import { connect } from 'react-redux';
import rison from 'rison';
import ControlHeader from 'src/explore/components/ControlHeader';
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
  value?: string;
  onChange: (value: any, errors: any[]) => void;
  default: string;
  disabled: boolean;
}

const SEPARATOR = ' : ';
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
      // keep labelling consistent in error messages
      error: (clientError.message || clientError.error)
        .replace('From date', 'Start date')
        .replace('to date', 'end date'),
    };
  }
};

const DatetimeControl: React.FC<Props> = props => {
  // if the value passed in is "no filter", leave the control empty
  // if the value does not exist, set it to the default
  const [timeRange, setTimeRange] = useState(
    props.value
      ? props.value === NO_TIME_RANGE
        ? ''
        : props.value
      : props.default,
  );
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [actualTimeRange, setActualTimeRange] = useState<string>();

  const [since, until] = timeRange.split(SEPARATOR);

  useEffect(() => {
    props.onChange(timeRange, validationErrors);
  }, [timeRange, since, until, validationErrors]);

  function onChange(control: 'since' | 'until', value: string) {
    if (control === 'since') {
      setTimeRange(
        until ? `${value}${SEPARATOR}${until}` : `${value}${SEPARATOR}`,
      );
    } else {
      setTimeRange(`${since}${SEPARATOR}${value}`);
    }
  }

  useDebouncedEffect(
    () => {
      fetchTimeRange(timeRange)
        .then(value => {
          setActualTimeRange(
            value?.value ? `Actual Time Range ${value?.value}` : '',
          );
          setValidationErrors(value?.error ? [value?.error] : []);
        })
        .catch(error => {
          setValidationErrors(error);
        });
    },
    SLOW_DEBOUNCE,
    [timeRange],
  );

  const headerProps = {
    name: props.name,
    label: props.label,
    validationErrors,
    description: actualTimeRange,
    hovered: true,
  };

  return (
    <>
      <ControlHeader {...headerProps} />
      <div className="control-label">{t('START (INCLUSIVE)')} </div>
      <Input
        key="since"
        value={since}
        onChange={e => onChange('since', e.target.value)}
        disabled={props.disabled}
      />
      <div className="control-label">{t('END (EXCLUSIVE)')} </div>
      <Input
        key="until"
        value={until}
        onChange={e => onChange('until', e.target.value)}
        disabled={props.disabled}
      />
    </>
  );
};

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
