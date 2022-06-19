import './styles/index.css';

import * as PIXI from 'pixi.js';
import { Game } from './main';

const load = (app: PIXI.Application, asset: string) => {
    return new Promise<void>((resolve) => {
        app.loader.add(asset).load(() => {
            resolve();
        });
    });
};

const main = async () => {
    // Main app
    const app = new PIXI.Application({ width: 500, height: 500 });

    // Load assets
    await load(app, 'assets/stone.png');
    await load(app, 'assets/player0.png');
    await load(app, 'assets/brick.png');
    await load(app, 'assets/cursor.png');
    await load(app, 'assets/blockade.png');


    const x = document.getElementById("mainView")
    if (x) {
        x.appendChild(app.view);
    }

    // Set scene
    var scene = new Game(app);
    app.stage.addChild(scene);
};

main();
