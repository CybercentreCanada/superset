import React from 'react';

import moment from 'moment-timezone';

const TimestampValueRenderer: React.FC<{
  [index: string]: any;
}> = React.memo(data => {
  const timezone = moment(data.value).format('zz');

  return (
    <>
      {moment(data.value).format('YYYY-MM-DD HH:mm:ss.SS') +
        (timezone ? `(${timezone})` : '')}
    </>
  );
});

export default TimestampValueRenderer;
