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
                ctx.translate(-car.x, -car.y)

                ctx.drawImage(carImg, -10, -20, 20, 40)

                ctx.restore();
                //console.log("iteration foreach HERE!!!", i++)
            })

            requestAnimationFrame(draw)
        }

        draw()
    }, [])

    useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        pressedKeysRef.current.add(e.key.toLowerCase());
    };

    const handleKeyUp = (e: KeyboardEvent) => {
        pressedKeysRef.current.delete(e.key.toLowerCase());
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    const interval = setInterval(() => {
        const keys = pressedKeysRef.current;

        if (keys.has('w')) handleMove(playerId, 0, 0);
        if (keys.has('d')) handleMove(playerId, 0, 2);
        if (keys.has('a')) handleMove(playerId, 0, 6);
        if (keys.has('s')) handleMove(playerId, 0, 4);
    }, 200);

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