import { useEffect, useState } from 'react'

function Game({ socket }: { socket: WebSocket | null}) {

    useEffect(() => {
        if (!socket) {
            console.warn('No WebSocket connection')
            return;
        }

        socket.send('Player joined the game')

        socket.onmessage = (e) => {
            console.log('Game received:', e.data)
        }

        return () => {
            socket.close()
        }
    });

  return (
    <>
      <h1>Game Page</h1>
    </>
  )
}

export default Game
