from superset.advanced_data_type.plugins import translate_filter_func
from superset.advanced_data_type.plugins.utils.validate_azure_id import validate_azure_id
from superset.advanced_data_type.types import AdvancedDataType, AdvancedDataTypeRequest, AdvancedDataTypeResponse

def azure_application_id_func(req: AdvancedDataTypeRequest) -> AdvancedDataTypeResponse:
    return validate_azure_id("Azure Application ID", req)

azure_application_id: AdvancedDataType = AdvancedDataType(
    verbose_name="Azure Application ID",
    description="Represents an Azure Application ID",
    valid_data_types=["str"],
    translate_filter=translate_filter_func,
    translate_type=azure_application_id_func,
)
