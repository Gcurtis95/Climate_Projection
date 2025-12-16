'use client'
import styles from './style.module.css'

export default function Loading() {
  return (
    <div className={styles.loadingContainer}>
    <p className={styles.shinyText}>
      Analysing
    </p>
    </div>
  );
}