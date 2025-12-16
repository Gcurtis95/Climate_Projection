'use client'

import ThreeDShader from '../ThreeShaderVis/ThreeShaderVis'
import VisScene from '@/components/Client/VisScene/VisScene'
import AgentOutput from '@/components/Client/AgentOutput/AgentOutput';
import {useState} from 'react'
import styles from './style.module.css'


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

type RenderDataProps = {
  climateData: {
    data: graphData,
    agent: string
  }
};

export default function RenderData({ climateData }: RenderDataProps) {


  const [loaded, setLoaded] = useState<boolean>(false)


    const graphData: graphData = climateData.data
    const agentData: string = climateData.agent


    return(
        <>
          <ThreeDShader setLoaded={setLoaded}/>
          {/* <ThreeDShader/> */}
              <AgentOutput agent={agentData}/>
              <VisScene graphData={graphData}/>
          {/* {loaded && (
            <div className={styles.container}>
              <AgentOutput agent={agentData}/>
              <VisScene graphData={graphData}/>
            </div>
            
          )} */}

        </>
    )
}


