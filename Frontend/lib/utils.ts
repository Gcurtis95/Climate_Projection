type VisualisationPageProps = {
  searchParams: Promise<{
    lon: string;
    lat: string;
    season: string;
    year: string;
    address: string;
  }>;
};


export async function getData({searchParams}: VisualisationPageProps){

  const params = await searchParams

  const lon = params.lon;
  const lat = params.lat;
  const season = params.season;
  const year = params.year;
  const address = params.address;
  

  const climateReponse = await fetch(`http://localhost:3000/api/climate?lon=${lon}&lat=${lat}&season=${season}&year=${year}&address=${address}`);


  const ClimateData = await climateReponse.json();

  return ClimateData.result

}