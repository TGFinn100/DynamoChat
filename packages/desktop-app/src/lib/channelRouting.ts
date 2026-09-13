import {
  Room,
  RoomEvent,
  Track,
  type Participant,
  type RemoteParticipant,
  type RemoteTrackPublication,
} from "livekit-client";
import { MAIN_CHANNEL, type ChannelId } from "@ron-voice/shared";
import { getParticipantChannel } from "./livekitClient";

function shouldHear(participantChannel: ChannelId, myChannel: ChannelId): boolean {
  return participantChannel === MAIN_CHANNEL || participantChannel === myChannel;
}

function reconcileParticipant(participant: RemoteParticipant, myChannel: ChannelId): void {
  const participantChannel = getParticipantChannel(participant.attributes);
  const desired = shouldHear(participantChannel, myChannel);

  participant.trackPublications.forEach((publication) => {
    if (publication.kind !== Track.Kind.Audio) return;
    const remotePub = publication as RemoteTrackPublication;
    if (remotePub.isSubscribed !== desired) {
      remotePub.setSubscribed(desired);
    }
  });
}

export interface ChannelRouting {
  reconcileAll: () => void;
  detach: () => void;
}

export function attachChannelRouting(room: Room): ChannelRouting {
  const reconcileAll = () => {
    const myChannel = getParticipantChannel(room.localParticipant.attributes);
    room.remoteParticipants.forEach((participant) => {
      reconcileParticipant(participant, myChannel);
    });
  };

  const onAttributesChanged = (_changed: Record<string, string>, participant: Participant) => {
    if (participant === room.localParticipant) {
      reconcileAll();
      return;
    }
    const myChannel = getParticipantChannel(room.localParticipant.attributes);
    reconcileParticipant(participant as RemoteParticipant, myChannel);
  };

  const onTrackPublished = (_pub: RemoteTrackPublication, participant: RemoteParticipant) => {
    const myChannel = getParticipantChannel(room.localParticipant.attributes);
    reconcileParticipant(participant, myChannel);
  };

  const onParticipantConnected = (participant: RemoteParticipant) => {
    const myChannel = getParticipantChannel(room.localParticipant.attributes);
    reconcileParticipant(participant, myChannel);
  };

  room.on(RoomEvent.ParticipantAttributesChanged, onAttributesChanged);
  room.on(RoomEvent.TrackPublished, onTrackPublished);
  room.on(RoomEvent.ParticipantConnected, onParticipantConnected);

  reconcileAll();

  return {
    reconcileAll,
    detach: () => {
      room.off(RoomEvent.ParticipantAttributesChanged, onAttributesChanged);
      room.off(RoomEvent.TrackPublished, onTrackPublished);
      room.off(RoomEvent.ParticipantConnected, onParticipantConnected);
    },
  };
}
