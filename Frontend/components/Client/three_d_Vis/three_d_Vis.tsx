'use client'
import WebGPUScene from '../../THREEjs/components/webgpu_scene'
import {WebGPUSketch} from '../../THREEjs/components/webgpu_sketch'
import {slateBase, Sketch} from '../../THREEjs/sketch'
import {useRef, Suspense} from 'react'
import styles from './style.module.css'




export default function ThreeDVisual(){



    const ref = useRef(null)
    return (
    <div ref={ref} className={styles.WebGPUScene}>
    <Suspense>
        <WebGPUScene
          style={{
            position: 'fixed',
            inset: 0,
            pointerEvents: 'none',
          }}
          eventSource={ref}
          eventPrefix='client'
          >

        <Sketch/>
        </WebGPUScene>
    </Suspense>
    </div>
    )
}