# Docker Compose shortcuts
# Usage: make [target]
#
# Examples:
#   make dev      # Start PostgreSQL development environment
#   make test     # Run tests with PostgreSQL
#   make ci       # Run CI with PostgreSQL

COMPOSE = docker compose
BASE = -f docker-compose.base.yaml
REDIS = -f docker-compose.redis.yaml
PG = -f docker-compose.postgres.yaml
DEV = -f docker-compose.dev.yaml
TEST = -f docker-compose.test.yaml
CI = -f docker-compose.ci.yaml

.PHONY: help dev test ci down clean logs

help:
	@echo "Available targets:"
	@echo "  dev     - Start PostgreSQL development environment"
	@echo "  test    - Start PostgreSQL test environment"
	@echo "  ci      - Run CI with PostgreSQL"
	@echo "  down    - Stop all containers"
	@echo "  clean   - Stop and remove all containers, volumes"
	@echo "  logs    - Show logs"

# PostgreSQL environments
dev:
	$(COMPOSE) $(BASE) $(REDIS) $(PG) $(DEV) up --build

test:
	$(COMPOSE) $(BASE) $(REDIS) $(PG) $(TEST) up --build

ci:
	$(COMPOSE) $(BASE) $(REDIS) $(PG) $(CI) up --build --abort-on-container-exit
	$(COMPOSE) $(BASE) $(REDIS) $(PG) $(CI) down

# Utilities
down:
	$(COMPOSE) $(BASE) $(REDIS) $(PG) down

clean:
	$(COMPOSE) $(BASE) $(REDIS) $(PG) down -v --remove-orphans

logs:
	$(COMPOSE) $(BASE) $(REDIS) $(PG) logs -f api
