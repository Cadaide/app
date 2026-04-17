import { DialogPortal } from "@/components/base/Dialog";
import { ReactNode, useCallback, useMemo, useState } from "react";

export interface IDialogProps {
  closeDialog: () => void;
  props?: any;
}

export function useDialog(
  factory: (props: IDialogProps) => ReactNode | ReactNode[],
) {
  const [isOpen, setIsOpen] = useState(false);
  const [props, setProps] = useState<any>(undefined);

  const openDialog = useCallback((props?: any) => {
    setIsOpen(true);
    setProps(props);
  }, []);
  const closeDialog = useCallback(() => setIsOpen(false), []);

  const dialogBody = useMemo(
    () => factory({ closeDialog, props }),
    [factory, closeDialog, props],
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
