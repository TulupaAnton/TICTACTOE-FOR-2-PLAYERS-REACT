import React, { useState, useEffect } from 'react'
import styles from './css/Chat.module.css'

const Chat = ({ roomId, socket, user }) => {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')

  useEffect(() => {
    if (!socket) return

    socket.on('newMessage', message => {
      setMessages(prev => [...prev, message])
    })

    socket.on('chatHistory', history => {
      setMessages(history)
    })

    return () => {
      socket.off('newMessage')
      socket.off('chatHistory')
    }
  }, [socket])

  const sendMessage = () => {
    if (!newMessage.trim()) return
    socket.emit('sendMessage', { roomId, user, text: newMessage })
    setNewMessage('')
  }

  return (
    <div className={styles.chat}>
      <h3 className={styles.chatHeading}>Чат</h3>
      <div className={styles.messages}>
        {messages.map((msg, i) => (
          <p key={i}>
            <strong>{msg.user}:</strong> {msg.text}
          </p>
        ))}
      </div>
      <input
        type='text'
        value={newMessage}
        onChange={e => setNewMessage(e.target.value)}
        placeholder='Введите сообщение...'
        className={styles.chatInput}
      />
      <button onClick={sendMessage} className={styles.chatButton}>
        Отправить
      </button>
    </div>
  )
}

export default Chat
