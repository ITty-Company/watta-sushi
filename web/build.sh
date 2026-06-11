#!/bin/bash
set -e

# Render/Dashboard задают NEXT_PUBLIC_API_URL при сборке. Локально без env — как dev-прокси на API.
export NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL:-http://127.0.0.1:5050}

echo "Building with NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL"

# Production оптимизации для сборки
export NODE_OPTIONS="--max-old-space-size=4096"

# Install dependencies BEFORE setting NODE_ENV=production — иначе npm может
# не установить devDependencies (cssnano нужен для PostCSS).
echo "📦 Installing dependencies..."
npm install --no-audit --no-fund --include=dev

# Production mode для сборки Next.js
export NODE_ENV=production

# Patcheмо Fontsource CSS: font-display: swap → optional
# Зменшує FOIT/FOUT без блокування рендерингу тексту.
echo "🔤 Patching font-display: swap → optional in Fontsource CSS..."
node -e "
const{readdirSync,readFileSync,writeFileSync,statSync}=require('fs');
const{join}=require('path');
const src='node_modules/@fontsource';
let patched=0;
readdirSync(src).forEach(d=>{
  const dp=join(src,d);
  try{if(!statSync(dp).isDirectory())return;}catch(e){return;}
  readdirSync(dp).forEach(f=>{
    if(!f.endsWith('.css'))return;
    const fp=join(dp,f);
    const c=readFileSync(fp,'utf8');
    const u=c.replace(/font-display:\s*swap/g,'font-display: optional');
    if(c!==u){writeFileSync(fp,u);patched++;}
  });
});
console.log('   Patched '+patched+' Fontsource CSS files.');
"

# Next.js build с production оптимизацией
npm run build
