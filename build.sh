#!/usr/bin/env bash
# Exit on error
set -o errexit

echo "--- Installing Python Dependencies ---"
pip install --upgrade pip
pip install -r requirements.txt

echo "--- Building Frontend Static Bundle ---"
cd frontend
npm install
npm run build
cd ..

echo "--- Seeding Database ---"
python scripts/seed_db.py

echo "--- Build Completed Successfully ---"
