var os = require('os');
var nodeStatic = require('node-static');
var socketIO = require('socket.io');
var SerialPort = require("serialport").SerialPort; 
const { ReadlineParser } = require('@serialport/parser-readline')

console.log('start');


// var port = new SerialPort("/dev/ttyAMA0", {
// const Readline = SerialPort.parsers.Readline;

const serialport = new SerialPort({
  path:"COM7",
  baudRate:115200,
  // parser: "\n"
  // parser: SerialPort.parsers.Readline('\r\n')
});
const parser = serialport.pipe(new ReadlineParser({ delimiter: '\n' }))

// serialport.on('data', function (data) {
//   console.log('uart: ' + data);
// });

parser.on('data', function (data) {
  console.log('uart: ' + data);
});

serialport.write('Hey!Ready?\n');
console.log('Serial on');

function function1() {
  // all the stuff you want to happen after that pause
  serialport.write('srv:90,100,90,90,90,90\n');
  setTimeout(function2, 50);
  console.log('---------------------------------');
}


function function2() {
  // all the stuff you want to happen after that pause
  setTimeout(function1, 50);
  serialport.write('srv:90,105,90,90,90,90\n');
  console.log('---------------------------------');
}

// call the rest of the code and have it execute after 3 seconds
// setTimeout(function2, 3000);


//http mode
var http = require('http');
var fileServer = new(nodeStatic.Server)();
var app = http.createServer(function(req, res) {
  fileServer.serve(req, res);
}).listen(3030);
/////////////////////////////////////
//https mode
// const https = require('https');
// const fs = require('fs');
// const options = {
//   key: fs.readFileSync('./private.pem'),
//   cert: fs.readFileSync('./public.pem')
// };
// var fileServer = new(nodeStatic.Server)();
// let app = https.createServer(options, (req, res)=> {
//   fileServer.serve(req, res);
// }).listen(3030);
////////////////////////////////////
console.log('started chating server..');

const io2 = socketIO.listen(app);
io2.sockets.on('connection', function(socket) {
  socket.on('bye', function(){
    console.log('received bye');
  });
})

// var io = require('socket.io')(app);
const io = require('socket.io')(3000);

//client type
//-1: NOT DEFINED
// 1: CLIENT_USER
// 2: CLIENT_ADMIN
io.on('connection', socket => {
  var client_profile = new Object();
  client_profile.Admin = null;

  // either with send()
  socket.send('Hello!');
  // or with emit() and custom event names
  socket.emit('Greetings', 'identify yourself');
  // handle the event sent with socket.send()
  socket.on('UserLogIn', (data) => {
    console.log("UserLogIn:");
    console.log(data);
    client_profile.Id=null;
    client_profile.Pw=null;
    client_profile.Admin = null;
    if(client_info.Admin===true){
      socket.emit('AdminInfo', 'Request for admin information');
    }else{
      socket.emit('UserInfo', 'Request for user information');
    }
  });
  socket.on('disconnect', (data) => {
    console.log("\n----Disconnected!---\n");
    console.log(data);
  });

  //From user to device
  socket.on('SetParams', (data) => {
    //security, network time, sampling interval, and other operation conditions
    //initiate operation immediately
    //schedule operation at a specific time & interval
    serialport.write(data); //'srv:90,90,90,90,90,90\n'
    console.log('socket:'+data);
  });
  socket.on('GetParams', (data) => {
    //display current params settings of the device
    console.log(data);
  });
  socket.on('SetData', (data) => {
    //not used
    console.log(data);
  });
  socket.on('GetData', (data) => {
    //request one time data
    console.log(data);
  });
  socket.on('Reset', (data) => {
    //reset device
    console.log(data);
  });
});