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
    await load(app, 'assets/player0.png');
    await load(app, 'assets/brick.png');
    await load(app, 'assets/cursor.png');
    await load(app, 'assets/blockade.png');
    await load(app, 'assets/tree.png');
    await load(app, 'assets/log.png');
    await load(app, 'assets/ironOre.png');

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
};


main();

