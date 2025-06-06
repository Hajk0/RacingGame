function init() {
    websocket = new WebSocket("ws://localhost:8000");
    websocket.onopen = function(e) { onOpen(e) };
    websocket.onclose = function(e) { onClose(e) };
    websocket.onmessage = function(e) { onMessage(e) };
    websocket.onerror = function(e) { onError(e) };
  }
  
  function onOpen(e) {
    console.log(e.type);
    websocket.send("Hello");
  }
  
  function onMessage(e) {
    console.log(e.type + ': '  + e.data);
    websocket.close();
  }
  
  window.addEventListener("load", init, false);