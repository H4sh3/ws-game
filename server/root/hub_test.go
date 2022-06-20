package root

import (
	"testing"
)

func TestHub(t *testing.T) {
	n := 10
	num_resources := (n - 1) * (n - 1)
	hub := NewHub(n)

	if len(hub.Resources) != num_resources {
		t.Errorf("Expected %d resources but got %d", num_resources, len(hub.Resources))
	}
}
