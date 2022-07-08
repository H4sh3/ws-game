import './styles/index.css';

import * as PIXI from 'pixi.js';
import { Game } from './main';
import { SCREEN_SIZE } from './etc/const';

import InventoryComponent from './components/inventoryComponent';

import React from 'react';
import * as ReactDOM from 'react-dom';
import { InventoryStore } from './inventoryStore';
import { UserStore } from './userStore';
import BuilderComponent from './components/builderComponent';

const load = (app: PIXI.Application, asset: string) => {
    return new Promise<void>((resolve) => {
        app.loader.add(asset).load(() => {
            resolve();
        });
    });
};

const main = async () => {
    // Main app


    const app = new PIXI.Application({ width: SCREEN_SIZE, height: SCREEN_SIZE });

    // Load assets
    await load(app, 'assets/stone.png');
    await load(app, 'assets/brick.png');
    await load(app, 'assets/cursor.png');
    await load(app, 'assets/blockade.png');
    await load(app, 'assets/tree.png');
    await load(app, 'assets/log.png');
    await load(app, 'assets/ironOre.png');
    await load(app, 'assets/grass.png');

    await load(app, 'assets/sounds/hit1.wav');
    await load(app, 'assets/sounds/hit2.wav');
    await load(app, 'assets/sounds/treeHit1.wav');

    const tileTextures = ["grass1.png", "grass2.png", "grass3.png",
        "sand1.png", "sand2.png", "sand3.png",
        "shallowWater.png",
        "water.png"
    ]

    for (let i = 0; i < tileTextures.length; i++) {
        const t = tileTextures[i]
        await load(app, `assets/${t}`)
    }

    const loadingDiv = document.getElementById("loadingSpinner")
    loadingDiv.style.display = "none"

    for (let i = 0; i <= 6; i++) {
        await load(app, `assets/human/tile00${i}.png`);
    }

    const x = document.getElementById("mainView")
    if (x) {
        x.appendChild(app.view);
    }


    // Init Stores
    const inventoryStore = new InventoryStore()
    const userStore = new UserStore()

    // Set scene
    var scene = new Game(app, inventoryStore, userStore);
    app.stage.addChild(scene);

    ReactDOM.render(<InventoryComponent inventoryStore={inventoryStore} />, document.getElementById("inventoryDiv"));
    ReactDOM.render(<BuilderComponent inventoryStore={inventoryStore} />, document.getElementById("builderDiv"));

    const licenseDive = document.getElementById("licenseDiv")
    licenseDive.style.display = "flex"
};


main();

