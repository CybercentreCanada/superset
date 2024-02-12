#!/usr/bin/env python3
import unittest
import requests
import json
import re
from typing import Dict, List

from certified_datasets_test_helper import SCROLL_ACROSS_ENTITIES_QUERY, GET_DATASET_QUERY, base_form_data

DBT_URN = 'urn:li:dataset:(urn:li:dataPlatform:dbt'
ICEBERG_URN_PREFIX = 'urn:li:dataset:(urn:li:dataPlatform:iceberg'
OWNER_EXCLUSION_LIST = ['airflow/None']
TEMPORAL_DATATYPES = [ 'DATE', 'TIMESTAMP', 'TIME', 'TIMESTAMP WITH TIME ZONE', 'TIME WITH TIME ZONE']
ACCEPTED_PARTITION_DATATYPES = ['date', 'time', 'timestamp', 'timestamptz']
COMPLEX_DATATYPES = ['ARRAY', 'STRUCT']
DEFAULT_SUPERSET_DATA_TYPE = "TEXT"
DEFAULT_COMPLEX_DATA_TYPE = "JSON"
RAW_JSON_COLUMN_NAME = 'rawJSON'
SUPERSET_QUERY_TIMEOUT = 5*60*1000

# These should come from a config or environment variables
superset_url = 'https://superset-stg.hogwarts.pb.azure.chimera.cyber.gc.ca'
# superset_url = 'https://superset-stg.hogwarts.u.azure.chimera.cyber.gc.ca'
datahub_url = 'https://datahub-stg.hogwarts.pb.azure.chimera.cyber.gc.ca'
# datahub_url = 'https://datahub-stg.hogwarts.u.azure.chimera.cyber.gc.ca'
glossary_terms_urns = [ 'urn:li:glossaryTerm:Superset.Import to Superset' ]
domains_urns = [ 'urn:li:domain:05eb46e7-ab79-40cd-9385-5d4b9552a043' ]
# PB-STG
DATAHUB_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhY3RvclR5cGUiOiJVU0VSIiwiYWN0b3JJZCI6IkpvZWwuR3JlZ29pcmVAY3liZXIuZ2MuY2EiLCJ0eXBlIjoiUEVSU09OQUwiLCJ2ZXJzaW9uIjoiMiIsImp0aSI6IjdmMjlhN2QzLTNmN2QtNDY2OC04MmY1LTEwMGI3NDIwYzU4NyIsInN1YiI6IkpvZWwuR3JlZ29pcmVAY3liZXIuZ2MuY2EiLCJpc3MiOiJkYXRhaHViLW1ldGFkYXRhLXNlcnZpY2UifQ.68HHg-V2jyGrfCAmnN__20zxngItzt6RNFbMIxine-w'
# SUPERSET_TOKEN = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6IlQxU3QtZExUdnlXUmd4Ql82NzZ1OGtyWFMtSSIsImtpZCI6IlQxU3QtZExUdnlXUmd4Ql82NzZ1OGtyWFMtSSJ9.eyJhdWQiOiJhcGk6Ly80NzMxMWNlMS1lYmNjLTQ0NDktYjhiYS0zYjM5OGY1Yjk1NDgiLCJpc3MiOiJodHRwczovL3N0cy53aW5kb3dzLm5ldC9kYTljYmU0MC1lYzFlLTQ5OTctYWZiMy0xN2Q4NzU3NDU3MWEvIiwiaWF0IjoxNzAwNzQ3NTA5LCJuYmYiOjE3MDA3NDc1MDksImV4cCI6MTcwMDc1MTgyNywiYWNyIjoiMSIsImFpbyI6IkFYUUFpLzhWQUFBQU5McFdxQmFWSFh0aE9YYzJpbjl6b1lvaEJ5SVpVZDROWlFOeHltTFdTK0IxZGp0b2R3UG1Xa0IzR25ia3U2am1nZm51QVNBUzlkaUx3OWhIUkxpWWtoNTA1WFQ2cjRHbWZWVS83YjdqK2lWZXBjY3pkbGRhNUk4cVVmdUhUUFJTU3BFRVhaTjRMaUVXRXBaTFA3TExKZz09IiwiYW1yIjpbInB3ZCIsImZpZG8iLCJyc2EiLCJtZmEiXSwiYXBwaWQiOiIwNGIwNzc5NS04ZGRiLTQ2MWEtYmJlZS0wMmY5ZTFiZjdiNDYiLCJhcHBpZGFjciI6IjAiLCJkZXZpY2VpZCI6IjE2NGRiNDA1LTVmZDktNDQyYy1iMGY4LTkxNTU1NzI1MDJjMiIsImZhbWlseV9uYW1lIjoiR3JlZ29pcmUiLCJnaXZlbl9uYW1lIjoiSm9lbCIsImlwYWRkciI6IjIwLjE3NS4xNTQuMTc2IiwibmFtZSI6IkdyZWdvaXJlLCBKb2VsIEoiLCJvaWQiOiIwZWY2YWFhNi00OGEwLTQ2ZjMtODkzMi1jNzA3ZWU1NTdhMjgiLCJvbnByZW1fc2lkIjoiUy0xLTUtMjEtMjA3NTk0MjY1OC03NTMzNDEwNTctODE3NjU2NTM5LTE3NzM2IiwicmgiOiIwLkFTd0FRTDZjMmg3c2wwbXZzeGZZZFhSWEd1RWNNVWZNNjBsRXVMbzdPWTlibFVnc0FMby4iLCJzY3AiOiJ1c2VyX2ltcGVyc29uYXRpb24iLCJzdWIiOiJIbV9Jdlh2ak9yZzJSbi1tNmNObjdwRTEyVFpKcW9CU0tRRW0tbU1OczVRIiwidGlkIjoiZGE5Y2JlNDAtZWMxZS00OTk3LWFmYjMtMTdkODc1NzQ1NzFhIiwidW5pcXVlX25hbWUiOiJKb2VsLkdyZWdvaXJlQGN5YmVyLmdjLmNhIiwidXBuIjoiSm9lbC5HcmVnb2lyZUBjeWJlci5nYy5jYSIsInV0aSI6Im43Um94MlBWUzB5NDF3ZGlHM0ZOQUEiLCJ2ZXIiOiIxLjAifQ.VQdHFxGyeK5qLDKQrbax2erv4yeUY3rgXmK55Rqz_uoBmBqSpCHZwimVWzA-sR33Yw7S5RUZpFpCERMIN7OslIVeWT2R9gurafdxn4H5_sx_Ts13JzdcRHCH1MqKu9bcANx1YEIeZ3GYIN_JHRJq9BemZEoxyWhDPEiIKnfhoPlu3bZoEyJosbSfA38OsQylsm-7nqH9kZnD6c9dgQ-x0tYH27CBixMopLtpigd0t8MeBps1vKuJZ4gazpkTwdBf2GuQ0L16RCksfQEXGl1o3WyEXTH9AictwglxLmBqH3jB1AgimWa1vxCeRjGvIYQQhLD_UUsAPGnylJaLWS9_AA"
# SUPERSET_TOKEN = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6IlQxU3QtZExUdnlXUmd4Ql82NzZ1OGtyWFMtSSIsImtpZCI6IlQxU3QtZExUdnlXUmd4Ql82NzZ1OGtyWFMtSSJ9.eyJhdWQiOiJhcGk6Ly80NzMxMWNlMS1lYmNjLTQ0NDktYjhiYS0zYjM5OGY1Yjk1NDgiLCJpc3MiOiJodHRwczovL3N0cy53aW5kb3dzLm5ldC9kYTljYmU0MC1lYzFlLTQ5OTctYWZiMy0xN2Q4NzU3NDU3MWEvIiwiaWF0IjoxNzAwNjA2MDY0LCJuYmYiOjE3MDA2MDYwNjQsImV4cCI6MTcwMDYxMDQ4MSwiYWNyIjoiMSIsImFpbyI6IkFYUUFpLzhWQUFBQTNpQjdlOUlGMkQweDhqYWNCMDg3REI5NlFqcTFrNVlBc1d3L0QzNVBlc0pUcDBJekVmb0R5UkluOWhCY1c4MFNGS01XQXptdEFtaitEYUIwRVFVU3Z0eW1tTW0wdmdDb1NMcVJiOFRMNlFIYVlTWGZXVTBNczI1NDR5ejNNSFlPSjdxcXBFYzlLVm5OVFVYU1prS3p4UT09IiwiYW1yIjpbInB3ZCIsImZpZG8iLCJyc2EiLCJtZmEiXSwiYXBwaWQiOiIwNGIwNzc5NS04ZGRiLTQ2MWEtYmJlZS0wMmY5ZTFiZjdiNDYiLCJhcHBpZGFjciI6IjAiLCJkZXZpY2VpZCI6IjE2NGRiNDA1LTVmZDktNDQyYy1iMGY4LTkxNTU1NzI1MDJjMiIsImZhbWlseV9uYW1lIjoiR3JlZ29pcmUiLCJnaXZlbl9uYW1lIjoiSm9lbCIsImlwYWRkciI6IjIwLjE3NS4xNTQuMTc2IiwibmFtZSI6IkdyZWdvaXJlLCBKb2VsIEoiLCJvaWQiOiIwZWY2YWFhNi00OGEwLTQ2ZjMtODkzMi1jNzA3ZWU1NTdhMjgiLCJvbnByZW1fc2lkIjoiUy0xLTUtMjEtMjA3NTk0MjY1OC03NTMzNDEwNTctODE3NjU2NTM5LTE3NzM2IiwicmgiOiIwLkFTd0FRTDZjMmg3c2wwbXZzeGZZZFhSWEd1RWNNVWZNNjBsRXVMbzdPWTlibFVnc0FMby4iLCJzY3AiOiJ1c2VyX2ltcGVyc29uYXRpb24iLCJzdWIiOiJIbV9Jdlh2ak9yZzJSbi1tNmNObjdwRTEyVFpKcW9CU0tRRW0tbU1OczVRIiwidGlkIjoiZGE5Y2JlNDAtZWMxZS00OTk3LWFmYjMtMTdkODc1NzQ1NzFhIiwidW5pcXVlX25hbWUiOiJKb2VsLkdyZWdvaXJlQGN5YmVyLmdjLmNhIiwidXBuIjoiSm9lbC5HcmVnb2lyZUBjeWJlci5nYy5jYSIsInV0aSI6Ijk5OUxlTXdvTGt1cC01QlM4aGF5QUEiLCJ2ZXIiOiIxLjAifQ.db3YmHBeIE6aXeNjqERC2oPulB-vB2iqIeWtSYEwWLsXhEJTA4OvFNwptpKVcQbpzpsyp3VkzH5w-ZEOIoQBEvc3pU8EROMPieGZtEruFnZRgMPhaILgBWsVptuPOAnTmAui0dntHCpM1A1ov-fhJDeGwoEKjk_YHLp5ZidmSDSmzsCFRp4RtLcKbre6XVtXjGX_5pa5hphZkg50Eq1GMpDvRyUtsal6qEX2omg4va9zdU0mk2sISsZ4RCQGv4kFan1dCFOXMRw2uO_RO_5ifrJFnYs_c2VEmHtQLm9miPi_JyRuqHBbUOKOpcYtp45QD2ws22tE15S7SrjhufMA7A"
#  U-STG
# DATAHUB_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhY3RvclR5cGUiOiJVU0VSIiwiYWN0b3JJZCI6IkpvZWwuR3JlZ29pcmVAY3liZXIuZ2MuY2EiLCJ0eXBlIjoiUEVSU09OQUwiLCJ2ZXJzaW9uIjoiMiIsImp0aSI6ImEzN2VhYWM5LWQ4MjktNDY2ZS1hODUyLTUyOTE5MzYxNjc5OSIsInN1YiI6IkpvZWwuR3JlZ29pcmVAY3liZXIuZ2MuY2EiLCJpc3MiOiJkYXRhaHViLW1ldGFkYXRhLXNlcnZpY2UifQ.BhhfMAOiazbUR5CrhCrKC81xiVdXOZvExj030BH7jX8'
# SUPERSET_TOKEN = '.eJyNWNtyo8oV_ZWUn5MUV89o3iRzEZhuBtSAulMplwQa7rLGg43g1Pn3rAYnJ0nlIQ8ul6y-7F57rbX39m8PL--_Lm8vdfHw7cF4-PND95qfugs-XK749Hp6H6qHb789_Gl4-Pa3h8vkK5fjtg5r_zlVozp48quzm8vPh2T2VFp7v7xrqRZP3qPXdPtzZppxt3s7uWQ-2Rs1abzpfBSs6It35n7VswPW98NN_N_r_c1fEURVZJG89LXYx2M-v34Emlqde-cqMrU7X6N3rm0mcTD1U2a2Z72Yg97siqevMuBbrpP_3KtTJZ_-e-2m5axreJ8o5Ent-Ox0AYvMkOUDz0RNJuVOtcigc6JTK9FJZn949VifMkfxmtc7bVqDsHwkjNxx5zvveR02thay8k7n7Z3MNh6eGjkeThg3Q8vGOfZInsaaZ3TCGTVZwHFu5wngtM4pSZwqmKs0SpxdlBRNYRUV7W_TSbPnMCvHSxO_J6wgubuZs2M0nY6-du43tuidj8RO_SLtvsdtmh20ex8ltna-vn5Q1R5zrWCsvSWn7N6mSbcr0vLt1N-UAyvakHVKti-eE8dTC8fRD0lKi2xwLpZzYJr_elb8jF2JztXXMVLSON0XfuhWU6LHsbg6FWHFL6LfHk9K-vNwvM20dx4Tq1XT9mZEc2rzpjCF3pFIUVPSmtrBTfvE9Z8P9fB8tqt3gvvS5KskRZenxeOpHmjROU-f2Ax57T1mkz8W2kLG_pTFSx7yK63k73MmKq9T5Noxd7t2wdWK8ZPrIUuG0I1bXisKbYBt5tciSwZi-X2YJXfkTOdNpMlz-HE34uyK6x64443L3zRnPGv3m9jTH2fXUUTm3849eNn9wvmeyXvPJK49AP-KTooiGnvEHR21yCBYOZE5mahGe9HE_Rpj3BV914jsM07GFeF6CrGSgWaiDQ-I0_KbIPNG0ZRDyGyVMnCvSUbSk0nGhLsG5NE8amZ1zhLJ833ep9ez1kEPErPiVvTp-799_3zW0l_LXt3_KI672WtuZ69PTJxVh9Z2Bu_BdXugbqSIJ8Ugc6kGrATn_Z42tsGbtIeAcXYCXreGaLZ6wNIW_Mce-463G4I5TcCcjrKqIywFx4nKJ7nH1sMsUkNrVwUsbimLBujJFAe1FlYHzfExZFXDtbTC734xmGZrhFakYY88s4LWBokLndSauglii3F-ootedMKNuzU2eyI4hbJdGzBPFTI27Bc19sxbTd4DDO-E7SrikmnlFz7PDuKwpyBLZqJx7KF9CAwoK4GLrfAsUmiG83DWsqfJZ8kl5GbBDTySexCDYvKGABcyc1YqgtGKzuUYLvfY-Mx1eIASsFwlPfa4FOepiEXgjduZz7tKWEWPM-4Lbg08REvG0HLaIKPdihvW1NjTJGbACuDcTqHl1wuPl3vinmTRXSx7Eg034J60I7Vikj7tA1a1wiUjNKBITpLlHjKHrAAXPSXI-J0zucc2CHAjTSzPgW-Byz1y2yRquGI908xvyexXcg84itjyKcR7kP86YH6Lu--i4RNv8vuyp9lVfPahBQoewFct-Z5cE4gNb-hkTgmwpy7uga7WexBrU8m3z5JbpNnK2Cb4Ne6JJW4K72nPe6k5rizc6f02zGzcnUoeKFzDe6x2lu9ZuQFOWFuTzpGG-JsVa_i4S4EB9mRpBe-WOW0o7kHe8R5Po1ba46eVXF5xgyYtbvKZg1u4z1qwbumCQQk-8Uk0XR1msYxwpgsG5V24og6Z3FPewVfJ64oekJ_ZMyUPRI-YgApYNK_3gBPYz-d8RP56onm4hygSa2IJ5JSoFCtF095DqZGVowpnu1o0BbD2JrFgbasSg9BKO-mDIcP7kdfQhb5W3KATgncWPTCAR8nYqg7eaYomNwLWqpKz1NqCv7Rbc1qAi1tT8j1gohK9jC0Z-aSYNIu0IHMqwTrJSTV0o3H1AwfaTaFp8CTjGtekFuBzi05b7LFnYrUjNKsDh2rRdtMBewG-VdIbDdHL2LyVb66n4hzwIDKE1UK3rbJi7fTAUMU9eG8EjCLpb8iDYgD_OUCNh8eOAryl2acW8C7Sw0Oaql98R_qyy0eO_KAvuMNDZvgffIQDN_HpifYdb1OgRemJ9aI5CzkHbrSXHhE3WCt1hxi6lixYS1-3ldBqkXOpRy5j08ADI8ykj8ITrdIkGtYBi3WP1EYMvDtoTkAL0t_aUeqHzgX0U45USzv4kiFcbqy42eATsMlsHbiZ0O_CgxVrCl4TaCDtwQmcWxorDzwVvKrBC3wfd-Al9sBDJN-WN7ZmCH7Iu-jstHThaGmgl2pFJvekHTDFe1AbwQPixsgzbeVbSJZgHTi0eHyHda0mMm8KmPSjVu7RZF0ANtAH-GjZGpdeP5dQxIKbBqxxjif9XOZb-mgVPkmvEtCuh3rqg28e9JJo_FOngm1N3AOskQdr4XW93kMl17sQ2odPTfAdgyw5RT6tEsr2wYPtnWbSD5I5lDXLJSb00wAz9I-oGQx9xoK1D-44qE8E3AKmruQOMWXNEtCt5LpovBG1FZ6NeBYM4IfwQKxF38BRjyV34KvwHd7IGgw-WjFwbhVZo1Ztg5-Zp0udIReokyX2EEXymsMPA-iNZ9JLuwZ101x6gsaeQmAA_EfpvWSGj8I7pO8AT3iV06BfMhZs0dOuOuUGeoIZ9yA_8BUmtW3rC9_cBFpINPiKSdlW5qjja2yTYPBFLUEcu1ULLjxlkpqj0C5tkEuDSn-Gt6z-1rUhfJ-4KXgSox_d_rMPAR4efKeo4OcG-hDUAvFZg51e1mXoEO8h8OB29d4JfoB6hNikJ6EX99ADlvqnH8CLgL_8PiMKX3mNHhwctUrgDx2yfOYNh3eln37gzfBw3C_9OofO-NK7cNzD0bvBVyaKmISb6LJfWXntGbLOo-uD95bzqh_UXWhO9LKOCfQFsgZgLzi1ai6CduWMIaS_3RcflfOCrPX94teoO-jBZZ-gyfv9Qs45Yh-bcr7wruksjt46-7hOK_ZLDzuhr3yHZueg8VCDDW3tef5X3ziWh37TnZ92z0tPrX32p-jV0c_Lt8o3VOQJ_SlqEd4l69Uga9LiA-hROfOMda854tzhqNN16OvIAIzBZQ958eDriQnvRp8G3s7QzxzdEaceLHOT9GupM8xec75ic92pp2UW9LBuOxMoPG4dJ5p3T3Eb28ss0JdLzx60DisUJ2YWeNKXeq6NI4bL-eIKIZzqkNnFW9aiHmnDrjjGbbJP3xLXQR_5OrHEp7nikPNkSBxnri9DsJpr6XTUuiF30ynXNu_8GN_O2rqmyCTOvkmYH16cYndOyuGgbqIkE_45tbEnfsvRj4urUHLX5zGL04PqvEfd7naYtwtexefMIlzbhN-gj9kOIkPvhFkglH6bObInHIic1axc1jH8OMvsU2TmLT-m3X_3-kFbTCIrPjAfdpFLMaekU9AXTdCvMxNmgHd555pz8w8eJLvmgvklr80rn8xm0fQ1VU4HOZ8O_JL677HVos_eakkj4th1XrNE5Zg1JR6a5KDMU9Bs5WfM2_HnrAEdLvUW_SQ8bfF6ixvIM2ZoqYlc440tfQX1Gz3vYeG3cT7SH5jBun_NytdqyNWN7NnkTGglll0fD2N9cdX5qInbeR93ebfBjBZ3lye5xoMv_nFW3kcrT5poYu5dRJ1_Iwm49MfZc64pyxskTsu5etyIfSRnexVcnSnj0Hy1-WuquC_K4RLzj6fd1SVfHn_evhgH78ZuP5JYL19fylbb-DPU4PrOU_1uDX7CK2f_5eYJoZjx5Lr7y-v95W4Wb1N1323fDnbx_XnoXwvP1-99uuNod41gPOjDoX5jSnoLvrjD_vkW3r7w7elr_SZ-WW-5sn_Z7S6PXx8rxY6f2vdu6z2_PPFpOEJpwfXrj8djcnqpderoe-u1zzdKckh_hE4b_dzFz7tEu8zZdy1qdbRk13qTdpvRfo4177v5Qb_fv9rlHFvxj9P33fljw_Tg5XJQ6qvxI-Dqz3I7ANtzOlgFvQ3uzujI44FM5l-u1s_vkRJ-3xesKYM3_fbcltHAprRKblt2Cw60OKHnrv5ixz_DKKrry3UXojdKyoc_Pzz8_ffPf0u93N5eP-ri8vbw7eE0v79d8O2__y_r938AO7tacQ.ZTgKeA.XXFY5Zhxkhlz7Ivu9O0TQwPz83E'

