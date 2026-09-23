package config

import "os"

type Config struct {
	AppEnv         string
	Port           string
	DatabaseURL    string
	CorsOrigins    string
	MigrationsPath string
}

func Load() Config {
	return Config{
		AppEnv:         env("APP_ENV", "development"),
		Port:           env("PORT", "8080"),
		DatabaseURL:    env("DATABASE_URL", "postgres://umutungo:umutungo@localhost:5432/umutungo?sslmode=disable"),
		CorsOrigins:    env("CORS_ORIGINS", "http://localhost:3000"),
		MigrationsPath: env("MIGRATIONS_PATH", "migrations/001_init.sql"),
	}
}

func env(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
