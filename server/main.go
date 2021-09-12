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
			s.ForEachPeer(func(id int, peer rua.Peer) {
				if id == newPeer.Id() {
					peer.Write([]byte(fmt.Sprintf("id:%d", newPeer.Id())))
				} else {
					peer.Write([]byte(fmt.Sprintf("new:%d", newPeer.Id())))
				}
			})
		}).
		OnPeerMsg(func(m *rua.PeerMsg) {
			s.ForEachPeer(func(id int, peer rua.Peer) {
				go peer.Write(m.Data)
			})
		}).
		AfterRemovePeer(func(targetId int) {
			s.ForEachPeer(func(id int, peer rua.Peer) {
				peer.Write([]byte(fmt.Sprintf("gone:%d", targetId)))
			})
		})

	go websocket.NewWebsocketListener(":8080", s).WithAllOriginAllowed().Start()
	s.Start()
}
