#!/bin/bash

echo "Building the proyect..."

python3.9 -m pip install -r requirements.txt

echo "Make migrations..."
python3.9 manage.py makemigrations --noinput
python3.9 manage.py migrate --noinput

echo "Collect statics"
python3.9 manage.py collectstatic --noinput --clear
