def model_select(location_date_data):
    """Geographic bounding-box lookup for the most appropriate CMIP6 model."""
    lat = float(location_date_data["lat"])
    lon = float(location_date_data["lon"])

    if lat > 66:
        return "HadGEM3-GC31-MM"   # Arctic
    if lat < -60:
        return "NorESM2-MM"         # Antarctica
    if 35 <= lat <= 70 and -10 <= lon <= 40:
        return "EC-Earth3"          # Europe
    if 20 <= lat <= 72 and -140 <= lon <= -60:
        return "CanESM5"            # North America
    if -60 <= lat < 15 and -82 <= lon <= -34:
        return "MPI-ESM1-2-LR"     # South America
    if -35 <= lat <= 37 and -18 <= lon <= 51:
        return "CNRM-CM6-1"        # Africa
    if 12 <= lat <= 45 and 25 <= lon <= 75:
        return "CMCC-ESM2"         # Middle East / Central Asia
    if -10 <= lat < 35 and 65 <= lon < 100:
        return "MRI-ESM2-0"        # South Asia
    if -10 <= lat <= 55 and 100 <= lon <= 145:
        return "MIROC-ES2L"        # East / Southeast Asia
    if -50 <= lat < -10 and 110 <= lon <= 180:
        return "ACCESS-CM2"        # Australia / Oceania
    return "MPI-ESM1-2-HR"         # Global / ocean default
