package main

import (
	"flag"
	"log"
	"net/http"
	"sync"
	"ws-game/root"
)

var addr = flag.String("addr", ":7777", "http service address")

func main() {
	flag.Parse()
	hub := root.NewHub(10)
	go hub.Run()

	var m sync.Mutex

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		root.ServeWs(hub, w, r, &m)
	})
	err := http.ListenAndServe(*addr, nil)
	if err != nil {
		log.Fatal("ListenAndServe: ", err)
	}
}
