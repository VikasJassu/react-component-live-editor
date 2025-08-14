#!/bin/bash

# React Live Inspector Backend Startup Script

echo "🚀 Starting React Live Inspector Backend..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ and try again."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js version 16+ is required. Current version: $(node -v)"
    exit 1
fi

# Create data directory if it doesn't exist
mkdir -p data

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  No .env file found. Creating from .env.example..."
    cp .env.example .env
    echo "✅ Created .env file. Please review and update the configuration."
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d node_modules ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start the server
echo "🌟 Starting server..."
if [ "$NODE_ENV" = "production" ]; then
    npm start
else
    npm run dev
fi