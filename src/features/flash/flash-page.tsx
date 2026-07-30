import { useEffect, type JSX } from "react";
import { useSearchParams } from "react-router-dom";

import { DeviceBusyBanner } from "@/components/device-busy-banner";
import { PageHeader } from "@/components/page-header";
import { FlashPanel } from "@/features/flash/flash-panel";
import { useFlashWorkflow } from "@/features/flash/use-flash-workflow";

/**
 * Flash feature: one-click install through catalog + {@link FlashService}.
 *
 * Accepts `?project=<builtInId>` from the Firmware Library Install CTA.
 */
export function FlashFeature(): JSX.Element {
  const [searchParams] = useSearchParams();
  const projectParam = searchParams.get("project");

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
    inspectionNotice,
    pendingOverwrite,
    errorKind,
    errorMessage,
    githubReleasesHref,
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
    confirmOverwrite,
    cancelOverwrite,
    builtInCatalogStatus,
    builtInCatalogError,
    retryBuiltInCatalog,
  } = useFlashWorkflow();

  useEffect(() => {
    ensureSupport();
  }, [ensureSupport]);

  useEffect(() => {
    if (projectParam === null || projectParam.length === 0) {
      return;
    }
    if (builtInEntries.length === 0) {
      return;
    }
    if (selectedBuiltInId === projectParam) {
      return;
    }
    if (!builtInEntries.some((entry) => entry.id === projectParam)) {
      return;
    }
    setFirmwareSource("builtin");
    selectBuiltInEntry(projectParam);
  }, [
    builtInEntries,
    projectParam,
    selectBuiltInEntry,
    selectedBuiltInId,
    setFirmwareSource,
  ]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Install Firmware"
        description="Connect a device, choose a project, then click Install Firmware."
      />
      <DeviceBusyBanner attempting="flash" />
      <FlashPanel
        activeDevice={activeDevice}
        webSerialSupported={webSerialSupported}
        firmwareSource={firmwareSource}
        builtInEntries={builtInEntries}
        builtInCatalogStatus={builtInCatalogStatus}
        builtInCatalogError={builtInCatalogError}
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
        inspectionNotice={inspectionNotice}
        pendingOverwrite={pendingOverwrite}
        errorKind={errorKind}
        errorMessage={errorMessage}
        githubReleasesHref={githubReleasesHref}
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
        onRetryBuiltInCatalog={retryBuiltInCatalog}
        onSelectCatalogEntry={selectCatalogEntry}
        onSelectFile={(file) => {
          void selectFirmwareFile(file);
        }}
        onClearFile={clearFirmware}
        onInstall={() => {
          void startFlash();
        }}
        onConfirmOverwrite={() => {
          void confirmOverwrite();
        }}
        onCancelOverwrite={cancelOverwrite}
      />
    </div>
  );
}
