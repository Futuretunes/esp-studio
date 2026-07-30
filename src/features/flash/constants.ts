/**
 * Default absolute flash address for a single application `.bin` (ESP32 app offset).
 *
 * Multi-partition / bootloader selection is out of scope for Flash UI MVP.
 */
export const DEFAULT_APP_FLASH_ADDRESS = 0x10000;

/**
 * CommunicationSession owner id for Flash Service operations.
 */
export const FLASH_SERVICE_OWNER_ID = "flash-service" as const;
