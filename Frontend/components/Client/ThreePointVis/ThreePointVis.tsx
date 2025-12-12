'use client'
import dynamic from 'next/dynamic';
import { useFrame } from '@react-three/fiber';
import { useRef, useEffect, useState } from 'react';
import SpriteText from 'three-spritetext';
import R3fForceGraph from 'r3f-forcegraph';


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


export default function ClimateGraph({ graphData }: { graphData: graphData }) {
  const fgRef = useRef<any>(null);
  useFrame(() => (fgRef.current.tickFrame()));

  // Ensure graphData has safe defaults to prevent undefined errors
  const safeGraphData = {
    nodes: Array.isArray(graphData?.nodes) ? graphData.nodes : [],
    links: Array.isArray(graphData?.links) ? graphData.links : []
  };

  console.log('Safe graph data:', safeGraphData);
  console.log('Node count:', safeGraphData.nodes.length);
  console.log('Link count:', safeGraphData.links.length);

  // Don't render if there's no data
  if (safeGraphData.nodes.length === 0) {
    console.log('No nodes to render');
    return null;
  }

  return (
      <NoSSRForceGraph
        ref={fgRef}
        graphData={safeGraphData}
        linkDirectionalParticles={2}
        linkDirectionalParticleWidth={0.9}
        linkDirectionalParticleSpeed={0.006}
        d3VelocityDecay={0.3}
         nodeThreeObject={node => {
          const sprite = new SpriteText(node.name?.toString());
          sprite.color = '#ffffff';
          sprite.textHeight = 6;
          return sprite;
        }}

      />
  );
}
