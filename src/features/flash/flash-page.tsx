import { useEffect, type JSX } from "react";

import { PageHeader } from "@/components/page-header";
import { FlashPanel } from "@/features/flash/flash-panel";
import { useFlashWorkflow } from "@/features/flash/use-flash-workflow";

/**
 * Flash feature: catalog-selected firmware flashing through {@link FlashService}.
 */
export function FlashFeature(): JSX.Element {
  const {
    activeDevice,
    webSerialSupported,
    firmwareSource,
    repositorySlug,
    releaseSummary,
    isLoadingGithub,
    isResolving,
    catalogEntries,
    selectionKey,
    resolved,
    primaryImage,
    isFlashing,
    progress,
    result,
    errorKind,
    errorMessage,
    flashAddress,
    fileInputRef,
    ensureSupport,
    setFirmwareSource,
    setRepositorySlug,
    loadGitHubRepository,
    selectCatalogEntry,
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
        description="Select firmware from the catalog and write it to a connected ESP board."
      />
      <FlashPanel
        activeDevice={activeDevice}
        webSerialSupported={webSerialSupported}
        firmwareSource={firmwareSource}
        repositorySlug={repositorySlug}
        releaseSummary={releaseSummary}
        isLoadingGithub={isLoadingGithub}
        isResolving={isResolving}
        catalogEntries={catalogEntries}
        selectionKey={selectionKey}
        resolved={resolved}
        primaryImage={primaryImage}
        isFlashing={isFlashing}
        progress={progress}
        result={result}
        errorKind={errorKind}
        errorMessage={errorMessage}
        flashAddress={flashAddress}
        fileInputRef={fileInputRef}
        onFirmwareSourceChange={setFirmwareSource}
        onRepositorySlugChange={setRepositorySlug}
        onLoadGitHubRepository={() => {
          void loadGitHubRepository();
        }}
        onSelectCatalogEntry={selectCatalogEntry}
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
