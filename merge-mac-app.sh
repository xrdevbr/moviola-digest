#!/bin/sh

APP_NAME="Moviola Digest"
APP_PATH="./out/${APP_NAME}-darwin-"
OUTPUT_DIR="./out/${APP_NAME}-darwin-universal"

rm -rf "${OUTPUT_DIR}"
mkdir -p "${OUTPUT_DIR}/${APP_NAME}.app"

cp -R "${APP_PATH}x64/${APP_NAME}.app/" "${OUTPUT_DIR}/${APP_NAME}.app"
rm "${OUTPUT_DIR}/${APP_NAME}.app/Contents/MacOS/${APP_NAME}"

lipo -create -output "${OUTPUT_DIR}/${APP_NAME}.app/Contents/MacOS/${APP_NAME}" \
  "${APP_PATH}x64/${APP_NAME}.app/Contents/MacOS/${APP_NAME}" \
  "${APP_PATH}arm64/${APP_NAME}.app/Contents/MacOS/${APP_NAME}"