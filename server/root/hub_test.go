package root

import (
	"testing"
)

func TestHub(t *testing.T) {
	n := 10
	hub := NewHub(n)

	if len(hub.Resources) != n {
		t.Errorf("Expected %d resources but got %d", n, len(hub.Resources))
	}
}
