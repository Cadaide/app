package main

import (
	"bufio"
	"cadaide/fs/src/handlers"
	"encoding/json"
	"log"
	"os"
)

type Request struct {
	ID     string          `json:"id"`
	Method string          `json:"method"`
	Params json.RawMessage `json:"params"`
}

type Response struct {
	ID     string      `json:"id"`
	Result interface{} `json:"result,omitempty"`
	Error  *RPCError   `json:"error,omitempty"`
}

type RPCError struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
}

const bufferSize int = 10 * 1024 * 1024

var handlerMap = map[string]func(json.RawMessage) (interface{}, error){
	"fs.listDir":   makeHandler(handlers.HandleListDir),
	"fs.treeDir":   makeHandler(handlers.HandleTreeDir),
	"fs.readFile":  makeHandler(handlers.HandleReadFile),
	"fs.writeFile": makeHandler(handlers.HandleWriteFile),
	"fs.stat":      makeHandler(handlers.HandleStat),
	"fs.mkdir":     makeHandler(handlers.HandleMkdir),
	"fs.rm":        makeHandler(handlers.HandleRm),
	"health":       makeHandler(handlers.HandleHealth),
}

func main() {
	// Move log output to stderr to avoid conflicts with stdio
	log.SetOutput(os.Stderr)

	encoder := json.NewEncoder(os.Stdout)
	scanner := bufio.NewScanner(os.Stdin)

	// Increase buffer size to handle large files
	scanner.Buffer(make([]byte, bufferSize), bufferSize)

	log.Println("[MICROSERVICE::FS] FS Microservice ready")

	for scanner.Scan() {
		line := scanner.Bytes()
		if len(line) == 0 {
			continue
		}

		// Parse the request
		var request Request
		if err := json.Unmarshal(line, &request); err != nil {
			encoder.Encode(Response{Error: &RPCError{Code: -32700, Message: "Parse error"}})
			continue
		}

		// Try to find the handler
		handler, ok := handlerMap[request.Method]
		if !ok {
			encoder.Encode(Response{Error: &RPCError{Code: -32601, Message: "Method not found"}})
			continue
		}

		// Call the handler
		result, err := handler(request.Params)
		if err != nil {
			encoder.Encode(Response{Error: &RPCError{Code: -32000, Message: err.Error()}})
			continue
		}

		// Send the response to stdout
		encoder.Encode(Response{ID: request.ID, Result: result})
	}

	// If the scanner encounters an error, log it and exit
	if err := scanner.Err(); err != nil {
		log.Fatalf("[MICROSERVICE::FS] Stdin error: %v", err)
	}
}

func makeHandler[T any, R any](fn func(T) (R, error)) func(json.RawMessage) (interface{}, error) {
	return func(params json.RawMessage) (interface{}, error) {
		var p T

		if err := json.Unmarshal(params, &p); err != nil {
			return nil, err
		}

		return fn(p)
	}
}
