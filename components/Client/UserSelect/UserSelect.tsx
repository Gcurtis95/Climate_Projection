import Date from '../../Client/Date/Date'
import styles from './style.module.css'
import Button from '../../Client/Button/Button'
import { PickerValue } from 'react-mobile-picker'
import {SetStateAction} from 'react'

interface appProp {
    location: number[]
    date: PickerValue
    setDate: React.Dispatch<SetStateAction<PickerValue>>
}

export default function UserSelect({location, date, setDate} : appProp){


    return(
        <div className={styles.UserInput}>
            <h1>Climate Projections</h1>
            <Date setDate={setDate}/>
            <Button location={location} date={date}/>
        </div>
    )
}