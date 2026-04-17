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
import { ContextMenu } from "../base/ContextMenu";

interface IExplorerFolderProps {
  folderEntry: FilesystemFolderEntry;
  isRoot?: boolean;
}

interface IExplorerFileProps {
  fileEntry: FilesystemFileEntry;
}

export function ExplorerFolder(props: IExplorerFolderProps) {
  const isExpandedInStore = useExplorerState((state) =>
    state.expandedFolders.includes(props.folderEntry.path)
  );

  const [isExpanded, setIsExpanded] = useState(
    (props.isRoot ?? false) || isExpandedInStore,
  );

  const parentExplorer = useExplorer();

  const selectedEntryPath = useExplorerState(
    (state) => state.selectedEntryPath,
  );
  const toggleFolderExpansion = useExplorerState(
    (state) => state.toggleFolderExpansion,
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

  const { dialog: removeDialog, openDialog: openRemoveDialog } = useDialog(
    (props) => <ExplorerRemoveDialog {...props} />,
  );

  return (
    <ExplorerContext.Provider
      value={{
        reload: () => {
          parentExplorer?.reload?.();
          entries.reload();
        },
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
        defaultExpanded={isExpanded}
        isLoading={entries.isLoading}
        selected={selectedEntryPath === props.folderEntry.path}
        onStateChange={(isExpanded) => {
          setIsExpanded(isExpanded);
          toggleFolderExpansion(props.folderEntry.path);
        }}
        headerContextMenuItems={[
          {
            label: "New folder",
            onClick: () =>
              openCreateFolderDialog({
                parentPath: props.folderEntry.path,
              }),
          },
          {
            label: "New file",
            onClick: () =>
              openCreateEntityDialog({
                parentPath: props.folderEntry.path,
              }),
          },
          {
            label: "Delete folder",
            onClick: () =>
              openRemoveDialog({
                path: props.folderEntry.path,
                type: "folder",
              }),
          },
        ]}
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
      {removeDialog}
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
      if (!selectedEntryPath) return;

      let parentEntry: FilesystemFolderEntry;

      if (props.props?.parentPath) {
        parentEntry = (await FilesystemEntry.fromPath(
          props.props.parentPath,
        )) as FilesystemFolderEntry;
      } else {
        const selectedEntry = await FilesystemEntry.fromPath(selectedEntryPath);

        if (selectedEntry instanceof FilesystemFileEntry)
          parentEntry = await FilesystemEntry.parent(selectedEntryPath);
        else parentEntry = selectedEntry as FilesystemFolderEntry;
      }

      const folderPath = `${parentEntry.path}/${data.get("name") as string}`;

      await FsAPI.mkdir(folderPath);

      setSelectedEntryPath(folderPath);
      props.closeDialog();

      explorer.reload();
    },
    [selectedEntryPath, setSelectedEntryPath, explorer, props],
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

function ExplorerRemoveDialog(props: IDialogProps) {
  const explorer = useExplorer();

  const onSubmit = useCallback(async () => {
    const path = props.props?.path as string;
    if (!path) throw new Error("No path selected");

    await FsAPI.rm(path);

    props.closeDialog();
    explorer.reload();
  }, [props, explorer]);

  return (
    <>
      <DialogHeader title="Are you sure?" onClose={props.closeDialog} />
      <Form onSubmit={onSubmit}>
        <div className="flex flex-col gap-2">
          <p>
            Are you sure you want to permanently delete this {props.props?.type}
            ?
          </p>
          <div className="flex flex-row items-center justify-end gap-2">
            <Button variant="secondary" onClick={props.closeDialog}>
              Cancel
            </Button>
            <Button variant="danger" type="submit">
              Delete
            </Button>
          </div>
        </div>
      </Form>
    </>
  );
}
