import { create } from 'zustand'
import { calculateWinner } from '../helper'

export const useGameStore = create(set => ({
  board: Array(9).fill(null),
  xIsNext: true,
  winner: null,
  setGameState: newBoard => {
    const winner = calculateWinner(newBoard)
    set({
      board: newBoard,
      xIsNext: newBoard.filter(Boolean).length % 2 === 0,
      winner
    })
  }
}))
