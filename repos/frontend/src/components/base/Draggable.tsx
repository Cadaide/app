import { DragEvent, ReactNode } from "react";

interface IDraggableProps {
  children: ReactNode | ReactNode[];
  data: string;
}

interface IDraggableDropAreaProps {
  children: ReactNode | ReactNode[];
  onDrop: (data: string) => void;
  onDragOver: (data: string) => void;
}

export function Draggable(props: IDraggableProps) {
  return (
    <div
      className="cursor-grab"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", props.data);
      }}
    >
      {props.children}
    </div>
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
