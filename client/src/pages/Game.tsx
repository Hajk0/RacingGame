import { useEffect, useRef, useState, type RefObject } from 'react'

export interface CarState {
  id: number;
  angle: number;
  x: number;
  y: number;
  velocity: number;
}

function Game(
    { socket, playerId, cars }: 
    { socket: WebSocket | null, playerId: number, cars: RefObject<CarState[]> },
) {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        const carImg = new Image();
        carImg.src = '/src/assets/car_red_down.png'
        const canvas = canvasRef.current
        if (!canvas) {
            console.log("Error getting canvas")
            return
        }

        // Event listeners
        canvas.addEventListener('click', (e) => {
            handleMove(playerId, 0, 0)
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            console.log(`Mouse clicked at: ${x}, ${y}`);
        });
        //

        const ctx = canvas.getContext('2d')
        if (!ctx) {
            console.log("Error getting context")
            return
        }

        const draw = () => {
            ctx.fillStyle = 'white'
            ctx.clearRect(0, 0, canvas.width, canvas.height)

            let i = 0
            cars.current.forEach((car) => {
                ctx.save()
                ctx.translate(car.x, car.y)
                ctx.rotate((car.angle * Math.PI) / 128) // z 256 na radiany

                ctx.drawImage(carImg, -10, -20, 20, 40)

                ctx.restore();
                console.log("iteration foreach HERE!!!", i++)
            })

            requestAnimationFrame(draw)
        }

        draw()
    }, [])

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
    
      /*<h1>Game Page</h1>
      <button onClick={() => handleMove(playerId, 0, 0)}>W</button>
      <button onClick={() => handleMove(playerId, 0, 1)}>WD</button>
      <button onClick={() => handleMove(playerId, 0, 2)}>D</button>*/

  return (
    <>
      <canvas ref={canvasRef} width={800} height={600} />
    </>
  )
}

export default Game