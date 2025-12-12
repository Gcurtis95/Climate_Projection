'use client'
import { Canvas, useFrame } from '@react-three/fiber';
import ClimateGraph from '../ThreePointVis/ThreePointVis'
import styles from './style.module.css'
import { useMemo } from 'react'
import { OrbitControls } from '@react-three/drei'


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


    // console.log(data)


//     const safeData = useMemo(
//     () => ({
//       nodes: Array.isArray(data?.nodes) ? data!.nodes : [],
//       links: Array.isArray(data?.links) ? data!.links : [],
//     }),
//     [data]
//   );


    return(
        <div className={styles.sceneContainer}>
        <Canvas flat camera={{ position: [0, 0, 400], far: 6000 }}>
            <OrbitControls/>
            <ambientLight color={0xcccccc} intensity={Math.PI}/>
            <directionalLight intensity={0.6 * Math.PI}/>
              {/* <ambientLight intensity={1} />
                <mesh>
                <boxGeometry args={[50, 50, 50]} />
                <meshStandardMaterial />
                </mesh> */}
            <ClimateGraph graphData={graphData} />
        </Canvas>
        </div>
    )
}