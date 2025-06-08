import './App.css'
import { Routes, Route, BrowserRouter } from "react-router-dom"
import Menu from "./pages/Menu"
import Game, { type CarState } from './pages/Game'
import { useRef, useState } from 'react'

function App() {
  const [socket, setSocket] = useState<WebSocket | null>(null)
  const [playerId, setPlayerId] = useState(-1)
  //const [cars, setCars] = useState<CarState[]>([]);
  const cars = useRef<CarState[]>([])

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
                } else {
                    let found = false
                    cars.current.forEach((car) => {
                        
                        if (car.id === message.playerId) {
                            found = true
                            car.angle = message.angle
                            car.x = message.x
                            car.y = message.y
                            car.velocity = message.velocity
                            //console.log("Modify Car")
                            //console.log(car)
                        }
                    })
                    if (!found) {
                        cars.current.push({
                            id: message.playerId,
                            angle: message.angle,
                            x: message.x,
                            y: message.y,
                            velocity: message.velocity,
                        })
                        console.log("Add Car")
                    }
                }
                //console.log("od servera binary")
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
        playerId: number, angle: number, type: number, x: number, y: number, velocity: number
    } {
        let playerId = 0
        let angle = 0
        let type = 0
        let x = 0
        let y = 0
        let value = 0
        const buffer = new Uint8Array(data)

        if (buffer.length === 5) {
            const view = new DataView(data)
            playerId = view.getUint8(4)
            value = view.getUint32(0, true)
        } else {
            console.warn("Unexpected byte length", buffer.length)
        }
        if (value >= 16777216) {
            angle = Math.floor(value / 16777216)
            value -= angle * 16777216
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
        console.log("playerId:", playerId)
        console.log("angle:", angle)
        console.log("type:", type)
        console.log("x:", x)
        console.log("y:", y)
        console.log("velocity:", velocity)

        return {playerId, angle, type, x, y, velocity}
    }


    setSocket(ws)
    return ws
  }



  return (
    <BrowserRouter>
      <Routes>
        <Route index element={<Menu initWebSocket={initWebSocket} />} />
        <Route path='race' element={<Game socket={socket} playerId={playerId} cars={cars} />} />
      </Routes>

    </BrowserRouter>
  )
}

export default App
