import ee
from utils.get_date import get_date, get_location, get_month
import asyncio
import pandas as pd
import json

ee.Authenticate()
ee.Initialize(project='climatechangeproject-477817')


def get_google_earth_data(location_date_data):

    longitude, latitude = get_location(location_date_data)
    start_date, projected_end = get_date(location_date_data["month"], location_date_data["year"])
    month = get_month(location_date_data["month"])


    point = ee.Geometry.Point([longitude, latitude]) # type: ignore
    int_year = int(location_date_data["year"])
    int_month = int(month)

    BANDS = ["hurs", "huss", "pr", "rlds", "rsds", "sfcWind", "tas", "tasmin", "tasmax"]
    MODEL = 'MPI-ESM1-2-HR' 

    base_collection = ( 
        ee.ImageCollection('NASA/GDDP-CMIP6')  # type: ignore
        .filter(ee.Filter.eq('model', MODEL)) # type: ignore
        .filterBounds(point)
        .select(BANDS)
    )


    projected_collection = (
        base_collection
        .filter(ee.Filter.eq('scenario', 'ssp245'))# type: ignore
        .filter(ee.Filter.eq('month', int_month))# type: ignore
        .filter(ee.Filter.eq('year', int_year))# type: ignore
    )

    projected_image = projected_collection.mean()

    projected_bands_renamed = [f"{b}_projected" for b in BANDS]
    projected_image = projected_image.rename(projected_bands_renamed)


    baseline_collection = (
        base_collection
        .filter(ee.Filter.eq('scenario', 'historical'))# type: ignore
        .filter(ee.Filter.date("1950-01-01", "2015-01-01"))# type: ignore
        .filter(ee.Filter.eq('month', int_month))# type: ignore
    )
    baseline_image = baseline_collection.mean()
    
    # Rename bands: tas -> tas_baseline
    baseline_bands_renamed = [f"{b}_baseline" for b in BANDS]
    baseline_image = baseline_image.rename(baseline_bands_renamed)

    combined_image = ee.Image.cat(projected_image, baseline_image)# type: ignore

    combined_reduced = combined_image.reduceRegion(
        reducer=ee.Reducer.mean(),   # type: ignore
        geometry=point,
        scale=25000,
        bestEffort=True
    )
    
    results = combined_reduced.getInfo()

    print(results)

    return results



def get_projected_time_series(location_date_data):

    longitude, latitude = get_location(location_date_data)
    point = ee.Geometry.Point([longitude, latitude])# type: ignore
    
    month_str = get_month(location_date_data["month"])
    target_month = int(month_str)
    
    start_year = 2015
    
    end_year = int(location_date_data["year"])
    
    years = ee.List.sequence(start_year, end_year)# type: ignore

    BANDS = ["hurs", "huss", "pr", "rlds", "rsds", "sfcWind", "tas", "tasmin", "tasmax"]
    MODEL = 'MPI-ESM1-2-HR'
    
    # --- 2. Filter the Full Projected Collection ---
    full_projected_collection = (
        ee.ImageCollection('NASA/GDDP-CMIP6')# type: ignore
        .filter(ee.Filter.eq('model', MODEL))# type: ignore
        .filter(ee.Filter.eq('scenario', 'ssp245'))# type: ignore
        .filterBounds(point)
        .select(BANDS)
    )
    def per_year_mean(year):

        year = ee.Number(year).toInt() # type: ignore
        
        filtered_by_year = (
            full_projected_collection 
            .filter(ee.Filter.eq('month', target_month))# type: ignore
            .filter(ee.Filter.calendarRange(year, year, 'year'))# type: ignore
        )
        

        mean_image = filtered_by_year.mean()


        reduced_dict = mean_image.reduceRegion(
            reducer=ee.Reducer.mean(),  # type: ignore
            geometry=point,
            scale=25000,
            bestEffort=True
        )

        return ee.Feature(None, reduced_dict).set('year', year) # type: ignore

    time_series_collection = years.map(per_year_mean)

    time_series_features = ee.FeatureCollection(time_series_collection).getInfo()['features'] # type: ignore


    result = process_time_series_for_frontend(time_series_features)

    print(f"""

        get_projected_time_series
          

          {result}
          
          
          """)

    return 



import pandas as pd

def process_time_series_for_frontend(time_series_features):

    records = [feature["properties"] for feature in time_series_features]

    df = pd.DataFrame(records)

    if "year" not in df.columns:
        raise ValueError(
            f"'year' not found in time-series properties. "
            f"Available columns: {df.columns.tolist()}"
        )


    df["year"] = df["year"].astype(int)

    BANDS = ["tas", "tasmin", "tasmax", "pr", "hurs", "huss", "rlds", "rsds", "sfcWind"]

    missing = [b for b in BANDS if b not in df.columns]
    if missing:
        print("Warning: missing bands in time-series:", missing)

    present_bands = [b for b in BANDS if b in df.columns]

    plot_df = df[["year"] + present_bands].sort_values("year").reset_index(drop=True)

    json_data = plot_df.to_dict(orient="records")
    return json_data







