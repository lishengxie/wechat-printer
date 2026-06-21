# ---- Build Stage ----
FROM golang:alpine AS builder
RUN apk add --no-cache gcc musl-dev
WORKDIR /build
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=1 go build -o api ./cmd/api/main.go

# ---- Runtime Stage ----
FROM alpine:latest
RUN apk add --no-cache ca-certificates tzdata
WORKDIR /app
COPY --from=builder /build/api .
EXPOSE 8080
CMD ["./api"]
