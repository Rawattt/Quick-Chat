const path = require("path");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const Filter = require("bad-words");
const {
  generateMessage,
  genereteLocationMessage
} = require("./utils/messages");
const {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom
} = require("../public/js/user");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const publicDirectoryPath = path.join(__dirname, "../public");
const port = process.env.PORT || 3000;

app.use(express.static(publicDirectoryPath));

const locationURL = "https://google.com/maps?q=";

io.on("connection", (socket) => {
  socket.on("join", ({ username, room }, callback) => {
    const { error, user } = addUser({ id: socket.id, username, room });

    if (error) {
      return callback(error);
    }
    socket.join(user.room);

    socket.emit("message", generateMessage("Admin", "Welcome!"));
    socket.broadcast
      .to(user.room)
      .emit("message", generateMessage("Admin", `${user.username} has joined`));

    io.to(user.room).emit("roomData", {
      room: user.room,
      users: getUsersInRoom(user.room)
    });
    callback();
  });

  socket.on("sendMessage", (message, callback) => {
    const user = getUser(socket.id);
    const filter = new Filter();
    if (filter.isProfane(message)) {
      return callback("Bad language, try again");
    }
    io.to(user.room).emit("message", generateMessage(user.username, message));
    callback("Delivered");
  });

  socket.on("disconnect", () => {
    const user = removeUser(socket.id);
    if (user) {
      io.to(user.room).emit(
        "message",
        generateMessage("Admin", `${user.username} has left!`)
      );
      io.to(user.room).emit("roomData", {
        room: user.room,
        users: getUsersInRoom(user.room)
      });
    }
  });

  socket.on("shareLocation", (data, callback) => {
    const user = getUser(socket.id);
    io.to(user.room).emit(
      "locationMessage",
      genereteLocationMessage(
        user.username,
        `${locationURL}${data.lat},${data.long}`
      )
    );
    callback();
  });
});

server.listen(port, () => console.log(`Server is running on port ${port}`));
