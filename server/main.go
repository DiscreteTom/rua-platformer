package main

import (
	"fmt"
	"strings"

	"github.com/DiscreteTom/rua"
	"github.com/DiscreteTom/rua/plugin/network/websocket"
)

// game state
var (
	players map[string]string
)

func main() {
	players = map[string]string{}

	s := rua.NewEventDrivenServer()
	s.
		AfterAddPeer(func(newPeer rua.Peer) {
			s.ForEachPeer(func(id int, peer rua.Peer) {
				if id == newPeer.Id() {
					peer.Write([]byte(fmt.Sprintf("id:%d", newPeer.Id())))
					for pid, player := range players {
						peer.Write([]byte(fmt.Sprintf("sync:%s:%s", pid, player)))
					}
				} else {
					peer.Write([]byte(fmt.Sprintf("new:%d", newPeer.Id())))
				}
			})
		}).
		OnPeerMsg(func(m *rua.PeerMsg) {
			state := string(m.Data)
			if strings.HasPrefix(state, "sync:") {
				detail := strings.SplitN(state, ":", 3)
				players[detail[1]] = detail[2]
			}
			go s.ForEachPeer(func(id int, peer rua.Peer) {
				go peer.Write(m.Data)
			})
		}).
		AfterRemovePeer(func(targetId int) {
			s.ForEachPeer(func(id int, peer rua.Peer) {
				peer.Write([]byte(fmt.Sprintf("gone:%d", targetId)))
			})
			delete(players, fmt.Sprint(targetId))
		})

	go websocket.NewWebsocketListener(":8080", s).WithAllOriginAllowed().Start()
	s.Start()
}
