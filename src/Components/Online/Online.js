import React from 'react';
import './Online.css';

const Online = ({users,makeCall,userName}) => {    
    
    
    return(
    <div className="onlineContainer">
    {
      users
        ? (
          <div>
            <h4>People currently online:</h4>
            <div className="activeContainer">              
                {users.filter(val => val.name !== userName.toLowerCase()).map(val => (
                  <div key={val.id} className="activeItem">
                    <button className="callButton" onClick={()=>makeCall(val.id)}>Call {val.name}</button>
                  </div>
                ))
                }
            </div>
          </div>
        )
        : null
    }
  </div>
  )
}

export default Online;