
import styles from './style.module.css'
import RenderData from '@/components/Client/RenderData/RenderData';
import { getData } from '../../lib/utils'


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

  const promiseData = await getData({ searchParams })


  return (
        <div className={styles.ThreeDVisual}>

            <RenderData climateData={promiseData}/>

        </div>
    )
}