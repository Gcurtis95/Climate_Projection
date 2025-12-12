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

  // Ensure graphData has safe defaults to prevent undefined errors
  const safeGraphData = {
    nodes: Array.isArray(graphData?.nodes) ? graphData.nodes : [],
    links: Array.isArray(graphData?.links) ? graphData.links : []
  };

  console.log('Safe graph data:', safeGraphData);

  return (
      <NoSSRForceGraph
        ref={fgRef}
        graphData={safeGraphData}
        // nodeThreeObject={node => {
        //   const sprite = new SpriteText(String(node.name));
        //   sprite.color = node.color;
        //   sprite.textHeight = 8;
        //   return sprite;
        // }} 
      />


  );
}
