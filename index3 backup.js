'use strict';

var os = require('os');
var nodeStatic = require('node-static');
// var http = require('http');
var socketIO = require('socket.io');

const https = require('https');
const fs = require('fs');
const { listenerCount } = require('process');

const options = {
  key: fs.readFileSync('./private.pem'),
  cert: fs.readFileSync('./public.pem')
};

var fileServer = new(nodeStatic.Server)();
let app = https.createServer(options, (req, res)=> {
  fileServer.serve(req, res);
}).listen(3000);

console.log('started chating server..');

var DeviceList=new Array();
var obj = new Object();
obj.socketId = "dummy device1";
obj.description = "dummy";
DeviceList.push(obj);

var io = socketIO.listen(app);
io.sockets.on('connection', function(socket) {
  let client_info = new Object();
  client_info.type = null;
  //type: 
  //1. Streamer
  //2. SensorDev
  //3. owner
  //4. user
  
  client_info.socketId = socket.id;
  client_info.info = null;

  // convenience function to log server messages on the client
  function log() {
    var array = ['Message from server:'];
    array.push.apply(array, arguments);
    socket.emit('log', array);
  }

  // clean up the room 'foo' -by Joonhwa
  socket.on('Start_Stream', function(room) {
    // room=socket.id;
    console.log("Streamer's room id: ", room);
    // var clientsInRoom = io.sockets.adapter.rooms[room];
    var clientsInRoom = io.sockets.adapter.rooms[room];
    var numClients = clientsInRoom ? Object.keys(clientsInRoom.sockets).length : 0;
    console.log("(create) Room [" + room + "] now has " + numClients + ' client(s)');

    socket.join(room);
    console.log('Client ID ' + socket.id + " created room '" + room+"'");
    socket.emit('created', room, socket.id);
    console.log('room created');
    var obj = new Object();
    // obj.SocketId = room;
    obj.socketId = client_info.socketId;
    // obj.Description = data.description;
    obj.Description = "dummy description";
    var queriedList = DeviceList.filter(function(item){return (item.socketId===obj.socketId)});
    if(queriedList.length===0){ //avoid overlap
      DeviceList.push(obj);
      client_info.type = "streamer";
      client_info.description = "Streamer";
    }
    console.log("(create2) Room [" + room + "] now has " + numClients + ' client(s)');
    socket.emit('DevList', DeviceList);// To itself
    socket.broadcast.emit('DevList', DeviceList); // To others


  });

  socket.on('Subscribe_Stream', function(room) {
    log('Received request to join the streaming channel:' + room);

    var clientsInRoom = io.sockets.adapter.rooms[room];
    var numClients = clientsInRoom ? Object.keys(clientsInRoom.sockets).length : 0;
    console.log('(before entry) Room [' + room + '] now has ' + numClients + ' client(s)');

    if (numClients <= 4) {
      console.log('Client [' + socket.id + '] joined room [' + room + ']');
      log('Client [' + socket.id + '] joined room [' + room + ']');
      io.sockets.in(room).emit('join', room);
      socket.join(room);
      socket.emit('joined', room, socket.id);
      io.sockets.in(room).emit('ready');
      console.log('join completed');
      console.log('(after entry) Room [' + room + '] now has ' + numClients + ' client(s)');
      socket.emit('message')
    } else { // max two clients
      socket.emit('full', room);
    }
  });
  
  socket.on('disconnect', (data) => {
    console.log(data);
    console.log("\n\nDisconnected!\n\n");
    if(client_info.type=="streamer"){
      var FilterList = DeviceList.filter(e => e.socketId === client_info.socketId);
      FilterList.forEach(f => DeviceList.splice(DeviceList.findIndex(e => e.socketId === f.socketId),1));
      console.log(DeviceList);
    }
  // or with emit() and custom event names
//  socket.emit('greetings', 'Hey!', { 'ms': 'jane' }, Buffer.from([4, 3, 3, 1]));
    socket.broadcast.emit('DevList', DeviceList); // To others
  });

  socket.on('Query_DevList', (data) => {
    //Display the available device list
    socket.emit('DevList', DeviceList);
    console.log(data);
    console.log(DeviceList);
  });


  // clean up the room 'foo' -by Joonhwa
  socket.on('message', function(message) {
    log('Client said: ', message);
    console.log('Client said: ', message);

    if (message==="bye" && socket.rooms['foo']) {
      io.of('/').in('foo').clients((error, socketIds) => {
          if (error) throw error;

          socketIds.forEach(socketId => {
              io.sockets.sockets[socketId].leave('foo');
          });
      });
  }
  // 출처: https://forest71.tistory.com/213?category=788767 [SW 개발이 좋은 사람]

  
  
  // for a real app, would be room-only (not broadcast)
    socket.broadcast.emit('message', message);
  });

  // socket.on('create or join', function(room) {
  //   log('Received request to create or join room ' + room);

  //   var clientsInRoom = io.sockets.adapter.rooms[room];
  //   var numClients = clientsInRoom ? Object.keys(clientsInRoom.sockets).length : 0;
  //   console.log('(X1)Room ' + room + ' now has ' + numClients + ' client(s)');

  //   if (numClients === 0) {
  //     socket.join(room);
  //     log('Client ID ' + socket.id + ' created room ' + room);
  //     socket.emit('created', room, socket.id);
  //     console.log('room created');
  //     console.log('(X2)Room ' + room + ' now has ' + numClients + ' client(s)');

  //   } else if (numClients === 1) {
  //     log('Client ID ' + socket.id + ' joined room ' + room);
  //     io.sockets.in(room).emit('join', room);
  //     socket.join(room);
  //     socket.emit('joined', room, socket.id);
  //     io.sockets.in(room).emit('ready');
  //     console.log('A client joined the room');
  //     console.log('(X3)Room ' + room + ' now has ' + numClients + ' client(s)');
  //   } else { // max two clients
  //     socket.emit('full', room);
  //   }
  // });

  socket.on('ipaddr', function() {
    var ifaces = os.networkInterfaces();
    for (var dev in ifaces) {
      ifaces[dev].forEach(function(details) {
        if (details.family === 'IPv4' && details.address !== '127.0.0.1') {
          socket.emit('ipaddr', details.address);
        }
      });
    }
  });

  socket.on('bye', function(){
    console.log('received bye');
  });

});
