'use strict';

var isChannelReady = false;
var isInitiator = false;
var isStarted = false;
var localStream;
var pc;
var remoteStream;
var turnReady;

var ServiceList;

var jbBtn = document.createElement('button');
var jbBtnText = document.createTextNode('Click me!');
jbBtn.id='btn_0'
jbBtnText.id='btnText_0'

jbBtn.appendChild(jbBtnText);
document.body.appendChild(jbBtn);
// jbBtn.addEventListener('StreamOn');

// jbBtn.addEventListener("click", function() {
//     alert("clicked!!!");
// })

jbBtn.addEventListener("click",onButtonClick)
jbBtn.addEventListener("mouseover", onMouseOver);
jbBtn.addEventListener("mouseout", onMouseOut);


function onButtonClick() {
  alert("clicked!!!");
}
function onMouseOver() {
    document.getElementById("btn_0").innerText = "mouse over"
}
function onMouseOut() {
    document.getElementById("btn_0").innerText= "mouse out"
}
// var pcConfig = {
//   'iceServers': [{
//     'urls': 'stun:stun.l.google.com:19302'
//   }]
// };
var pcConfig = {
  'iceServers': [{
    "urls": "turn:3.38.108.27",
    "username":"usr",
    "credential":"pass"
  }]
};

// Set up audio and video regardless of what devices are present.
var sdpConstraints = {
  offerToReceiveAudio: true,
  offerToReceiveVideo: true
};


/////////////////////////////////////////////
var localVideo = document.querySelector('#localVideo');
var remoteVideo = document.querySelector('#remoteVideo');

var room = 'foo';
// Could prompt for room name:
// room = prompt('Enter room name:');
var socket = io.connect();

var controlPanel = document.querySelector('#controlPanel');

var SltServiceList = document.createElement('select');
var option_default = document.createElement('option');
option_default.innerText = "Available Device List";
option_default.value = "field";
SltServiceList.append(option_default);
SltServiceList.addEventListener("onchange",function(){
  
})


var BtnStartStream = document.createElement('button');
// var div = document.createElement('div');
// controlPanel.appendChild(BtnStartStream);

BtnStartStream.id='btn_start_stream'
BtnStartStream.innerText='Start Streaming'
document.body.appendChild(BtnStartStream);
BtnStartStream.addEventListener("click", function() {
  let serviceProfile = new Object();
  serviceProfile.room = 'room:'+socket.id;
  serviceProfile.type = 'Device_1';
  serviceProfile.description = 'Streamer';
  // obj.contents = {stream:'{video,audio}'};
  serviceProfile.contents = {sensor:'{sensor1,sensor2}',stream:'{video,audio}'};
  // room = 'channel:'+socket.id;
  // console.log('room:'+room);
  socket.emit('Start_Service', serviceProfile);
  navigator.mediaDevices.getUserMedia({
    audio: true,
    video: true
  })
  .then(gotStream)
  .catch(function(e) {
    alert('getUserMedia() error: ' + e.name);
  });
  // toggleMic();
  // localStream.getAudioTracks()[0].enabled = false;

})



var BtnJoinService = document.createElement('button');
BtnJoinService.id='btn_join_service'
BtnJoinService.innerText='Join Service'
document.body.appendChild(BtnJoinService);
BtnJoinService.addEventListener("click", function() {
  // var link = 'http://bino.blog';
  
  // let DevList = document.querySelector('.deviceList');
  // let DevSelected = DevList.options[DevList.selectedIndex].innerText;
  // let ServiceSelected = SltServiceList.options[SltServiceList.selectedIndex].value;
  console.log(ServiceList);
  //FilteredList of Services
  var selectedProfile = ServiceList.filter(e => e.socketId === SltServiceList.options[SltServiceList.selectedIndex].value)[0];
  console.log(selectedProfile);

  socket.emit('Join_Service', selectedProfile.socketId);
  if(selectedProfile.service.description === 'tsSensor'){    
    location.href='SensorMonitor.html';
  }else if(selectedProfile.service.description === 'Streamer'){
    navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true
    })
    .then(gotStream)
    .catch(function(e) {
      alert('getUserMedia() error: ' + e.name);
    });  
  }

  // alert(DevSelected);///
  // socket.emit('Join_Service', ServiceSelected);
