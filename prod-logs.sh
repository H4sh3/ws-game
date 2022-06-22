#!/bin/bash

ssh $PROD 'cd /opt/game/ws-game && docker-compose logs -f '