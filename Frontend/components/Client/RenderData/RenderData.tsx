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
    agent: agentData
  }
};


type Comparison = {
    baseline_vs_projected: {
    key: string
    delta: number
    delta_unit: string
    relative_change_percent: number
    interpretation: string
    }[],
    notes: string[],
}

export type ClimateTableRow = {
  key: string;
  label: string;
  unit: string;
  display_format?: "kelvin" | "percent" | "scientific" | "w_m2" | "m_s";
  baseline: { value: number };
  projected: { value: number };
};


type Impact = {
    bullets: string[]
}

type Location = {
    country_region: string,
    lat: number,
    lon: number,
    name: string
}

type Overview = {
    key_takeaways: string[]
    summary: string
}



type agentData = {
        $schema: string,
        caveats: string[],
        citations: string [],
        comparison: Comparison,
        data_table: any
        impacts: Impact,
        location: Location,
        overview: Overview,
        time: any,
        title: string    
}

export default function RenderData({ climateData }: RenderDataProps) {


  const [loaded, setLoaded] = useState<boolean>(false)

    console.log(climateData)
    const graphData: graphData = climateData.data
    const agentData: agentData = climateData.agent


    return(
        <>
          <ThreeDShader setLoaded={setLoaded}/>
          {loaded && (
            <div className={styles.container}>
              <AgentOutput agent={agentData}/>
            </div>
            
          )}

        </>
    )
}


