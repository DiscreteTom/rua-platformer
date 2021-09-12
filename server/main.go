package main

import (
	"github.com/DiscreteTom/rua"
	"github.com/DiscreteTom/rua/plugin/network/websocket"
)

func main() {
	s := rua.NewEventDrivenServer()
	s.OnPeerMsg(func(m *rua.PeerMsg) {
		s.ForEachPeer(func(id int, peer rua.Peer) {
			if id != m.Peer.Id() {
				peer.Write(m.Data)
			}
		})
	})

	go websocket.NewWebsocketListener(":8080", s).Start()
	s.Start()
}
