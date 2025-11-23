# Transição de Software Legado

Este projeto é um trabalho acadêmico que consiste na reescrita completa de um sistema legado desenvolvido em Java, migrando sua lógica e funcionalidades para um novo sistema web baseado em Python utilizando o framework Django. Além disso, implementa algumas funcionalidades novas, fornecendo uma interface para gerenciar clientes, fornecedores, funcionários, produtos e vendas, com APIs simples para integração.


## Pré-requisitos

- Git
- Python 3.10 ou superior
- PostgreSQL (ou SQLite para desenvolvimento local)
- PgAdmin (opcional, para gerenciamento do banco PostgreSQL)

## Instalação

### 1. Clone o repositório

```bash
git clone https://github.com/Vitor-Calliari/transicao_software.git
cd transicao_software
```

### 2. Crie um ambiente virtual

**Windows (PowerShell):**

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

**Linux/Mac:**

```bash
python3 -m venv venv
source venv/bin/activate
```

### 3. Instale as dependências

```bash
pip install -r requirements.txt
```

### 4. Configure o arquivo .env

Crie um arquivo `.env` na raiz do projeto baseado no template abaixo.
Para desenvolvimento local, você pode usar SQLite alterando as configurações no `core/settings.py`.

```bash
# Configurações do banco de dados PostgreSQL
DB_NAME=nome_do_banco_aqui
DB_USER=user_do_postgres_aqui
DB_PASSWORD=senha_do_postgres_aqui
DB_HOST=host_utilizado_aqui
DB_PORT=porta_utilizada_aqui

# Chave secreta do Django (gere uma nova para produção)
SECRET_KEY=secret_key_do_django_aqui

# Debug (True para desenvolvimento, False para produção)
DEBUG=True
```

**Nota:** Para gerar uma nova `SECRET_KEY`, você pode usar o comando: `python -c "import secrets; print(secrets.token_urlsafe(50))"`

### 5. Execute as migrações do banco de dados

```bash
python manage.py migrate
```

## Uso

### Executar o servidor de desenvolvimento

```bash
python manage.py runserver
```

Acesse a aplicação em `http://127.0.0.1:8000/`.

### Páginas principais

- **Home**: `http://127.0.0.1:8000/`
- **Login**: `http://127.0.0.1:8000/login/`
- **Dashboard**: `http://127.0.0.1:8000/dashboard/`
- **Clientes**: `http://127.0.0.1:8000/clientes/`
- **Admin**: `http://127.0.0.1:8000/admin/` (superusuário)
