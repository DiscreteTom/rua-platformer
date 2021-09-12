package main

import (
	"fmt"

	"github.com/DiscreteTom/rua"
	"github.com/DiscreteTom/rua/plugin/network/websocket"
)

func main() {
	s := rua.NewEventDrivenServer()
	s.
		AfterAddPeer(func(newPeer rua.Peer) {
			newPeer.Write([]byte(fmt.Sprintf("id:%d", newPeer.Id())))
		}).
		OnPeerMsg(func(m *rua.PeerMsg) {
			s.ForEachPeer(func(id int, peer rua.Peer) {
				go peer.Write(m.Data)
			})
		})

	go websocket.NewWebsocketListener(":8080", s).WithAllOriginAllowed().Start()
	s.Start()
}
