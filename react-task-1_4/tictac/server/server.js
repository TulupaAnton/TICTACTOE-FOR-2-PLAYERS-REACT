import express from 'express'
import http from 'http'
import { Server } from 'socket.io'
import cors from 'cors'

const app = express()
app.use(cors())

const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
})

const rooms = new Map()

io.on('connection', socket => {
  let currentRoom = null
  let playerRole = null

  socket.on('reconnectToRoom', ({ roomId, user }) => {
    const room = rooms.get(roomId)
    if (!room) {
      socket.emit('roomNotFound')
      return
    }

    // Проверяем, был ли этот игрок в комнате ранее
    const wasPlayerX =
      room.players[0] === socket.id ||
      (room.players[0] && room.players[0].includes(user))
    const wasPlayerO =
      room.players[1] &&
      (room.players[1] === socket.id || room.players[1].includes(user))

    if (!wasPlayerX && !wasPlayerO) {
      if (room.players.length >= 2) {
        socket.emit('roomFull')
        return
      }
      room.players.push(socket.id)
    }

    socket.join(roomId)
    currentRoom = roomId

    // Обновляем ID сокета, сохраняя позицию игрока
    if (wasPlayerX) {
      room.players[0] = socket.id
      playerRole = 'X'
    } else if (wasPlayerO) {
      room.players[1] = socket.id
      playerRole = 'O'
    } else {
      playerRole = room.players.length === 1 ? 'X' : 'O'
    }

    socket.emit('reconnected', {
      roomId,
      playerRole,
      isYourTurn: room.currentTurn === playerRole,
      board: room.board,
      messages: room.messages
    })

    // Уведомляем другого игрока
    socket.to(roomId).emit('opponentReconnected')
  })

  socket.on('createRoom', (roomId, user) => {
    rooms.set(roomId, {
      board: Array(9).fill(null),
      players: [socket.id],
      messages: [],
      currentTurn: 'X',
      creator: socket.id
    })
    socket.join(roomId)
    currentRoom = roomId
    playerRole = 'X'
    socket.emit('playerRole', 'X')
    socket.emit('yourTurn', true)
  })

  socket.on('joinRoom', (roomId, user) => {
    const room = rooms.get(roomId)
    if (!room || room.players.length >= 2) {
      socket.emit('roomFull')
      return
    }

    room.players.push(socket.id)
    socket.join(roomId)
    currentRoom = roomId
    playerRole = 'O'
    socket.emit('playerRole', 'O')
    socket.emit('yourTurn', false)

    io.to(roomId).emit('gameState', room.board)
    io.to(room.players[0]).emit('yourTurn', true)
  })

  socket.on('makeMove', ({ roomId, index }) => {
    const room = rooms.get(roomId)
    if (!room || !room.players.includes(socket.id)) return

    const isPlayerX = room.players[0] === socket.id
    const currentPlayerRole = isPlayerX ? 'X' : 'O'

    if (room.currentTurn !== currentPlayerRole) {
      socket.emit('invalidMove', 'Не ваш ход!')
      return
    }

    if (room.board[index] || calculateWinner(room.board)) return

    room.board[index] = currentPlayerRole
    room.currentTurn = currentPlayerRole === 'X' ? 'O' : 'X'

    io.to(roomId).emit('gameState', room.board)

    const winner = calculateWinner(room.board)
    if (winner) {
      io.to(roomId).emit('winner', winner)

      setTimeout(() => {
        if (rooms.has(roomId)) {
          const room = rooms.get(roomId)
          room.board = Array(9).fill(null)
          room.currentTurn = winner === 'X' ? 'O' : 'X'
          io.to(roomId).emit('gameState', room.board)
          io.to(roomId).emit('winner', null)
          updateTurnNotifications(room)
        }
      }, 5000)
    } else {
      updateTurnNotifications(room)
    }
  })

  function updateTurnNotifications (room) {
    const nextPlayer =
      room.currentTurn === 'X' ? room.players[0] : room.players[1]
    const otherPlayer = room.players.find(id => id !== nextPlayer)

    if (nextPlayer) io.to(nextPlayer).emit('yourTurn', true)
    if (otherPlayer) io.to(otherPlayer).emit('yourTurn', false)
  }

  socket.on('continueGame', roomId => {
    const room = rooms.get(roomId)
    if (!room) return

    room.board = Array(9).fill(null)
    io.to(roomId).emit('gameState', room.board)
    io.to(roomId).emit('winner', null)

    const firstPlayer =
      room.currentTurn === 'X' ? room.players[0] : room.players[1]
    if (firstPlayer) io.to(firstPlayer).emit('yourTurn', true)
    const secondPlayer = room.players.find(id => id !== firstPlayer)
    if (secondPlayer) io.to(secondPlayer).emit('yourTurn', false)
  })

  socket.on('sendMessage', ({ roomId, user, text }) => {
    const room = rooms.get(roomId)
    if (!room) return

    const message = { user, text }
    room.messages.push(message)
    io.to(roomId).emit('newMessage', message)
  })

  socket.on('disconnect', () => {
    if (currentRoom) {
      const room = rooms.get(currentRoom)
      if (room) {
        room.players = room.players.filter(id => id !== socket.id)
        if (room.players.length === 0) {
          rooms.delete(currentRoom)
        } else {
          io.to(currentRoom).emit('opponentDisconnected')
          // Если отключился текущий игрок, передаем ход
          if (room.players.length === 1) {
            room.currentTurn = room.players[0] === room.players[0] ? 'X' : 'O'
            io.to(room.players[0]).emit('yourTurn', true)
          }
        }
      }
    }
  })
})

function calculateWinner (squares) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
  ]

  for (const [a, b, c] of lines) {
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares[a]
    }
  }
  return null
}

const PORT = 3001
server.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`)
})
