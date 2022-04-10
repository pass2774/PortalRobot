'use strict';

var os = require('os');
var nodeStatic = require('node-static');
// var http = require('http');
var socketIO = require('socket.io');

const https = require('https');
const fs = require('fs');
const { listenerCount } = require('process');
const { timeStamp } = require('console');

const options = {
  key: fs.readFileSync('./private.pem'),
  cert: fs.readFileSync('./public.pem')
};

var fileServer = new(nodeStatic.Server)();
let app = https.createServer(options, (req, res)=> {
  fileServer.serve(req, res);
}).listen(3000);

console.log('started chating server..');

var ServiceList=new Array();
var obj = new Object();
obj.socketId = "dummy device1";
obj.service = new Object();
obj.service.nickname = "(nickname)";
obj.service.description = "tsSensor";
ServiceList.push(obj);

var io = socketIO.listen(app);

io.sockets.on('connection', function(socket) {
  let client_profile = new Object();
  client_profile.socketId = socket.id;
  client_profile.type = null;
  //type: Service
  client_profile.service = new Object();
  client_profile.service.id = socket.id;
  client_profile.service.nickname = null;
  client_profile.service.contents = null;
  client_profile.service.description = null;
  //type: User  
  client_profile.target = null; //target device

  // convenience function to log server messages on the client
  function log() {
    var array = ['Message from server:'];
    array.push.apply(array, arguments);
    socket.emit('log', array);
  }

  // clean up the room 'foo' -by Joonhwa
  socket.on('Start_Service', function(service_profile) {
    // room=socket.id;
    console.log("Streamer's msg: ", service_profile);
    // var clientsInRoom = io.sockets.adapter.rooms[room];
    var clientsInRoom = io.sockets.adapter.rooms[service_profile.room];
    var numClients = clientsInRoom ? Object.keys(clientsInRoom.sockets).length : 0;
    console.log("(create) Room [" + service_profile.room + "] now has " + numClients + ' client(s)');

    socket.join(service_profile.room);
    console.log('Client ID ' + socket.id + " created room '" + service_profile.room+"'");
    socket.emit('created', service_profile.room, socket.id);
    console.log('room created');
    client_profile.type = 'service';
    client_profile.service = service_profile;

    var queriedList = ServiceList.filter(function(item){return (item.socketId===client_profile.socketId)});
    if(queriedList.length===0){ //avoid overlap
      // client_profile.type = service_profile.type;
      // client_profile.description = service_profile.description;
      // client_profile.contents = service_profile.contents;
      ServiceList.push(client_profile);
    }
    console.log("(create2) Room [" + service_profile.room + "] now has " + numClients + ' client(s)');


    // socket.emit('DevList', ServiceList);// To itself
    // socket.broadcast.emit('DevList', ServiceList); // To others

    socket.emit('q_result',[{header:'ServiceList',data:ServiceList}]);
    socket.broadcast.emit('q_result',[{header:'ServiceList',data:ServiceList}]);

  });

  socket.on('Join_Service', function(room) {
    log('Received request to join the streaming channel:' + room);

    var clientsInRoom = io.sockets.adapter.rooms[room];
    var numClients = clientsInRoom ? Object.keys(clientsInRoom.sockets).length : 0;
    console.log('(before entry) Room [' + room + '] now has ' + numClients + ' client(s)');

    if (numClients <= 5) {
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
    if(client_profile.type=="service"){
      var FilterList = ServiceList.filter(e => e.socketId === client_profile.socketId);
      FilterList.forEach(f => ServiceList.splice(ServiceList.findIndex(e => e.socketId === f.socketId),1));
      console.log(ServiceList);
    }
  // or with emit() and custom event names
//  socket.emit('greetings', 'Hey!', { 'ms': 'jane' }, Buffer.from([4, 3, 3, 1]));
    // socket.broadcast.emit('DevList', ServiceList); // To others
    socket.broadcast.emit('q_result',[{header:'ServiceList',data:ServiceList}]);

  });

  socket.on('q_service', (query) => {
    console.log('query:'+query);
    for(var item of query){
      handleServiceQuery(item);
    }
  });

  function handleServiceQuery(query){
    console.log('handling query:'+query);
    if(query.header==='ServiceList'){
      var qres = new Array();
      qres.push({header:'ServiceList',data:ServiceList});
      console.log(qres);
      socket.emit('q_result',qres);
    }else if(query.header==='ServiceInfo'){
      // var FilterList = DeviceList.filter(e => e.serviceId === query.serviceId);
      var idx = ServiceList.findIndex(e => e.service.id === query.service.id);
      var q_result = ServiceList[idx].service.contents;

      socket.emit('q_result',q_result);
    }//else if(query.name=='information of a sensor'){
      //socket.emit('q_result','some options of a sensor will be served');
    //}
  }
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
