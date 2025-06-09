import './App.css'
import { Routes, Route, BrowserRouter } from "react-router-dom"
import Menu from "./pages/Menu"
import Game, { type CarState } from './pages/Game'
import { useEffect, useRef, useState } from 'react'

function App() {
  //const [socket, setSocket] = useState<WebSocket | null>(null)
  const socket = useRef<WebSocket | null>(null)
  //const [playerId, setPlayerId] = useState(-1)
  const playerIdRef = useRef(-1)
  //const [cars, setCars] = useState<CarState[]>([]);
  const cars = useRef<CarState[]>([])

  function initWebSocket(roomId: number, playerId: number, reconnect: number): WebSocket {
    if (socket.current && socket.current.readyState !== WebSocket.CLOSED) {
        console.log("SOCKET ISTNIEJE")
        return socket.current
    }

    const ws = new WebSocket('ws://localhost:8000')
    ws.binaryType = 'arraybuffer'

    ws.onopen = function(e) { onOpen(roomId, playerId, reconnect, e) };
    ws.onclose = function(e) { onClose(e) };
    ws.onmessage = function(e) { onMessage(e) };
    ws.onerror = function(e) { onError(e) };

    function onOpen(roomId: number, playerId: number, reconnect: number, e: Event) {
        console.log(e.type);
        //debugger
        const binary = createJoinMessage(playerId, roomId, reconnect)
        console.log("reconnect number:", reconnect)
        const buffer = new Uint16Array([binary])
        ws.send(buffer);
        if (reconnect) {
            const playerIdString = sessionStorage.getItem("playerId")
            const roomIdString = sessionStorage.getItem("roomId")
            const carXString = sessionStorage.getItem('carX')
            const carYString = sessionStorage.getItem('carY')
            const angleString = sessionStorage.getItem('angle')
            if (roomIdString && playerIdString) {
                console.log("hello")
                //const playerIdInt = parseInt(playerIdString)
                //playerIdRef.current = playerIdInt
                
                if (carXString && carYString && angleString && socket) {
                    console.log("hello 2")
                    const carXInt = parseInt(carXString)
                    const carYInt = parseInt(carYString)
                    const angleInt = parseInt(angleString)
                    console.log(carXInt, carYInt, angleInt)

                    if (carXInt >= 0 && carXInt <= 511) { // gdyby ktoś zmienił sessionStorage
                        const binaryX = createPositionMessage(carXInt, 2)
                        const bufferX = new Uint16Array([binaryX])
                        ws.send(bufferX);
                    }
                    if (carYInt >= 0 && carYInt <= 511) { // gdyby ktoś zmienił sessionStorage
                        const binaryY = createPositionMessage(carYInt, 3)
                        const bufferY = new Uint16Array([binaryY])
                        ws.send(bufferY);
                    }
                    if (angleInt >= 0 && angleInt <= 255) { // gdyby ktoś zmienił sessionStorage
                        const binaryAngle = createPositionMessage(angleInt, 4)
                        const bufferAngle = new Uint16Array([binaryAngle])
                        ws.send(bufferAngle);
                    }
                }
            }
        }
    }
    
    function onMessage(e: MessageEvent<any>) {
        if (e.data instanceof ArrayBuffer) {
                const message = decodeMessage(e.data)
                if (message.type === 1) {
                    if (message.velocity === 31) {
                        cars.current = cars.current.filter((car) => car.id !== message.playerId)
                        return;
                    }
                    //setPlayerId(message.playerId)
                    playerIdRef.current = message.playerId
                    playerId = message.playerId
                    sessionStorage.setItem('playerId', message.playerId.toString())
                    sessionStorage.setItem('roomId', message.angle.toString())
                    console.log("SETTING UP SESSIONSTORAGE")
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

    function createJoinMessage(playerId: number, roomId: number, reconnect: number): number {
        return (playerId * 256 + 128 + roomId * 8 + reconnect)
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
        /*console.log("playerId:", playerId)
        console.log("angle:", angle)
        console.log("type:", type)
        console.log("x:", x)
        console.log("y:", y)
        console.log("velocity:", velocity)*/

        return {playerId, angle, type, x, y, velocity}
    }


    //setSocket(ws)
    socket.current = ws
    return ws
  }

    function createPositionMessage(position: number, dimetion: number): number {
        let firstbit = 0
        if (position >= 256) {
            firstbit = 1
            position -= 256
        }
        const last8bits = position
        console.log("last8bits", last8bits)
        return (last8bits * 256 + 128 + firstbit * 8 + dimetion)
    }


  return (
    <BrowserRouter>
      <Routes>
        <Route index element={<Menu initWebSocket={initWebSocket} />} />
        <Route path='race' element={<Game socket={socket.current} playerId={playerIdRef} cars={cars} initWebSocket={initWebSocket} />} />
      </Routes>

    </BrowserRouter>
  )
}

export default App
