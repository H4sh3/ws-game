package main

import (
	"flag"
	"log"
	"net/http"
	_ "net/http/pprof"
	"runtime"
	"sync"
	"ws-game/root"
)

var addr = flag.String("addr", ":6060", "http service address")

func main() {
	runtime.SetMutexProfileFraction(-1)
	runtime.SetBlockProfileRate(1)
	flag.Parse()
	hub := root.NewHub()
	go hub.Run()

	var m sync.Mutex

	http.HandleFunc("/test", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("hello"))
	})

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		root.ServeWs(hub, w, r, &m)
	})
	err := http.ListenAndServe(*addr, nil)
	if err != nil {
		log.Fatal("ListenAndServe: ", err)
	}
}
