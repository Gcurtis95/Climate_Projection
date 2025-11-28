import ee
from utils.get_date import get_date, get_location, get_month
import asyncio

ee.Authenticate()
ee.Initialize(project='climatechangeproject-477817')




async def google_earth_engine(location_date_data):


    projected_task = async_get_projected(location_date_data)
    baseline_task = async_get_baseline_data(location_date_data)

    projected, base = await asyncio.gather(projected_task, baseline_task)

    result = f"""
    
    Projected climate data for {location_date_data["month"]} of {location_date_data["year"]} is:
    {projected}.

    Baseline climate data for {location_date_data["month"]} from 1950 to 2014 is {base}.
    
    
    
    """

    print(result)

    return result





def get_projected(location_date_data): 
    print(location_date_data)

    longitude, latitude = get_location(location_date_data)

    start_date, end_date = get_date(location_date_data["month"], location_date_data["year"])

    print(start_date)
    print(end_date)

    collection = (
                ee.ImageCollection('NASA/GDDP-CMIP6') # type: ignore
               .filter(ee.Filter.date(start_date, end_date)) # type: ignore
               .filter(ee.Filter.eq('model', 'MPI-ESM1-2-HR')) # type: ignore
               .filter(ee.Filter.eq('scenario', 'ssp245')) # type: ignore
               .filterBounds(ee.Geometry.Point([longitude, latitude])) # type: ignore
               
            )
    image = collection.select(["hurs","huss","pr","rlds", "rsds", "sfcWind", "tas", "tasmin", "tasmax"]).mean()

    collection_reduced = image.reduceRegion(
                                reducer= ee.Reducer.mean(), # type: ignore
                                geometry= ee.Geometry.Point([longitude, latitude]), # type: ignore
                                scale= 25000,
                            )

    return collection_reduced.getInfo()





def get_baseline_data(location_date_data):


    longitude, latitude = get_location(location_date_data)

    month = get_month(location_date_data["month"])

    int_month = int(month)

    dataset = (ee.ImageCollection('NASA/GDDP-CMIP6')  # type: ignore
                  .filter(ee.Filter.date(f"1950-01-01", f"2015-01-01")) # type: ignore
                  .filter(ee.Filter.eq('model', 'MPI-ESM1-2-HR')) # type: ignore
                  .filter(ee.Filter.eq('scenario', 'historical')) # type: ignore
                  .filter(ee.Filter.eq('month', int_month)) # type: ignore
                  .filterBounds(ee.Geometry.Point([longitude, latitude])) # type: ignore
                )
    
    image = dataset.select(["hurs","huss","pr","rlds", "rsds", "sfcWind", "tas", "tasmin", "tasmax"]).mean()

    dataset_reduced = image.reduceRegion(
                                reducer= ee.Reducer.mean(), # type: ignore
                                geometry= ee.Geometry.Point([longitude, latitude]),    # type: ignore
                                scale= 25000,
                                bestEffort=True
                            )

    return dataset_reduced.getInfo()



async def async_get_baseline_data(location_date_data):
    return await asyncio.to_thread(get_baseline_data, location_date_data)


async def async_get_projected(location_date_data):
    return await asyncio.to_thread(get_projected, location_date_data)






