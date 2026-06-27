#!/bin/bash
set -e

cd "$(dirname "$0")"

echo "==> Installing dependencies..."
pnpm install

echo "==> Running type check & lint..."
pnpm exec vue-tsc --noEmit --project apps/desktop/tsconfig.json
pnpm lint

echo "==> Building Tauri app..."
pnpm tauri build

echo "==> Replacing /Applications/DBX.app..."
APP_PATH="src-tauri/target/release/bundle/macos/DBX.app"
if [ -d "$APP_PATH" ]; then
  rm -rf /Applications/DBX.app
  cp -R "$APP_PATH" /Applications/DBX.app
  echo "==> /Applications/DBX.app replaced successfully."
else
  echo "ERROR: $APP_PATH not found. Build may have failed."
  exit 1
fi

echo "==> Pushing to aho1ic..."
git push aho1ic main

echo "==> All done!"
