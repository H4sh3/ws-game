#!/bin/bash

ssh $PROD 'cd /opt/game && /opt/game/update.sh'

cd frontend
yarn build
scp -r dist/* $PROD:/opt/game/frontend/
