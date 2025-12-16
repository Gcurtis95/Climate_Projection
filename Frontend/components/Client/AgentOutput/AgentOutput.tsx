'use client'
import styles from './style.module.css'




export default function AgentOutput({agent}:{ agent : string}){

    return(
        <div className={styles.AgentOutput}>
            <p>{agent}</p>
        </div>
    )
}