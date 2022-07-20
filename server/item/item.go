package item

import (
	"fmt"
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
	Armour     ItemType = "armourItem"
	Weapon     ItemType = "weaponItem"
	Consumable ItemType = "consumableItem"
)

type ItemSubType string

// weapons
const (
	Axe    ItemSubType = "axe"
	Sword  ItemSubType = "sword"
	Hammer ItemSubType = "hammer"
)

type BoniAttribute string

const (
	Strength BoniAttribute = "strength"
	Agility  BoniAttribute = "agility"
	Vitality BoniAttribute = "vitality"
)

// improves str agi vita
type Boni struct {
	Attribute BoniAttribute `json:"attribute"`
	Value     int           `json:"value"`
}

type Rarity string

const (
	NormalRarity Rarity = "normal" // 50%
	MagicRarity  Rarity = "magic"  // 80%
	UniqueRarity Rarity = "unique" // 9%
	UltraRarity  Rarity = "ultra"  // 1%
)

type Item struct {
	GridCellPos shared.Vector `json:"gridCellPos"`
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
	rarityRoll := shared.RandIntInRange(0, 101)
	if rarityRoll <= 50 {
		return NormalRarity
	} else if rarityRoll > 50 && rarityRoll <= 95 {
		return MagicRarity
	} else if rarityRoll > 95 && rarityRoll <= 99 {
		return UniqueRarity
	}
	fmt.Println("UNIQUE ITEM OHH BOY!")
	return UltraRarity
}

func NewItem(gridCellPos shared.Vector, zoneLevel int, pos shared.Vector) Item {

	item := Item{
		GridCellPos: gridCellPos,
		ItemType:    Weapon,
		ItemSubType: Sword,
		Pos:         pos,
		UUID:        uuid.New().String(),
		Quantity:    1,
		Rarity:      rollRarity(),
		Quality:     100,
		MinDamage:   2000,
		MaxDamage:   5000,
		Absorb:      10,
		AttackSpeed: 10,
		Boni: []Boni{
			{
				Attribute: Vitality,
				Value:     10,
			},
		},
	}

	for i := 0; i < shared.RandIntInRange(2, 5); i++ {
		//Todo random initialze items; rarity in considerations
		item.Boni = append(item.Boni, Boni{
			Attribute: Vitality,
			Value:     10,
		})
	}

	return item
}
