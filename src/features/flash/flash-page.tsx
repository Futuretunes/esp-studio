import { useEffect, type JSX } from "react";

import { PageHeader } from "@/components/page-header";
import { FlashPanel } from "@/features/flash/flash-panel";
import { useFlashWorkflow } from "@/features/flash/use-flash-workflow";

/**
 * Flash feature: local `.bin` flashing through {@link FlashService}.
 */
export function FlashFeature(): JSX.Element {
  const {
    activeDevice,
    webSerialSupported,
    firmware,
    isFlashing,
    progress,
    result,
    errorKind,
    errorMessage,
    flashAddress,
    fileInputRef,
    ensureSupport,
    selectFirmwareFile,
    clearFirmware,
    startFlash,
  } = useFlashWorkflow();

  useEffect(() => {
    ensureSupport();
  }, [ensureSupport]);

  return (
    <div>
      <PageHeader
        title="Flash Firmware"
        description="Write a local .bin image to a connected ESP board using Flash Service."
      />
      <FlashPanel
        activeDevice={activeDevice}
        webSerialSupported={webSerialSupported}
        firmware={firmware}
        isFlashing={isFlashing}
        progress={progress}
        result={result}
        errorKind={errorKind}
        errorMessage={errorMessage}
        flashAddress={flashAddress}
        fileInputRef={fileInputRef}
        onSelectFile={(file) => {
          void selectFirmwareFile(file);
        }}
        onClearFile={clearFirmware}
        onFlash={() => {
          void startFlash();
        }}
      />
    </div>
  );
}
