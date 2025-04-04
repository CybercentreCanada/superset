import React from 'react';
import alfredLogo from './alfred-logo-black-small.png';

const AlfredIcon: React.FC<{ disabled?: boolean; disablePadding?: boolean }> =
  ({ disabled = false }) => (
    <span role="img" className="anticon">
      <img
        src={alfredLogo}
        alt="alfred logo"
        style={{
          overflow: 'visible',
          width: 12,
          height: 12,
          display: 'block',
          objectFit: 'cover',
          opacity: disabled ? 0.5 : 1,
        }}
      />
    </span>
  );

export default AlfredIcon;
