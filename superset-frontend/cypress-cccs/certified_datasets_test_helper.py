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
    "datasource": {
      'type': 'table'
    },
    "force": False,
    "form_data": {
      "enable_row_numbers": True,
      "force": None,
      "include_time": False,
      "query_mode": "raw",
      "result_format": "json",
      "result_type": 'post_processed',
      "row_limit": 10,
      "timeseries_limit_metric": None,
      "viz_type": "cccs_grid"
    },
    "queries": [
      {
        "row_limit": 10
      }
    ],
    "result_format": "json",
    "result_type": "post_processed",
    "viz_type": "cccs_grid"
}