import ThreeDVisual from '../../components/Client/three_d_Vis/three_d_Vis'
import styles from './style.module.css'
type VisualisationPageProps = {
  searchParams: Promise<{
    lon: string;
    lat: string;
    month: string;
    year: string;
    address: string;
  }>;
};

export default async function visualisation({searchParams}: VisualisationPageProps){

  
    // const params = await searchParams
    // const lon = params.lon;
    // const lat = params.lat;
    // const month = params.month;
    // const year = params.year;
    // const address = params.address;



    // const climateReponse = await fetch(`http://localhost:3000/api/climate?lon=${lon}&lat=${lat}&month=${month}&year=${year}&address=${address}`);
    // const json = await climateReponse.json();

    // console.log(json)

    return (
        <div className={styles.ThreeDVisual}>
          <ThreeDVisual/>
        </div>
    )
}