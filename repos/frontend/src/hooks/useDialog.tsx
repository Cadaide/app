import { DialogPortal } from "@/components/base/Dialog";
import { ReactNode, useCallback, useMemo, useState } from "react";

export interface IDialogProps {
  closeDialog: () => void;
}

export function useDialog(
  factory: (props: IDialogProps) => ReactNode | ReactNode[],
) {
  const [isOpen, setIsOpen] = useState(false);

  const openDialog = useCallback(() => setIsOpen(true), []);
  const closeDialog = useCallback(() => setIsOpen(false), []);

  const dialogBody = useMemo(
    () => factory({ closeDialog }),
    [factory, closeDialog],
  );

  const dialog = (
    <DialogPortal isOpen={isOpen} onClose={closeDialog}>
      {dialogBody}
    </DialogPortal>
  );

  return {
    dialog,
    isOpen,
    openDialog,
    closeDialog,
  };
}
