import { useWorkspaceState } from "@/hooks/stores/useWorkspaceState";
import { Expandable } from "../utils/Expandable";
import { FilesystemFolderEntry } from "@/classes/FilesystemFolderEntry";
import { useAwait } from "@/hooks/useAwait";
import { FilesystemFileEntry } from "@/classes/FilesystemFileEntry";
import { Icon } from "@iconify/react";
import { useCallback, useState } from "react";
import { useTabbarViewState } from "@/hooks/stores/useTabbarViewState";
import { PiFolderPlus, PiPlus } from "react-icons/pi";
import { useExplorerState } from "@/hooks/stores/useExplorerState";
import { IDialogProps, useDialog } from "@/hooks/useDialog";
import { DialogHeader } from "../base/Dialog";
import { Form } from "../base/Form";
import { Input } from "../base/Input";
import { Button } from "../base/Button";
import { FilesystemEntry } from "@/classes/FilesystemEntry";
import { FsAPI } from "@/api/fs";
import { ExplorerContext, useExplorer } from "@/contexts/ExplorerContext";

interface IExplorerFolderProps {
  folderEntry: FilesystemFolderEntry;
  isRoot?: boolean;
}

interface IExplorerFileProps {
  fileEntry: FilesystemFileEntry;
}

export function ExplorerFolder(props: IExplorerFolderProps) {
  const [isExpanded, setIsExpanded] = useState(props.isRoot ?? false);

  const selectedEntryPath = useExplorerState(
    (state) => state.selectedEntryPath,
  );
  const setSelectedEntryPath = useExplorerState(
    (state) => state.setSelectedEntryPath,
  );

  const entries = useAwait(
    () => props.folderEntry.ls(),
    [props.folderEntry, isExpanded],
    () => isExpanded,
  );

  const { dialog: createEntityDialog, openDialog: openCreateEntityDialog } =
    useDialog((props) => (
      <>
        <DialogHeader title="Create file" onClose={props.closeDialog} />
        <div>
          <p>
            To create a file, please open this project in any other editor that
            functions properly and create the file there.
          </p>
        </div>
      </>
    ));

  const { dialog: createFolderDialog, openDialog: openCreateFolderDialog } =
    useDialog((props) => <ExplorerCreateFolderDialog {...props} />);

  return (
    <ExplorerContext.Provider
      value={{
        reload: entries.reload,
      }}
    >
      <Expandable
        title={props.folderEntry.name}
        expandedIcon={
          props.isRoot ? "catppuccin:root-open" : props.folderEntry.icon
        }
        collapsedIcon={
          props.isRoot ? "catppuccin:root" : props.folderEntry.icon
        }
        defaultExpanded={props.isRoot}
        isLoading={entries.isLoading}
        selected={selectedEntryPath === props.folderEntry.path}
        onStateChange={(isExpanded) => setIsExpanded(isExpanded)}
        headerButtons={
          props.isRoot
            ? [
                {
                  icon: PiFolderPlus,
                  onClick: openCreateFolderDialog,
                },
                {
                  icon: PiPlus,
                  onClick: openCreateEntityDialog,
                },
              ]
            : undefined
        }
        onClick={() => {
          setSelectedEntryPath(props.folderEntry.path);
        }}
      >
        {isExpanded &&
          entries.data?.map((entry) =>
            entry instanceof FilesystemFolderEntry ? (
              <ExplorerFolder key={entry.path} folderEntry={entry} />
            ) : (
              <ExplorerFile key={entry.path} fileEntry={entry} />
            ),
          )}
      </Expandable>
      {createEntityDialog}
      {createFolderDialog}
    </ExplorerContext.Provider>
  );
}

export function ExplorerFile(props: IExplorerFileProps) {
  const addTab = useTabbarViewState((state) => state.addTab);

  const selectedEntryPath = useExplorerState(
    (state) => state.selectedEntryPath,
  );
  const setSelectedEntryPath = useExplorerState(
    (state) => state.setSelectedEntryPath,
  );

  return (
    <button
      onClick={() => {
        addTab(
          props.fileEntry.path,
          props.fileEntry.icon,
          props.fileEntry.name,
        );

        setSelectedEntryPath(props.fileEntry.path);
      }}
      className={`w-full flex flex-row items-center gap-1.5 px-1.5 py-1 hover:bg-ctp-surface0 cursor-pointer transition-colors text-ctp-text ${
        selectedEntryPath === props.fileEntry.path ? "bg-ctp-surface1/30" : ""
      }`}
    >
      <div className="w-4 h-4" />
      <div className="w-5 h-5">
        <Icon
          icon={props.fileEntry.icon}
          width={20}
          height={20}
          className="shrink-0 text-ctp-lavender"
        />
      </div>
      <span className="text-ctp-text text-[15px] whitespace-nowrap">
        {props.fileEntry.name}
      </span>
    </button>
  );
}

function ExplorerCreateFolderDialog(props: IDialogProps) {
  const selectedEntryPath = useExplorerState(
    (state) => state.selectedEntryPath,
  );
  const setSelectedEntryPath = useExplorerState(
    (state) => state.setSelectedEntryPath,
  );

  const explorer = useExplorer();

  const onSubmit = useCallback(
    async (data: FormData) => {
      // Use workspace root if nothing selected -- probably should set this as useState default
      if (!selectedEntryPath) return;

      let parentEntry: FilesystemFolderEntry;

      const selectedEntry = await FilesystemEntry.fromPath(selectedEntryPath);

      if (selectedEntry instanceof FilesystemFileEntry)
        parentEntry = await FilesystemEntry.parent(selectedEntryPath);
      else parentEntry = selectedEntry as FilesystemFolderEntry;

      const folderPath = `${parentEntry.path}/${data.get("name") as string}`;

      await FsAPI.mkdir(folderPath);

      setSelectedEntryPath(folderPath);
      props.closeDialog();

      explorer.reload();
    },
    [selectedEntryPath, setSelectedEntryPath, explorer],
  );

  return (
    <>
      <DialogHeader title="Create folder" onClose={props.closeDialog} />
      <Form onSubmit={onSubmit}>
        <div className="flex flex-col gap-2">
          <Input name="name" placeholder="Folder name" />
          <div className="flex flex-row items-center justify-end gap-2">
            <Button variant="secondary" onClick={props.closeDialog}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Create
            </Button>
          </div>
        </div>
      </Form>
    </>
  );
}
