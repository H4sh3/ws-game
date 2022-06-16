#!/bin/bash

ssh ansible@gymcadia.com 'cd /opt/game && /opt/game/update.sh'

cd frontend
yarn build
scp -r dist/* ansible@gymcadia.com:/opt/game/frontend/
scp -r assets ansible@gymcadia.com:/opt/game/frontend/
