package item

import (
	"ws-game/shared"

	"github.com/google/uuid"
)

// items can:
//  - placed on the ground in a cell
//  - dropped by a player
//  - stored in a players inventory
//  - equipped by a player
//  - consumed by a player -> potions

type ItemType string

const (
	Armour     ItemType = "ArmourItem"
	Weapon     ItemType = "WeaponItem"
	Consumable ItemType = "ConsumableItem"
)

type ItemTypeSub string

// weapons
const (
	Axe    ItemTypeSub = "Axe"
	Sword  ItemTypeSub = "Sword"
	Hammer ItemTypeSub = "Hammer"
)

type BoniAttribute string

const (
	Strength BoniAttribute = "Strength"
	Agility  BoniAttribute = "Agility"
	Vitality BoniAttribute = "Vitality"
)

// improves str agi vita
type Boni struct {
	Attribute BoniAttribute `json:"attribute"`
	Value     int           `json:"value"`
}

type Rarity string

const (
	NormalRarity Rarity = "NormalRarity" // 50%
	MagicRarity  Rarity = "MagicRarity"  // 80%
	UniqueRarity Rarity = "UniqueRarity" // 9%
	UltraRarity  Rarity = "UltraRarity"  // 1%
)

type Item struct {
	ItemType    ItemType      `json:"itemType"`
	ItemSubType ItemSubType   `json:"itemSubType"`
	Pos         shared.Vector `json:"pos"`
	UUID        string        `json:"uuid"`
	Quantity    int           `json:"quantity"` // for potions or throwables

	Rarity      Rarity `json:"rarity"`    // influences min/max damage etc.
	Quality     int    `json:"quality"`   // 80-100
	MinDamage   int    `json:"minDamage"` // roll
	MaxDamage   int    `json:"maxDamage"` // roll
	Absorb      int    `json:"absorb"`    // all items can have this stat -> only show in ui if >= 0
	AttackSpeed int    `json:"attackSpeed"`

	Boni []Boni `json:"boni"`
	// bonis the items provides +20 vita etc.
	// calulcate players stats on equipped item changes
}

func rollRarity() Rarity {
	rarityRoll := shared.RandIntInRange(1, 100)
	if rarityRoll <= 50 {
		return NormalRarity
	} else if rarityRoll > 50 && rarityRoll <= 80 {
		return MagicRarity
	} else if rarityRoll > 80 && rarityRoll <= 99 {
		return UniqueRarity
	} else if rarityRoll > 99 {
		return UltraRarity
	}
}

func NewItem(zoneLevel int, pos shared.Vector) Item {

	item := Item{
		ItemType:    Weapon,
		ItemSubType: Sword,
		Pos:         pos,
		UUID:        uuid.New().String(),
		Quantity:    1,
		Rarity:      rollRarity(),
		Quality:     100,
		MinDamage:   20,
		MaxDamage:   50,
		Absorb:      10,
		AttackSpeed: 10,
		Boni: []Boni{
			Boni{
				Attribute: Vitality,
				Value:     10,
			},
		},
	}

	return item
}
