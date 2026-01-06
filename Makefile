.PHONY: help setup dev build test lint clean

help: ## Show this help message
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

setup: ## Install all dependencies
	npm install

dev: ## Start all packages in development mode
	npm run dev

dev-api: ## Start API in development mode
	npm run dev --workspace=@scp-viewer/api

dev-viewer: ## Start viewer in development mode
	npm run dev --workspace=@scp-viewer/viewer

build: ## Build all packages
	npm run build

build-api: ## Build API package
	npm run build --workspace=@scp-viewer/api

build-viewer: ## Build viewer package
	npm run build --workspace=@scp-viewer/viewer

test: ## Run all tests
	npm run test

test-api: ## Run API tests
	npm run test --workspace=@scp-viewer/api

test-viewer: ## Run viewer unit tests
	npm run test --workspace=@scp-viewer/viewer

test-mcp: ## Run mcp unit tests
	npm run test --workspace=@scp-viewer/mcp

test-e2e: ## Run E2E tests (Playwright)
	npm run test:e2e

test-e2e-ui: ## Run E2E tests with UI
	npm run test:e2e:ui --workspace=@scp-viewer/viewer


test-docker: build-docker ## Run e2e tests in Docker
	docker-compose --profile test up e2e && docker compose down

lint: ## Run linter on all packages
	npm run lint


up: ## Start all Docker services
	docker compose up -d

down: ## Stop all Docker services
	docker compose down

restart: down build-docker up ## Restart all Docker services (rebuilding them for changes)

build-docker: ## Build all Docker images
	docker compose build

rebuild-docker: ## Force rebuild Docker images (no cache)
	docker compose build --no-cache

scan: ## Run scanner to populate graph (uses ./data or V_DATA)
	docker compose --profile scan up scanner


test-e2e-docker: ## Run E2E tests in Docker
	docker compose --profile test up --abort-on-container-exit e2e

neo4j-shell: ## Open Neo4j Cypher shell
	docker compose exec neo4j cypher-shell -u neo4j -p scpviewer

neo4j-clear: ## Clear all data from Neo4j
	docker compose exec neo4j cypher-shell -u neo4j -p scpviewer "MATCH (n) DETACH DELETE n"

clean: ## Clean build artifacts and node_modules
	rm -rf node_modules/
	rm -rf packages/*/node_modules/
	rm -rf packages/*/dist/
	rm -rf test-results/

clean-docker: down ## Stop and remove Docker volumes
	docker compose down -v

clean-all: clean clean-docker ## Full cleanup
