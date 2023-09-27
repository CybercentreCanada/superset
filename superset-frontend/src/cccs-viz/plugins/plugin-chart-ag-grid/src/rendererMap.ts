import CountryValueRenderer from './renderers/CountryValueRenderer';
import DomainValueRenderer from './renderers/DomainValueRenderer';
import Ipv4ValueRenderer from './renderers/Ipv4ValueRenderer';
import Ipv6ValueRenderer from './renderers/Ipv6ValueRenderer';
import JsonValueRenderer from './renderers/JsonValueRenderer';
import TimestampValueRenderer from './renderers/TimestampValueRenderer';

// Key is column advanced type, value is renderer
const rendererMap = {
  IPV4: Ipv4ValueRenderer,
  IPV6: Ipv6ValueRenderer,
  DOMAIN: DomainValueRenderer,
  COUNTRY: CountryValueRenderer,
  JSON: JsonValueRenderer,
  DATE: TimestampValueRenderer,
  DATETIME: TimestampValueRenderer,
  'TIMESTAMP WITHOUT TIME ZONE': TimestampValueRenderer,
  'TIMESTAMP WITH TIME ZONE': TimestampValueRenderer,
};

export default rendererMap;
