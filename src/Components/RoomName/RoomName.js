import React from 'react';
import './RoomName.css';

const RoomName = ({roomName}) => {
    return(
        <div className="roomName">
            <div className="rname">
                {roomName}
            </div>  
            <div className="close">
                <a href="/">Leave Room</a>
            </div>
        </div>
    )
}

export default RoomName;