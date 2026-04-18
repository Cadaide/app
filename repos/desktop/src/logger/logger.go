package logger

import (
	"io"
	"log"
	"os"
	"path/filepath"
	"strconv"
	"time"
)

var file *os.File

func Init(logfilePath string) {
	// Create log directory
	err := os.MkdirAll(logfilePath, 0755)
	if err != nil {
		panic(err)
	}

	// Move existing latest.log to <timestamp>.log
	_, err = os.Stat(filepath.Join(logfilePath, "latest.log"))
	if err == nil {
		timestamp := time.Now().UnixMicro()
		logFileName := strconv.FormatInt(timestamp, 10) + ".log"

		err := os.Rename(filepath.Join(logfilePath, "latest.log"), filepath.Join(logfilePath, logFileName))
		if err != nil {
			panic(err)
		}
	}

	file, err = os.OpenFile(filepath.Join(logfilePath, "latest.log"), os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0644)
	if err != nil {
		panic(err)
	}

	mw := io.MultiWriter(os.Stdout, file)
	log.SetOutput(mw)
}

func Close() {
	file.Close()
	file = nil

	log.SetOutput(os.Stderr)
}
