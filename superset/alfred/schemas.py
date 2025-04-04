"""
File for holding the schemas for the requests sent to alfred
"""
from marshmallow import fields, Schema

class RetainToAlfredSchema(Schema):
    """Schema for creating an email retention

    Fields: 
        eml_ids: a list of strings that are Harmonized EML IDs
        dates: list of dates in the format mm-dd-yyyy to lookup email ids 
            by to improve performance, not required
    """
    email_ids = fields.List(fields.String())
    dates = fields.List(fields.String(), allow_none=True)
