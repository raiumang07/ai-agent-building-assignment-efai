def detect_conflicts(data: dict):
    conflicts = []

    # simple demo logic
    if "employees" in data and isinstance(data["employees"], list):
        if len(set(data["employees"])) > 1:
            conflicts.append("Found conflicting employee numbers.")

    return conflicts
