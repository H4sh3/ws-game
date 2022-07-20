package root

import (
	"ws-game/shared"

	"github.com/google/uuid"
)

type NpcState int

const (
	Idle      NpcState = 0
	Walk      NpcState = 1
	Attack    NpcState = 2
	Returning NpcState = 3
)

type Npc struct {
	UUID             string           `json:"UUID"`
	Pos              shared.Vector    `json:"pos"`
	Hitpoints        shared.Hitpoints `json:"hitpoints"`
	NpcType          string           `json:"npcType"`
	AttackSpeed      int              `json:"attackSpeed"`
	spawnPos         shared.Vector
	movesBackToSpawn bool
	aggressive       bool
	critChance       float32
	minDamage        float32
	maxDamage        float32
	movementCooldown int
	walkCooldown     int
	attackCooldown   int
	targetedPlayer   *Client
	remove           bool
	State            NpcState
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
			Current: 25000,
			Max:     25000,
		},
		NpcType:          "",
		aggressive:       false,
		minDamage:        10,
		maxDamage:        30,
		critChance:       0.5,
		targetedPlayer:   nil,
		movementCooldown: 0,
		walkCooldown:     0,
		attackCooldown:   0,
		State:            Idle,
		AttackSpeed:      15,
	}
}
