'use client'
import WebGPUScene from '../../THREEjs/components/webgpu_scene'
import {Sketch} from '../../THREEjs/sketch'
import {useRef, SetStateAction} from 'react'
import styles from './style.module.css'

interface ThreeDShaderProps {
    setLoaded: React.Dispatch<SetStateAction<boolean>>;
}

export default function ThreeDShader({setLoaded}: ThreeDShaderProps) {
    const ref = useRef(null)

    return (
    <div ref={ref} className={styles.WebGPUScene}>
        <WebGPUScene
          style={{
            position: 'fixed',
            inset: 0,
            pointerEvents: 'none',
          }}
          eventSource={ref}
          eventPrefix='client'
          >
         <Sketch setLoaded={setLoaded}/>
        </WebGPUScene>

    </div>
    )
}