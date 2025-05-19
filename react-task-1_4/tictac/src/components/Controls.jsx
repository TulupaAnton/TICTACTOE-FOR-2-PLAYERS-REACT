import React from 'react'
import styles from './css/Controls.module.css'
export default function Controls ({ resetGame }) {
  return (
    <div className={styles.controls}>
      <button onClick={resetGame}>ResetGame</button>
    </div>
  )
}
