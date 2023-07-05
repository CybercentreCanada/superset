
// Key is column advanced type, value is renderer name
export const rendererMap = {
    IPV4: 'ipv4ValueRenderer',
    IPV6: 'ipv6ValueRenderer',
    DOMAIN: 'domainValueRenderer',
    COUNTRY: 'countryValueRenderer',
    JSON: 'jsonValueRenderer',
};

export const formatIpV4 = (v: any) => {
    const converted = `${(v >> 24) & 0xff}.${(v >> 16) & 0xff}.${
      (v >> 8) & 0xff
    }.${v & 0xff}`;
    return converted;
  };
