    //track state of number of players
let readyPlayerNumber = 0;

function listening(io) {
    //create namespace variable name
    const pongNamespace = io.of('/pong');

    //event emitter narrowed down to only pong namespace
    pongNamespace.on('connection', (socket)=> {
        let room;
        console.log(`the user ${socket.id} has connected`);
        socket.on('ready', ()=>{
            //set up rooms for users to join for each game
            let room = 'room' + Math.floor(readyPlayerNumber/2);  /*have enough rooms for all the players, and assign groups of 2 players to the room numbered based on when they arrive */
            socket.join(room);

            console.log(`Player ${socket.id} ready in room: ${room}`);

            //add another player when they connect
            readyPlayerNumber++;

            if (readyPlayerNumber % 2 === 0) {
                //broadcast start game to all users in the room and name second player who joins game as referee
                pongNamespace.in(room).emit('startGame', socket.id)

            }
        })
        socket.on('paddleMove', (paddleData) => {
            //send data server to be broadcast to everyone in the room but the sender
            socket.to(room).emit('paddleMove', paddleData)
        })

        socket.on('ballMove', (ballData) => {
            //send data server to be broadcast to everyone in the room but the sender
            socket.to(room).emit('ballMove', ballData)
        })

        socket.on('disconnect', (reason) => {
            console.log(`User ${socket.id} disconnected because of: ${reason}`);
            //when player disconnects, they leave the room by default in socket.io, but do it explicitly here anyway to be sure.
            socket.leave(room)
        })
    });
}
module.exports = 
{
    listening,
}