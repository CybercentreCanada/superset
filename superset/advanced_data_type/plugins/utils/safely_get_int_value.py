def safely_get_int_value(string_number):
    try:
        return int(string_number)
    except ValueError:
        return 0
