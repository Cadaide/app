package handlers

import "os"

type MkdirParams struct {
	Path string `json:"path"`
}

type MkdirResult struct {
}

func HandleMkdir(params MkdirParams) (MkdirResult, error) {
	err := os.MkdirAll(params.Path, 0755)
	if err != nil {
		return MkdirResult{}, err
	}

	return MkdirResult{}, nil
}
