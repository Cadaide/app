package app

import "os"

func IsDevModeEnabled() bool {
	return os.Getenv("CADAIDE_DEV") == "1"
}
