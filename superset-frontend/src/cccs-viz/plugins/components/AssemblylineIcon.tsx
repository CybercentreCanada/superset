import React from 'react';
import assemblylineLogo from './assemblyline-logo.png';

const AssemblylineIcon: React.FC<{ disabled?: boolean; disablePadding?: boolean }> =
  ({ disabled = false }) => (
    <span role="img" className="anticon">
      <img
        src={assemblylineLogo}
        alt="assemblyline logo"
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

export default AssemblylineIcon;
