#!/bin/bash

# Script para verificar endpoints del backend
# Uso: ./check-backend.sh https://tu-backend.railway.app

if [ -z "$1" ]; then
  echo "❌ Error: Debes proporcionar la URL del backend"
  echo "Uso: $0 https://tu-backend.railway.app"
  exit 1
fi

BACKEND_URL="$1"

echo "🔍 Verificando endpoints del backend: $BACKEND_URL"
echo ""
echo "========================================="
echo "1️⃣ Probando /home"
echo "========================================="
curl -i "$BACKEND_URL/home" 2>/dev/null | head -20
echo ""
echo ""

echo "========================================="
echo "2️⃣ Probando /api/home"
echo "========================================="
curl -i "$BACKEND_URL/api/home" 2>/dev/null | head -20
echo ""
echo ""

echo "========================================="
echo "3️⃣ Probando /rutas"
echo "========================================="
curl -i "$BACKEND_URL/rutas" 2>/dev/null | head -20
echo ""
echo ""

echo "========================================="
echo "4️⃣ Probando /api/rutas"
echo "========================================="
curl -i "$BACKEND_URL/api/rutas" 2>/dev/null | head -20
echo ""
echo ""

echo "========================================="
echo "📋 RESUMEN"
echo "========================================="
echo ""
echo "Si ves 'HTTP/1.1 200 OK' en /home y /rutas:"
echo "  → NEXT_PUBLIC_API_URL=$BACKEND_URL"
echo ""
echo "Si ves 'HTTP/1.1 200 OK' en /api/home y /api/rutas:"
echo "  → NEXT_PUBLIC_API_URL=$BACKEND_URL/api"
echo ""
echo "Si todos dan 404:"
echo "  → Verifica que el backend esté corriendo y las rutas existan"
echo ""
