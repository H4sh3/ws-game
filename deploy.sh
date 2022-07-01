#!/bin/bash
start=`date +%s`


# build backend
ssh $PROD 'cd /opt/game && /opt/game/update.sh'

# build and deploy frontend
cd frontend
yarn build
#scp -r dist/* $PROD:/opt/game/frontend/
rsync -av -e ssh --exclude='*.map' dist/* $PROD:/opt/game/frontend/

# restart nginx for cache clear
ssh -t $PROD 'sudo /bin/systemctl restart nginx'

end=`date +%s`
runtime=$((end-start))
echo "All done in $runtime"