FROM golang:1.25.8-bookworm

RUN apt-get update && apt-get install -y \
  gcc-mingw-w64 \
  g++-mingw-w64 \
  mingw-w64-common \
  mingw-w64-x86-64-dev

WORKDIR /app
COPY . .

RUN go mod download && \
    WEBVIEW2_INCLUDE=/go/pkg/mod/github.com/webview/webview_go@v0.0.0-20240831120633-6173450d4dd6/libs/mswebview2/include && \
    ln -sf /usr/x86_64-w64-mingw32/include/eventtoken.h ${WEBVIEW2_INCLUDE}/EventToken.h

CMD CC=x86_64-w64-mingw32-gcc \
    CXX=x86_64-w64-mingw32-g++ \
    CGO_ENABLED=1 \
    GOOS=windows \
    GOARCH=amd64 \
    go build -o build/cadaide.exe -ldflags "-H windowsgui" ./src/main.go