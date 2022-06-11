package shared

import "math/rand"

func RandIntInRange(min int, max int) int {
	return rand.Intn(max-min) + min
}

type Vector struct {
	X int `json:"x"`
	Y int `json:"y"`
}
