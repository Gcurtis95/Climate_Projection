'use client'
import styles from './style.module.css'
import {ClimateDataTable} from '../AgentTable/AgentTable'


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
    summary: string
    key_takeaways: string[]
    
}



type agentData = {
        $schema: string,
        caveats: string[],
        citations: string [],
        data_table: any
        impacts: Impact,
        location: Location,
        overview: Overview,
        time: any,
        title: string    
}


export default function AgentOutput({agent}:{ agent : agentData}){
    console.log(agent)

    return(
        <div className={styles.AgentOutput}>
            {/* <h1 className={styles.h1}>{agent.title}</h1>
            <div className={styles.Content}>
                <div className={styles.left}>
                
                    <div className={styles.takeaways}>
                        <h3>Overview</h3>
                        {agent.overview.key_takeaways.map((t, id) => {
                            return <div key={id}>{t}</div>
                        })}
                    </div>
                    <div className={styles.summary}>
                        <h3>Summary</h3>
                        <p>{agent.overview.summary}</p>

                    </div>
                    
                    <div className={styles.impacts}>
                        <h3>Impacts</h3>
                        {agent.impacts.bullets.map((b, id) => {
                            return <div key={id}>{b}</div>
                        })}
                    </div>
                </div>
                <div className={styles.right}>
                    <ClimateDataTable rows={agent.data_table}/>
                </div>
            </div> */}
        </div>
    )
}