package handlers

import (
	"cadaide/fs/src/filesystem"
	"os"
)

type StatParams struct {
	Path string `json:"path"`
}

type StatResult struct {
	Entry filesystem.FileInfo `json:"entry"`
}

func HandleStat(params StatParams) (StatResult, error) {
	stat, err := os.Stat(params.Path)
	if err != nil {
		return StatResult{}, err
	}

	filetype := filesystem.FileTypeFile
	if stat.IsDir() || stat.Mode() == os.ModeSymlink {
		filetype = filesystem.FileTypeDirectory
	}

	return StatResult{Entry: filesystem.FileInfo{Name: stat.Name(), Path: params.Path, Type: filetype}}, nil
}
