package root

import (
	"ws-game/shared"

	"github.com/google/uuid"
)

type Npc struct {
	UUID             string        `json:"UUID"`
	Pos              shared.Vector `json:"pos"`
	Hp               float32       `json:"hp"`
	NpcType          string        `json:"npcType"`
	spawnPos         shared.Vector
	movesBackToSpawn bool
	aggressive       bool
	critChance       float32
	minDamage        float32
	maxDamage        float32
	actionCooldown   int
	targetedPlayer   *Client
}

func NewNpc(pos shared.Vector) Npc {
	// simple test npc for ai implementation
	return Npc{
		UUID:             uuid.New().String(),
		Pos:              pos,
		spawnPos:         pos,
		movesBackToSpawn: false,
		Hp:               200.0,
		NpcType:          "",
		aggressive:       false,
		minDamage:        10,
		maxDamage:        30,
		critChance:       0.2,
		targetedPlayer:   nil,
		actionCooldown:   0,
	}
}
