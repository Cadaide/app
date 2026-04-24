import { ReactNode, useState, useEffect } from "react";
import { createPortal } from "react-dom";

interface IDraggableProps {
  children: ReactNode | ReactNode[];
  data: string;
  image?: ReactNode | ReactNode[];
  disabled?: boolean;
}

interface IDraggableDropAreaProps {
  children: ReactNode | ReactNode[];
  onDrop: (data: string) => void;
  onDragOver: (data: string) => void;
}

export function Draggable(props: IDraggableProps) {
  const [ghostId] = useState(
    () => "drg-ghost-" + crypto.randomUUID().replaceAll("-", ""),
  );

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <>
      <div
        className={props.disabled ? "" : "cursor-grab"}
        draggable={!props.disabled}
        onDragStart={
          props.disabled
            ? undefined
            : (e) => {
                e.stopPropagation();
                e.dataTransfer.setData("text/plain", props.data);
                e.dataTransfer.setDragImage(
                  document.querySelector(`#${ghostId}`) as Element,
                  0,
                  0,
                );
              }
        }
      >
        {props.children}
      </div>
      {mounted &&
        props.image &&
        document.querySelector("#ghost-container") &&
        createPortal(
          <div id={ghostId}>{props.image}</div>,
          document.querySelector("#ghost-container")!,
        )}
    </>
  );
}

export function DraggableDropArea(props: IDraggableDropAreaProps) {
  return (
    <div
      className="cursor-grab"
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();

        props.onDragOver(e.dataTransfer.getData("text/plain"));
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();

        props.onDrop(e.dataTransfer.getData("text/plain"));
      }}
    >
      {props.children}
    </div>
  );
}
