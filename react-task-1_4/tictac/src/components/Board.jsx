import React from 'react'
import styles from './css/Board.module.css'
import Square from './Square'

export default function Board ({ squares, click, disabled }) {
  return (
    <div className={styles.board}>
      {squares.map((square, i) => (
        <Square
          key={i}
          value={square}
          onClick={() => click(i)}
          disabled={disabled}
        />
      ))}
    </div>
  )
}
