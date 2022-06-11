package shared

import (
	"testing"
)

func TestRandIntInRange(t *testing.T) {
	var lower int = -10
	var upper int = 50
	for i := 0; i < 1000; i++ {
		n := RandIntInRange(lower, upper)
		if n < lower || n > upper {
			t.Errorf("%d not between %d and %d", n, upper, lower)
		}
	}

}
