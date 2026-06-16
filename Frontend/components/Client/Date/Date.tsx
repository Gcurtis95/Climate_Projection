'use client'

import { useEffect, useState } from 'react'
import Picker, { PickerValue } from 'react-mobile-picker'
import styles from './styles.module.css'
import {SetStateAction} from 'react'



const year: string[] = [];

for(let i: number = 2030; i < 2101; i += 10){
    year.push(`${i}`)
}


const selections: { season: string[]; year: string[] } = {
    season: ['Winter', 'Spring', 'Summer', 'Autumn'],
    year: year
}


interface userSelectProp {
  setDate: React.Dispatch<SetStateAction<PickerValue>>
}



export default function Date({setDate}: userSelectProp){

    const [pickerValue, setPickerValue] = useState<PickerValue>({season: 'Winter', year: '2030'})


    useEffect(() => {

      setDate(pickerValue)

    },[pickerValue])

    



    return (
    <div className={styles.DateContainer}>
    <Picker value={pickerValue} onChange={setPickerValue} wheelMode='normal'>
      {Object.keys(selections).map((name, id) => (
        <Picker.Column key={id} name={name}>
          {(selections as Record<string, string[]>)[name].map(option => (
            <Picker.Item key={option} value={option}>
                <div className={styles.Date}>
                    {option}            
                </div>
              
            </Picker.Item>
          ))}
        </Picker.Column>
      ))}
    </Picker>
    </div>
    )

}