//  socket.emit('Join_Service', selectedProfile.socketId);
  // localStream.getAudioTracks()[0].enabled = false;

})


var BtnAudioToggle = document.createElement('button');
BtnAudioToggle.id='btn_audio_toggle'
BtnAudioToggle.innerText='My Audio On/Off'
document.body.appendChild(BtnAudioToggle);
BtnAudioToggle.addEventListener("click", function() {
  localStream.getAudioTracks()[0].enabled = !localStream.getAudioTracks()[0].enabled;

})

controlPanel.appendChild(BtnStartStream);
controlPanel.appendChild(BtnJoinService);
controlPanel.appendChild(BtnAudioToggle);
controlPanel.appendChild(SltServiceList);


let mic_switch = true;
let video_switch = true;

function toggleMic() {
  if(localStream != null && localStream.getAudioTracks().length > 0){
    mic_switch = !mic_switch;

  }
}  

// room = 'foo';
// if (room !== '') {
//   socket.emit('create or join', room);
//   console.log('Attempted to create or  join room', room);
// }


// socketClient.emit("first Request", { data: "first Reuqest" }); 

// socket.emit("Query_DevList", { filter: "None" }); 
var query = new Array();
query.push({header:'ServiceList',filter:{}});
console.log(query);
socket.emit("q_service", query); 

socket.on('q_result', function(q_result) {
  console.log('query result:' + q_result);

  for(const item of q_result){
    if(item.header==='ServiceList'){
      ServiceList=item.data;
      SltServiceList.options.length=1;
      for (const [key, value] of Object.entries(Object(ServiceList))) {
          console.log(`${key}: ${value.socketId}`);
          var option = document.createElement('option');
          option.innerText = value.socketId+':'+value.service.description;
          option.value = value.socketId;
          SltServiceList.append(option);
      }
    }
  }

});


socket.on('created', function(room) {
  console.log('Created room ' + room);
  isInitiator = true;
});

socket.on('full', function(room) {
  console.log('Room ' + room + ' is full');
});

socket.on('join', function (room){
  console.log('Another peer made a request to join room ' + room);
  console.log('This peer is the initiator of room ' + room + '!');
  isChannelReady = true;
});

socket.on('joined', function(room) {
  console.log('joined: ' + room);
  isChannelReady = true;
});

socket.on('log', function(array) {
  console.log.apply(console, array);
});

////////////////////////////////////////////////

function sendMessage(message) {
  console.log('Client sending message: ', message);
  socket.emit('message', message);
}

// This client receives a message
socket.on('message', function(message) {
  console.log('Client received message:', message);
  try{
    if (message === 'got user media') {
      maybeStart();
    } else if (message.type === 'offer') {
      if (!isInitiator && !isStarted) {
        maybeStart();
      }
      pc.setRemoteDescription(new RTCSessionDescription(message));
      doAnswer();
    } else if (message.type === 'answer' && isStarted) {
      pc.setRemoteDescription(new RTCSessionDescription(message));
    } else if (message.type === 'candidate' && isStarted) {
      var candidate = new RTCIceCandidate({
        sdpMLineIndex: message.label,
        candidate: message.candidate
      });
      pc.addIceCandidate(candidate);
    } else if (message === 'bye' && isStarted) {
      handleRemoteHangup();
    }
  }catch(e){

  }
});

////////////////////////////////////////////////////

// var localVideo = document.querySelector('#localVideo');
// var remoteVideo = document.querySelector('#remoteVideo');

// navigator.mediaDevices.getUserMedia({
//   audio: false,
//   video: true
// })
// .then(gotStream)
// .catch(function(e) {
//   alert('getUserMedia() error: ' + e.name);
// });

