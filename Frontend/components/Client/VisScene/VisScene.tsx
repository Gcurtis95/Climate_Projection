'use client'
import { Canvas, useFrame } from '@react-three/fiber';
import ClimateGraph from '../ThreePointVis/ThreePointVis'
import styles from './style.module.css'
import { Suspense } from 'react'
import { OrbitControls } from '@react-three/drei'
import { TrackballControls } from '@react-three/drei';



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

export default function VisScene({graphData}: {graphData: graphData}){

    return(
        <div className={styles.sceneContainer}>
        <div className={styles.Canvas}>
        <Canvas flat camera={{ position: [90, 0, 40], far: 6000 }}>
            <OrbitControls/>
            <ambientLight color={0xcccccc} intensity={Math.PI}/>
            <directionalLight intensity={0.6 * Math.PI}/>
            <ClimateGraph graphData={graphData} />
        </Canvas>
        </div>

        <div className={styles.legend}>
            <p className={styles.tas}>Mean Temperature °C</p>
            <p className={styles.hurs}>Near-surface relative humidity %</p>
            <p className={styles.sfcWind}>Daily-mean near-surface wind speed m/s</p>
        </div>
        // </div>
    )
}