package events

import (
	"testing"
	"ws-game/shared"
)

func TestNewUserEvent(t *testing.T) {
	v := &shared.Vector{X: 10, Y: 10}
	result := string(GetNewPlayerEvent(12, *v))
	expected := "{\"eventType\":\"NEW_USER_EVENT\",\"id\":12,\"pos\":{\"x\":10,\"y\":10}}"

	if result != expected {
		t.Errorf("json new user event error!")
		t.Errorf("Got:\n %s", result)
		t.Errorf("Expected:\n %s", expected)
	}
}
