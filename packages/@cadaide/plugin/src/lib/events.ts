import { HostEvents } from "../host/events";

export type CadaideEvent = "initialize";

export function CadaideEventOn(
  event: CadaideEvent,
  handler: (data: unknown) => unknown,
) {
  HostEvents.on(event, handler);
}
