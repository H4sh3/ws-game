import { CompositeTilemap } from "@pixi/tilemap"
import * as PIXI from "pixi.js"
import { Text } from "pixi.js"
import { SCREEN_SIZE } from "../etc/const"
import { CellDataEvent, createVector } from "../events/events"
import Vector from "../types/vector"

const height = 150
const width = 150

const BlankBase64Tile1 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAIAAAAC64paAAADE3pUWHRSYXcgcHJvZmlsZSB0eXBlIGV4aWYAAHja7ZZbktwqDIbfWUWWgCSExHIwhqqzgyw/P5h2uieXM6k8parNGLDAktAnuSf0r/+N8AUXR/aQ1DyXnCOuVFLhionH66qrp5hWfz2kvUav8nAvMESCUa5Hz1veIWfs5y1vW0+FXJ8Ulb4XjteFuhWxbwNb/jAkdBmI51ZUtyLhbXl7eGzLubg9H2G/N49Pe1x3mF0S46yZLKFPHM1ywdw5JkPczumo2LJ/G/r4HB5bGT5xF5K4er+8lHmzVIyGngShQm9LwktiK74xABlcgOayY9vjHc2X2DzGX1zhM8fa6fCC+57tNAg/LHxIg9y3XD7Qy/e45OHjAunPcS+mTx5Zug3zi0fGt434jHXeY5w+Rr9OV1PGkfM+1OMkFOYMG4+ZBOu1jGa4FXNbraA5yqUB9RlbPNAaFWIgHpTopEojUF+TRg0+Ju4M15i5sSyZg0XhJhN6mo0GmxQ5xYG/IVUEUh4jbF9o2S3LXiOH5ZOwlQnKaOXS/7TwmU2/a2PMWiIKu2boAswz7eHGJDd7bAMRGjuougL8aK8JucEKEOoKs+OANR6XikPpe27JAi3YpxivGiM7r/enogTbCmdQSYliJlHKhHxgI0IgHYAqRWdJfIAAqfIJJzmJZLBBEcB0wDtGay8rX3J8JUFCJaM4HYQqYKWkyB9LjhyqKppUNaupa9GaJaeACsvZ8vzcVhNLppbNzK1YdfHk6tnN3YvXwkXwNdaCcixeSqkVNis01xwq9ldIDj7kSIce+bDDj3LUhvRpqWnLzZq30urJp5yo4zOfdvpZztqpI5V66hp67ta9l14Hcm3ISENHHjZ8lFFvapvqD+0PqNGmxovU3Gc3NUjNrjGsfIGSyQzEOBGI2ySAhObJLDqlxJPcZBYLoyqU4aRONifFSplTkNSJddDN7ju5P+IWcvotN/4suTDR/SW5xS10feL2E2rn/Nlui9hVhTOmUVB9DXFw/OHHFGN4TP52fCt6K3oreit6K3oreiv6ZxUJ/nUo4RsmUbkWwkJJTwAAAYVpQ0NQSUNDIHByb2ZpbGUAAHicfZE9SMNQFIVPU6WilQ52EHHIUJ0siIo6ahWKUCHUCq06mLz0R2jSkKS4OAquBQd/FqsOLs66OrgKguAPiKOTk6KLlHhfUmgR44XH+zjvnsN79wFCvcw0q2MU0HTbTCcTYja3IoZeEUIPIghgSmaWMStJKfjW1z31Ud3FeZZ/35/Vq+YtBgRE4hlmmDbxOvHkpm1w3ieOspKsEp8Tj5h0QeJHrisev3EuuizwzKiZSc8RR4nFYhsrbcxKpkY8QRxTNZ3yhazHKuctzlq5ypr35C8M5/XlJa7TGkQSC1iEBBEKqthAGTbitOukWEjTecLHP+D6JXIp5NoAI8c8KtAgu37wP/g9W6swPuYlhRNA54vjfAwBoV2gUXOc72PHaZwAwWfgSm/5K3Vg+pP0WkuLHQGRbeDiuqUpe8DlDtD/ZMim7EpBWkKhALyf0TflgL5boHvVm1vzHKcPQIZmlboBDg6B4SJlr/m8u6t9bv/2NOf3A01acpjSC2rjAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH5gcLDwISoztd2QAAABl0RVh0Q29tbWVudABDcmVhdGVkIHdpdGggR0lNUFeBDhcAAAAdSURBVDjLY0xKSmIgFzAxUABGNY9qHtU8qplyzQDbKwFOi4VA/gAAAABJRU5ErkJggg=="
const BlankBase64Tile2 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAIAAAAC64paAAADF3pUWHRSYXcgcHJvZmlsZSB0eXBlIGV4aWYAAHja7ZdbktwqDIbfWUWWgCSExHKwgaqzgyw/P5h2uieXM6k8parNGLDAktAndfeE/vW/Eb7g4igxJDXPJeeIK5VUuGLi8brq6imm1V8Paa/RqzzcCwyRYJTr0fOWd8gZ+3nLz62nQq5PikrfC8frQt2K2LeBLX8YEroMxLYV1a1IeFveHh7bci5uz0fY783j0x7XHWaXxDhrJkvoE0ezXDB3jskQtzYdFVv2b0Mfn8NjKyLP3IUkrt4vL2XeLBWjoSdBqNDbkkx5krziGwOQwQVoLju2Pd7RfInNY/zFFT5zrJ0OL7jv2U6D8MPChzTIfcvlA718j0sePi6Q/hz3YvrkkaXbML94ZHLbiM9Y5z1G8zH6dbqaMo6c96EeJ6EwZ9h4zCRYr2U0w62Y22oFzVEuJ1C3eMYD7aRCDMSDEjWqNAL1NTnphI+JOxtG5pNlyRwsCp8yoafZaLBJkSYO/CdSRSDlMcL2hZbdsuyd5LDcCFuZoIxWLv1PC5/Z9Ls2xqwlorBrhi7APNMebkxys8c2EKGxg6orwI/2mpAbrAChrjA7Dljjcak4lL7nlizQgn2K8aoxsna9PxUl2FY4g0pKFDOJUqZozEaEQDoAVYrOkvgAAVLlBic5iWSwQRHAdMA7RmsvK19yfEqChEpGcToIVcBKSZE/lhw5VFU0qWpWU9eiNUtOARWWs+X5cVtNLJlaNjO3YtXFk6tnN3cvXgsXwaexFpRj8VJKrbBZobnmULG/QnLwIUc69MiHHX6Uo55InzOdeubTTj/LWRs3aajjlps1b6XVTh2p1FPX0HO37r30OpBrQ0YaOvKw4aOMelPbVH9of0CNNjVepOY+u6lBanaNYeULlExmIMaJQNwmASQ0T2bRKSWe5CazWBhVoQwndbJpFCtlTkFSJ9ZBN7vv5P6IW8jpt9z4s+TCRPeX5Ba30PWJ20+otfm1fS5iVxXOmEZB9WFvZccfvk3Zw2Pyt+Nb0VvRW9Fb0VvRW9Fb0b+rSAZ+POA/yvANLFu6Q7CxW5QAAAGFaUNDUElDQyBwcm9maWxlAAB4nH2RPUjDUBSFT1OlopUOdhBxyFCdLIiKOmoVilAh1AqtOpi89Edo0pCkuDgKrgUHfxarDi7Oujq4CoLgD4ijk5Oii5R4X1JoEeOFx/s4757De/cBQr3MNKtjFNB020wnE2I2tyKGXhFCDyIIYEpmljErSSn41tc99VHdxXmWf9+f1avmLQYEROIZZpg28Trx5KZtcN4njrKSrBKfE4+YdEHiR64rHr9xLros8MyomUnPEUeJxWIbK23MSqZGPEEcUzWd8oWsxyrnLc5aucqa9+QvDOf15SWu0xpEEgtYhAQRCqrYQBk24rTrpFhI03nCxz/g+iVyKeTaACPHPCrQILt+8D/4PVurMD7mJYUTQOeL43wMAaFdoFFznO9jx2mcAMFn4Epv+St1YPqT9FpLix0BkW3g4rqlKXvA5Q7Q/2TIpuxKQVpCoQC8n9E35YC+W6B71Ztb8xynD0CGZpW6AQ4OgeEiZa/5vLurfW7/9jTn9wNNWnKY0gtq4wAAAAlwSFlzAAALEwAACxMBAJqcGAAAAAd0SU1FB+YHCw8CL/tTEcgAAAAZdEVYdENvbW1lbnQAQ3JlYXRlZCB3aXRoIEdJTVBXgQ4XAAAAHUlEQVQ4y2N0cHBgIBcwMVAARjWPah7VPKqZcs0A9cEA6ApUQisAAAAASUVORK5CYII="
const BlankBase64Tile3 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAIAAAAC64paAAABhGlDQ1BJQ0MgcHJvZmlsZQAAKJF9kT1Iw0AcxV9TpaVUFKwg4pChOlkQFXHUKhShQqgVWnUwufQLmjQkKS6OgmvBwY/FqoOLs64OroIg+AHi6OSk6CIl/i8ptIj14Lgf7+497t4BQr3MNKtrHNB020wl4mImuyoGXhFACAPoQ1BmljEnSUl0HF/38PH1LsazOp/7c/SoOYsBPpF4lhmmTbxBPL1pG5z3iSOsKKvE58RjJl2Q+JHrisdvnAsuCzwzYqZT88QRYrHQxkobs6KpEU8RR1VNp3wh47HKeYuzVq6y5j35C8M5fWWZ6zSHkcAiliBBhIIqSijDRoxWnRQLKdqPd/APuX6JXAq5SmDkWEAFGmTXD/4Hv7u18pMTXlI4DnS/OM7HCBDYBRo1x/k+dpzGCeB/Bq70lr9SB2Y+Sa+1tOgR0LsNXFy3NGUPuNwBBp8M2ZRdyU9TyOeB9zP6pizQfwuE1rzemvs4fQDS1FXyBjg4BEYLlL3e4d3B9t7+PdPs7wcKW3J93lb+vQAAAAlwSFlzAAALEwAACxMBAJqcGAAAAAd0SU1FB+YHChUQHnt0IOIAAAAZdEVYdENvbW1lbnQAQ3JlYXRlZCB3aXRoIEdJTVBXgQ4XAAAAEklEQVQ4y2NgGAWjYBSMgqELAATEAAHkcNQ6AAAAAElFTkSuQmCC"


