import { useEffect, useState } from 'react'

function Game(
  { socket, playerId }: { socket: WebSocket | null, playerId: number},
) {

    useEffect(() => {
        if (!socket) {
            console.warn('No WebSocket connection')
            return;
        }


        return () => {
            //socket.close()
        }
    }, []);

    function createMoveMessage(playerId: number, roomId: number, moveCode: number) {
        return (playerId * 256 + roomId * 8 + moveCode)
    }

    function handleMove(playerId: number, roomId: number, moveCode: number) {
        const binary = createMoveMessage(playerId, roomId, moveCode)

        const buffer = new Uint8Array([binary])
        if (socket != null) {
            socket.send(buffer);
        } else {
            console.log("socket nie działa")
        }
    }

  return (
    <>
      <h1>Game Page</h1>
      <button onClick={() => handleMove(playerId, 0, 0)}>W</button>
      <button onClick={() => handleMove(playerId, 0, 1)}>WD</button>
      <button onClick={() => handleMove(playerId, 0, 2)}>D</button>
    </>
  )
}

export default Game
