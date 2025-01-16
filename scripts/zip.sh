CURR_DIR_NAME=${PWD##*/}
BUILD_DIR="./deployment"

git archive HEAD -o ${BUILD_DIR}/${CURR_DIR_NAME}.zip
