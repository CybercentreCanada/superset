#!/usr/bin/env python3
import glob
import os
import json
import shutil
import sys
import tempfile
import re
import traceback
from datetime import datetime
import requests
from typing import Dict, List, Optional, TypedDict, Union, cast

DBT_URN = 'urn:li:dataset:(urn:li:dataPlatform:dbt'
ICEBERG_URN_PREFIX = 'urn:li:dataset:(urn:li:dataPlatform:iceberg'
OWNER_EXCLUSION_LIST = ['airflow/None']
TEMPORAL_DATATYPES = [ 'DATE', 'TIMESTAMP', 'TIME', 'TIMESTAMP WITH TIME ZONE', 'TIME WITH TIME ZONE']
ACCEPTED_PARTITION_DATATYPES = ['date', 'time', 'timestamp', 'timestamptz']
COMPLEX_DATATYPES = ['ARRAY', 'STRUCT']
DEFAULT_SUPERSET_DATA_TYPE = "TEXT"
DEFAULT_COMPLEX_DATA_TYPE = "JSON"
RAW_JSON_COLUMN_NAME = 'rawJSON'
SCROLL_ACROSS_ENTITIES_QUERY = 'query scrollAcrossEntities($input: ScrollAcrossEntitiesInput!) { \
    scrollAcrossEntities(input: $input) { \
        ...scrollResults \
      } \
    } \
    fragment scrollResults on ScrollResults { \
      nextScrollId \
      searchResults { \
        entity { \
          ...searchResultFields \
        } \
      } \
    } \
    fragment searchResultFields on Entity { \
      urn \
      type \
    }'
GET_DATASET_QUERY = 'query getDataset($urn: String!) { \
    dataset(urn: $urn) {  \
      name \
      type \
      urn \
      schemaMetadata(version: 0) { \
        ...schemaMetadataFields \
      } \
      editableSchemaMetadata { \
        editableSchemaFieldInfo { \
          fieldPath \
          description \
          glossaryTerms { \
            ...glossaryTerms \
          } \
        } \
      } \
      glossaryTerms { \
        ...glossaryTerms \
        __typename \
      } \
      ownership { \
        ...ownershipFields \
        __typename \
      } \
      domain { \
      ...entityDomain \
      } \
      properties { \
        customProperties { \
          key \
          value \
        } \
      } \
      siblings { \
        siblings { \
          ...siblingDatasetFields \
        } \
      } \
    } \
  } \
  fragment glossaryTerms on GlossaryTerms { \
    terms { \
      term { \
        urn \
        name \
        properties { \
          name \
        } \
      } \
    } \
  } \
  fragment schemaMetadataFields on SchemaMetadata { \
    fields { \
      fieldPath \
      description \
      jsonPath \
      type \
      nativeDataType \
      glossaryTerms { \
        ...glossaryTerms \
      } \
    } \
  } \
  fragment ownershipFields on Ownership { \
    owners { \
      owner { \
        ... on CorpUser { \
          type \
          username \
          info { \
            displayName \
          } \
        } \
        ... on CorpGroup { \
          type \
          name \
          info { \
            displayName \
          } \
        } \
      } \
      type \
    } \
  } \
  fragment entityDomain on DomainAssociation { \
    domain { \
      urn \
    } \
  } \
  fragment siblingDatasetFields on Dataset { \
    name \
    type \
    urn \
    schemaMetadata(version: 0) { \
      ...schemaMetadataFields \
    } \
    editableSchemaMetadata { \
      editableSchemaFieldInfo { \
        fieldPath \
        description \
        glossaryTerms { \
          ...glossaryTerms \
        } \
      } \
    } \
    glossaryTerms { \
      ...glossaryTerms \
      __typename \
    } \
    ownership { \
      ...ownershipFields \
      __typename \
    } \
    domain { \
    ...entityDomain \
    } \
    properties { \
      customProperties { \
        key \
        value \
      } \
    } \
    status { \
      removed \
    } \
  }'

base_form_data = {
   'datasource': {
      'type':'table'
    },
    'queries': [
      {
         'row_limit': 10,
         'series_limit': 0
      }
    ],
    'form_data': {
      'viz_type': 'cccs_grid',
      'query_mode': 'raw',
      'row_limit': 10,
      'timeseries_limit_metric':None,
      'enable_row_numbers': True,
      'result_format': 'json'
    },
    'result_format':'json'
}

