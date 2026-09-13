import { useDroppable } from "@dnd-kit/core";
import type { ChannelId } from "@ron-voice/shared";
import type { ParticipantInfo } from "../state/sessionStore";
import { ParticipantTile } from "./ParticipantTile";

interface Props {
  channelId: ChannelId;
  name: string;
  participants: ParticipantInfo[];
}

export function TeamBox({ channelId, name, participants }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: channelId });

  return (
    <div ref={setNodeRef} className={`team-box${isOver ? " team-box--over" : ""}`}>
      <h3>{name}</h3>
      <div className="team-box__tiles">
        {participants.map((participant) => (
          <ParticipantTile key={participant.identity} participant={participant} />
        ))}
      </div>
    </div>
  );
}