class MiniMapHandler {
    container: PIXI.Container
    tilemap: CompositeTilemap
    playerPos: Vector

    // stores the base64png of each cell
    dataMatrix: { [keyX: number]: { [keyX: number]: PIXI.Texture; }; }
    blankTextures: PIXI.Texture[]

    oldSubCell: Vector

    constructor(playerPos: Vector) {
        this.container = new PIXI.Container()
        this.container.position.set(SCREEN_SIZE - (width / 2), height / 2)
        //this.container.position.set(SCREEN_SIZE / 2, SCREEN_SIZE / 2)
        this.playerPos = playerPos
        this.dataMatrix = []

        this.blankTextures = [
            new PIXI.Texture(new PIXI.BaseTexture(BlankBase64Tile1)),
            new PIXI.Texture(new PIXI.BaseTexture(BlankBase64Tile2)),
            new PIXI.Texture(new PIXI.BaseTexture(BlankBase64Tile3))
        ]

        this.oldSubCell = createVector(0, 0)
    }

    addTiles(event: CellDataEvent) {

        if (!(event.pos.x in this.dataMatrix)) {
            this.dataMatrix[event.pos.x] = []
        }

        const base = new PIXI.BaseTexture(event.subCellBase64);
        const texture = new PIXI.Texture(base);
        this.dataMatrix[event.pos.x][event.pos.y] = texture

        let minX = 0
        let minY = 0
        let maxX = 0
        let maxY = 0

        Object.keys(this.dataMatrix).forEach(x => {
            const xInt = parseInt(x)
            minX = xInt < minX ? xInt : minX
            maxX = xInt > maxX ? xInt : maxX

            Object.keys(this.dataMatrix[xInt]).forEach(y => {
                const yInt = parseInt(y)
                minY = yInt < minY ? yInt : minY
                maxY = yInt > maxY ? yInt : maxY
            })
        })
    }

