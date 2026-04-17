package handlers

import "os"

type RmParams struct {
	Path string `json:"path"`
}

type RmResult struct {
}

func HandleRm(params RmParams) (RmResult, error) {
	err := os.RemoveAll(params.Path)
	if err != nil {
		return RmResult{}, err
	}

	return RmResult{}, nil
}
