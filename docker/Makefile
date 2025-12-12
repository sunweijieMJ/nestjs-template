# Docker Compose shortcuts
# Usage: make [target]
#
# Examples:
#   make pg-dev      # Start PostgreSQL development environment
#   make mongo-dev   # Start MongoDB development environment
#   make pg-test     # Run tests with PostgreSQL
#   make mongo-ci    # Run CI with MongoDB

COMPOSE = docker compose
BASE = -f docker-compose.base.yaml
PG = -f docker-compose.postgres.yaml
MONGO = -f docker-compose.mongo.yaml
DEV = -f docker-compose.dev.yaml
TEST = -f docker-compose.test.yaml
CI = -f docker-compose.ci.yaml

.PHONY: help pg-dev pg-test pg-ci mongo-dev mongo-test mongo-ci down clean logs

help:
	@echo "Available targets:"
	@echo "  pg-dev     - Start PostgreSQL development environment"
	@echo "  pg-test    - Start PostgreSQL test environment"
	@echo "  pg-ci      - Run CI with PostgreSQL"
	@echo "  mongo-dev  - Start MongoDB development environment"
	@echo "  mongo-test - Start MongoDB test environment"
	@echo "  mongo-ci   - Run CI with MongoDB"
	@echo "  down       - Stop all containers"
	@echo "  clean      - Stop and remove all containers, volumes"
	@echo "  logs       - Show logs"

# PostgreSQL environments
pg-dev:
	$(COMPOSE) $(BASE) $(PG) $(DEV) up --build

pg-test:
	$(COMPOSE) $(BASE) $(PG) $(TEST) up --build

pg-ci:
	$(COMPOSE) $(BASE) $(PG) $(CI) up --build --abort-on-container-exit
	$(COMPOSE) $(BASE) $(PG) $(CI) down

# MongoDB environments
mongo-dev:
	$(COMPOSE) $(BASE) $(MONGO) $(DEV) up --build

mongo-test:
	$(COMPOSE) $(BASE) $(MONGO) $(TEST) up --build

mongo-ci:
	$(COMPOSE) $(BASE) $(MONGO) $(CI) up --build --abort-on-container-exit
	$(COMPOSE) $(BASE) $(MONGO) $(CI) down

# Utilities
down:
	$(COMPOSE) $(BASE) $(PG) down 2>/dev/null || true
	$(COMPOSE) $(BASE) $(MONGO) down 2>/dev/null || true

clean:
	$(COMPOSE) $(BASE) $(PG) down -v --remove-orphans 2>/dev/null || true
	$(COMPOSE) $(BASE) $(MONGO) down -v --remove-orphans 2>/dev/null || true

logs:
	$(COMPOSE) $(BASE) $(PG) logs -f api 2>/dev/null || $(COMPOSE) $(BASE) $(MONGO) logs -f api
