#!/bin/bash
set -e

# Экспортируем переменную окружения для билда
export NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL:-https://watta-sushi-9qfh.onrender.com}

echo "Building with NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL"

# Устанавливаем зависимости и собираем проект
npm install
npm run build
