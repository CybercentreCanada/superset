import CountryValueRenderer from '../renderers/CountryValueRenderer';
import DomainValueRenderer from '../renderers/DomainValueRenderer';
import Ipv6ValueRenderer from '../renderers/Ipv6ValueRenderer';
import JsonValueRenderer from '../renderers/JsonValueRenderer';
import TimestampValueRenderer from '../renderers/TimestampValueRenderer';

// Key is column advanced type, value is renderer
export const rendererMap = new Map();
rendererMap.set('IPV6', Ipv6ValueRenderer);
rendererMap.set('DOMAIN', DomainValueRenderer);
rendererMap.set('COUNTRY', CountryValueRenderer);
rendererMap.set('JSON', JsonValueRenderer);
rendererMap.set('DATE', TimestampValueRenderer);
rendererMap.set('DATETIME', TimestampValueRenderer);
rendererMap.set('TIMESTAMP WITHOUT TIME ZONE', TimestampValueRenderer);
rendererMap.set('TIMESTAMP WITH TIME ZONE', TimestampValueRenderer);
rendererMap.set('DATETIMETZ', TimestampValueRenderer);

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

export const formatterMap = new Map<string, (v: any) => string>([
  ['IPV4', formatIpv4],
  ['INTERNET_ADDRESS', formatIpv4],
]);
