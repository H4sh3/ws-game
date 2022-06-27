package main

import (
	"flag"
	"fmt"
	"log"
	"math/rand"
	"net/url"
	"time"

	"github.com/gorilla/websocket"
)

const prod = "game.gymcadia.com"

const local = "localhost:6060"

var addr = flag.String("addr", local, "http service address")

type EventType int
type BaseEvent struct {
	EventType EventType     `json:"eventType"`
	Payload   KeyBoardEvent `json:"payload"`
}

type KeyBoardEvent struct {
	Key   string `json:"key"`
	Value int    `json:"value"`
	Id    int    `json:"id"`
}

func ReaderCoro(c *websocket.Conn) {
	defer c.Close()
	for {
		messageType, _, err := c.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("error: %v", err)
			}
			return
		}
		fmt.Println(messageType)
	}
}

func runClient() {
	u := url.URL{Scheme: "ws", Host: *addr, Path: "/websocket"}
	c, _, err := websocket.DefaultDialer.Dial(u.String(), nil)
	if err != nil {
		log.Fatal("dial:", err)
	}

	go ReaderCoro(c)

	Keys := []string{"w", "a", "s", "d"}
	time.Sleep(time.Millisecond * 100)
	for i := 0; i > -1; i++ {
		randomIndex := rand.Intn(len(Keys))
		pick := Keys[randomIndex]
		p := &KeyBoardEvent{
			Key:   pick,
			Value: 1,
		}

		e := &BaseEvent{
			EventType: 3,
			Payload:   *p,
		}

		err := c.WriteJSON(*e)

		//j, err := json.Marshal(e)
		//c.WriteMessage(websocket.TextMessage, j)
		if err != nil {
			fmt.Println(err)
			break
		}
		time.Sleep(time.Millisecond * 200)
	}
	fmt.Println("kill")
	c.Close()
}

func main() {
	for i := 0; i < 50; i++ {
		go runClient()
		time.Sleep(time.Millisecond * 50)
		//time.Sleep(time.Second / 10)
	}
	time.Sleep(time.Second * 1000)
	fmt.Println("DONE!")
}
