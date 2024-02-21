import ipaddress
import re
from superset.advanced_data_type.plugins import translate_filter_func
from superset.advanced_data_type.plugins.internet_address import cidr_translate_filter_func
from superset.advanced_data_type.plugins.operator_sets import CIDR_OPERATOR_SET
from superset.advanced_data_type.types import AdvancedDataType, AdvancedDataTypeRequest, AdvancedDataTypeResponse

def ipv6_func(req: AdvancedDataTypeRequest) -> AdvancedDataTypeResponse:
    """
    Convert a passed in AdvancedDataTypeRequest to an AdvancedDataTypeResponse
    """
    resp: AdvancedDataTypeResponse = {
        "values": [],
        "error_message": "",
        "display_value": "",
        "valid_filter_operators": CIDR_OPERATOR_SET,
    }
    if req["values"] == [""]:
        resp["error_message"] = "IPv6 address must not be empty"
        return resp
    for val in req["values"]:
        string_value = str(val)
        try:
            ip_range = (
                ipaddress.ip_network(int(string_value), strict=False)
                if string_value.isnumeric()
                else ipaddress.ip_network(string_value, strict=False)
            )

            if ip_range.version != 6:
                raise TypeError(f"'{ val }' is not a valid IPv6 address.")

            resp["values"].append(
                {"start": int(ip_range[0]), "end": int(ip_range[-1])}
                if ip_range[0] != ip_range[-1]
                else int(ip_range[0])
            )
        except ValueError as ex:
            resp["error_message"] = f"'{ val }' is not a valid IPv6 address."
            break
        except TypeError as ex:
            resp["error_message"] = str(ex)
            break
        else:
            resp["display_value"] = ", ".join(
                map(
                    lambda x: f"{x['start']} - {x['end']}" if isinstance(x, dict) else str(x),
                    resp["values"],
                )
            )
    return resp

ipv6_address: AdvancedDataType = AdvancedDataType(
    verbose_name="IPv6",
    description="Represents an IPv6 address",
    valid_data_types=["int"],
    translate_filter=cidr_translate_filter_func,
    translate_type=ipv6_func,
)