# base_form_data = {
#     'datasource': {
#       'type': 'table'
#     },
#     'force': False,
#     'form_data': {
#       'enable_row_numbers': True,
#       'force': None,
#       'include_time': False,
#       'query_mode': 'raw',
#       'result_format': 'json',
#       'result_type': 'post_processed',
#       'row_limit': 10,
#       'timeseries_limit_metric': None,
#       'viz_type': 'cccs_grid'
#     },
#     'queries': [
#       {
#         'row_limit': 10
#       }
#     ],
#     'result_format': 'json',
#     'result_type': 'post_processed',
#     'viz_type': 'cccs_grid'
# }

def parse_entity_name(name: str) -> Dict:
    namespace = {}
    # expected format is catalog.schema.table_name
    regex_pattern = r"(\S+?)\.(\S+?)\.(\S+)"
    match = re.search(regex_pattern, name)
    if match:
        namespace["catalog"] = match.group(1)
        namespace["schema"] = match.group(2)
        namespace["table_name"] = match.group(3)
    else:
        raise (
            Exception(
                f'The entity name {name} did not match the expected pattern "{regex_pattern}".'
            )
        )
    return namespace

def get_owners(entity) -> List[str]:
    owners = []
    if entity['ownership'] and entity['ownership']['owners']:
        for owner in entity['ownership']['owners']:
            if owner['owner'] and owner['owner']['info'] and owner['owner']['info']['displayName']:
                owners.append(owner['owner']['info']['displayName'])
            elif owner['owner']['type']:
                ownerNameType = owner['owner']['type']
                if ownerNameType == 'CORP_USER':
                    owners.append(owner['owner']['username'])
                elif ownerNameType == 'CORP_GROUP':
                    owners.append(owner['owner']['name'])
    return list(filter(lambda owner: owner not in OWNER_EXCLUSION_LIST, owners))

def get_partition_column(entity) -> str:
    if entity['properties'] and entity['properties']['customProperties']:
      for properties in entity['properties']['customProperties']:
        if properties['key'] == 'partition-spec':
          for item in json.loads(properties['value']):
            if item['source-type'] in ACCEPTED_PARTITION_DATATYPES:
              # First item that qualifies determines the partition column
              return item['source']

    return None

def get_field_name(field_path: str) -> str:
    """
    Retrieves the first field name in a field path.
    This means that if the field is a child field,
    this method will return the field name of the parent.

    :param field_path: the field path as found in the GraphQL response.
    returns: The first field name in the field path.
    """
    match = re.match(r"^(?:\[\S*?=\S*?\]\.)*([^\.\s]*)(?:\..*)?", field_path)
    if match and match.group(1):
        return match.group(1)
    
def get_superset_datatype(datatype: str, column_name: str) -> str:
    datatype = datatype.upper()
    return_datatype = datatype
    if datatype in COMPLEX_DATATYPES or column_name == RAW_JSON_COLUMN_NAME:
      return_datatype = DEFAULT_COMPLEX_DATA_TYPE
    elif return_datatype == 'STRING' or datatype.startswith('VARCHAR'):
      return_datatype = DEFAULT_SUPERSET_DATA_TYPE
    elif datatype == 'NUMBER':
      return_datatype = 'NUMERIC'
    elif datatype in TEMPORAL_DATATYPES:
      return_datatype = 'TIMESTAMP WITH TIME ZONE'
    return return_datatype

