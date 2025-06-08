import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

function Menu(props: any) {

  const [roomIdString, setRoomIdString] = useState('')
  const roomId = parseInt(roomIdString)
  const [errorMessage, setErrorMessage] = useState('')

  const navigate = useNavigate()

  function startGame(roomId: number) {
    if (roomId < 0 || roomId > 15) {
      setErrorMessage('Room ID must be between 0 and 15.')
      return
    }

    setErrorMessage('')
    props.initWebSocket(roomId, 0, 0)
    navigate('/race')
  }
  

  return (
    <>
      <h1>Very Realistic Racing Game</h1>
      <div className="card">
        <input 
          type='number' 
          name='roomId' 
          value={roomIdString} 
          onChange={e => setRoomIdString(e.target.value)} 
          min={0}
          max={15}
          className='input-field'
        />
        {errorMessage && <p>{errorMessage}</p>}
        <button onClick={() => startGame(roomId)}>
            Start Game
        </button>
      </div>
    </>
  )
}

export default Menu
