const express = require("express");
const app = express();
const server = require("http").Server(app);
const { v4: uuidv4 } = require("uuid");
const io = require("socket.io")(server);

// Peer
const { ExpressPeerServer } = require("peer");
const peerServer = ExpressPeerServer(server, {
  debug: true,
});

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use("/peerjs", peerServer);

app.get("/", (req, res) => {
  res.redirect(`/${uuidv4()}`);
});

app.get("/:room", (req, res) => {
  res.render("room", { roomId: req.params.room });
});

io.on("connection", (socket) => {
  let roomId = null;

  socket.on("join-room", (roomId, userId) => {
    socket.join(roomId);
    roomId = roomId;
    io.to(roomId).emit("user-connected", userId);

    // Send the updated list of participants
    io.to(roomId).emit("participants", getParticipants(roomId));

    socket.on("message", (message) => {
      io.to(roomId).emit("createMessage", message);
    });

    socket.on("request-participants", () => {
      io.to(roomId).emit("participants", getParticipants(roomId));
    });

    socket.on("disconnect", () => {
      io.to(roomId).emit("user-disconnected", userId);
      io.to(roomId).emit("participants", getParticipants(roomId));
    });
  });

  const getParticipants = (roomId) => {
    const clients = io.sockets.adapter.rooms.get(roomId);
    return Array.from(clients || []).map(id => io.sockets.sockets.get(id).id);
  };
});

server.listen(process.env.PORT || 3030, () => {
  console.log('Server is running on port', process.env.PORT || 3030);
});

const peer = new Peer(undefined, {
  path: '/peerjs',
  host: '/',
  port: '3030',
  config: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      // Add TURN server configuration if needed
    ]
  }
});
