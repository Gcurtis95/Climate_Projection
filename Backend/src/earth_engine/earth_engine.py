import ee
from utils.get_date import get_date, get_location, get_month
import asyncio
import pandas as pd
import json

ee.Authenticate()
ee.Initialize(project='climatechangeproject-477817')


def get_google_earth_data(location_date_data, model):

    longitude, latitude = get_location(location_date_data)


    target_year = int(location_date_data["year"])
    start_year = target_year - 15
    end_year = target_year + 14 

    seasons = {
        "Winter": [12, 2],
        "Spring": [3, 5],  
        "Summer": [6, 8],  
        "Autumn": [9, 11]  
    }

    selected_season = location_date_data["season"]
    print(selected_season)
    month_start, month_end = seasons[selected_season]



    point = ee.Geometry.Point([longitude, latitude]) # type: ignore
    int_year = int(location_date_data["year"])


    BANDS = ["hurs", "sfcWind", "tas", "tasmin", "tasmax", "pr"]
    MODEL = model 

    base_collection = ( 
        ee.ImageCollection('NASA/GDDP-CMIP6')  # type: ignore
        .filter(ee.Filter.eq('model', MODEL)) # type: ignore
        .filterBounds(point)
        .select(BANDS)
    )


    projected_collection = (
        base_collection
        .filter(ee.Filter.eq('scenario', 'ssp245'))# type: ignore
        .filter(ee.Filter.calendarRange(month_start, month_end, 'month'))# type: ignore
        .filter(ee.Filter.calendarRange(start_year, end_year, 'year'))# type: ignore
    )

    projected_mean = projected_collection.mean().rename([f"{b}_mean" for b in BANDS])
    projected_std = projected_collection.reduce(ee.Reducer.stdDev()).rename([f"{b}_std" for b in BANDS]) # type: ignore


    baseline_collection = (
        base_collection
        .filter(ee.Filter.eq('scenario', 'historical'))# type: ignore
        .filter(ee.Filter.calendarRange(1985, 2015, 'year'))# type: ignore
        .filter(ee.Filter.calendarRange(month_start, month_end, 'month'))# type: ignore
    )
    baseline_mean = baseline_collection.mean().rename([f"{b}_baseline" for b in BANDS])

    combined_image = ee.Image.cat(projected_mean, projected_std, baseline_mean)# type: ignore

    combined_reduced = combined_image.reduceRegion(
        reducer=ee.Reducer.mean(),   # type: ignore
        geometry=point,
        scale=25000,
        bestEffort=True
    )
    
    results = combined_reduced.getInfo()

    print(results)

    return results



# def get_projected_time_series(location_date_data):

#     longitude, latitude = get_location(location_date_data)
#     point = ee.Geometry.Point([longitude, latitude])# type: ignore
    
#     month_str = get_month(location_date_data["month"])
#     target_month = int(month_str)

# #     month_window = [
# #     ((target_month - 2) % 12) + 1,  # previous month
# #     target_month,
# #     (target_month % 12) + 1       
# # ]
    
#     start_year = 2025
    
#     end_year = int(location_date_data["year"])
    
#     years = ee.List.sequence(2020, 2100, 10)# type: ignore

#     BANDS = ["hurs", "sfcWind", "tas"]
#     MODEL = 'MPI-ESM1-2-HR'
    
#     full_projected_collection = (
#         ee.ImageCollection('NASA/GDDP-CMIP6')# type: ignore
#         .filter(ee.Filter.eq('model', MODEL))# type: ignore
#         .filter(ee.Filter.eq('scenario', 'ssp245'))# type: ignore
#         .filterBounds(point)
#         .select(BANDS)
#     )
#     def per_year_mean(year):

#         year = ee.Number(year).toInt() # type: ignore
        
#         filtered_by_year = (
#             full_projected_collection 
#             .filter(ee.Filter.eq('month', target_month))# type: ignore
#             .filter(ee.Filter.calendarRange(year, year, 'year'))# type: ignore
#         )
        
 
#         mean_image = filtered_by_year.mean()

#         # Convert Kelvin → Celsius for temperature bands
#         mean_image = mean_image.addBands(
#             mean_image.select(['tas']).subtract(273.15),
#             overwrite=True
#         )


#         reduced_dict = mean_image.reduceRegion(
#             reducer=ee.Reducer.mean(),  # type: ignore
#             geometry=point,
#             scale=25000,
#             bestEffort=True
#         )

#         return ee.Feature(None, reduced_dict).set('year', year) # type: ignore

#     time_series_collection = years.map(per_year_mean)

#     time_series_features = ee.FeatureCollection(time_series_collection).getInfo()['features'] # type: ignore


#     print(time_series_features[2]['properties']['year'])


#     nodes = []
#     links = []


#     BANDS = ["hurs", "sfcWind", "tas"]



#     for idx, feature in enumerate(time_series_features, start=1):
#         props = feature["properties"]
#         year = props["year"]


#         if idx < len(time_series_features):
#             links.append({
#                 "source": f"{idx}",
#                 "target": f"{idx + 1}",
#                 "value": idx
#             })


#         nodes.append({
#         "id": f"{idx}",
#         "name": f"{year}",    
#         "group": "year",
#         "year": year,
#         "index": idx
#         })

    
#         for band in BANDS:
#             nodes.append({
#                 "id": f"{band}.{idx}",
#                 "name": f"{round(props[band], 2)}",
#                 "group": band,
#                 "year": year,
#                 "index": idx
#             })

#             links.append({
#                 "source": f"{band}.{idx}",
#                 "target": f"{idx}",
#                 "value": 1
#             })



   

#     # print(nodes)
#     # print(links)


#     result = {"nodes": nodes, "links": links}

#     # print(f"""

#     #     get_projected_time_series
          

#     #       {result}
          
          
#     #       """)

#     return result











