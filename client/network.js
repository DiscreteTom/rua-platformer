var ws;

function connect() {
  let addr = document.getElementById("ws-addr").value;
  ws = new WebSocket(addr);

  ws.onopen = function (evt) {};

  ws.onmessage = function (evt) {
    evt.data.text().then((d) => {
      if (d.startsWith("id:")) {
        state.localPlayerId = d.slice(3);
        newPlayer(state.scene, d.slice(3));
      } else {
        state.commandQueue.push(d)
      }
    });
  };

  ws.onclose = function (evt) {
    console.assert("Connection closed.");
  };
}
