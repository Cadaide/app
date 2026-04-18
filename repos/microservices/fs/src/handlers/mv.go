package handlers

import "os"

type MvParams struct {
	Path string `json:"path"`
	Dest string `json:"dest"`
}

type MvResult struct {
}

func HandleMv(params MvParams) (MvResult, error) {
	err := os.Rename(params.Path, params.Dest)
	if err != nil {
		return MvResult{}, err
	}

	return MvResult{}, nil
}
