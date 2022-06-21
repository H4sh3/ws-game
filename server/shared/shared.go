package shared

import (
	"math"
	"math/rand"
)

func RandIntInRange(min int, max int) int {
	return rand.Intn(max-min) + min
}

type Vector struct {
	X int `json:"x"`
	Y int `json:"y"`
}

func (v1 *Vector) Dist(v2 *Vector) float64 {
	a := math.Pow(float64(v1.X-v2.X), 2)
	b := math.Pow(float64(v1.Y-v2.Y), 2)
	return math.Sqrt(a + b)
}

func (v1 *Vector) Copy() Vector {
	return Vector{X: v1.X, Y: v1.Y}
}
