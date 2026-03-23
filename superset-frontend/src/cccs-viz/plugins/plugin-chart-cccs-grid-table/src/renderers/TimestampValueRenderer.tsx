import { memo } from 'react';

import { extendedDayjs } from '@superset-ui/core/utils/dates';

/**
 * Defines a list of hardcoded formats when the column definition has a matching field
 * name - i.e. "year" will always show the year only, instead of the full date
 */
const HARDCODED_FORMATS = new Map<string, string>([
  ['year', 'Y'],
  ['month', 'MMMM'],
  ['week', 'W'],
]);

// show all dates in UTC
const TimestampValueRenderer: React.FC<{
  [index: string]: any;
}> = memo(data => {
  const date = extendedDayjs(data.value);

  if (!date.isValid()) {
    return <>{data.value}</>;
  }

  return (
    <>
      {date
        .utc()
        .format(
          HARDCODED_FORMATS.get(data.colDef?.field?.toLowerCase()) ??
            'YYYY-MM-DD HH:mm:ss.SSS [UTC]',
        )}
    </>
  );
});

export default TimestampValueRenderer;
