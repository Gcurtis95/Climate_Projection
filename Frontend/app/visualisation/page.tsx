import ThreeDVisual from '../../components/Client/ThreeShaderVis/ThreeShaderVis'
import styles from './style.module.css'
import VisScene from '../../components/Client/VisScene/VisScene'

type VisualisationPageProps = {
  searchParams: Promise<{
    lon: string;
    lat: string;
    month: string;
    year: string;
    address: string;
  }>;
};


type graphData = {
  nodes: {
    id: string;
    name: string,
    group: number;
  }[];
  links: {
    source: string;
    target: string;
  }[];
};



export default async function visualisation({searchParams}: VisualisationPageProps){

  
  const params = await searchParams
  const lon = params.lon;
  const lat = params.lat;
  const month = params.month;
  const year = params.year;
  const address = params.address;
  

  const climateReponse = await fetch(`http://localhost:3000/api/climate?lon=${lon}&lat=${lat}&month=${month}&year=${year}&address=${address}`);


  const ClimateData = await climateReponse.json();

  const graphData: graphData = ClimateData.result


  return (
        <div className={styles.ThreeDVisual}>
          <ThreeDVisual />
          {graphData && <VisScene graphData={graphData} />}
          
        </div>
    )
}