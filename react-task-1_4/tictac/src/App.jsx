import React, { useState, useEffect } from 'react'
import { io } from 'socket.io-client'
import Game from './components/Game'
import Chat from './components/Chat'
import './App.css'

const socket = io('http://localhost:3001', {
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000
})

function App () {
  const [roomId, setRoomId] = useState('')
  const [user, setUser] = useState('')
  const [isInRoom, setIsInRoom] = useState(false)
  const [isCreator, setIsCreator] = useState(false)

  useEffect(() => {
    const savedRoomId = localStorage.getItem('roomId')
    const savedUser = localStorage.getItem('user')
    const savedIsCreator = localStorage.getItem('isCreator') === 'true'

    if (savedRoomId && savedUser) {
      setRoomId(savedRoomId)
      setUser(savedUser)
      setIsCreator(savedIsCreator)
      socket.emit('reconnectToRoom', {
        roomId: savedRoomId,
        user: savedUser,
        isCreator: savedIsCreator
      })
    }

    socket.on('reconnected', ({ roomId, isCreator }) => {
      setRoomId(roomId)
      setIsInRoom(true)
      setIsCreator(isCreator)
    })

    return () => {
      socket.off('reconnected')
    }
  }, [])

  const handleCreateRoom = () => {
    if (!user) return alert('Введите имя')
    const newRoomId = Math.random().toString(36).substring(2, 8)
    socket.emit('createRoom', newRoomId)
    setRoomId(newRoomId)
    setIsInRoom(true)
    setIsCreator(true)
    localStorage.setItem('roomId', newRoomId)
    localStorage.setItem('user', user)
    localStorage.setItem('isCreator', 'true')
  }

  const handleJoinRoom = () => {
    if (!roomId || !user) return alert('Введите имя и ID комнаты')
    socket.emit('joinRoom', roomId)
    setIsInRoom(true)
    setIsCreator(false)
    localStorage.setItem('roomId', roomId)
    localStorage.setItem('user', user)
    localStorage.setItem('isCreator', 'false')
  }

  return (
    <div className='app'>
      {!isInRoom ? (
        <div className='lobby'>
          <input
            type='text'
            placeholder='Ваше имя'
            value={user}
            onChange={e => setUser(e.target.value)}
          />
          <button onClick={handleCreateRoom}>Создать игру</button>
          <div className='join-section'>
            <input
              type='text'
              placeholder='ID комнаты'
              value={roomId}
              onChange={e => setRoomId(e.target.value)}
            />
            <button onClick={handleJoinRoom}>Присоединиться</button>
          </div>
        </div>
      ) : (
        <>
          <h3>Комната: {roomId}</h3>
          <Game
            roomId={roomId}
            socket={socket}
            user={user}
            isCreator={isCreator}
          />
          <Chat roomId={roomId} socket={socket} user={user} />
        </>
      )}
    </div>
  )
}

export default App
