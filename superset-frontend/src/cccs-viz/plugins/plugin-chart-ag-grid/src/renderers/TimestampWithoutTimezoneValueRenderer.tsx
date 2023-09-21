import React from 'react';

import moment from 'moment';

const TimestampWithoutTimezoneValueRenderer: React.FC<{
  [index: string]: any;
}> = React.memo(data => (
  <>{moment(data.value).format('YYYY-MM-DD HH:mm:ss.SS')}</>
));

export default TimestampWithoutTimezoneValueRenderer;