function gotStream(stream) {
  console.log('Adding local stream.');
  localStream = stream;
  localVideo.srcObject = stream;
  sendMessage('got user media');
  if (isInitiator) {
    maybeStart();
  }
}

var constraints = {
  video: true
};

console.log('Getting user media with constraints', constraints);

if (location.hostname !== 'localhost') {
  requestTurn(
    'https://computeengineondemand.appspot.com/turn?username=41784574&key=4080218913'
  );
}

function maybeStart() {
  console.log('>>>>>>> maybeStart() ', isStarted, localStream, isChannelReady);
  if (!isStarted && typeof localStream !== 'undefined' && isChannelReady) {
    console.log('>>>>>> creating peer connection');
    createPeerConnection();
    pc.addStream(localStream);
    isStarted = true;
    console.log('isInitiator', isInitiator);
    if (isInitiator) {
      doCall();
    }
  }
}

window.onbeforeunload = function() {
  sendMessage('bye');
};

/////////////////////////////////////////////////////////

function createPeerConnection() {
  try {
    // pc = new RTCPeerConnection(null);
    pc = new RTCPeerConnection(pcConfig); //Joonhwa
    pc.onicecandidate = handleIceCandidate;
    pc.onaddstream = handleRemoteStreamAdded;
    pc.onremovestream = handleRemoteStreamRemoved;
    console.log('Created RTCPeerConnnection');
  } catch (e) {
    console.log('Failed to create PeerConnection, exception: ' + e.message);
    alert('Cannot create RTCPeerConnection object.');
    return;
  }
}

function handleIceCandidate(event) {
  console.log('icecandidate event: ', event);
  if (event.candidate) {
    sendMessage({
      type: 'candidate',
      label: event.candidate.sdpMLineIndex,
      id: event.candidate.sdpMid,
      candidate: event.candidate.candidate
    });
  } else {
    console.log('End of candidates.');
  }
}

function handleCreateOfferError(event) {
  console.log('createOffer() error: ', event);
}

function doCall() {
  console.log('Sending offer to peer');
  pc.createOffer(setLocalAndSendMessage, handleCreateOfferError);
}

function doAnswer() {
  console.log('Sending answer to peer.');
  pc.createAnswer().then(
    setLocalAndSendMessage,
    onCreateSessionDescriptionError
  );
}

function setLocalAndSendMessage(sessionDescription) {
  pc.setLocalDescription(sessionDescription);
  console.log('setLocalAndSendMessage sending message', sessionDescription);
  sendMessage(sessionDescription);
}

function onCreateSessionDescriptionError(error) {
  trace('Failed to create session description: ' + error.toString());
}

function requestTurn(turnURL) {
  var turnExists = false;
  for (var i in pcConfig.iceServers) {
    if (pcConfig.iceServers[i].urls.substr(0, 5) === 'turn:') {
      turnExists = true;
      turnReady = true;
      break;
    }
  }
  if (!turnExists) {
    console.log('Getting TURN server from ', turnURL);
    // No TURN server. Get one from computeengineondemand.appspot.com:
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4 && xhr.status === 200) {
        var turnServer = JSON.parse(xhr.responseText);
        console.log('Got TURN server: ', turnServer);
        pcConfig.iceServers.push({
          'urls': 'turn:' + turnServer.username + '@' + turnServer.turn,
          'credential': turnServer.password
        });
        turnReady = true;
      }
    };
    xhr.open('GET', turnURL, true);
    xhr.send();
  }
}

function handleRemoteStreamAdded(event) {
  console.log('Remote stream added.');
  remoteStream = event.stream;
  remoteVideo.srcObject = remoteStream;
}

function handleRemoteStreamRemoved(event) {
  console.log('Remote stream removed. Event: ', event);
}

function hangup() {
  console.log('Hanging up.');
  stop();
  sendMessage('bye');
}

function handleRemoteHangup() {
  console.log('Session terminated.');
  stop();
  isInitiator = false;
}

function stop() {
  isStarted = false;
  pc.close();
  pc = null;
}
