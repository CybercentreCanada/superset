import CountryValueRenderer from '../renderers/CountryValueRenderer';
import DomainValueRenderer from '../renderers/DomainValueRenderer';
import Ipv6ValueRenderer from '../renderers/Ipv6ValueRenderer';
import JsonValueRenderer from '../renderers/JsonValueRenderer';
import TimestampValueRenderer from '../renderers/TimestampValueRenderer';

// Key is column advanced type, value is renderer
export const rendererMap = {
  IPV6: Ipv6ValueRenderer,
  DOMAIN: DomainValueRenderer,
  COUNTRY: CountryValueRenderer,
  JSON: JsonValueRenderer,
  DATE: TimestampValueRenderer,
  DATETIME: TimestampValueRenderer,
  'TIMESTAMP WITHOUT TIME ZONE': TimestampValueRenderer,
  'TIMESTAMP WITH TIME ZONE': TimestampValueRenderer,
  DATETIMETZ: TimestampValueRenderer,
};

export const formatIpv4 = (v: any) => {
  if (v.value === null) {
    return '';
  }
  const value = Number(v.value ?? v);
  const converted = `${(value >> 24) & 0xff}.${(value >> 16) & 0xff}.${
    (value >> 8) & 0xff
  }.${value & 0xff}`;
  return converted;
};

export const formatterMap = {
  IPV4: formatIpv4,
  INTERNET_ADDRESS: formatIpv4,
};
