Rememeber to set the .env

EXAMPLE:

Postgres settings
POSTGRES_USER=myuser 
POSTGRES_PASSWORD=mypassword 
POSTGRES_DB=mydb 
POSTGRES_HOST=db 
POSTGRES_PORT=5432

App Configuration
SECRET_KEY=your-super-secret-key-for-development 
DEBUG=true 
ENVIRONMENT=development 
APP_NAME=disaster-response-api APP_VERSION=1.0.0

prestart:
    image: prestart_api_service
    build:
      context: .
      dockerfile: api_service/Dockerfile
    container_name: prestart
    networks:
      - default
    depends_on:
        db:
          condition: service_healthy
          restart: true
    command: bash scripts/prestart.sh
    env_file:
      - .env

 # For the API service
  web:
    image: api_service:latest
    build:
      context: .
      dockerfile: api_service/Dockerfile
    container_name: api_service
    depends_on:
      db:
        condition: service_healthy
    restart: always
    env_file:
      - .env
    ports:
      - "8000:8000"
    networks:
      - default

