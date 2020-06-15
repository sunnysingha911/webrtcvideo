import React,{useState} from 'react';
import {Link} from 'react-router-dom';
import './Join.css'

const Join = () => {
    const [userName, setUserName] = useState('');
    const [room, setRoom] = useState('');

    return(
        <div className="joinOuter">
            <h1>Join the Chat</h1>
            <div className="joinInner">
                <div className="userName">
                    <p className="text">User Name</p>
                    <input className="textbox" placeholder="Name" type="text" onChange={(event) => setUserName(event.target.value)} />
                </div>
                <div className="room">
                    <p className="text">Chat Room Name</p>
                    <input className="textbox" placeholder="Room" type="text" onChange={(event) => setRoom(event.target.value)} />
                </div>
                <div className="joinButton">
                    <Link onClick={e => (!userName || !room) ? e.preventDefault() : null} to={`/chat?userName=${userName}&room=${room}`}>
                        <button className="buttonStart" type="submit">Start</button>
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default Join;