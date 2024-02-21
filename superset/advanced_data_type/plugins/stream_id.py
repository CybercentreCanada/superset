import re
from superset.advanced_data_type.plugins import translate_filter_func
from superset.advanced_data_type.plugins.operator_sets import EQUAL_NULLABLE_OPERATOR_SET, PATTERN_MATCHING_OPERATOR_SET
from superset.advanced_data_type.types import AdvancedDataType, AdvancedDataTypeRequest, AdvancedDataTypeResponse

STREAM_DICT = {11: 'IIS_EXT',
 73: 'SCED_EPS_EXT',
 35: 'GCSN_EXT',
 28: 'HOC_EXT_89',
 63: 'HOC_EXT_BELL_ROG',
 54: 'ELC_LOGS_HQ',
 7: 'SMS_INT',
 13: 'NRC_INT',
 2: 'NRC_EXT',
 59: 'SMNET_EXT',
 24: 'CSE_EXT',
 37: 'DND_EXT',
 39: 'DND_DMZ',
 20: 'GAC_DMZ',
 8: 'HOC_EXT_504',
 9: 'GAC_INT',
 27: 'MapleTap-RCMP-PB-PROD',
 52: 'MT-TBS-PROD',
 149: 'SMS_External',
 50: 'SMS_DMZ',
 172: 'GAC_EXT',
 6: 'MapleTap - ETS-EIO-INTERNET - PB - Prod',
 23: 'GCSN_EXT_DECRYPT',
 161: 'SCNL_EXT_PROD',
 29: 'MapleTap - SSC SCED-STATS-VCAP - PB - Prod',
 45: 'ELC_EXT_DECRYPT_CEHOM',
 166: 'MapleTap - SSC GcPc-NSS-IRCCvCAP - PB - Prod',
 61: 'MapleTap-OCOL-PB-PROD',
 136: 'HOC_EXT_81',
 144: 'DND_Passive',
 40: 'MapleTap - ETS-EIO-INTERNET - U - Prod',
 55: 'ELC_EXT_CEHOM',
 185: 'HOC_EXT_83',
 3: 'ATL_EXT',
 51: 'MapleTap - RCMP - U - CloudDev',
 4: 'MapleTap - SSC SCED-CRA-VCAP - PB - Prod',
 134: 'MT-ETS-PROD',
 60: 'CSE_DMZ',
 18: 'MEDUSA_EXT',
 155: 'CSE_INT',
 142: 'SMNET_LOGS',
 167: 'MapleTap-BigDigEvents-U-Dev',
 74: 'HOC_EXT_87',
 25: 'IIS_EXT_STG',
 179: 'SCED_Passive-only_EXT',
 168: 'ATL_INT',
 158: 'MapleTap - FINTRAC - PB - PROD',
 159: 'MapleTap - FINTRAC - PB - CloudDev',
 140: 'MT-CBS-STAGING',
 129: 'MT-ASSEMBLYLINE-U-PROD'}

def stream_id_func(req: AdvancedDataTypeRequest) -> AdvancedDataTypeResponse:
    """
    Convert a passed in AdvancedDataTypeRequest to an AdvancedDataTypeResponse
    """
    resp: AdvancedDataTypeResponse = {
        "values": [],
        "error_message": "",
        "display_value": "",
        "valid_filter_operators": EQUAL_NULLABLE_OPERATOR_SET,
    }
    if req["values"] == [""]:
        resp["error_message"] = "Stream ID must not be empty"
        return resp
    for val in req["values"]:
        if (val in STREAM_DICT):
            resp["values"].append(val)
        else:
            try:
                key = list(STREAM_DICT.keys())[list(STREAM_DICT.values()).index(val)]
                resp["values"].append(key)
            except ValueError:
                resp["error_message"] = f"'{ val }' is not a valid Stream ID. Did not match a known Stream ID or name."
                return resp

    resp["display_value"] = ", ".join(str(resp["values"]))
    return resp

stream_id: AdvancedDataType = AdvancedDataType(
    verbose_name="Stream ID",
    description="Represents a Stream ID",
    valid_data_types=["str", "int"],
    translate_filter=translate_filter_func,
    translate_type=stream_id_func,
)
