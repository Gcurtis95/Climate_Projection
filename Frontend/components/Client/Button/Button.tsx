'use client'

import styles from './styles.module.css'
import {useState, useEffect} from 'react'
import { PickerValue } from 'react-mobile-picker'

interface userSelect {
    location: number[]
    date: PickerValue
}
export default function Button({location, date} : userSelect){


    const [isItWater, setIsItWater] = useState<boolean>();





    async function handleFetch(location: number[], date: PickerValue): Promise<void> {
        const [lon, lat] = location
        const {month, year} = date



        const responseIsItWater = await fetch(`/api/water?lon=${lon}&lat=${lat}`, {cache: "no-cache"});
        const jsonWaterResponse = await responseIsItWater.json();

        const responseLocation = await fetch(`/api/geocoding?lon=${lon}&lat=${lat}`)

        const jsonLocation = await responseLocation.json()

        const address = jsonLocation.result.features[0].properties.full_address

        console.log(address)

        setIsItWater(jsonWaterResponse.result.water)


        if(!jsonWaterResponse.result.water){

            const climateReponse = await fetch(`/api/climate?lon=${lon}&lat=${lat}&month=${month}&year=${year}&address=${address}`);
            const json = await climateReponse.json();

            console.log(json.result)
        }

    }


    return (
        <div className={styles.ButtonContainer}>
            <button className={styles.EnterButton} onClick={() => handleFetch(location, date)}> Enter </button>
            <div className={styles.ErrorContainer}>
            {isItWater? <p className={styles.ErrorMessage}> NEX-GDDP-CMIP only covers land regions, please reposition the marker and try again!</p> : ''}
            </div>
        </div>
    )
}