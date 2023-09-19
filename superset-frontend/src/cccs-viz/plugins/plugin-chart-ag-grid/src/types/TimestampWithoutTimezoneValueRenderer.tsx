import React from 'react';

import moment from 'moment';

const TimestampWithoutTimezoneValueRenderer: React.FC<{
  [index: string]: any;
}> = React.memo(
  // Since there's no timezone, we manually add in the UTC timezone
  data => <>{moment(data.value).format('YYYY-MM-DD HH:mm:ss.SS UTC')}</>,
);

export default TimestampWithoutTimezoneValueRenderer;
