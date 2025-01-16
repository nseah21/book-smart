#!/bin/bash

echo "----- user_data.sh -----"
APP_DIR="/srv/booksmart-backend"

sudo apt-get update

echo "----- Setting up docker... -----"
sudo apt-get install ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

echo "----- Setting up github repository... -----"
echo "${GITHUB_DEPLOY_KEY}" > /root/.ssh/id_ed25519
chmod 600 /root/.ssh/id_ed25519
ssh-keyscan -t ed25519 github.com >> /root/.ssh/known_hosts
git clone git@github.com:nseah21/book-smart.git $APP_DIR
# sudo chown -R ubuntu:ubuntu $APP_DIR
cd $APP_DIR/backend
git checkout feat/deploy

echo "----- Running docker compose... -----"
APP_PASSWORD=${APP_PASSWORD} \
EMAIL_SENDER=${EMAIL_SENDER} \
OPENAI_API_KEY=${OPENAI_API_KEY} \
docker compose up


# #!/bin/bash
# echo "----- user_data.sh -----"
# APP_DIR="/srv/booksmart-backend"

# # Update
# sudo apt update

# # Set up github
# echo "${GITHUB_DEPLOY_KEY}" > /root/.ssh/id_ed25519
# chmod 600 /root/.ssh/id_ed25519
# ssh-keyscan -t ed25519 github.com >> /root/.ssh/known_hosts
# GIT_SSH_COMMAND="ssh -v" git clone git@github.com:nseah21/book-smart.git $APP_DIR

# # Set up server
# sudo add-apt-repository -y ppa:deadsnakes/ppa
# sudo apt install -y python3.12 python3.12-venv libpq-dev libpython3.12-dev lib32ncurses5-dev # dependencies needed for psycopg2
# cd $APP_DIR/backend
# python3.12 -m venv venv
# source venv/bin/activate
# python3 --version
# pip install -r requirements.txt
# sudo chown -R ubuntu:ubuntu $APP_DIR

# # Run server

# APP_PASSWORD=${APP_PASSWORD} \
# EMAIL_SENDER=${EMAIL_SENDER} \
# OPENAI_API_KEY=${OPENAI_API_KEY} \
# uvicorn app.main:app 

