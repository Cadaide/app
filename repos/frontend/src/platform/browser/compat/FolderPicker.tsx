import { Button } from "@/components/base/Button";
import { DialogHeader } from "@/components/base/Dialog";
import { useDialog } from "@/hooks/useDialog";
import { useEffect, useMemo, useState } from "react";
import { FsAPI } from "@/api/fs";
import { Icon } from "@iconify/react";
import { Input } from "@/components/base/Input";
import { getIcon } from "@/editor/icons";
import { Form } from "@/components/base/Form";
import { useAwait } from "@/hooks/useAwait";

interface IBrowserPlatformCompatFolderPickerProps {}

interface IFolderPickerDialogProps {
  onSelect: (path: string | null) => void;
  closeDialog: () => void;
}

function FolderPickerDialogContent(props: IFolderPickerDialogProps) {
  const [currentPath, setCurrentPath] = useState<string>("/");
  const [pathInput, setPathInput] = useState<string>("/");

  const { data: rawEntries, isLoading: loading } = useAwait(
    () => FsAPI.listDir(currentPath),
    [currentPath],
  );

  const entries = useMemo(() => {
    if (!rawEntries) return [];

    return rawEntries
      .filter((e) => e.type === "directory")
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [rawEntries]);

  useEffect(() => {
    setPathInput(currentPath);
  }, [currentPath]);

  const handleGoUp = () => {
    if (currentPath === "/") return;

    const parts = currentPath.split("/").filter(Boolean);
    parts.pop();

    const newPath = ("/" + parts.join("/")).replace(/\/{2,}/g, "/");

    setCurrentPath(newPath || "/");
  };

  const handleNavigate = (path: string) => {
    setCurrentPath(path.replace(/\/{2,}/g, "/"));
  };

  const handleSelect = () => {
    props.onSelect(currentPath);
    props.closeDialog();
  };

  const handleCancel = () => {
    props.onSelect(null);
    props.closeDialog();
  };

  const handlePathSubmit = (data: FormData) => {
    const newPath = data.get("path") as string;

    if (newPath) setCurrentPath(newPath.replace(/\/{2,}/g, "/"));
  };

  return (
    <>
      <DialogHeader title="Select Folder" onClose={handleCancel} />
      <div className="flex flex-col gap-4 w-[500px]">
        <Form onSubmit={handlePathSubmit}>
          <div className="flex flex-row gap-2">
            <Input
              name="path"
              value={pathInput}
              onChange={(e) => setPathInput(e.target.value)}
              className="flex-1 min-w-0"
            />
            <Button type="submit" variant="primary">
              Go
            </Button>
          </div>
        </Form>

        <div className="flex flex-col h-[300px] bg-ctp-crust rounded-md overflow-y-auto border border-white/5 py-2">
          {loading ? (
            <div className="flex flex-1 items-center justify-center text-ctp-subtext0">
              Loading...
            </div>
          ) : (
            <>
              {currentPath !== "/" && (
                <div
                  className="flex flex-row items-center gap-2 px-3 py-1.5 hover:bg-ctp-surface0 cursor-pointer text-ctp-text transition-colors"
                  onClick={handleGoUp}
                >
                  <Icon
                    icon="catppuccin:folder"
                    width={20}
                    className="shrink-0 text-ctp-lavender"
                  />
                  <span>..</span>
                </div>
              )}
              {entries.map((entry) => (
                <div
                  key={entry.path}
                  className="flex flex-row items-center gap-2 px-3 py-1.5 hover:bg-ctp-surface0 cursor-pointer text-ctp-text transition-colors"
                  onClick={() => handleNavigate(entry.path)}
                >
                  <Icon
                    icon={getIcon(entry.name, true)}
                    width={20}
                    className="shrink-0 text-ctp-lavender"
                  />
                  <span className="truncate">{entry.name}</span>
                </div>
              ))}
              {entries.length === 0 && (
                <div className="text-ctp-subtext0 text-sm px-3 italic">
                  Empty folder
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex flex-row gap-2 justify-end">
          <Button variant="secondary" onClick={handleCancel}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSelect}>
            Select Current Folder
          </Button>
        </div>
      </div>
    </>
  );
}

export function BrowserPlatformCompatFolderPicker(
  props: IBrowserPlatformCompatFolderPickerProps,
) {
  const { dialog, openDialog } = useDialog((props) => (
    <FolderPickerDialogContent
      onSelect={props.props?.onSelect}
      closeDialog={props.closeDialog}
    />
  ));

  useEffect(() => {
    window.api.openSelectDirectoryDialog = async () => {
      return new Promise((resolve) => {
        openDialog({
          onSelect: resolve,
        });
      });
    };
  }, [openDialog]);

  return dialog;
}
