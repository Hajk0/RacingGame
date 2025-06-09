import { useEffect, useRef, useState, type RefObject } from 'react'
import { useNavigate } from 'react-router-dom';

export interface CarState {
  id: number;
  angle: number;
  x: number;
  y: number;
  velocity: number;
}

function Game(
    { socket, playerId, cars, initWebSocket }: 
    { socket: WebSocket | null, playerId: RefObject<number>, cars: RefObject<CarState[]>, initWebSocket: Function },
) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const pressedKeysRef = useRef<Set<string>>(new Set())

    useEffect(() => { // reconnecting
        if (socket == null) {
            //debugger
            const playerIdString = sessionStorage.getItem("playerId")
            const roomIdString = sessionStorage.getItem("roomId")
            if (roomIdString && playerIdString) {
                const playerIdInt = parseInt(playerIdString)
                //playerId.current = playerIdInt
                const roomId = parseInt(roomIdString)
                socket = initWebSocket(roomId, playerIdInt, 1)
            }
        }
    }, [])

    useEffect(() => {
        const carImg = new Image()
        carImg.src = '/src/assets/car_red_down.png'
        const canvas = canvasRef.current
        if (!canvas) {
            console.log("Error getting canvas")
            return
        }


        const ctx = canvas.getContext('2d')
        if (!ctx) {
            console.log("Error getting context")
            return
        }

        const draw = () => {
            ctx.fillStyle = 'white'
            ctx.clearRect(0, 0, canvas.width, canvas.height)

            //let i = 0
            cars.current.forEach((car) => {
                if (car.id === playerId.current) {
                    sessionStorage.setItem('carX', car.x.toString())
                    sessionStorage.setItem('carY', car.y.toString())
                    sessionStorage.setItem('angle', car.angle.toString())
                }

                ctx.save()
                ctx.translate(car.x, car.y)
                ctx.rotate((car.angle * Math.PI) / 128) // z 256 na radiany

                ctx.drawImage(carImg, -10, -20, 20, 40)

                ctx.restore();
                //console.log("iteration foreach HERE!!!", i++)
            })

            setTimeout(() => {
                requestAnimationFrame(draw)
            }, 100)
        }

        draw()
    }, [])

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (pressedKeysRef.current.size < 2) {
                pressedKeysRef.current.add(e.key.toLowerCase());
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            pressedKeysRef.current.delete(e.key.toLowerCase());
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        const interval = setInterval(() => {
            const keys = pressedKeysRef.current;
            if (keys.has('w') && keys.has('d')) handleMove(playerId.current, 0, 1)
            else if (keys.has('d') && keys.has('s')) handleMove(playerId.current, 0, 3)
            else if (keys.has('s') && keys.has('a')) handleMove(playerId.current, 0, 5)
            else if (keys.has('a') && keys.has('w')) handleMove(playerId.current, 0, 7)
            else if (keys.has('w')) handleMove(playerId.current, 0, 0);
            else if (keys.has('d')) handleMove(playerId.current, 0, 2);
            else if (keys.has('a')) handleMove(playerId.current, 0, 6);
            else if (keys.has('s')) handleMove(playerId.current, 0, 4);
        }, 50);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            clearInterval(interval);
        };
    }, [playerId, socket]);


    function createMoveMessage(playerId: number, roomId: number, moveCode: number) {
        return (playerId * 256 + roomId * 8 + moveCode)
    }

    function handleMove(playerId: number, roomId: number, moveCode: number) {
        const binary = createMoveMessage(playerId, roomId, moveCode)

        const buffer = new Uint16Array([binary])
        if (socket != null) {
            socket.send(buffer);
        } else {
            console.log("socket nie działa")
        }
    }

    const navigate = useNavigate()

    function handleExit() {
        if (socket != null) {
            socket.close()
            const playerIdString = sessionStorage.getItem("playerId")
            /*if (playerIdString) {
                const playerIdInt = parseInt(playerIdString)
                cars.current = cars.current.filter((car) => car.id !== playerIdInt)
            }*/
            cars.current = []
        }
        navigate("/")
    }

    function createPositionMessage(position: number, dimetion: number): number {
        let firstbit = 0
        if (position >= 256) {
            firstbit = Math.floor(position / 256)
            position -= firstbit * 256
        }
        const last8bits = position
        return (last8bits * 256 + 128 + firstbit * 8 + dimetion)
    }
    

  return (
    <>
      <button onClick={handleExit} className='exit-button'>Exit</button>
      <canvas ref={canvasRef} width={512} height={512} />
    </>
  )
}

export default Game