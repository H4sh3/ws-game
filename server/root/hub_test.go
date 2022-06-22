package root

import (
	"fmt"
	"testing"
)

func TestHub(t *testing.T) {
	hub := NewHub()
	fmt.Println(hub)
}
