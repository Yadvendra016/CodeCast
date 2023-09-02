import React, { useEffect, useRef, useState } from "react";
import Client from "./Client";
import Editor from './Editor';
import { initSocket } from "../Socket";
import { ACTIONS } from "../Actions";
import { useNavigate, useLocation, Navigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";

function EditorPage() {

  const [clients, setClients] = useState([]);

  const Location = useLocation();
  const navigate = useNavigate();
  const {roomId} = useParams();

  
  const socketRef = useRef(null); 
  useEffect(() =>{
    const init = async () =>{
      socketRef.current = await initSocket();
      socketRef.current.on('connect_error', (err) => handleErrors(err));
      socketRef.current.on('connect_failed', (err) => handleErrors(err));

      const handleErrors = (err) =>{
        console.log("Error", err );
        toast.error('Socket connectiono failed, Try again later');
        navigate('/')
      }

      socketRef.current.emit(ACTIONS.JOIN, {
        roomId,
        username: Location.state?.username,
      });
      // Listen for new clients joining the chatroom
      socketRef.current.on(ACTIONS.JOINED, ({ clients, username, socketId }) => {
           // this insure that new user connected message do not display to that user itself
          if(username !== Location.state?.username){
              toast.success(`${username} joined the room.`);

          }
          setClients(clients)
      });
      // listening for disconnected
      socketRef.current.on(ACTIONS.DISCONNECTED, ({socketId, username}) =>{
        toast.success(`${username} left the room`);
        setClients((prev) => {
          return prev.filter(client => client.socketId !== socketId)
        })
      })
    }
    init();
    
    // cleanup
    return () =>{
           socketRef.current &&  socketRef.current.disconnect();
           socketRef.current.off(ACTIONS.JOINED);
           socketRef.current.off(ACTIONS.DISCONNECTED);
    }
  },[])

  if(!Location.state){
    return <Navigate to="/" />
  }

  return (
    <div className="container-fluid vh-100">
      <div className="row h-100">
        {/* client panel */}
        <div
          className="col-md-2 bg-dark text-light d-flex flex-column h-100"
          style={{ boxShadow: "2px 0px 4px rgba(0, 0, 0, 0.1)" }}
        >
          <img
            src="/images/codecast.png"
            alt="Logo"
            className="img-fluid mx-auto"
            style={{ maxWidth: "150px", marginTop: "-43px" }}
          />
          <hr style={{ marginTop: "-3rem" }} />
          
          {/* Client list container */}
          <div className="d-flex flex-column flex-grow-1 overflow-auto">
            <span className="mb-2" >Members</span>
            {clients.map((client) => (
              <Client key={client.socketId} username={client.username} />
            ))}
          </div>
          
          <hr />
          {/* Buttons */}
          <div className="mt-auto ">
            <button className="btn btn-success">Copy Room ID</button>
            <button className="btn btn-danger mt-2 mb-2 px-3 btn-block">Leave Room</button>
          </div>
        </div>
        
        {/* Editor panel */}
        <div className="col-md-10 text-light d-flex flex-column h-100 ">
          <Editor />
        </div>
      </div>
    </div>
  );
}

export default EditorPage;
