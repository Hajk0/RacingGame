import './App.css'
import { Routes, Route, BrowserRouter } from "react-router-dom"
import Menu from "./pages/Menu"
import Game from './pages/Game'
import { useState } from 'react'

function App() {
  const [socket, setSocket] = useState<WebSocket | null>(null)

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
        const view = new DataView(e.data)
        console.log(view.getUint8)
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

    function createMoveMessage(roomId: number, move: number) {

    }

    return ws
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route index element={<Menu initWebSocket={initWebSocket} />} />
        <Route path='race' element={<Game socket={socket}/>} />
      </Routes>

    </BrowserRouter>
  )
}

export default App
