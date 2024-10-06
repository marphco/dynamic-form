#!/bin/bash
cd "$(dirname "$0")"  # Assicurati di essere nella directory del backend
source venv/bin/activate  # Attiva l'ambiente virtuale
uvicorn main:app --reload