def main():
    
    # From the config
    superset_url = 'https://superset-stg.hogwarts.pb.azure.chimera.cyber.gc.ca'
    # superset_url = 'https://superset-stg.hogwarts.u.azure.chimera.cyber.gc.ca'
    datahub_url = 'https://datahub-stg.hogwarts.pb.azure.chimera.cyber.gc.ca'
    # datahub_url = 'https://datahub-stg.hogwarts.u.azure.chimera.cyber.gc.ca'
    glossary_terms_urns = [ 'urn:li:glossaryTerm:Superset.Import to Superset' ]
    domains_urns = [ 'urn:li:domain:05eb46e7-ab79-40cd-9385-5d4b9552a043' ]

    # PB-STG
    DATAHUB_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhY3RvclR5cGUiOiJVU0VSIiwiYWN0b3JJZCI6IkpvZWwuR3JlZ29pcmVAY3liZXIuZ2MuY2EiLCJ0eXBlIjoiUEVSU09OQUwiLCJ2ZXJzaW9uIjoiMiIsImp0aSI6IjdmMjlhN2QzLTNmN2QtNDY2OC04MmY1LTEwMGI3NDIwYzU4NyIsInN1YiI6IkpvZWwuR3JlZ29pcmVAY3liZXIuZ2MuY2EiLCJpc3MiOiJkYXRhaHViLW1ldGFkYXRhLXNlcnZpY2UifQ.68HHg-V2jyGrfCAmnN__20zxngItzt6RNFbMIxine-w'
    SUPERSET_TOKEN = ".eJyVVU2zojgU_StTrudNARFHeyfyIQhBICQkU1MWEJ58BPD5UJSu_u-Dr3vR21lkcSs595ybnHvzfXG6fRbXU8UX3xbrxZ8L0eepKOag6OaoT29Dufj2ffHHsPj2z6J4OlKRbCu_cg5YDip355SZlb_iKJ5sGVb2p90OF7azV7YIHjEIBmY8Yt6JJG75MhBrBU5M9q3hSUxviCJn89ectOQkmJPYqq_HgLW4opEs4CRaF4UConygdbyET0n1WtZ4E2yZvp18vXkJuOTAewno-T4c86m_u8rjzhRxc1v5QoFzz5VNy63NLbPEjUVqnSnSnVmGShVHQH07MOI9WCRJPmqAS8yW1t7gId74ei7DKZiXWbqAPt16-8VHk1lrbQBP3yqebkxwauai1YpV9spD-ejpdPSQB_xorFhSjnbdP-C0HWG9VXw9mF6XlpL1S7NGhKnRaL3EjakFsUmzaLPykRMgWbvlSrlkJlcDSYiAMDeIxTImxpRJpo0EO1D5fCUETxHWEJZ4xzq8Q4ZYIqk8QjJMDJmIEtH7SEQFgRprQuyBMoUNroKERQc5mFI5xBnCXpGULp1pgrbcRV0sxy1GvNOUzCwfoclwaLAmkPMx6HgSk4fsAtGlu80e6eUll50uQOGU7_EOGt41NKFAuLQPADqpgHesh2agLO8p0HauhCUXXAJinJWUxAojG43Eg8eRMHzrp6GK7mUwe4TWvKZchZG0ZFZYuShQPGIMtHXE_F6j11J1rrFiNa-gTn9htZIC-wtvV2OVtebAotmMDX8ywu9p4gh3px0yBX_aRv_C3NOf3hsZoQolZgmr2QuWMb742OyF2WeTV8n1_IaAkViGiJdefX5hx7zFLUucOXf4zhMo8lYtMxJ_NciLw_2NN7CgSlv8dFteuy0sX_ry9vzF7TYm4pIZIn1mbM8gV8YxS9hUWIwxs4yIwZ95JRNIRAuR2SAQMobhOza36nz311wyvey5fGmaKPhqUDlX8DNRxJBb-Dn3wI0m4SVTfp7hxP4645FQIcgsc4M3OLkklISJG8mUWBcckrXMda1JZNPIFOPBkQO9rmQcO_eXdm6JZvZ29X976Qs7a3lhqeBxnJQkwybCmPcEb4aoGaRI4loczcOkYyKf-8qu7Zu3m4fFvjqynaSe-_zvz-Z4LDa1hqSNVx5TpE5o07Tgg6fkvKR1AmtD18Zx1XtovXx-HK9m-WltDNmvIucUGkBswHCma_Rxu94VPyOFFdorrAF3uG1O66PI7B7bFJ41f5CSQ5aY273flOeHnAe0Pqn6276jzVIaMuGO9qOO1lG2Mpar40cR5_C6_dxJxTkIjBvgqQXWoFtHp6PhvVt7oPZh44Ex96u3Axj0vhHMKLqCHla61XfPNzl6TwENjtPHe_e3r7xHINY-7uR9IrNYsfLaoXz7hNk4DmnAT-bwUG29UVePvnPlOqxXoOzN-1uRK9m04xSPMHrrn_neX-8eTDyELq0v9oebj-CgnRWHb8d50i_-_fFr3J8u1_5e8eI6fwLpdLsW8-7vf8SP_wBGnhSt.ZV0hmA.-J9_i3DPalV9763gd1nxCFVo1_8"

    # U-STG
    # DATAHUB_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhY3RvclR5cGUiOiJVU0VSIiwiYWN0b3JJZCI6IkpvZWwuR3JlZ29pcmVAY3liZXIuZ2MuY2EiLCJ0eXBlIjoiUEVSU09OQUwiLCJ2ZXJzaW9uIjoiMiIsImp0aSI6ImEzN2VhYWM5LWQ4MjktNDY2ZS1hODUyLTUyOTE5MzYxNjc5OSIsInN1YiI6IkpvZWwuR3JlZ29pcmVAY3liZXIuZ2MuY2EiLCJpc3MiOiJkYXRhaHViLW1ldGFkYXRhLXNlcnZpY2UifQ.BhhfMAOiazbUR5CrhCrKC81xiVdXOZvExj030BH7jX8'
    # SUPERSET_TOKEN = '.eJyNWNtyo8oV_ZWUn5MUV89o3iRzEZhuBtSAulMplwQa7rLGg43g1Pn3rAYnJ0nlIQ8ul6y-7F57rbX39m8PL--_Lm8vdfHw7cF4-PND95qfugs-XK749Hp6H6qHb789_Gl4-Pa3h8vkK5fjtg5r_zlVozp48quzm8vPh2T2VFp7v7xrqRZP3qPXdPtzZppxt3s7uWQ-2Rs1abzpfBSs6It35n7VswPW98NN_N_r_c1fEURVZJG89LXYx2M-v34Emlqde-cqMrU7X6N3rm0mcTD1U2a2Z72Yg97siqevMuBbrpP_3KtTJZ_-e-2m5axreJ8o5Ent-Ox0AYvMkOUDz0RNJuVOtcigc6JTK9FJZn949VifMkfxmtc7bVqDsHwkjNxx5zvveR02thay8k7n7Z3MNh6eGjkeThg3Q8vGOfZInsaaZ3TCGTVZwHFu5wngtM4pSZwqmKs0SpxdlBRNYRUV7W_TSbPnMCvHSxO_J6wgubuZs2M0nY6-du43tuidj8RO_SLtvsdtmh20ex8ltna-vn5Q1R5zrWCsvSWn7N6mSbcr0vLt1N-UAyvakHVKti-eE8dTC8fRD0lKi2xwLpZzYJr_elb8jF2JztXXMVLSON0XfuhWU6LHsbg6FWHFL6LfHk9K-vNwvM20dx4Tq1XT9mZEc2rzpjCF3pFIUVPSmtrBTfvE9Z8P9fB8tqt3gvvS5KskRZenxeOpHmjROU-f2Ax57T1mkz8W2kLG_pTFSx7yK63k73MmKq9T5Noxd7t2wdWK8ZPrIUuG0I1bXisKbYBt5tciSwZi-X2YJXfkTOdNpMlz-HE34uyK6x64443L3zRnPGv3m9jTH2fXUUTm3849eNn9wvmeyXvPJK49AP-KTooiGnvEHR21yCBYOZE5mahGe9HE_Rpj3BV914jsM07GFeF6CrGSgWaiDQ-I0_KbIPNG0ZRDyGyVMnCvSUbSk0nGhLsG5NE8amZ1zhLJ833ep9ez1kEPErPiVvTp-799_3zW0l_LXt3_KI672WtuZ69PTJxVh9Z2Bu_BdXugbqSIJ8Ugc6kGrATn_Z42tsGbtIeAcXYCXreGaLZ6wNIW_Mce-463G4I5TcCcjrKqIywFx4nKJ7nH1sMsUkNrVwUsbimLBujJFAe1FlYHzfExZFXDtbTC734xmGZrhFakYY88s4LWBokLndSauglii3F-ootedMKNuzU2eyI4hbJdGzBPFTI27Bc19sxbTd4DDO-E7SrikmnlFz7PDuKwpyBLZqJx7KF9CAwoK4GLrfAsUmiG83DWsqfJZ8kl5GbBDTySexCDYvKGABcyc1YqgtGKzuUYLvfY-Mx1eIASsFwlPfa4FOepiEXgjduZz7tKWEWPM-4Lbg08REvG0HLaIKPdihvW1NjTJGbACuDcTqHl1wuPl3vinmTRXSx7Eg034J60I7Vikj7tA1a1wiUjNKBITpLlHjKHrAAXPSXI-J0zucc2CHAjTSzPgW-Byz1y2yRquGI908xvyexXcg84itjyKcR7kP86YH6Lu--i4RNv8vuyp9lVfPahBQoewFct-Z5cE4gNb-hkTgmwpy7uga7WexBrU8m3z5JbpNnK2Cb4Ne6JJW4K72nPe6k5rizc6f02zGzcnUoeKFzDe6x2lu9ZuQFOWFuTzpGG-JsVa_i4S4EB9mRpBe-WOW0o7kHe8R5Po1ba46eVXF5xgyYtbvKZg1u4z1qwbumCQQk-8Uk0XR1msYxwpgsG5V24og6Z3FPewVfJ64oekJ_ZMyUPRI-YgApYNK_3gBPYz-d8RP56onm4hygSa2IJ5JSoFCtF095DqZGVowpnu1o0BbD2JrFgbasSg9BKO-mDIcP7kdfQhb5W3KATgncWPTCAR8nYqg7eaYomNwLWqpKz1NqCv7Rbc1qAi1tT8j1gohK9jC0Z-aSYNIu0IHMqwTrJSTV0o3H1AwfaTaFp8CTjGtekFuBzi05b7LFnYrUjNKsDh2rRdtMBewG-VdIbDdHL2LyVb66n4hzwIDKE1UK3rbJi7fTAUMU9eG8EjCLpb8iDYgD_OUCNh8eOAryl2acW8C7Sw0Oaql98R_qyy0eO_KAvuMNDZvgffIQDN_HpifYdb1OgRemJ9aI5CzkHbrSXHhE3WCt1hxi6lixYS1-3ldBqkXOpRy5j08ADI8ykj8ITrdIkGtYBi3WP1EYMvDtoTkAL0t_aUeqHzgX0U45USzv4kiFcbqy42eATsMlsHbiZ0O_CgxVrCl4TaCDtwQmcWxorDzwVvKrBC3wfd-Al9sBDJN-WN7ZmCH7Iu-jstHThaGmgl2pFJvekHTDFe1AbwQPixsgzbeVbSJZgHTi0eHyHda0mMm8KmPSjVu7RZF0ANtAH-GjZGpdeP5dQxIKbBqxxjif9XOZb-mgVPkmvEtCuh3rqg28e9JJo_FOngm1N3AOskQdr4XW93kMl17sQ2odPTfAdgyw5RT6tEsr2wYPtnWbSD5I5lDXLJSb00wAz9I-oGQx9xoK1D-44qE8E3AKmruQOMWXNEtCt5LpovBG1FZ6NeBYM4IfwQKxF38BRjyV34KvwHd7IGgw-WjFwbhVZo1Ztg5-Zp0udIReokyX2EEXymsMPA-iNZ9JLuwZ101x6gsaeQmAA_EfpvWSGj8I7pO8AT3iV06BfMhZs0dOuOuUGeoIZ9yA_8BUmtW3rC9_cBFpINPiKSdlW5qjja2yTYPBFLUEcu1ULLjxlkpqj0C5tkEuDSn-Gt6z-1rUhfJ-4KXgSox_d_rMPAR4efKeo4OcG-hDUAvFZg51e1mXoEO8h8OB29d4JfoB6hNikJ6EX99ADlvqnH8CLgL_8PiMKX3mNHhwctUrgDx2yfOYNh3eln37gzfBw3C_9OofO-NK7cNzD0bvBVyaKmISb6LJfWXntGbLOo-uD95bzqh_UXWhO9LKOCfQFsgZgLzi1ai6CduWMIaS_3RcflfOCrPX94teoO-jBZZ-gyfv9Qs45Yh-bcr7wruksjt46-7hOK_ZLDzuhr3yHZueg8VCDDW3tef5X3ziWh37TnZ92z0tPrX32p-jV0c_Lt8o3VOQJ_SlqEd4l69Uga9LiA-hROfOMda854tzhqNN16OvIAIzBZQ958eDriQnvRp8G3s7QzxzdEaceLHOT9GupM8xec75ic92pp2UW9LBuOxMoPG4dJ5p3T3Eb28ss0JdLzx60DisUJ2YWeNKXeq6NI4bL-eIKIZzqkNnFW9aiHmnDrjjGbbJP3xLXQR_5OrHEp7nikPNkSBxnri9DsJpr6XTUuiF30ynXNu_8GN_O2rqmyCTOvkmYH16cYndOyuGgbqIkE_45tbEnfsvRj4urUHLX5zGL04PqvEfd7naYtwtexefMIlzbhN-gj9kOIkPvhFkglH6bObInHIic1axc1jH8OMvsU2TmLT-m3X_3-kFbTCIrPjAfdpFLMaekU9AXTdCvMxNmgHd555pz8w8eJLvmgvklr80rn8xm0fQ1VU4HOZ8O_JL677HVos_eakkj4th1XrNE5Zg1JR6a5KDMU9Bs5WfM2_HnrAEdLvUW_SQ8bfF6ixvIM2ZoqYlc440tfQX1Gz3vYeG3cT7SH5jBun_NytdqyNWN7NnkTGglll0fD2N9cdX5qInbeR93ebfBjBZ3lye5xoMv_nFW3kcrT5poYu5dRJ1_Iwm49MfZc64pyxskTsu5etyIfSRnexVcnSnj0Hy1-WuquC_K4RLzj6fd1SVfHn_evhgH78ZuP5JYL19fylbb-DPU4PrOU_1uDX7CK2f_5eYJoZjx5Lr7y-v95W4Wb1N1323fDnbx_XnoXwvP1-99uuNod41gPOjDoX5jSnoLvrjD_vkW3r7w7elr_SZ-WW-5sn_Z7S6PXx8rxY6f2vdu6z2_PPFpOEJpwfXrj8djcnqpderoe-u1zzdKckh_hE4b_dzFz7tEu8zZdy1qdbRk13qTdpvRfo4177v5Qb_fv9rlHFvxj9P33fljw_Tg5XJQ6qvxI-Dqz3I7ANtzOlgFvQ3uzujI44FM5l-u1s_vkRJ-3xesKYM3_fbcltHAprRKblt2Cw60OKHnrv5ixz_DKKrry3UXojdKyoc_Pzz8_ffPf0u93N5eP-ri8vbw7eE0v79d8O2__y_r938AO7tacQ.ZTgKeA.XXFY5Zhxkhlz7Ivu9O0TQwPz83E'

    datahub_headers = { 'Authorization': f'Bearer {DATAHUB_TOKEN}' }
    superset_cookies = { 'session': SUPERSET_TOKEN }
    datahub_graphql_url = datahub_url + '/api/v2/graphql'
    superset_dataset_url = superset_url + '/api/v1/dataset'
    superset_chart_url = superset_url + '/api/v1/chart/data'

    # Call Superset to get a list of database ids
    databasesQueryUrl = superset_url + '/api/v1/database/'
    response = requests.get( url=databasesQueryUrl, cookies=superset_cookies )
    response.raise_for_status()
    response_json = json.loads(response.text)
    database_ids = dict( map(lambda database: (database['database_name'], database['id']), response_json['result']) )

    # Call Datahub to get a list of entities pre-filtered for datasets
    input = {
            'count': 10,
            'scrollId': None,
            'orFilters': [
                {'and': [{'field': 'glossaryTerms', 'values': glossary_terms_urns}]},
                {'and': [{'field': 'domains', 'values': domains_urns}]}
            ],
            'query': '*',
            'types': ['DATASET'],
          }
    postData = { 'query': SCROLL_ACROSS_ENTITIES_QUERY, 'variables': { 'input': input} }
    response = requests.post( url=datahub_graphql_url, json=postData, headers=datahub_headers )
    assert response.status_code == 200, f'When calling Datahub to get datasets to verify, expected 200/OK, received a {response.status_code}/{response.reason}'
    response_json = json.loads(response.text)

    print(f"Found {len(response_json['data']['scrollAcrossEntities']['searchResults'])} dataset(s) to verify\n")

    for entity in response_json['data']['scrollAcrossEntities']['searchResults']:
        dataset_urn = entity['entity']['urn']
        # Check for soft deleted datasets
        if entity.get('status') and entity.get('status').get('removed'):
            print('Dataset ' + dataset_urn + ' is soft deleted, will be skipped')
            continue
        try:
            print('Processing ' + dataset_urn + '...')
            # Call DataHub to get the metadata of a single dataset 
            postData = {'query': GET_DATASET_QUERY, 'variables': {'urn': dataset_urn}}
            response = requests.post(url=datahub_graphql_url, json=postData, headers=datahub_headers)
            assert response.status_code == 200, f'When calling Datahub to get metadata of a dataset, expected 200/OK, received a {response.status_code}/{response.reason}'
            response_json = json.loads(response.text)
            dataset = response_json['data']['dataset']
            dataset_full_qualified_name = dataset['name']
            # Use the Iceberg sibling if available and it's a DBT
            if dataset_urn.startswith(DBT_URN):
                if dataset['siblings'] and \
                dataset['siblings']['siblings'] and \
                dataset['siblings']['siblings'][0]['urn'] and \
                dataset['siblings']['siblings'][0]['urn'].startswith(ICEBERG_URN_PREFIX):
                    dataset = dataset["siblings"]["siblings"][0]
                    dataset_urn = dataset['urn']
                    dataset_full_qualified_name = dataset['name']
                    print('Will be using Iceberg dataset ' + dataset['name'] + ' with urn ' + dataset_urn)
                else:
                    print('Dataset does not have a sibling Iceberg dataset, will be skipped')
                    continue
            # Get entity name
            namespace = parse_entity_name(dataset_full_qualified_name)
            # Get various dataset information
            catalog = namespace['catalog']
            schema = namespace['schema']
            table_name = namespace['table_name']
            dataset_owners = get_owners(dataset)
            # Get the partition column to determine the main datetime column
            dataset_partition_column = get_partition_column(dataset)
            if dataset_partition_column is None and dataset.get('siblings') and dataset.get('siblings').get('siblings'):
                dataset_partition_column = get_partition_column(dataset['siblings']['siblings'][0])
            editableSchemaMetadata = dataset['editableSchemaMetadata']
            # Collecting DataHub dataset advanced datatypes for all fields
            advanced_data_types = {}
            if (editableSchemaMetadata and editableSchemaMetadata['editableSchemaFieldInfo']):
                editableSchemaFieldInfo = editableSchemaMetadata['editableSchemaFieldInfo']
                for field in editableSchemaFieldInfo:
                    if field['glossaryTerms'] and field['glossaryTerms']['terms'] and len(list(filter(lambda item: 'AdvancedDataType' in item['term']['urn'], field['glossaryTerms']['terms']))) > 0:
                        # The advanced data type is the first glossary term that is an advanced data type
                        advanced_data_type = list(filter(lambda item: 'AdvancedDataType' in item['term']['urn'], field['glossaryTerms']['terms']))[0]['term']['name']
                        advanced_data_types[field['fieldPath']] = advanced_data_type
            # Collect DataHub dataset fields
            datahub_dataset_field_map = {}
            for field in dataset['schemaMetadata']['fields']:
                field_name = get_field_name(field['fieldPath'])
                #  We are only interested in top level fields, which is always the first one to be named in the list
                if field_name not in datahub_dataset_field_map:
                    field_path = field["fieldPath"]
                    advanced_data_type = advanced_data_types.get(field_path)
                    datahub_field = {
                        'description': field['description'],
                        'datatype': field['type'],
                        'advanced_data_type': advanced_data_type,
                        'is_temporal': field['type'].upper() in TEMPORAL_DATATYPES
                    }
                    datahub_dataset_field_map[field_name] = datahub_field
            # Check number of fields
            assert len(datahub_dataset_field_map) > 0, 'No field was found for this dataset in Datahub'
            # Check schema
            assert namespace['catalog'] in database_ids, f'Schema {namespace["catalog"]} was not found in Superset'
            # Call Superset to find the unique identifier of the dataset
            datasets_query_url = f"{superset_dataset_url}/?q=(filters:!((col:database,opr:equal,value:'{database_ids.get(catalog)}'),(col:schema,opr:eq,value:'{schema}'),(col:table_name,opr:eq,value:'{table_name}')))"
            response = requests.get( url=datasets_query_url, cookies=superset_cookies )
            assert response.status_code == 200, f'When calling Superset to get the unique ID for a dataset, expected 200/OK, but received {response.status_code}/{response.reason}'
            response_json = json.loads(response.text)
            assert response_json['count'] > 0
            superset_dataset_id = response_json['ids'][0]
            #  Call Superset to get metadata of the dataset
            response = requests.get( url=f'{superset_dataset_url}/{superset_dataset_id}', cookies=superset_cookies )
            assert response.status_code == 200, f'When calling Superset to get metadata for a dataset, expected 200/OK, received a {response.status_code}/{response.reason}'
            response_json = json.loads(response.text)
            # Extra settings
            try:
              # The extra string should be a json, none of the values will be parsed if not
              extra_json  = json.loads(response_json['result']['extra'])
            except ValueError as e:
              assert False, 'Unable to parse the extra string from Superset, whatever is in there won''t be used by Superset'
            # Check owners in extra settings
            if len(dataset_owners) > 0:
              assert 'certification' in extra_json
              assert 'certified_by' in extra_json['certification']
              certified_by_items = extra_json['certification']['certified_by']
              assert len(dataset_owners) == len(certified_by_items)
              for dataset_owner in dataset_owners:
                assert dataset_owner in certified_by_items
            else:
              if extra_json['certification'] and extra_json['certification']['certified_by']:
                  assert len(extra_json['certification']['certified_by']) == 0
            # Check Datahub urn in extra settings
            assert 'urn' in extra_json
            assert dataset_urn == extra_json['urn']
            # Check import value in extra settings
            assert 'imported_from_datahub' in extra_json
            assert extra_json['imported_from_datahub']
            # Check main temporal column
            if dataset_partition_column:
              assert 'main_dttm_col' in response_json['result']
              assert dataset_partition_column == response_json['result']['main_dttm_col']
            else:
              assert 'warning_markdown' in extra_json
              assert 'There are no datetime partition columns in this dataset' in extra_json['warning_markdown']
            # Check all fields
            assert len(datahub_dataset_field_map) == len(response_json['result']['columns'])
            for column in response_json['result']['columns']:
              assert column['column_name'] in datahub_dataset_field_map
              datahub_dataset_field = datahub_dataset_field_map.get(column['column_name'])
              #  Check description
              assert datahub_dataset_field['description'] == column['description']
              #  Check label
              assert 'verbose_name' in column
              assert len(column['verbose_name']) > 0
              # Check datatype
              translatedDatatype = get_superset_datatype(datahub_dataset_field['datatype'], column['column_name'])
              assert translatedDatatype == column['type']
              # Check filterable flag
              if datahub_dataset_field['datatype'] in COMPLEX_DATATYPES or column['column_name'] == RAW_JSON_COLUMN_NAME:
                  assert not column['filterable']
              else:
                  assert column['filterable']
              # Check group by flag, whether or not the field shows up as a Dimension
              assert column['groupby']
              # Check advanced datatypes
              assert datahub_dataset_field['advanced_data_type'] == column['advanced_data_type']
              #  Check is temporal
              assert 'is_dttm' in column
              if datahub_dataset_field['datatype'] in TEMPORAL_DATATYPES:
                  assert column['is_dttm']
              else:
                  assert not column['is_dttm']
              # Run a dummy query and ensure we get some results
              columns = []
              for column in response_json['result']['columns']:
                columns.append(column['column_name'])
              form_data = { **base_form_data['form_data'], 'datasource': str(superset_dataset_id) + '__table', 'columns': columns }
              datasource = { **base_form_data['datasource'], 'id': superset_dataset_id }
              if dataset_partition_column:
                query = { **base_form_data['queries'][0], 'columns': columns, 'filters': [{ 'col': dataset_partition_column, 'op': 'TEMPORAL_RANGE', 'val': 'Last week'}] }
              else:
                query = { **base_form_data['queries'][0], 'columns': columns }
              post_data = {**base_form_data, 'datasource': datasource, 'form_data': form_data, 'queries': [query] }
              headers = { 'Content-Type': 'application/json; charset=utf-8' }
              timeout = 5*60*1000
              response = requests.post( url=superset_chart_url, json=json.loads(json.dumps(post_data)), headers=headers, cookies=superset_cookies, timeout=timeout )
              # We only assert on status code, we don't check the results as some tables might be empty and it's fine
              assert response.status_code == 200, f'When calling Superset to make a simple query, expected 200/OK, received {response.status_code}/{response.reason} with: {json.loads(response.text)["message"]}'
        except Exception as exception:
          print(exception)
        finally:
          print(f'Processing {dataset_urn} completed\n')

if __name__ == "__main__":
    main()


