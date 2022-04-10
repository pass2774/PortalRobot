'use strict';
// import io from "socket.io-client"; 
console.log("js file loaded"); 

// const io = require("socket.io-client");
const socketClient = io("192.168.0.3:3000"); 
console.log("socketclient loaded"); 

socketClient.on("connect", () => { 
    console.log("connection server"); 
}); 
// socketClient.emit("first Request", { data: "first Reuqest" }); 
socketClient.emit("Query_DevList", { filter: "None" }); 

socketClient.on("DevList", list => { 
    console.log(list); 
    var DevList = document.querySelector('.deviceList');
    for (const [key, value] of Object.entries(Object(list))) {
        console.log(`${key}: ${value.Id}`);
        var option = document.createElement('option');
        option.innerText = value.Id+':'+value.Description;
        option.value = key;
        DevList.append(option);
    }
      

    // var mainPanel=document.getElementById("mainPanel");
    // var field_params_origin=document.getElementById("field_params");
});

//출처: https://hoony-gunputer.tistory.com/entry/socket-io사용하기 [후니의 컴퓨터]