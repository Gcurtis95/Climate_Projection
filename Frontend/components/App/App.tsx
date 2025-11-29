'use client'
import Map from '../Client/Map/Map'
import styles from './styles.module.css'
import UserSelect from '../Client/UserSelect/UserSelect'
import { PickerValue } from 'react-mobile-picker'
import {useState} from 'react'





export default function App(){

    const [location, setLocation] = useState<number[]>([])
    const [date, setDate] = useState <PickerValue>({month: 'January', year: '2025'})







    return (
        <div className={styles.Container}>
            <Map setLocation={setLocation} />
            <UserSelect location={location} date={date} setDate={setDate}/>
        </div>
    )
}