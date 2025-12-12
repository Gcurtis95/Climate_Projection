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


    print(time_series_features[2]['properties']['year'])


    # result = process_time_series_for_frontend(time_series_features)

    nodes = []
    links = []


    ## THINGS TODO TOMORROW:: ROUND EACH NUMBER: ADD SEPERATE ID FOR AND PUT BANDS INTO NAME INSTEAD OF ID

    
    # for i in time_series_features:

    #     id1 = {"id": f"""{i["properties"]["year"]}""", "group": i["properties"]["year"]}
    #           ## link 
    #     lk1 = {"source": f"""{i["properties"]["year"]}""", "target": f"""{i["properties"]["year"] + 1}""", "value": i["properties"]["year"]}
    #     links.append(lk1)

    #     nodes.append(id1)
    #     id2 = {"id": f"""hurs {i["properties"]["hurs"]}""", "group": i["properties"]["year"]}
    #     nodes.append(id2)
    #     id3 = {"id": f"""huss {i["properties"]["huss"]}""", "group": i["properties"]["year"]}
    #     nodes.append(id3)
    #     id4 = {"id": f"""pr {i["properties"]["pr"]}""", "group": i["properties"]["year"]}
    #     nodes.append(id4)
    #     id5 = {"id": f"""rlds {i["properties"]["rlds"]}""", "group": i["properties"]["year"]}
    #     nodes.append(id5)
    #     id6 = {"id": f"""rsds {i["properties"]["rsds"]}""", "group": i["properties"]["year"]}
    #     nodes.append(id6)
    #     id7 = {"id": f"""sfcWind {i["properties"]["sfcWind"]}""", "group": i["properties"]["year"]}
    #     nodes.append(id7)
    #     id8 = {"id": f"""tas {i["properties"]["tas"]}""", "group": i["properties"]["year"]}
    #     nodes.append(id8)
    #     id9 = {"id": f"""tasmax {i["properties"]["tasmax"]}""", "group": i["properties"]["year"]}
    #     nodes.append(id9)
    #     id10 = {"id": f"""tasmin {i["properties"]["tasmin"]}""", "group": i["properties"]["year"]}
    #     nodes.append(id10)

    #     ## link 
        # lk1 = {"source": f"""{i["properties"]["year"]}""", "target": f"""{i["properties"]["year"] + 1}""", "value": i["properties"]["year"]}
        # links.append(lk1)

    BANDS = ["hurs", "huss", "pr", "rlds", "rsds", "sfcWind", "tas", "tasmax", "tasmin"]



    for feature in time_series_features:
        props = feature["properties"]
        year = props["year"]

        if not f"{year}" == location_date_data["year"]:
            lk1 = {"source": f"{year}", "target": f"{year + 1}", "value": year}
            links.append(lk1)

        
        

        nodes.append({
        "id": f"{year}",
        "name": f"{year}",
        "group": year,
        })


        nodes.extend(
        {
            "id": f"{band}.{year}",
            "name": f"{band}: {round(props[band], 3)}",
            "group": year,
        }

        for band in BANDS 
        )

        links.extend({
            "source": f"{band}.{year}",
            "target": f"{year}",
            "value": 100
        }
        for band in BANDS 
        )


   

    # print(nodes)
    # print(links)


    result = {"nodes": nodes, "links": links}








    # print(f"""

    #     get_projected_time_series
          

    #       {result}
          
          
    #       """)

    return result



# def process_time_series_for_frontend(time_series_features):

#     records = [feature["properties"] for feature in time_series_features]

#     df = pd.DataFrame(records)

#     df["year"] = df["year"].astype(int)

#     BANDS = ["tas", "tasmin", "tasmax", "pr", "hurs", "huss", "rlds", "rsds", "sfcWind"]

#     present_bands = [b for b in BANDS if b in df.columns]

#     plot_df = df[["year"] + present_bands].sort_values("year").reset_index(drop=True)

#     json_data = plot_df.to_dict(orient="records")

#     return json_data







