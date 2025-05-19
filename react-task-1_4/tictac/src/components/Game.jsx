import React, { useEffect, useState } from 'react'
import Board from './Board'
import { useGameStore } from '../store/useGameStore'
import styles from './css/Game.module.css'

export default function Game ({ roomId, socket, user, isCreator }) {
  const { board, xIsNext, winner, setGameState } = useGameStore()
  const [isCurrentPlayer, setIsCurrentPlayer] = useState(false)

  useEffect(() => {
    if (!socket) return

    const handleWinner = winner => {
      alert(`Игрок ${winner} победил! Новая игра начнётся через 5 секунд.`)
      setTimeout(() => {
        setGameState(Array(9).fill(null))
      }, 5000)
    }

    socket.on('playerRole', role => {
      setIsCurrentPlayer(
        (role === 'X' && xIsNext) || (role === 'O' && !xIsNext)
      )
    })

    socket.on('yourTurn', isYourTurn => {
      setIsCurrentPlayer(isYourTurn)
    })

    socket.on('gameState', newBoard => {
      setGameState(newBoard)
    })

    socket.on('winner', handleWinner)

    socket.on('opponentReconnected', () => {
      // No special handling needed, just continue the game
    })

    return () => {
      socket.off('playerRole')
      socket.off('yourTurn')
      socket.off('gameState')
      socket.off('winner', handleWinner)
      socket.off('opponentReconnected')
    }
  }, [socket, setGameState, xIsNext])

  const handleSquareClick = index => {
    if (winner || board[index] || !isCurrentPlayer) return
    socket.emit('makeMove', { roomId, index })
  }

  return (
    <div className='game'>
      <Board
        squares={board}
        click={handleSquareClick}
        disabled={!isCurrentPlayer || winner}
      />
      <p className={styles.status}>
        {winner
          ? `Победитель: ${winner}`
          : `Следующий ход: ${xIsNext ? 'X' : 'O'}`}
        <br />
        {isCurrentPlayer ? 'Ваш ход!' : 'Ожидаем ход соперника...'}
      </p>
    </div>
  )
}
