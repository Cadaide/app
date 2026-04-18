package handlers

import (
	"cadaide/fs/src/filesystem"
	"os"
	"path"
)

type ListDirParams struct {
	Path string `json:"path"`
}

type ListDirResult struct {
	Entries []filesystem.FileInfo `json:"entries"`
}

func HandleListDir(params ListDirParams) (ListDirResult, error) {
	dirs, err := os.ReadDir(params.Path)
	if err != nil {
		return ListDirResult{}, err
	}

	entries := make([]filesystem.FileInfo, 0, len(dirs))
	for _, dir := range dirs {
		filetype := filesystem.FileTypeFile

		if dir.IsDir() || dir.Type() == os.ModeSymlink {
			filetype = filesystem.FileTypeDirectory
		}

		entries = append(entries, filesystem.FileInfo{Name: dir.Name(), Path: path.Join(params.Path, dir.Name()), Type: filetype})
	}

	return ListDirResult{Entries: entries}, nil
}
