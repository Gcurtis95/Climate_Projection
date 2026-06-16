'use client'

import styles from './styles.module.css'
import {useRef, useEffect, useState, SetStateAction} from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css';



interface Props {
    setLocation: React.Dispatch<SetStateAction<number[]>>
}



export default function Map({setLocation}: Props){

    const mapRef = useRef<maplibregl.Map | null>(null)
    const mapContainerRef = useRef<HTMLDivElement | null>(null)

    const [coordinates, setCoordinates] = useState<string[]>(['Longitude: 0', 'Latitude: 51.072']);

    useEffect(() => {


        if (mapContainerRef.current) {
            mapRef.current = new maplibregl.Map({
                container: mapContainerRef.current,
                style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
                center: [0, 51.072],
                zoom: 2
            });
            mapRef.current.on('style.load', () => {
                if (mapRef.current) {
                    mapRef.current.setProjection({
                        type: 'globe', 
                    });
                }
            });
            
        }



        const marker = new maplibregl.Marker({
                scale: 0.5,
                color: "#FFFFFF",
                draggable: true
             })
            .setLngLat([0, 51.5072])
            .addTo(mapRef.current!);

        function onDragEnd() {
            const lngLat = marker.getLngLat();
            setCoordinates([`Longitude: ${toFourDecimalPlaces(lngLat.lng)}`,
                            `Latitude: ${toFourDecimalPlaces(lngLat.lat)}`
                ]);
            setLocation([toFourDecimalPlaces(lngLat.lng),
                            toFourDecimalPlaces(lngLat.lat)
                ]);
           }



        marker.on('dragend', onDragEnd);

        return () => {
            if (mapRef.current) {
                mapRef.current.remove()
            }
        }
    }, [])

    function toFourDecimalPlaces(num: number) {
    return parseFloat(num.toFixed(4));
  }
    
  console.log(mapContainerRef)

    return (
        <>
            <div className={styles.MapContainer} ref={mapContainerRef}/>
            <div className={styles.Cooridinates}> 
                {coordinates && coordinates.map((coord, id) => <p key = {id}style={{ margin: 0 }}>{coord}</p>)}
            </div>
        </>
    )
}