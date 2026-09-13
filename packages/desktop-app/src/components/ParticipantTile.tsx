import { useDraggable } from "@dnd-kit/core";
import type { ParticipantInfo } from "../state/sessionStore";

interface Props {
  participant: ParticipantInfo;
}

export function ParticipantTile({ participant }: Props) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: participant.identity,
    disabled: !participant.isLocal,
  });

  const style: React.CSSProperties = {
    transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
    opacity: isDragging ? 0.5 : 1,
    cursor: participant.isLocal ? "grab" : "default",
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="participant-tile"
      {...(participant.isLocal ? listeners : {})}
      {...(participant.isLocal ? attributes : {})}
    >
      {participant.name}
      {participant.isLocal ? " (you)" : participant.audible ? " 🔊" : " 🔇"}
    </div>
  );
}
