import { useEffect, type JSX } from "react";

import { PageHeader } from "@/components/page-header";
import { FlashPanel } from "@/features/flash/flash-panel";
import { useFlashWorkflow } from "@/features/flash/use-flash-workflow";

/**
 * Flash feature: one-click install through catalog + {@link FlashService}.
 */
export function FlashFeature(): JSX.Element {
  const {
    activeDevice,
    webSerialSupported,
    firmwareSource,
    builtInEntries,
    selectedBuiltInId,
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
    chipCompatibilityWarning,
    firmwareProjectLabel,
    firmwareVersionLabel,
    flashAddress,
    fileInputRef,
    ensureSupport,
    setFirmwareSource,
    setRepositorySlug,
    loadGitHubRepository,
    selectBuiltInEntry,
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
        title="Install Firmware"
        description="Connect a device, choose a project, then click Install Firmware."
      />
      <FlashPanel
        activeDevice={activeDevice}
        webSerialSupported={webSerialSupported}
        firmwareSource={firmwareSource}
        builtInEntries={builtInEntries}
        selectedBuiltInId={selectedBuiltInId}
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
        chipCompatibilityWarning={chipCompatibilityWarning}
        firmwareProjectLabel={firmwareProjectLabel}
        firmwareVersionLabel={firmwareVersionLabel}
        flashAddress={flashAddress}
        fileInputRef={fileInputRef}
        onFirmwareSourceChange={setFirmwareSource}
        onRepositorySlugChange={setRepositorySlug}
        onLoadGitHubRepository={() => {
          void loadGitHubRepository();
        }}
        onSelectBuiltInEntry={selectBuiltInEntry}
        onSelectCatalogEntry={selectCatalogEntry}
        onSelectFile={(file) => {
          void selectFirmwareFile(file);
        }}
        onClearFile={clearFirmware}
        onInstall={() => {
          void startFlash();
        }}
      />
    </div>
  );
}
