"""
File for holding the schemas for the requests sent to alfred
"""

from marshmallow import fields, Schema, validate


class RetainToAlfredSchema(Schema):
    """Schema for creating an email retention

    Fields:
        datasource: the chart datasource key, in the format id__type
        eml_ids: a list of strings that are Harmonized EML IDs
        dates: list of dates in the format mm-dd-yyyy to lookup email ids
            by to improve performance, not required
    """

    datasource = fields.String(
        required=True,
        validate=validate.Regexp(r"^.+__(table|query|saved_query)$"),
    )
    email_ids = fields.List(fields.String())
    dates = fields.List(fields.String(), allow_none=True)
