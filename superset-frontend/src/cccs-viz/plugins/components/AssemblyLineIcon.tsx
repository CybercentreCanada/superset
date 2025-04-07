import AssemblyLineLogo from './assemblyline-logo.png';

const AssemblyLineIcon: React.FC<{
  disabled?: boolean;
  disablePadding?: boolean;
}> = ({ disabled = false }) => (
  <span role="img" className="anticon">
    <img
      src={AssemblyLineLogo}
      alt="AssemblyLine logo"
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

export default AssemblyLineIcon;
