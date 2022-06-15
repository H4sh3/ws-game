package main

import (
	"flag"
	"log"
	"net/http"
	"ws-game/root"
)

var addr = flag.String("addr", ":7777", "http service address")

func main() {
	flag.Parse()
	hub := root.NewHub(10)
	go hub.Run()
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		root.ServeWs(hub, w, r)
	})
	err := http.ListenAndServe(*addr, nil)
	if err != nil {
		log.Fatal("ListenAndServe: ", err)
	}
}