    update(playerPos: Vector, gridCellSize: number, subCells: number) {
        // const aroundZero = (v: number) => v > -gridCellSize && v < gridCellSize
        // let subCelX =aroundZero(playerPos.x) ? 0 : Math.floor(Math.abs(playerPos.x) / gridCellSize)
        // let subCelY =aroundZero(playerPos.y) ? 0 : Math.floor(Math.abs(playerPos.y) / gridCellSize)

        // Calculating the players gridCell from his position
        // Example:
        // GCS -> GridCellSize = 1000
        // pos.x -1600 pos.y 1100
        // divide with GCS 
        // pos.x -1.6 pos.y 1.1
        // if we floor this we would get cell -2 1 but we want -1 1
        // To work around this we use the absolute value, divide it by the gridcellsize,floor it and add the sign back afterwards 
        const gridCelX = Math.floor(Math.abs(playerPos.x) / gridCellSize) * (playerPos.x < 0 ? -1 : 1)
        const gridCelY = Math.floor(Math.abs(playerPos.y) / gridCellSize) * (playerPos.y < 0 ? -1 : 1)

        if (this.tilemap !== undefined) {
            this.tilemap.destroy()
        }
        this.tilemap = new CompositeTilemap()

        const offsetRange = 5
        for (let x = -offsetRange; x < offsetRange; x++) {
            for (let y = -offsetRange; y < offsetRange; y++) {
                const tileIndexX = gridCelX + x
                const tileIndexY = gridCelY + y

                const tilePos = createVector(x * 20, y * 20)

                if (tileIndexX in this.dataMatrix) {
                    if (tileIndexY in this.dataMatrix[tileIndexX]) {
                        const texture = this.dataMatrix[tileIndexX][tileIndexY]

                        this.tilemap.tile(texture, tilePos.x, tilePos.y)
                        continue
                    }
                }

                const dist = createVector(x, y).dist(createVector(0, 0))
                if (dist >= 1 && dist <= 5) {
                    this.tilemap.tile(this.blankTextures[1], tilePos.x, tilePos.y)
                } else {
                    this.tilemap.tile(this.blankTextures[2], tilePos.x, tilePos.y)
                }
            }
        }


        const minimapTileSize = 20 // px
        const tX = -((playerPos.x / gridCellSize) * subCells) % minimapTileSize
        const tY = -((playerPos.y / gridCellSize) * subCells) % minimapTileSize
        this.tilemap.position.set(tX, tY)



        // remove previous tilemap just before we add the new one

        this.container.children.forEach(c => c.destroy())

        while (this.container.children[0]) {
            this.container.removeChild(this.container.children[0]);
        }

        const background = new PIXI.Graphics();
        background.beginFill(0x000000);
        background.drawRect(0, 0, width * 1.5, height * 1.5);
        background.endFill();
        background.position.set(-125, -100)
        this.container.addChild(background)

        this.container.addChild(this.tilemap)

        const topBar = new PIXI.Graphics();
        topBar.beginFill(0x666666);
        topBar.drawRect(0, 0, width * 1.6, 15);
        topBar.endFill();
        topBar.position.set(-125, -75)
        this.container.addChild(topBar)

        const text = new Text(`Zone ${gridCelX} ${gridCelY}`, { fontFamily: 'Arial Black', fontSize: 12, fill: 0xffffff, align: 'center' });
        text.position.set(-122, -74)
        this.container.addChild(text)


        const pixelSize = 2
        const pixel = new PIXI.Graphics();
        pixel.beginFill(0x000000);
        pixel.drawRect(0, 0, pixelSize, pixelSize);
        pixel.endFill();
        this.container.addChild(pixel)
    }
}

export default MiniMapHandler