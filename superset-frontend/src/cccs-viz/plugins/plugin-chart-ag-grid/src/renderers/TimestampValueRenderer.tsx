import { memo } from 'react';

import moment from 'moment-timezone';

/**
 * Defines a list of hardcoded formats when the column definition has a matching field
 * name - i.e. "year" will always show the year only, instead of the full date
 */
const HARDCODED_FORMATS = {
  year: 'Y',
  month: 'MMMM',
  week: 'W',
};

const TimestampValueRenderer: React.FC<{
  [index: string]: any;
}> = memo(data => {
  const date = moment.utc(data.value); // show all dates in UTC

  if (!date.isValid()) {
    return <>{data.value}</>;
  }

  const timezone = date.format('z');

  return (
    <>
      {date.format(
        HARDCODED_FORMATS[data.colDef?.field?.toLowerCase()] ??
          'YYYY-MM-DD HH:mm:ss.SSS',
      ) + (timezone ? ` ${timezone}` : '')}
    </>
  );
});

export default TimestampValueRenderer;
