'use client'

import styles from './styles.module.css'
import {useRef, useEffect, useState, SetStateAction} from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css';



interface Props {
    setLocation: React.Dispatch<SetStateAction<number[]>>
}



export default function Map({setLocation}: Props){

    const mapRef = useRef<mapboxgl.Map | null>(null)
    const mapContainerRef = useRef<HTMLDivElement | null>(null)

    const [coordinates, setCoordinates] = useState<string[]>(['Longitude: 0', 'Latitude: 51.072']);

    useEffect(() => {

        mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX

        if (mapContainerRef.current) {
            mapRef.current = new mapboxgl.Map({
                container: mapContainerRef.current,
                style: 'mapbox://styles/mapbox/dark-v11',
                center: [0, 51.072],
                zoom: 2
            });
        }

        const marker = new mapboxgl.Marker({
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