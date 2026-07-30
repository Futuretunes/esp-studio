/**
 * Single-owner communication layer over {@link import("../transport").TransportIo}.
 *
 * @packageDocumentation
 */

export {
  CommunicationBusyError,
  CommunicationError,
  CommunicationNotOpenError,
  CommunicationOwnershipError,
} from "./CommunicationError";
export {
  CommunicationLock,
  type CommunicationOwnerId,
} from "./CommunicationLock";
export {
  CommunicationSession,
  type CommunicationSessionState,
} from "./CommunicationSession";
