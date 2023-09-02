const express = require('express');
const app = express();
const http = require('http');
const {Server} = require('socket.io');
const ACTIONS = require('./Actions');

const server = http.createServer(app);

const io = new Server(server);

const userSocketMap = {}
const getAllConnectedClients = (roomId) =>{
   return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map((socketId) =>{
        return{
            socketId,
            username: userSocketMap[socketId],
        }
   });
}

io.on('connection', (socket) =>{
    // console.log('Socket connected', socket.id);
    socket.on(ACTIONS.JOIN, ({roomId, username}) =>{
        userSocketMap[socket.id] = username;
        socket.join(roomId);
        const clients = getAllConnectedClients(roomId)
        // notify that new user join
        clients.forEach(({socketId}) =>{ 
            io.to(socketId).emit(ACTIONS.JOINED, {
                clients,
                username,
                socketId: socket.id,
            })
        })
    });

    // leave room
    socket.on('disconnecting', () =>{
        const rooms = [...socket.rooms];
        // leave all the room
        rooms.forEach((roomId) =>{
            socket.in(roomId).emit(ACTIONS.DISCONNECTED, {
                socketId: socket.id,
                username: userSocketMap[socket.id],
            });
        })
        
        delete userSocketMap[socket.id];
        socket.leave();

    })
})




const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server is runnint on port ${PORT}`));