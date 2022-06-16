package main

import (
	"encoding/json"
	"flag"
	"log"
	"math/rand"
	"net/url"
	"time"

	"github.com/gorilla/websocket"
)

// game.gymcadia.com
var addr = flag.String("addr", "localhost:7777", "http service address")

type EventType string
type BaseEvent struct {
	EventType EventType     `json:"eventType"`
	Payload   KeyBoardEvent `json:"payload"`
}

type KeyBoardEvent struct {
	Key   string `json:"key"`
	Value int    `json:"value"`
	Id    int    `json:"id"`
}

func runClient() {
	u := url.URL{Scheme: "ws", Host: *addr, Path: "/"}
	c, _, err := websocket.DefaultDialer.Dial(u.String(), nil)
	if err != nil {
		log.Fatal("dial:", err)
	}
	defer c.Close()

	done := make(chan struct{})
	Keys := []string{"w", "a", "s", "d"}

	for i := 0; i < 100; i++ {
		randomIndex := rand.Intn(len(Keys))
		pick := Keys[randomIndex]
		p := &KeyBoardEvent{
			Key:   pick,
			Value: 1,
		}
		e := &BaseEvent{
			EventType: "KEYBOARD_EVENT",
			Payload:   *p,
		}

		j, err := json.Marshal(e)

		if err == nil {
			c.WriteMessage(websocket.TextMessage, j)
			time.Sleep(time.Millisecond * 100)
		}
	}

	defer close(done)
}

func main() {
	for i := 0; i < 500; i++ {
		go runClient()
	}
	time.Sleep(time.Second * 10)
}
