package shell

import (
	"os"
	"os/exec"
)

type RunOptions struct {
	Command []string
	Cwd     string
	Env     map[string]string
}

func Run(options RunOptions) (*exec.Cmd, error) {
	cmd := prepareCmd(options)

	err := cmd.Start()
	if err != nil {
		return nil, err
	}

	return cmd, nil
}

func RunHidden(options RunOptions) (*exec.Cmd, error) {
	cmd := prepareCmd(options)

	SetSysProcAttr(cmd)

	err := cmd.Start()
	if err != nil {
		return nil, err
	}

	return cmd, nil
}

func RunHiddenSync(options RunOptions) error {
	cmd := prepareCmd(options)

	SetSysProcAttr(cmd)

	err := cmd.Run()
	if err != nil {
		return err
	}

	return nil
}

func prepareCmd(options RunOptions) *exec.Cmd {
	cmd := exec.Command(options.Command[0], options.Command[1:]...)

	cmd.Dir = options.Cwd

	cmd.Env = os.Environ()
	for k, v := range options.Env {
		cmd.Env = append(cmd.Env, k+"="+v)
	}

	cmd.Stderr = os.Stderr
	cmd.Stdout = os.Stdout

	return cmd
}
