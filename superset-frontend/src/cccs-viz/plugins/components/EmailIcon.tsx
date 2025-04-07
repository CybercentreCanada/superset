import emailLogo from './email-logo.png';

const EmailIcon: React.FC<{ disabled?: boolean; disablePadding?: boolean }> = ({
  disabled = false,
}) => (
  <span role="img" className="anticon">
    <img
      src={emailLogo}
      alt="email logo"
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

export default EmailIcon;
