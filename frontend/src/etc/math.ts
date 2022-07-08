export function radToDeg(radians: number) {
    var pi = Math.PI;
    return radians * (180 / pi);
}

export function degToRad(degrees: number) {
    var pi = Math.PI;
    return degrees * (pi / 180);
}

export function map(v: number, s1: number, e1: number, s2: number, e2: number) {
    return (v - s1) / (e1 - s1) * (e2 - s2) + s2;
}

export function randInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1) + min)
}

export function isBetween(value: number, low: number, high: number) {
    return value >= low && value <= high
}
