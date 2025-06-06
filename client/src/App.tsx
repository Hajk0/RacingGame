import './App.css'
import { Routes, Route, BrowserRouter } from "react-router-dom"
import Menu from "./pages/Menu"
import Game from './pages/Game'
import { useState } from 'react'

function App() {
  const [socket, setSocket] = useState<WebSocket | null>(null)
  const [playerId, setPlayerId] = useState(-1)

  function initWebSocket(roomId: number): WebSocket {
    if (socket && socket.readyState !== WebSocket.CLOSED) {
      return socket
    }

    const ws = new WebSocket('ws://localhost:8000')
    ws.binaryType = 'arraybuffer'

    ws.onopen = function(e) { onOpen(roomId, e) };
    ws.onclose = function(e) { onClose(e) };
    ws.onmessage = function(e) { onMessage(e) };
    ws.onerror = function(e) { onError(e) };

    function onOpen(roomId: number, e: Event) {
      console.log(e.type);
      const binary = createJoinMessage(roomId)
      const buffer = new Uint8Array([binary])
      ws.send(buffer);
    }
    
    function onMessage(e: MessageEvent<any>) {
      if (e.data instanceof ArrayBuffer) {
        const message = decodeMessage(e.data)
        if (message.type === 1) {
            setPlayerId(message.playerId)
        }
        console.log("od servera binary")
      } else {
        console.log(e.type + ': '  + e.data);
        console.log("od servera text")
      }
    }

    function onClose(e: Event) {
      console.log("connection closed")
      ws.close();
    }

    function onError(e: Event) {
      console.log("connection error")
    }

    function createJoinMessage(roomId: number): number {
      return (128 + roomId * 8)
    }

    function decodeMessage(data: ArrayBuffer): {
        playerId: number, type: number, x: number, y: number, velocity: number
    } {
        let playerId = 0
        let type = 0
        let x = 0
        let y = 0
        let value = 0
        const buffer = new Uint32Array(data)

        if (buffer.length === 1) {
            const view = new DataView(data);
            value = view.getUint32(0, true)
            console.log("Parsed uint32:", value)
        } else {
            console.warn("Unexpected byte length", buffer.length)
        }
      
        if (value >= 16777216) {
            playerId = Math.floor(value / 16777216)
            value -= playerId * 16777216
        }
        if (value >= 8388608) {
            type = 1
            value -= 8388608
        }
        if (value >= 16384) {
            x = Math.floor(value / 16384)
            value -= x * 16384
        }
        if (value >= 32) {
            y = Math.floor(value / 32)
            value -= y * 32
        }
        const velocity = value

        return {playerId, type, x, y, velocity}
    }


    setSocket(ws)
    return ws
  }



  return (
    <BrowserRouter>
      <Routes>
        <Route index element={<Menu initWebSocket={initWebSocket} />} />
        <Route path='race' element={<Game socket={socket} playerId={playerId} />} />
      </Routes>

    </BrowserRouter>
  )
}

export default App
