#!/usr/bin/env bash
set -o errexit
set -o pipefail
set -o nounset

python -m pip install --upgrade pip
pip install -r requirements.txt
python manage.py collectstatic --noinput
python manage.py migrate
python manage.py create_initial_admin
