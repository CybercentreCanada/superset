import CountryValueRenderer from './renderers/CountryValueRenderer';
import DomainValueRenderer from './renderers/DomainValueRenderer';
import Ipv4ValueRenderer from './renderers/Ipv4ValueRenderer';
import Ipv6ValueRenderer from './renderers/Ipv6ValueRenderer';
import JsonValueRenderer from './renderers/JsonValueRenderer';
import TimestampWithoutTimezoneValueRenderer from './renderers/TimestampWithoutTimezoneValueRenderer';

// Key is column advanced type, value is renderer
const rendererMap = {
  IPV4: Ipv4ValueRenderer,
  IPV6: Ipv6ValueRenderer,
  DOMAIN: DomainValueRenderer,
  COUNTRY: CountryValueRenderer,
  JSON: JsonValueRenderer,
  'TIMESTAMP WITHOUT TIME ZONE': TimestampWithoutTimezoneValueRenderer,
};

export default rendererMap;
