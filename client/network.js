function connect() {
  let addr = document.getElementById('ws-addr').value
  var ws = new WebSocket(addr);

  ws.onopen = function (evt) {
  };

  ws.onmessage = function (evt) {
    evt.data.text().then(d=>{
      if (d.startsWith('id:')){
        state.localPlayerId = d.slice(3)
        newPlayer(state.scene)
      }
    })
  };

  ws.onclose = function (evt) {
    console.assert("Connection closed.");
  };
}
