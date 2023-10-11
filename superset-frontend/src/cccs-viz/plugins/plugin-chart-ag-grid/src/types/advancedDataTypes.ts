import CountryValueRenderer from './CountryValueRenderer';
import DomainValueRenderer from './DomainValueRenderer';
import Ipv6ValueRenderer from './Ipv6ValueRenderer';
import JsonValueRenderer from './JsonValueRenderer';

// Key is column advanced type, value is renderer
export const rendererMap = {
  IPV6: Ipv6ValueRenderer,
  DOMAIN: DomainValueRenderer,
  COUNTRY: CountryValueRenderer,
  JSON: JsonValueRenderer,
};

export const formatIpV4 = (v: any) => {
  const value = Number(v.value ?? v);
  const converted = `${(value >> 24) & 0xff}.${(value >> 16) & 0xff}.${
    (value >> 8) & 0xff
  }.${value & 0xff}`;
  return converted;
};

export const formatterMap = {
  IPV4: formatIpV4,
};
