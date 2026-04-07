#!/bin/bash
set -e

# Render/Dashboard задают NEXT_PUBLIC_API_URL при сборке. Локально без env — как dev-прокси на API.
export NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL:-http://127.0.0.1:5050}

echo "Building with NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL"

# Устанавливаем зависимости и собираем проект
npm install
npm run build
