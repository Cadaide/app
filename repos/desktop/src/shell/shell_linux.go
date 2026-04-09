//go:build linux

package shell

import (
	"os"
	"os/exec"
	"syscall"
)

func SetSysProcAttr(cmd *exec.Cmd) {
	cmd.SysProcAttr = &syscall.SysProcAttr{
		Setpgid:   true,
		Pdeathsig: syscall.SIGKILL,
	}
}

func KillGroup(cmd *exec.Cmd) {
	if cmd.Process != nil {
		syscall.Kill(-cmd.Process.Pid, syscall.SIGKILL)
	}
}

func AppendPathEnv(path string, env []string) []string {
	return append(env, "PATH="+path+":"+os.Getenv("PATH"))
}