datahub_headers = { 'Authorization': f'Bearer {DATAHUB_TOKEN}',}
superset_headers = { }

datahub_graphql_url = datahub_url + '/api/v2/graphql'
superset_login_url = superset_url + '/api/v1/security/login'
superset_dataset_url = superset_url + '/api/v1/dataset'
superset_chart_url = superset_url + '/api/v1/chart/data'

def parse_entity_name(name: str) -> Dict:
  """
  Split the full qualified dataset name.

  :param name: the full qualified dataset name
  returns: a dict containing the 3 parts of the name
  """
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
  """
  Get a list of owners.

  :param entity: the dataset
  returns: a list of owners
  """
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
  """
  Retrieves the first partition column in the
  'partition-spec' that is a datetime column.
  If there are no datetime partition columns,
  return None.

  :param entity: the dataset
  returns: The partition column or None if not found
  """
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
  """
  Get the matching Superset datatype

  :param datatype: the datatype
  :param column_name: the columns name
  returns: The matching Superset datatype
  """
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

class Main(unittest.TestCase):

  database_ids = {}
  datahub_datasets = []

  def setUp(self):
    # Login
    access_token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6IlQxU3QtZExUdnlXUmd4Ql82NzZ1OGtyWFMtSSIsImtpZCI6IlQxU3QtZExUdnlXUmd4Ql82NzZ1OGtyWFMtSSJ9.eyJhdWQiOiJhcGk6Ly80NzMxMWNlMS1lYmNjLTQ0NDktYjhiYS0zYjM5OGY1Yjk1NDgiLCJpc3MiOiJodHRwczovL3N0cy53aW5kb3dzLm5ldC9kYTljYmU0MC1lYzFlLTQ5OTctYWZiMy0xN2Q4NzU3NDU3MWEvIiwiaWF0IjoxNzAzMDE2NzQ3LCJuYmYiOjE3MDMwMTY3NDcsImV4cCI6MTcwMzAyMTQzNywiYWNyIjoiMSIsImFpbyI6IkFYUUFpLzhWQUFBQWJQMnhxdzNjUzRtakxvaFA0dW9JdVRUeXh4MXZlSXM3ZUdzTW5VdlZKbm0wS0xFbGNiZklydDJzYjQ4UVJ4bG5xeWFoSDh1U25rY25MUEswKy8wdHF3V2tnMWtNNEUybkdDNTgrK1o4ZDhyL3pXdDFMZ01FeDc2eWtkd3d5OWI0UnhLT2VqQlExTVJEeDRialA0WXg4UT09IiwiYW1yIjpbInB3ZCIsImZpZG8iLCJyc2EiLCJtZmEiXSwiYXBwaWQiOiIwNGIwNzc5NS04ZGRiLTQ2MWEtYmJlZS0wMmY5ZTFiZjdiNDYiLCJhcHBpZGFjciI6IjAiLCJkZXZpY2VpZCI6IjE2NGRiNDA1LTVmZDktNDQyYy1iMGY4LTkxNTU1NzI1MDJjMiIsImZhbWlseV9uYW1lIjoiR3JlZ29pcmUiLCJnaXZlbl9uYW1lIjoiSm9lbCIsImlwYWRkciI6IjIwLjE3NS4xNTQuMTc2IiwibmFtZSI6IkdyZWdvaXJlLCBKb2VsIEoiLCJvaWQiOiIwZWY2YWFhNi00OGEwLTQ2ZjMtODkzMi1jNzA3ZWU1NTdhMjgiLCJvbnByZW1fc2lkIjoiUy0xLTUtMjEtMjA3NTk0MjY1OC03NTMzNDEwNTctODE3NjU2NTM5LTE3NzM2IiwicmgiOiIwLkFTd0FRTDZjMmg3c2wwbXZzeGZZZFhSWEd1RWNNVWZNNjBsRXVMbzdPWTlibFVnc0FMby4iLCJzY3AiOiJ1c2VyX2ltcGVyc29uYXRpb24iLCJzdWIiOiJIbV9Jdlh2ak9yZzJSbi1tNmNObjdwRTEyVFpKcW9CU0tRRW0tbU1OczVRIiwidGlkIjoiZGE5Y2JlNDAtZWMxZS00OTk3LWFmYjMtMTdkODc1NzQ1NzFhIiwidW5pcXVlX25hbWUiOiJKb2VsLkdyZWdvaXJlQGN5YmVyLmdjLmNhIiwidXBuIjoiSm9lbC5HcmVnb2lyZUBjeWJlci5nYy5jYSIsInV0aSI6Im5SVm5FSG1HV0UtRUNhRVdRMXhoQUEiLCJ2ZXIiOiIxLjAifQ.OXGQ2EwjSwmpwvMkEiMdP4f3Qbo_yTKBySxIIlzqyGkAwpj310-vzpUEpjcSN0VRnK_JlQOfjBfEMpnHHkmY39QoNhp6cazi59ywLEap8Sc03n206Bvi3aV-UzXjAXVIVs9mRS8ZB-8MWgc-suwt-vwIQhnS_OuZXMSUStX-bPrFakhnCN3oixgJKmJ6tsNFdiX6nY6kaqhgE_e2k_OMmBNaJy3vpcfb4zPEzhH4ZvAInWwm0vInaostS-iSPSvadqN33Ijd6I1rOFq8sym6tGAK6hhu1soQoXaQ8opBdbxvjoKQ91b2PGJ3MpQI9k7tRet4d5D6MzonL-UGdeg7gA'
    login_headers = {
        "Authorization": f"Bearer { access_token }",
        "Accept": "application/json",
        "Content-Type": "application/json",
    }
    login_data = { "provider": "oauth", "oauth_provider": "azure", "refresh": True }
    response = requests.post(
        'https://superset-stg.hogwarts.pb.azure.chimera.cyber.gc.ca/api/v1/security/login',
        headers=login_headers,
        data=json.dumps(login_data),
    )
    assert response.ok, f'When calling Superset to login, expected 200/OK, received a {response.status_code}/{response.reason}'
    response_json = json.loads(response.content.decode("utf8", "replace"))
    self.superset_headers = { 
      'Authorization': f'Bearer {response_json["access_token"]}',
      'Content-Type': 'application/json',
      'Accept': 'application/json'             
    }
    # Call Superset to get a list of database ids
    databasesQueryUrl = superset_url + '/api/v1/database/'
    response = requests.get( url=databasesQueryUrl, headers=self.superset_headers )
    assert response.ok, f'When calling Superset to get databases, expected 200/OK, received a {response.status_code}/{response.reason}'
    response_json = json.loads(response.text)
    self.database_ids = dict( map(lambda database: (database['database_name'], database['id']), response_json['result']) )
    # Call Datahub to get a list of selected datasets
    input = {
      'count': 1000,
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
    assert response.ok, f'When calling Datahub to get datasets to verify, expected 200/OK, received a {response.status_code}/{response.reason}'
    response_json = json.loads(response.text)
    self.datahub_datasets = response_json['data']['scrollAcrossEntities']['searchResults']
    print(f"Found {len(response_json['data']['scrollAcrossEntities']['searchResults'])} dataset(s) to verify\n")

  def test_superset_dataset(self):
    """
    Test that all elements of the selected Datahub datasets match the elements of the corresponding datasets in Superset
    """
    for dataset in self.datahub_datasets:
      original_dataset_urn = dataset['entity']['urn']
      dataset_urn = original_dataset_urn
      # Call DataHub to get the metadata of a single dataset
      postData = {'query': GET_DATASET_QUERY, 'variables': {'urn': dataset_urn}}
      response = requests.post(url=datahub_graphql_url, json=postData, headers=datahub_headers)
      assert response.ok, f'When calling Datahub to get metadata of a dataset, expected 200/OK, received a {response.status_code}/{response.reason}'
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
          # print('Will be using Iceberg dataset ' + dataset['name'] + ' with urn ' + dataset_urn)
        else:
          # print('Dataset does not have a sibling Iceberg dataset, will be skipped')
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
      # Collecting Datahub dataset advanced datatypes for all fields
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
      with self.subTest(f'Test schemaMetadata exists, original Datahub dataset: {original_dataset_urn}, Datahub dataset: {dataset_urn}'):
        assert dataset['schemaMetadata'] and dataset['schemaMetadata']['fields']
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
        superset_dataset_name = f'{catalog} {schema} {table_name}'
        with self.subTest(f'Test number of fields, original Datahub dataset: {original_dataset_urn}, Datahub dataset: {dataset_urn}'):
          assert len(datahub_dataset_field_map) > 0, 'No field was found for this dataset in Datahub'
        with self.subTest(f'Test schema exists, original Datahub dataset: {original_dataset_urn}, Datahub dataset: {dataset_urn}'):
          assert namespace['catalog'] in self.database_ids, f'Schema {namespace["catalog"]} was not found in Superset'
          # Call Superset to find the unique identifier of the dataset
          datasets_query_url = f"{superset_dataset_url}/?q=(filters:!((col:database,opr:equal,value:'{self.database_ids.get(catalog)}'),(col:schema,opr:eq,value:'{schema}'),(col:table_name,opr:eq,value:'{table_name}')))"
          response = requests.get( url=datasets_query_url, headers=self.superset_headers )
          assert response.ok, f'When calling Superset to get the unique ID for a dataset, expected 200/OK, but received {response.status_code}/{response.reason}'
          response_json = json.loads(response.text)
          assert response_json['count'] > 0, f'When calling Superset for unique dataset {superset_dataset_name}, no dataset was found'
          superset_dataset_id = response_json['ids'][0]
          #  Call Superset to get metadata of the dataset
          response = requests.get( url=f'{superset_dataset_url}/{superset_dataset_id}', headers=self.superset_headers )
          assert response.ok, f'When calling Superset to get metadata for dataset, expected 200/OK, received a {response.status_code}/{response.reason}'
          response_json = json.loads(response.text)
          with self.subTest(f'Test extra settings, original Datahub dataset: {original_dataset_urn}, Datahub dataset: {dataset_urn}, Superset dataset: {superset_dataset_name}'):
            # Extra settings
            try:
              # The extra string should be a json, none of the values will be parsed if not
              extra_json  = json.loads(response_json['result']['extra'])
            except ValueError as e:
              self.fail, f'Unable to parse the extra string from Superset: {response_json["result"]["extra"]}'
            with self.subTest(f'Test owners, original Datahub dataset: {original_dataset_urn}, Datahub dataset: {dataset_urn}, Superset dataset: {superset_dataset_name}'):
              # Check owners in extra settings
              if len(dataset_owners) > 0:
                assert 'certification' in extra_json
                assert 'certified_by' in extra_json['certification']
                certified_by_items = extra_json['certification']['certified_by']
                assert len(dataset_owners) == len(certified_by_items), f'Number of owners differs from number of certified by'
                for dataset_owner in dataset_owners:
                  assert dataset_owner in certified_by_items
              else:
                if extra_json['certification'] and extra_json['certification']['certified_by']:
                    assert len(extra_json['certification']['certified_by']) == 0
            with self.subTest(f'Test Datahub urn, original Datahub dataset: {original_dataset_urn}, Datahub dataset: {dataset_urn}, Superset dataset: {superset_dataset_name}'):
              # Check Datahub urn in extra settings
              assert 'urn' in extra_json
              assert dataset_urn == extra_json['urn']
            with self.subTest(f'Test imported from value, original Datahub dataset: {original_dataset_urn}, Datahub dataset: {dataset_urn}, Superset dataset: {superset_dataset_name}'):
              # Check import value in extra settings
              assert 'imported_from_datahub' in extra_json
              assert extra_json['imported_from_datahub']
            with self.subTest(f'Test main temporal column, original Datahub dataset: {original_dataset_urn}, Datahub dataset: {dataset_urn}, Superset dataset: {superset_dataset_name}'):
              # Check main temporal column
              if dataset_partition_column:
                assert 'main_dttm_col' in response_json['result']
                assert dataset_partition_column == response_json['result']['main_dttm_col']
              else:
                assert 'warning_markdown' in extra_json, "Warning markdown element for no partition is missing in the extra."
                assert 'There are no datetime partition columns in this dataset' in extra_json['warning_markdown'], f"Warning message for no partition is missing in the extra."
            # Check all fields
            with self.subTest(f'Test number of fields, original Datahub dataset: {original_dataset_urn}, Datahub dataset: {dataset_urn}, Superset dataset: {superset_dataset_name}'):
              assert len(datahub_dataset_field_map) == len(response_json['result']['columns']), f"Size of fields in Datahub ({len(datahub_dataset_field_map)}), does not match size of fields in Superset ({len(response_json['result']['columns'])})."
            for column in response_json['result']['columns']:
              with self.subTest(f'Test column, Datahub dataset: {dataset_urn}'):
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
            # with self.subTest(f'Run a dummy Superset query with all columns, original Datahub dataset: {original_dataset_urn}, Datahub dataset: {dataset_urn}, Superset dataset: {superset_dataset_name}'):
            #   # Run a dummy query and ensure we get some results
            #   columns = []
            #   for column in response_json['result']['columns']:
            #     columns.append(column['column_name'])
            #   # base_form_data = {
            #   #   "datasource": {
            #   #     "id": 372,
            #   #     "type":"table"
            #   #   },
            #   #   "queries": [
            #   #     {
            #   #       "columns":[
            #   #         "id",
            #   #         "department",
            #   #         "manager"
            #   #       ], 
            #   #       "row_limit": 100
            #   #     }
            #   #   ],
            #   #   "form_data": {
            #   #     "datasource": "372__table",
            #   #     "viz_type": "cccs_grid",
            #   #     "query_mode":"raw",
            #   #     "columns": [
            #   #       "id",
            #   #       "department",
            #   #       "manager"
            #   #     ],
            #   #     "row_limit": 100,
            #   #     "enable_row_numbers": True
            #   #   },
            #   #   "viz_type":"cccs_grid"
            #   # }
            #   base_form_data = {"datasource":{"id":372,"type":"table"},"force":False,"queries":[{"filters":[],"extras":{"having":"","where":""},"applied_time_extras":{},"columns":["id","department","manager"],"orderby":[],"annotation_layers":[],"row_limit":100,"series_limit":0,"order_desc":True,"url_params":{"datasource_id":"372","datasource_type":"table"},"custom_params":{},"custom_form_data":{},"post_processing":[]}],"form_data":{"datasource":"372__table","viz_type":"cccs_grid","url_params":{"datasource_id":"372","datasource_type":"table"},"query_mode":"raw","groupby":[],"columns":["id","department","manager"],"percent_metrics":[],"adhoc_filters":[],"row_limit":100,"order_by_cols":[],"principalColumns":[],"timeseries_limit_metric":None,"default_group_by":[],"enable_row_numbers":True,"extra_form_data":{},"force":None,"result_format":"json","result_type":"full","include_time":False},"result_format":"json","result_type":"full","viz_type":"cccs_grid"}
            #   # form_data = { **base_form_data["form_data"], "datasource": str(superset_dataset_id) + "__table", "columns": columns }
            #   # datasource = { **base_form_data["datasource"], "id": superset_dataset_id }
            #   # if dataset_partition_column:
            #   #   query = { **base_form_data["queries"][0], "columns": columns, "filters": [{ "col": dataset_partition_column, "op": "TEMPORAL_RANGE", "val": "Last week"}] }
            #   # else:
            #   #   query = { **base_form_data["queries"][0], "columns": columns }
            #   # post_data = {**base_form_data, "datasource": datasource, "form_data": form_data, "queries": [query] }

            #   response = requests.post( url=superset_chart_url, data=json.dumps(base_form_data), headers=self.superset_headers, timeout=SUPERSET_QUERY_TIMEOUT )
            #   # response = requests.post( url=superset_chart_url, data=json.dumps(data), headers=self.superset_headers, timeout=1000*60*5 )
            #   # We only assert on status code, we don't check the results as some tables might be empty and it's fine
            #   assert response.ok, f'When calling Superset to make a simple query, expected 200/OK, received {response.status_code}/{response.reason}'

if __name__ == '__main__':
  unittest.main()
