import CountryValueRenderer from './CountryValueRenderer';
import DomainValueRenderer from './DomainValueRenderer';
import Ipv4ValueRenderer from './Ipv4ValueRenderer';
import Ipv6ValueRenderer from './Ipv6ValueRenderer';
import JsonValueRenderer from './JsonValueRenderer';

// Key is column advanced type, value is renderer
export const rendererMap = {
  IPV4: Ipv4ValueRenderer,
  IPV6: Ipv6ValueRenderer,
  DOMAIN: DomainValueRenderer,
  COUNTRY: CountryValueRenderer,
  JSON: JsonValueRenderer,
};

export const formatIpV4 = (v: any) => {
  const converted = `${(v >> 24) & 0xff}.${(v >> 16) & 0xff}.${
    (v >> 8) & 0xff
  }.${v & 0xff}`;
  return converted;
};
