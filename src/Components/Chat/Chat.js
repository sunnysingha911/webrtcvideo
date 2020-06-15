import React,{useState, useEffect, useRef} from 'react';
import queryString from 'query-string';
import io from "socket.io-client";
import Peer from 'simple-peer';
import RoomName from '../RoomName/RoomName';
import Input from '../Input/Input';
import Messages from '../Messages/Messages';
import Online from '../Online/Online';
import './Chat.css'
import disconnectCallIcon from '../../Assets/Icons/disconnectCall.png';
import endCallIcon from '../../Assets/Icons/endcall.png';
import acceptCallIcon from '../../Assets/Icons/acceptcall.png';

let socket;

const Chat = ({location}) => {
    const [userID, setUserID] = useState("");
    const [userName, setUserName] = useState('');
    const [room, setRoom] = useState('');
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [users, setUsers] = useState('');    
    const [caller, setCaller] = useState("");
    const [callerName, setCallerName] = useState("");
    const [callerSignal, setCallerSignal] = useState();

    const [callAccept, setCallAccept] = useState(false);
    const [receivingCall, setReceivingCall] = useState(false);
    const [outgoingCall, setOutgoingCall] = useState(false);
    const [callStatus, setCallStatus] = useState();

    const ENDPOINT = 'https://react-webrtc-application.herokuapp.com/';
    // const ENDPOINT = 'localhost:4000';
    let userVideo = useRef();
    let partnerVideo = useRef();
    let videoStream;

    useEffect(()=>{
        const { userName, room } = queryString.parse(location.search);
        socket = io(ENDPOINT);

        setUserName(userName)
        setRoom(room);

        socket.emit('joinChat',{userName,room},error => {
            if(error)
                alert(error);
        })

        socket.on('userID', (id) => {
            setUserID(id);
          },error => console.log("User Id: " + error));

    },[ENDPOINT, location.search]);

    useEffect(()=>{
        socket.on('message', message => {
            setMessages(messages => [ ...messages, message ]);
          });

        socket.on('roomData', ({ users}) => {
            setUsers(users);
        });

        socket.on('initCall', (data) => {
            setReceivingCall(true);
            setCaller(data.callFrom);
            setCallerName(data.callerName);
            setCallerSignal(data.signalData);
        });

        socket.on('cut',(data)=>{
            setOutgoingCall(false);
            setReceivingCall(false);
            setCallAccept(false);
            setCallStatus(data.status);
            try{
                const tracks = userVideo.current.srcObject.getTracks();
                tracks.forEach(track => track.stop());
                userVideo.current.srcObject = null;
                partnerVideo.current.srcObject = null;
            }catch(error){
                console.log("Call Disconnected before receiving");
            }
        })
    },[]);

    const sendMessage = (e) => {
        e.preventDefault();
        if(message) {
            socket.emit('sendMessage', message, () => setMessage(''));
        }
    }

    const makeCall = async(callID) => {
        // socket.emit('getReceiverStatus',{userToCall: callID});
        
        setOutgoingCall(true);
        await navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(async stream => {
            videoStream = stream;
            if (userVideo.current) {
                userVideo.current.srcObject = stream;
            }
        });
            
        const peer = new Peer({
            initiator: true,
            trickle: false,
            stream: videoStream
        });
            
        peer.on("signal", data => {
            setCaller(callID);
            socket.emit('callingUser', { callTo: callID, callFrom: userID, callerName: userName ,signalData: data})
        });
            
        peer.on("stream", stream => {
            if (partnerVideo.current) {
                partnerVideo.current.srcObject = stream;
            }
        });
          
        socket.on('callAccepted', signal => {            
            setCallAccept(true);
            peer.signal(signal);
        })
    }

    const acceptCall = async() => {
        await navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
            setReceivingCall(false);
            videoStream = stream;
            if (userVideo.current) {
                userVideo.current.srcObject = stream;
            }            
        });

        const peer = new Peer({
            initiator: false,
            trickle: false,
            stream: videoStream,
        });
      
        peer.on("signal", data => {            
            setOutgoingCall(false);
            setCallAccept(true);
            socket.emit('acceptCall', { signal: data, to: caller })
        })
          
        peer.on('stream', stream => {
            partnerVideo.current.srcObject = stream;
        });

        peer.signal(callerSignal);
    }
    
    const disconnectCall = () => {
        socket.emit('disconnectCall', { source: userID , destination: caller, status: 'Call Disconnected'})
    }

    const rejectCall = () => {
        socket.emit('disconnectCall', { source: userID , destination: caller, status: 'Call Rejected'})
    }

    let incomingCall;
    if (receivingCall) {
        /* setTimeout(async()=>{
            if(!callAccept){
                console.log('I'+callAccept)
                socket.emit('disconnectCall', { source: userID , destination: caller, status: 'Call Missed'})
                setCallAccept(false)   
            }
        }, 10000); */
        
        incomingCall = (
            <div  className={!callAccept?"callAccept":"incommingCall"}>
                <h1>Incomming Call from {callerName}</h1>
                <div className="callButtons">
                    <button className="buttonCall buttonVibrate" onClick={() => acceptCall()}>
                        <img className="callImage" src={acceptCallIcon} alt="Disconnect Call"/>
                    </button>
                    <button className="buttonCall buttonVibrate" onClick={() => rejectCall()}>
                        <img className="callImage" src={endCallIcon} alt="Disconnect Call"/>
                    </button>
                </div>
            </div>
        )
    }

    if(callStatus){
        setTimeout(()=>setCallStatus(null), 7000);
    }
  
    return(
        <div className="chatContainer">
            <RoomName roomName={room}/>
            <div className={callStatus?"callReject":"incommingCall"}>
                {callStatus}
            </div>
            <div className={callAccept || outgoingCall?"callWindow":"incommingCall"}>
                <div className="video">
                    <div className="user">
                        <h3>You</h3>
                        <video className="videoSizeUser" playsInline muted ref={userVideo} autoPlay />
                    </div>
                    <div className="partner">
                        <h3>Receiver</h3>
                        <video className="videoSizePartner" playsInline ref={partnerVideo} autoPlay/>
                    </div>
                </div>
                <div className="callOptions">
                    <button className="buttonCall" onClick={()=>disconnectCall()}>
                        <img className="callImage" src={disconnectCallIcon} alt="Disconnect Call"/>
                    </button>
                </div>
            </div>
            {incomingCall}
            <div className="dataContainer">
                <div className="message-parent">
                    <div className="messages">
                        <Messages messages={messages} name={userName}/>
                    </div>
                    <div className="textbox">
                        <Input message={message} setMessage={setMessage} sendMessage={sendMessage}/>
                    </div>
                </div>
                <div className="onlinepeople">
                    <Online users={users} userName={userName} makeCall={makeCall}/>
                </div>
            </div>
        </div>
    )
}

export default Chat;