const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
//const pgSqlDB = require("./public/js/db_class");

const { userJoin, getCurrentUser, userLeave, getRoomUsers, getUserRoom } = require("./public/js/socket_users");

const bodyParser = require("body-parser");
const path = require("path");
const dotenv = require("dotenv");
dotenv.config();

const app = express();
app.use(cors());
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const httpServer = createServer(app);

/* client request  operation*/

// app.get("/", (req, res) => {
//   // res.set('Access-Control-Allow-Origin', '*');
//   res.send(new Date().toString() + " node server running on port 3000");
// });

// app.use("/user", require("./routers/users/User.js"));
// app.use("/data", require("./routers/data/Data.js"));

/* socket operation */

// io is an instance of server. Server is a socket.io class
const io = new Server(httpServer, {
  /* options */
  cors: {
    origins: ["*"],
    credentials: true,
    handlePreflightRequest: (req, res) => {
      res.writeHead(200, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,POST",
        "Access-Control-Allow-Headers": "my-custom-header",
        "Access-Control-Allow-Credentials": true,
      });
      res.end();
    },
    // methods:["GET","POST"]
  },
});

io.on("connection", async function (socket) {
  // the io variable represents the group of sockets.
  console.log("A user with ID: " + socket.id + " connected");

  let socketById = io.sockets.sockets.get(socket.id);
  socketById.emit("socket-id", socket.id); //send socket-id to sender...

  socket.on("disconnect", async function () {
    // disconnect : reserved word
    console.log("A user with ID: " + socket.id + " disconnected");

    let userRoom = getUserRoom(socket.id);
    const connectedUsers = userLeave(socket.id);
    socket.leave(userRoom);    
    const clientsRoom = io.sockets.adapter.rooms.get(userRoom);

    console.log(userRoom + " room clients list :", clientsRoom);
    console.log("socket Users clients list :", connectedUsers);
  });

  socket.on("client_disconnect", (data) => {
    console.log("client_disconnect: ", data.socket_id);

    let userRoom = getUserRoom(data.socket_id);
    socket.leave(userRoom);
    const connectedUsers = userLeave(socket.id);
    const clientsRoom = io.sockets.adapter.rooms.get(userRoom);

    console.log(userRoom + " room clients list :", clientsRoom);
    console.log("socket Users clients list :", connectedUsers);
  });

  socket.on("login-user", (data) => {
    console.log("socket login-user :", data);

    if (data.room !== "TOYS") data = JSON.parse(data);

    if (data.room === "TOYS") socket.join("TOYS");
    else if (data.room === "UNITS") socket.join("UNITS");
    else socket.join("UNITS"); // local sever prog  connected.
    // it is join UNITS channel for takes incoming sockets data.

    const connectedUsers = userJoin(data.company_id, data.user_id, data.socket_id, data.room);

    const clientsToys = io.sockets.adapter.rooms.get("TOYS");
    const clientsUnits = io.sockets.adapter.rooms.get("UNITS");

    console.log("Room Toys clients list :", clientsToys);
    console.log("Room Units clients list :", clientsUnits);
    console.log("connected socket clients list :", connectedUsers);
  });

  socket.on("unit-status", (data) => {
    console.log("unit-status: ", data);

    if (data.operation != "OYUNCAK-ODEME") socket.emit("unit-status", data);

    socket.to("UNITS").emit("unit-status", data);
  });

  socket.on("tag-data", (data) => {
    console.log("tag-data : ", data);

    //console.log(data);  //tag:65535,B6 A0 D8 1F D1,972.50,970.50,12.00
    let dataTag, dataObj, payType, timeBtn;
    if (typeof data !== "object") {
      dataObj = JSON.parse(data);
      console.log("dataObj : ", dataObj);
      data = dataObj;
      if (data.hasOwnProperty("data")) dataTag = data.data.split(":")[1];
      else console.log("tag-data :", "Error :  missing object dataTag");
    } else if (typeof data === "object") {
      dataTag = data.data.split(":")[1];
    }

    if (data.hasOwnProperty("pay_type")) payType = data.pay_type;
    //Differenet pay types for units.
    else payType = "KART-ODEME"; //  No different pay type for toys. Toys have one pay type.

    if (data.hasOwnProperty("time_button")) timeBtn = data.time_button;
    //Differenet pay types for units.
    else timeBtn = ""; //  No different pay type for toys. Toys have one pay type.

    const objData = {
      company_id: data.company_id,
      device_id: dataTag.split(",")[0].trim(),
      socket_id: data.socket_id,
      tag_id: dataTag.split(",")[1].trim(),
      tag_read: dataTag.split(",")[2],
      tag_write: dataTag.split(",")[3],
      total_token_tl: dataTag.split(",")[4], //toys or units total coin TL
      msg_id: data.msg_id,
      time_button: timeBtn,
      pay_type: payType,
      operation: data.operation,
    };
    console.log("tag-data:", objData);

    if (data.operation != "OYUNCAK-ODEME") {
      socket.emit("tag-data", JSON.stringify(objData)); // sends back to sender by the same events name.
      //io.sockets.sockets.get(objData.socket_id).emit("tag-data", JSON.stringify(objData));
      //  let socketById = io.sockets.sockets.get(objData.socket_id); //
      //  socketById.emit("tag-data", JSON.stringify(objData));
    }

    // socket.broadcast.emit("tag-data", JSON.stringify(objData)); //  Sends to everyone except the sender.
    // socket.broadcast.to("UNITS").emit("tag-data", JSON.stringify(objData); // Sends to everyone in the room except the sender.

    socket.to("UNITS").emit("tag-data", JSON.stringify(objData));
  });

  socket.on("tag-data-remote", (data) => {});

  socket.on("cash-credit-card", (data) => {
    console.log("cash-credit-card: ", data);

    if (data.operation != "OYUNCAK-ODEME") socket.emit("cash-credit-card", data); // sends back to sender by the same events name.

    socket.to("UNITS").emit("cash-credit-card", data);
  });

  socket.on("tag-cancel", (data) => {
    console.log("tag-cancel: ", data);

    if (data.operation != "OYUNCAK-ODEME") socket.emit("tag-cancel", data); // sends back to sender by the same events name.

    socket.to("UNITS").emit("tag-cancel", data);
  });

  socket.on("cancel", (data) => {
    console.log("cancel: ", data);

    if (data.operation != "OYUNCAK-ODEME") socket.emit("cancel", data); // sends back to sender by the same events name.

    socket.to("UNITS").emit("cancel", data);
  });

  socket.on("cash-outflow", (data) => {
    console.log("cash-outflow :", data);
    socket.to("UNITS").emit("cash-outflow", (data));
  });

  socket.on("create-temporary-card", (data) => {
    console.log("create-temporary-card :", data);
    socket.to("UNITS").emit("create-temporary-card", (data));
  });

  socket.on("create-temporary-card-return", (data) => {
    console.log("create-temporary-card-return :", data);
    socket.to("UNITS").emit("create-temporary-card-return", (data));
  }); 

  socket.on("cash-desk-transfer", (data) => {
    console.log("cash-desk-transfer:", data);
    socket.to("UNITS").emit("cash-desk-transfer", (data));
  });

  socket.on("personnel-tracking", (data) => {
    console.log("personnel tracking:", data);
    socket.to("UNITS").emit("personnel-tracking", (data));
  });

  socket.on("save-staff", (data) => {
    console.log("save-staff:", data);
    socket.to("UNITS").emit("save-staff", (data));
  });

  socket.on("user-add", (data) => {
    console.log("user-add:", data);
    socket.to("UNITS").emit("user-add", (data));
  });

  socket.on("product-sale", (data) =>{
    console.log("product-sale:", data);
    socket.to("UNITS").emit("product-sale", (data));
  });

  socket.on("product-add", (data) =>{
    console.log("product-add:", data);
    socket.to("UNITS").emit("product-add", (data));
  });

  socket.on("product-delete-update", (data) =>{
    console.log("product-delete-update:", data);
    socket.to("UNITS").emit("product-delete-update", (data));
  });

  socket.on("time_stamp", (data) => {
    // data:{ device_id: 62164, user_name: 'NODE-MCU', now: 30003 }
    //console.log("node-mcu event_name data:", data.device_id);
    //socket.broadcast.to("room1").emit("time_stamp", data); // Sends to everyone except the sender.

    console.log("time_stamp :", data);
    socket.to("UNITS").emit("time_stamp", JSON.stringify(data));
  });

  socket.on("led1-on", (data) => {
    // console.log("led1-on:", data);
    socket.broadcast.to("room1").emit("led1-on", data); // Sends to everyone except the sender.
  });
  socket.on("led1-off", (data) => {
    // console.log("led1-off:", data);
    socket.broadcast.to("room1").emit("led1-off", data); // Sends to everyone except the sender.
  });
}); //io.on

let port = process.env.APP_PORT;

httpServer.listen(port, () => {
  console.log(new Date().toLocaleString() + " => Listening on port : " + port);
});
