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
    const pressedKeysRef = useRef<Set<string>>(new Set())

    useEffect(() => {
        const carImg = new Image()
        carImg.src = '/src/assets/car_red_down.png'
        const canvas = canvasRef.current
        if (!canvas) {
            console.log("Error getting canvas")
            return
        }

        // Event listeners
        canvas.addEventListener('click', (e) => {
            handleMove(playerId, 0, 0)
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

            //let i = 0
            cars.current.forEach((car) => {
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
            if (keys.has('w') && keys.has('d')) handleMove(playerId, 0, 1)
            else if (keys.has('d') && keys.has('s')) handleMove(playerId, 0, 3)
            else if (keys.has('s') && keys.has('a')) handleMove(playerId, 0, 5)
            else if (keys.has('a') && keys.has('w')) handleMove(playerId, 0, 7)
            else if (keys.has('w')) handleMove(playerId, 0, 0);
            else if (keys.has('d')) handleMove(playerId, 0, 2);
            else if (keys.has('a')) handleMove(playerId, 0, 6);
            else if (keys.has('s')) handleMove(playerId, 0, 4);
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

        const buffer = new Uint8Array([binary])
        if (socket != null) {
            socket.send(buffer);
        } else {
            console.log("socket nie działa")
        }
    }
    

  return (
    <>
      <button onClick={() => console.log("Exit to implement")}>Exit</button>
      <canvas ref={canvasRef} width={512} height={512} />
    </>
  )
}

export default Game