package root

import (
	"math"
	"ws-game/shared"

	perl2 "github.com/aquilax/go-perlin"
)

type TerrainType string

const (
	Grass        TerrainType = "Grass"
	Water        TerrainType = "Water"
	ShallowWater TerrainType = "ShallowWater"
	Sand         TerrainType = "Sand"
)

type SubCell struct {
	Pos         shared.Vector `json:"pos"`
	TerrainType TerrainType   `json:"terrainType"`
}

func getTerrainType(noise float64) TerrainType {
	if noise < 0.35 {
		return Grass
	}
	if noise > 0.35 && noise < 0.45 {
		return Sand
	}
	if noise > 0.45 && noise < 0.49 {
		return ShallowWater
	}

	return Water
}

func getSubCells(cellX int, cellY int) []SubCell {
	alpha := 2.0
	beta := 2.0
	var n int32 = 3
	pn := perl2.NewPerlin(alpha, beta, n, 54000)

	cells := []SubCell{}

	for x := 0; x < SubCells; x++ {
		for y := 0; y < SubCells; y++ {
			mx := float64(x) * 0.05
			my := float64(y) * 0.05
			vx := (float64(cellX) + mx) * .5
			vy := (float64(cellY) + my) * .5
			nv := math.Abs(pn.Noise2D(vx, vy))

			// fmt.Printf("%f %f %f %f= %f\n", vx, vy, mx, my, nv)

			cells = append(cells, SubCell{
				Pos:         shared.Vector{X: x, Y: y},
				TerrainType: getTerrainType(nv),
			})
		}
	}
	return cells
}
