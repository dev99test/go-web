package main

import (
    "encoding/json"
    "net/http"
    "log"
)

type Message struct {
    Text string `json:"text"`
}

func helloHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
    msg := Message{Text: "Hello, World!"}
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(msg)
}

func main() {
    http.HandleFunc("/api/hello", helloHandler)
    log.Println("Server started at :8080")
    log.Fatal(http.ListenAndServe(":8080", nil))
}
