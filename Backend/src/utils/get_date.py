
def get_date(month, year):

    month_convert: str = ''

    match month: 
        case 'January':
            month_convert = '01'
        case 'February':
            month_convert = '02'
        case 'March':
            month_convert = '03'
        case 'April':
            month_convert = '04'
        case 'May': 
            month_convert = '05'
        case 'June':
            month_convert = '06'
        case 'July':
            month_convert = '07'
        case 'August':
            month_convert = '08'
        case 'September':
            month_convert = '09'
        case 'October':
            month_convert = '10'
        case 'November':
            month_convert = '11'
        case 'December':
            month_convert = '12'

    start_date: str = f"{year}-{month_convert}-01"
    end_date: str = f"{year}-{month_convert}-27"

    return start_date, end_date


def get_location(location_date_data):

    longitude: float = float(location_date_data['lon'])
    latitude: float = float(location_date_data['lat'])


    return longitude, latitude



def get_month(month):
    
    month_convert: str = ''

    match month: 
        case 'January':
            month_convert = '01'
        case 'February':
            month_convert = '02'
        case 'March':
            month_convert = '03'
        case 'April':
            month_convert = '04'
        case 'May': 
            month_convert = '05'
        case 'June':
            month_convert = '06'
        case 'July':
            month_convert = '07'
        case 'August':
            month_convert = '08'
        case 'September':
            month_convert = '09'
        case 'October':
            month_convert = '10'
        case 'November':
            month_convert = '11'
        case 'December':
            month_convert = '12'


    

    return month_convert

