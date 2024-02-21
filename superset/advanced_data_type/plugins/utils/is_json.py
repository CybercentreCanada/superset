def is_json(string_value) -> bool:
    try:
        json.loads(string_value)
    except ValueError as e:
        return False
    return True
