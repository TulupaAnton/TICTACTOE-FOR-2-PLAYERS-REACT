import React from 'react'
import styles from './css/Square.module.css'

export default function Square ({ value, onClick, disabled }) {
  return (
    <button className={styles.square} onClick={onClick} disabled={disabled}>
      {value}
    </button>
  )
}
