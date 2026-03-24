#!/bin/bash
set -e

echo "Building React..."
cd website/frontend
npm run build

echo "Copying to Spring Boot static..."
cd ../..
rm -rf website/src/main/resources/static
cp -r website/frontend/build website/src/main/resources/static

echo "Committing and pushing..."
git add website/src/main/resources/static
git commit -m "update frontend build"
git push

echo "Done! Railway will redeploy now."