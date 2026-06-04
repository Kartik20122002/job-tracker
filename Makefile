.PHONY: up down build logs migrate seed reset-db shell dev dev-down

# Production (default)
up:
	docker compose up -d

down:
	docker compose down

build:
	docker compose build

logs:
	docker compose logs -f app

migrate:
	docker compose exec app npx prisma migrate deploy

migrate-dev:
	docker compose exec app npx prisma migrate dev

seed:
	docker compose exec app npm run seed

reset-db:
	docker compose exec app npx prisma migrate reset --force

shell:
	docker compose exec app sh

# Development (hot reload)
dev:
	docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build

dev-down:
	docker compose -f docker-compose.yml -f docker-compose.dev.yml down
