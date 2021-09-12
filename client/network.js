function connect() {
  let addr = document.getElementById('ws-addr').value
  var ws = new WebSocket(addr);

  ws.onopen = function (evt) {
    newGame()
    ws.send("join")
  };

  ws.onmessage = function (evt) {
    console.log("Received Message: " + evt.data);
  };

  ws.onclose = function (evt) {
    console.assert("Connection closed.");
  };
}
