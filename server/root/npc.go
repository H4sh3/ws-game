package root

import (
	"ws-game/shared"

	"github.com/google/uuid"
)

type Npc struct {
	UUID             string           `json:"UUID"`
	Pos              shared.Vector    `json:"pos"`
	Hitpoints        shared.Hitpoints `json:"hitpoints"`
	NpcType          string           `json:"npcType"`
	spawnPos         shared.Vector
	movesBackToSpawn bool
	aggressive       bool
	critChance       float32
	minDamage        float32
	maxDamage        float32
	movementCooldown int
	attackCooldown   int
	targetedPlayer   *Client
	remove           bool
}

func (npc *Npc) SetRemove(value bool) {
	npc.remove = value
}

func NewNpc(pos shared.Vector) Npc {
	// simple test npc for ai implementation
	return Npc{
		UUID:             uuid.New().String(),
		Pos:              pos,
		spawnPos:         pos,
		movesBackToSpawn: false,
		Hitpoints: shared.Hitpoints{
			Current: 250,
			Max:     250,
		},
		NpcType:          "",
		aggressive:       false,
		minDamage:        10,
		maxDamage:        30,
		critChance:       0.5,
		targetedPlayer:   nil,
		movementCooldown: 0,
		attackCooldown:   0,
	}
}
