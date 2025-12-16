'use client'
import dynamic from 'next/dynamic';
import { useFrame } from '@react-three/fiber';
import { useRef, useEffect, useState } from 'react';
import SpriteText from 'three-spritetext';




const NoSSRForceGraph = dynamic(() => import('../../../lib/NoSSRForceGraph'), {
  ssr: false,
});


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

const BAND_COLOURS: Record<string, string> = {
  tas: '#ff2d9a',
  hurs: '#00b7ff',
  sfcWind: '#b6ff3b',
}
export default function ClimateGraph({ graphData }: { graphData: graphData }) {
  const fgRef = useRef<any>(null);
  useFrame(() => {
    if (fgRef.current) {
      fgRef.current.tickFrame();
    }
  });



  return (
      <NoSSRForceGraph
        ref={fgRef}
        graphData={graphData}
        numDimensions={3}
        forceEngine="d3"
        d3AlphaDecay={0.03}
        d3VelocityDecay={0.45}
        linkOpacity={0.5}
        linkDirectionalArrowLength={4}
        linkDirectionalArrowRelPos={0.5}
         nodeThreeObject={node => {
          const sprite = new SpriteText(node.name?.toString());
          const group = node.group ?? 0
          sprite.color =  BAND_COLOURS[node.group] ?? '#ffffff'
          sprite.textHeight = 8;
          return sprite;
        }}

      />
  );
}
