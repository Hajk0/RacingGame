import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

function Menu(props: any) {

  const [roomIdString, setRoomIdString] = useState('')
  const roomId = Number(roomIdString)

  const navigate = useNavigate()

  function startGame(roomId: Number) {
    props.initWebSocket(roomId)
    navigate('/race')
  }
  

  return (
    <>
      <h1>Siemano</h1>
      <div className="card">
        <input 
          type='number' 
          name='roomId' 
          value={roomIdString} 
          onChange={e => setRoomIdString(e.target.value)} 
        />
        <button onClick={() => startGame(roomId)}>
            Start Game
        </button>
      </div>
    </>
  )
}

export default Menu
