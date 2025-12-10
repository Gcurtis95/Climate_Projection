
/**
 * @license Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0)
 *
 * This sketch is licensed under CC BY-NC-SA 4.0. You are free to:
 * - Share and adapt this work
 * - Use modified versions commercially
 *
 * Under these conditions:
 * - Attribution: Credit Ben McCormick (phobon) and link to this project
 * - NonCommercial: Don't sell the original, unmodified sketch
 * - ShareAlike: Distribute derivatives under the same license
 */
// @ts-nocheck

'use client'

import { WebGPUSketch } from './components/webgpu_sketch'
import {
  Fn,
  uv,
  vec3,
  vec2,
  texture,
  smoothstep,
  float,
  PI,
  length,
  mix,
  rotateUV,
  step,
  pow,
  uniform,
} from 'three/tsl'
import { TextureLoader } from 'three/webgpu'

import { warpedFbmCoords } from './tsl/noise/fbm'
import { speckedNoiseEffect } from './tsl/effects/speckled_noise_effect'
import { canvasWeaveEffect } from './tsl/effects/canvas_weave_effect'
import { grainTextureEffect } from './tsl/effects/grain_texture_effect'
import { vignetteEffect } from './tsl/effects/vignette_effect'
import {crtScanlineEffect} from './tsl/post_processing/crt_scanline_effect'





const textureLoader = new TextureLoader()
const imageTexture = textureLoader.load('/debby.jpg')

const n1Freq = uniform(1)
const n1Offset1 = uniform(40)
const n1Offset2 = uniform(15)
const n1Oscillation1 = uniform(10)
const n1Oscillation2 = uniform(5)
const n1Contribution1 = uniform(0.3)
const n1Contribution2 = uniform(0.1)

const n2Freq = uniform(2
)
const n2Offset1 = uniform(22)
const n2Offset2 = uniform(32)
const n2Oscillation1 = uniform(17)
const n2Oscillation2 = uniform(12)
const n2Contribution1 = uniform(0.21)
const n2Contribution2 = uniform(0.26)

const n3Freq = uniform(3)
const n3Offset1 = uniform(2)
const n3Offset2 = uniform(14)
const n3Oscillation1 = uniform(1)
const n3Oscillation2 = uniform(1)
const n3Contribution1 = uniform(0.1)
const n3Contribution2 = uniform(0.04)

const rotAngle = uniform(0)
const uvOffset = uniform(vec2(1, 0.36))

const o1Contribution = uniform(10)
const o2Contribution = uniform(10)


const myUniform = uniform(0.0)
// Note that the `onFrame` callback is called every frame, so you need to be careful with the performance of your sketch.
const onFrame = (node, state) => {
  // Do something with your node, or using R3F's full state
  myUniform.value += 0.001
}




export const slateBase = Fn(() => {

 
  const _uv = uv().toVar()
  const _time = myUniform
  const _timex = _time.mul(0.1)

  const rotatedUV = rotateUV(_uv, PI.mul(rotAngle))
  const warpedUV = _uv.add(uvOffset).mul(length(_uv).mul(rotatedUV))
  

  const n1 = warpedFbmCoords(  rotatedUV,
  _time,
  n1Freq,
  n1Offset1,
  n1Offset2,
  n1Oscillation1,
  n1Oscillation2,
  n1Contribution1,
  n1Contribution2,)
  const n2 = warpedFbmCoords(  rotatedUV,
  _time,
  n1Freq,
  n1Offset1,
  n1Offset2,
  n1Oscillation1,
  n1Oscillation2,
  n1Contribution1,
  n1Contribution2,)
  const m1 = warpedFbmCoords(rotatedUV.mul(0.55), _time, 
    n3Freq,
    n3Offset1,
    n3Offset2,
    n3Oscillation1,
    n3Oscillation2,
    n3Contribution1,
    n3Contribution2,
  )

  const o1 = texture(imageTexture, warpedUV.add(warpedUV.mul(n1.mul(o1Contribution)))).toVar()
  const o2 = texture(imageTexture, rotatedUV.add(rotatedUV.mul(n2.mul(o2Contribution)))).toVar()



  const finalColor = mix(o1, o2, smoothstep(10, 0.4, m1))

  // const _vignette = vignetteEffect(_uv)

  // const vignette = smoothstep(0.45, 1, length(_uv.sub(0.5))).oneMinus()
  // finalColor.addAssign(_vignette)

  // const _grain = grainTextureEffect(_uv).mul(0.2)
  // finalColor.addAssign(_grain)

  const weave = canvasWeaveEffect(_uv) 
  finalColor.mulAssign(weave)

  



  return finalColor
})

/**
 * Slate 5: A sketch exploring noise, texture and color
 */
export const Sketch = () => {
  return <WebGPUSketch colorNode={slateBase()} onFrame={onFrame}/>
}