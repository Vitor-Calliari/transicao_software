# transicao_software


## Pré-requisitos

Git
Python 3.10+
PgAdmin


## Instalação
windowns

```bash
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

linux

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python3 manage.py migrate
python3 manage.py runserver


```