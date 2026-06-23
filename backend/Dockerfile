# ---- Build Stage ----
FROM golang:alpine AS builder
WORKDIR /build
COPY go.mod go.sum ./
ENV GOPROXY=https://goproxy.cn,direct
RUN go mod download
COPY . .
# 安装 CGO 编译工具链（go-sqlite3 需要）
RUN apk add --no-cache gcc musl-dev
RUN CGO_ENABLED=1 go build -o api ./cmd/api/main.go

# ---- Runtime Stage ----
FROM alpine:latest
RUN apk add --no-cache ca-certificates tzdata
WORKDIR /app
COPY --from=builder /build/api .
EXPOSE 5231
CMD ["./api"]
