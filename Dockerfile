FROM node:22-bookworm-slim

WORKDIR /app

# Install build dependencies for better-sqlite3
RUN apt-get update && apt-get install -y \
	python3 \
	make \
	g++ \
	&& rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package.json package-lock.json* ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source files
COPY . .

# Build-time env needed by drizzle.config.js, svelte-kit build analysis
# (dashboard +page.ts imports db, which requires DATABASE_URL)
ARG DATABASE_URL=local.db
ENV DATABASE_URL=${DATABASE_URL}

# Run svelte-kit sync
RUN npx svelte-kit sync

# Build the app
RUN npm run build

# Run migrations and seed
RUN npm run db:migrate
RUN npm run db:seed

EXPOSE 4173
ENV PORT=4173

CMD ["node", "build/index.js"]
