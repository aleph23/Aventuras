<script lang="ts">
  import { ui } from '$lib/stores/ui.svelte';
  import { story } from '$lib/stores/story.svelte';
  import { syncService } from '$lib/services/sync';
  import { exportService } from '$lib/services/export';
  import { getVersion } from '@tauri-apps/api/app';
  import {
    X,
    QrCode,
    Camera,
    Upload,
    Download,
    Loader2,
    AlertTriangle,
    RefreshCw,
    Check,
  } from 'lucide-svelte';
  import { Html5Qrcode } from 'html5-qrcode';
  import type {
    SyncServerInfo,
    SyncStoryPreview,
    SyncConnectionData,
  } from '$lib/types/sync';
  import { onDestroy } from 'svelte';

  // State
  let serverInfo = $state<SyncServerInfo | null>(null);
  let connection = $state<SyncConnectionData | null>(null);
  let remoteStories = $state<SyncStoryPreview[]>([]);
  let localStories = $state<SyncStoryPreview[]>([]);
  let selectedRemoteStory = $state<SyncStoryPreview | null>(null);
  let selectedLocalStory = $state<SyncStoryPreview | null>(null);
  let loading = $state(false);
  let error = $state<string | null>(null);
  let showConflictWarning = $state(false);
  let conflictStoryTitle = $state<string | null>(null);
  let syncSuccess = $state(false);
  let syncMessage = $state<string | null>(null);

  // State for receiving pushed stories (when in generate mode)
  let receivedStoryJson = $state<string | null>(null);
  let receivedStoryPreview = $state<SyncStoryPreview | null>(null);
  let showReceivedConflict = $state(false);
  let pollingInterval: ReturnType<typeof setInterval> | null = null;

  // State for version mismatch warning
  let remoteVersion = $state<string | null>(null);
  let localVersion = $state<string | null>(null);
  let showVersionWarning = $state(false);
  let pendingConnection = $state<SyncConnectionData | null>(null);

  // QR Scanner
  let scanner: Html5Qrcode | null = null;
  let scannerElementId = 'qr-reader';

  // Reset state when modal opens
  $effect(() => {
    if (ui.syncModalOpen) {
      resetState();
    }
  });

  function resetState() {
    serverInfo = null;
    connection = null;
    remoteStories = [];
    localStories = [];
    selectedRemoteStory = null;
    selectedLocalStory = null;
    loading = false;
    error = null;
    showConflictWarning = false;
    conflictStoryTitle = null;
    syncSuccess = false;
    syncMessage = null;
    receivedStoryJson = null;
    receivedStoryPreview = null;
    showReceivedConflict = false;
    remoteVersion = null;
    localVersion = null;
    showVersionWarning = false;
    pendingConnection = null;
    stopPolling();
  }

  function stopPolling() {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      pollingInterval = null;
    }
  }

  function startPolling() {
    stopPolling();
    pollingInterval = setInterval(checkForReceivedStories, 1000);
  }

  async function checkForReceivedStories() {
    try {
      const received = await syncService.getReceivedStories();
      if (received.length > 0) {
        // Take the first received story
        const storyJson = received[0];
        const preview = syncService.getStoryPreview(storyJson);

        if (preview) {
          receivedStoryJson = storyJson;
          receivedStoryPreview = preview;

          // Check for conflict
          const exists = await syncService.checkStoryExists(preview.title);
          if (exists) {
            showReceivedConflict = true;
          } else {
            // No conflict, import directly
            await importReceivedStory();
          }
        }

        // Clear received stories from server
        await syncService.clearReceivedStories();
        stopPolling();
      }
    } catch (e) {
      // Ignore polling errors
    }
  }

  async function importReceivedStory() {
    if (!receivedStoryJson || !receivedStoryPreview) return;

    loading = true;
    error = null;
    showReceivedConflict = false;

    try {
      // If replacing, delete the existing story first
      const existingId = await syncService.findStoryIdByTitle(receivedStoryPreview.title);
      if (existingId) {
        await syncService.createPreSyncBackup(existingId);
        await syncService.deleteStory(existingId);
      }

      const result = await exportService.importFromContent(receivedStoryJson, true);

      if (result.success) {
        await story.loadAllStories();
        syncSuccess = true;
        syncMessage = `Successfully received "${receivedStoryPreview.title}"`;
      } else {
        error = result.error ?? 'Import failed';
      }
    } catch (e) {
      error = e instanceof Error ? e.message : 'Import failed';
    } finally {
      loading = false;
      receivedStoryJson = null;
      receivedStoryPreview = null;
    }
  }

  function cancelReceivedImport() {
    showReceivedConflict = false;
    receivedStoryJson = null;
    receivedStoryPreview = null;
    // Resume polling for more stories
    startPolling();
  }

  // Cleanup on destroy
  onDestroy(() => {
    cleanup();
  });

  async function cleanup() {
    stopPolling();
    if (scanner) {
      try {
        await scanner.stop();
      } catch {
        // Ignore errors when stopping
      }
      scanner = null;
    }
    if (serverInfo) {
      try {
        await syncService.stopServer();
      } catch {
        // Ignore errors when stopping
      }
    }
  }

  async function startGenerateMode() {
    ui.setSyncMode('generate');
    loading = true;
    error = null;

    try {
      // Export all stories for the server
      const storiesJson = await syncService.exportAllStoriesToJson();
      serverInfo = await syncService.startServer(storiesJson);
      // Start polling for pushed stories
      startPolling();
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to start server';
      ui.setSyncMode('select');
    } finally {
      loading = false;
    }
  }

  async function startScanMode() {
    ui.setSyncMode('scan');
    error = null;

    // Wait for DOM to update
    await new Promise((resolve) => setTimeout(resolve, 100));
    await initScanner();
  }

  async function initScanner() {
    try {
      scanner = new Html5Qrcode(scannerElementId);

      await scanner.start(
        {
          facingMode: 'environment',
        },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        async (decodedText) => {
          await handleQrScanned(decodedText);
        },
        () => {
          // Ignore scan failures during continuous scanning
        }
      );

      // Apply zoom after camera starts (more reliable on mobile)
      try {
        const videoElement = document.querySelector(`#${scannerElementId} video`) as HTMLVideoElement;
        if (videoElement && videoElement.srcObject) {
          const track = (videoElement.srcObject as MediaStream).getVideoTracks()[0];
          const capabilities = track.getCapabilities() as MediaTrackCapabilities & { zoom?: { min: number; max: number } };
          if (capabilities.zoom) {
            const maxZoom = capabilities.zoom.max;
            const targetZoom = Math.min(maxZoom, 2.5);
            await track.applyConstraints({ advanced: [{ zoom: targetZoom } as MediaTrackConstraintSet] });
          }
        }
      } catch {
        // Zoom not supported on this device, continue without it
      }
    } catch (e) {
      error = 'Camera access denied or not available';
      ui.setSyncMode('select');
    }
  }

  async function handleQrScanned(data: string) {
    if (scanner) {
      try {
        await scanner.stop();
      } catch {
        // Ignore
      }
      scanner = null;
    }

    try {
      const parsed = syncService.parseQrCode(data);
      const appVersion = await getVersion();

      // Check for version mismatch or unknown remote version
      if (!parsed.version || parsed.version !== appVersion) {
        pendingConnection = parsed;
        remoteVersion = parsed.version ?? null;
        localVersion = appVersion;
        showVersionWarning = true;
        return;
      }

      // No mismatch, proceed normally
      await proceedWithConnection(parsed);
    } catch (e) {
      error = e instanceof Error ? e.message : 'Connection failed';
      ui.setSyncMode('select');
    }
  }

  function cancelVersionMismatch() {
    showVersionWarning = false;
    pendingConnection = null;
    remoteVersion = null;
    localVersion = null;
    ui.setSyncMode('select');
  }

  async function proceedWithVersionMismatch() {
    if (!pendingConnection) return;
    showVersionWarning = false;
    remoteVersion = null;
    localVersion = null;
    await proceedWithConnection(pendingConnection);
    pendingConnection = null;
  }

  async function proceedWithConnection(conn: SyncConnectionData) {
    try {
      connection = conn;
      ui.setSyncMode('connected');

      // Fetch available stories from remote
      loading = true;
      remoteStories = await syncService.connect(connection);

      // Also load local stories for push option
      const allLocalStories = story.allStories;
      localStories = allLocalStories.map((s) => ({
        id: s.id,
        title: s.title,
        genre: s.genre ?? null,
        updatedAt: s.updatedAt,
        entryCount: 0, // We don't track this in the store
      }));
    } catch (e) {
      error = e instanceof Error ? e.message : 'Connection failed';
      ui.setSyncMode('select');
    } finally {
      loading = false;
    }
  }

  async function pullStory() {
    if (!connection || !selectedRemoteStory) return;

    // Check for conflict
    const exists = await syncService.checkStoryExists(selectedRemoteStory.title);
    if (exists && !showConflictWarning) {
      conflictStoryTitle = selectedRemoteStory.title;
      showConflictWarning = true;
      return;
    }

    ui.setSyncMode('syncing');
    loading = true;
    error = null;
    showConflictWarning = false;

    try {
      // If replacing, delete the existing story first
      const existingId = await syncService.findStoryIdByTitle(selectedRemoteStory.title);
      if (existingId) {
        await syncService.createPreSyncBackup(existingId);
        await syncService.deleteStory(existingId);
      }

      // Pull the story
      const storyJson = await syncService.pullStory(
        connection,
        selectedRemoteStory.id
      );

      // Import using existing import service
      // Use skipImportedSuffix=true so synced stories keep their original title
      const result = await exportService.importFromContent(storyJson, true);

      if (result.success) {
        await story.loadAllStories();
        syncSuccess = true;
        syncMessage = `Successfully pulled "${selectedRemoteStory.title}"`;
      } else {
        error = result.error ?? 'Import failed';
      }
    } catch (e) {
      error = e instanceof Error ? e.message : 'Pull failed';
    } finally {
      loading = false;
    }
  }

  async function pushStory() {
    if (!connection || !selectedLocalStory) return;

    ui.setSyncMode('syncing');
    loading = true;
    error = null;

    try {
      // Create backup before pushing (on local device)
      await syncService.createPreSyncBackup(selectedLocalStory.id);

      // Export the story
      const storyJson = await syncService.exportStoryToJson(selectedLocalStory.id);

      // Push to remote
      await syncService.pushStory(connection, storyJson);

      syncSuccess = true;
      syncMessage = `Successfully pushed "${selectedLocalStory.title}"`;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Push failed';
    } finally {
      loading = false;
    }
  }

  function cancelConflict() {
    showConflictWarning = false;
    conflictStoryTitle = null;
  }

  async function close() {
    await cleanup();
    ui.closeSyncModal();
  }

  function formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
</script>

{#if ui.syncModalOpen}
  <div
    class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4"
    role="dialog"
    aria-modal="true"
  >
    <div
      class="card w-full sm:max-w-lg max-h-[90vh] sm:max-h-[80vh] overflow-hidden rounded-b-none sm:rounded-b-xl flex flex-col"
    >
      <!-- Header -->
      <div
        class="flex items-center justify-between border-b border-surface-700 p-4 -mx-4 -mt-4 sm:mx-0 sm:mt-0"
      >
        <div class="flex items-center gap-2">
          <RefreshCw class="h-5 w-5 text-accent-400" />
          <h2 class="text-lg font-semibold text-surface-100">
            {#if ui.syncMode === 'select'}
              Local Network Sync
            {:else if ui.syncMode === 'generate'}
              Waiting for Connection
            {:else if ui.syncMode === 'scan'}
              Scan QR Code
            {:else if ui.syncMode === 'connected'}
              Select Story to Sync
            {:else if ui.syncMode === 'syncing'}
              Syncing...
            {/if}
          </h2>
        </div>
        <button
          class="btn-ghost rounded-lg p-2 text-surface-400 hover:text-surface-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
          onclick={close}
        >
          <X class="h-5 w-5" />
        </button>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto p-4 pb-modal-safe -mx-4 sm:mx-0">
        {#if error}
          <div
            class="mb-4 rounded-lg bg-red-500/20 p-3 text-sm text-red-400 flex items-center gap-2"
          >
            <AlertTriangle class="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        {/if}

        {#if syncSuccess}
          <!-- Success State -->
          <div class="text-center py-8">
            <div
              class="mx-auto mb-4 h-16 w-16 rounded-full bg-green-500/20 flex items-center justify-center"
            >
              <Check class="h-8 w-8 text-green-400" />
            </div>
            <h3 class="text-lg font-semibold text-surface-100 mb-2">
              Sync Complete!
            </h3>
            <p class="text-surface-400">{syncMessage}</p>
            <button class="btn btn-primary mt-6" onclick={close}>Done</button>
          </div>
        {:else if ui.syncMode === 'select'}
          <!-- Mode Selection -->
          <p class="text-surface-400 text-sm mb-4">
            Sync stories between devices on the same network.
          </p>

          <div class="grid grid-cols-1 gap-3">
            <button
              class="card p-4 text-left transition-all hover:border-accent-500/50 hover:bg-surface-700/50 flex items-center gap-4"
              onclick={startGenerateMode}
            >
              <div class="rounded-lg bg-accent-900/50 p-3">
                <QrCode class="h-6 w-6 text-accent-400" />
              </div>
              <div>
                <h3 class="font-medium text-surface-100">Generate QR Code</h3>
                <p class="text-sm text-surface-400 mt-1">
                  Show a QR code for another device to scan
                </p>
              </div>
            </button>

            <button
              class="card p-4 text-left transition-all hover:border-accent-500/50 hover:bg-surface-700/50 flex items-center gap-4"
              onclick={startScanMode}
            >
              <div class="rounded-lg bg-primary-900/50 p-3">
                <Camera class="h-6 w-6 text-primary-400" />
              </div>
              <div>
                <h3 class="font-medium text-surface-100">Scan QR Code</h3>
                <p class="text-sm text-surface-400 mt-1">
                  Scan a QR code from another device
                </p>
              </div>
            </button>
          </div>
        {:else if ui.syncMode === 'generate'}
          <!-- QR Code Display -->
          {#if showReceivedConflict && receivedStoryPreview}
            <!-- Conflict warning for received push -->
            <div class="text-center py-4">
              <div
                class="mx-auto mb-4 h-16 w-16 rounded-full bg-amber-500/20 flex items-center justify-center"
              >
                <AlertTriangle class="h-8 w-8 text-amber-400" />
              </div>
              <h3 class="text-lg font-semibold text-surface-100 mb-2">
                Story Already Exists
              </h3>
              <p class="text-surface-400 mb-4">
                A story named "{receivedStoryPreview.title}" already exists on this device.
                Replacing it will create a "Pre-sync backup" checkpoint first. Continue?
              </p>
              <div class="flex justify-center gap-3">
                <button class="btn btn-secondary" onclick={cancelReceivedImport}>
                  Cancel
                </button>
                <button class="btn btn-primary" onclick={importReceivedStory}>
                  Replace
                </button>
              </div>
            </div>
          {:else if loading}
            <div class="flex flex-col items-center justify-center py-12">
              <Loader2 class="h-8 w-8 text-accent-400 animate-spin" />
              <p class="mt-4 text-surface-400">Starting server...</p>
            </div>
          {:else if serverInfo}
            <div class="text-center">
              <div
                class="bg-white p-4 rounded-lg inline-block mx-auto mb-4"
              >
                <img
                  src="data:image/png;base64,{serverInfo.qrCodeBase64}"
                  alt="QR Code"
                  class="w-64 h-64"
                />
              </div>
              <p class="text-surface-400 text-sm">
                Scan this QR code with another device running Aventura
              </p>
              <p class="text-surface-500 text-xs mt-2">
                Server: {serverInfo.ip}:{serverInfo.port}
              </p>
            </div>
          {/if}
        {:else if ui.syncMode === 'scan'}
          <!-- Version Mismatch Warning -->
          {#if showVersionWarning}
            <div class="text-center py-4">
              <div
                class="mx-auto mb-4 h-16 w-16 rounded-full bg-amber-500/20 flex items-center justify-center"
              >
                <AlertTriangle class="h-8 w-8 text-amber-400" />
              </div>
              <h3 class="text-lg font-semibold text-surface-100 mb-2">
                Version Mismatch
              </h3>
              <p class="text-surface-400 mb-2">
                The remote device is running a different version of Aventura.
              </p>
              <div class="text-sm text-surface-500 mb-4">
                <p>Local: v{localVersion}</p>
                <p>Remote: {remoteVersion ? `v${remoteVersion}` : 'unknown'}</p>
              </div>
              <p class="text-surface-400 text-sm mb-4">
                Syncing between different versions may cause issues. Continue anyway?
              </p>
              <div class="flex justify-center gap-3">
                <button class="btn btn-secondary" onclick={cancelVersionMismatch}>
                  Cancel
                </button>
                <button class="btn btn-primary" onclick={proceedWithVersionMismatch}>
                  Continue Anyway
                </button>
              </div>
            </div>
          {:else}
            <!-- QR Scanner -->
            <div class="text-center">
              <div
                id={scannerElementId}
                class="mx-auto mb-4 rounded-lg overflow-hidden"
                style="width: 300px; height: 300px;"
              ></div>
              <p class="text-surface-400 text-sm">
                Point your camera at the QR code
              </p>
            </div>
          {/if}
        {:else if ui.syncMode === 'connected'}
          <!-- Story Selection -->
          {#if loading}
            <div class="flex flex-col items-center justify-center py-8">
              <Loader2 class="h-8 w-8 text-accent-400 animate-spin" />
              <p class="mt-4 text-surface-400">Connecting...</p>
            </div>
          {:else}
            <!-- Conflict Warning -->
            {#if showConflictWarning}
              <div
                class="mb-4 rounded-lg bg-amber-500/20 p-4 text-amber-400"
              >
                <div class="flex items-center gap-2 mb-2">
                  <AlertTriangle class="h-5 w-5" />
                  <span class="font-semibold">Story Already Exists</span>
                </div>
                <p class="text-sm">
                  A story named "{conflictStoryTitle}" already exists on this
                  device. Pulling will replace it after creating a "Pre-sync backup"
                  checkpoint.
                </p>
                <div class="flex gap-2 mt-3">
                  <button
                    class="btn btn-secondary text-sm"
                    onclick={cancelConflict}
                  >
                    Cancel
                  </button>
                  <button class="btn btn-primary text-sm" onclick={pullStory}>
                    Continue Anyway
                  </button>
                </div>
              </div>
            {/if}

            <!-- Pull Stories (from remote) -->
            {#if remoteStories.length > 0}
              <div class="mb-6">
                <h3
                  class="text-sm font-medium text-surface-300 mb-2 flex items-center gap-2"
                >
                  <Download class="h-4 w-4" />
                  Pull from Remote Device
                </h3>
                <div class="space-y-2 max-h-40 overflow-y-auto">
                  {#each remoteStories as remoteStory}
                    <button
                      class="w-full card p-3 text-left transition-all hover:border-accent-500/50"
                      class:ring-2={selectedRemoteStory?.id === remoteStory.id}
                      class:ring-accent-500={selectedRemoteStory?.id ===
                        remoteStory.id}
                      onclick={() => {
                        selectedRemoteStory = remoteStory;
                        selectedLocalStory = null;
                      }}
                    >
                      <div class="flex items-center justify-between">
                        <span class="font-medium text-surface-100 truncate">
                          {remoteStory.title}
                        </span>
                        {#if remoteStory.genre}
                          <span
                            class="text-xs bg-surface-700 px-2 py-0.5 rounded-full text-surface-400"
                          >
                            {remoteStory.genre}
                          </span>
                        {/if}
                      </div>
                      <div class="text-xs text-surface-500 mt-1">
                        {remoteStory.entryCount} entries • Updated {formatDate(
                          remoteStory.updatedAt
                        )}
                      </div>
                    </button>
                  {/each}
                </div>
              </div>
            {:else}
              <div class="mb-6 text-center py-4 text-surface-500">
                No stories available on remote device
              </div>
            {/if}

            <!-- Push Stories (to remote) -->
            {#if localStories.length > 0}
              <div>
                <h3
                  class="text-sm font-medium text-surface-300 mb-2 flex items-center gap-2"
                >
                  <Upload class="h-4 w-4" />
                  Push to Remote Device
                </h3>
                <div class="space-y-2 max-h-40 overflow-y-auto">
                  {#each localStories as localStory}
                    <button
                      class="w-full card p-3 text-left transition-all hover:border-accent-500/50"
                      class:ring-2={selectedLocalStory?.id === localStory.id}
                      class:ring-accent-500={selectedLocalStory?.id ===
                        localStory.id}
                      onclick={() => {
                        selectedLocalStory = localStory;
                        selectedRemoteStory = null;
                      }}
                    >
                      <div class="flex items-center justify-between">
                        <span class="font-medium text-surface-100 truncate">
                          {localStory.title}
                        </span>
                        {#if localStory.genre}
                          <span
                            class="text-xs bg-surface-700 px-2 py-0.5 rounded-full text-surface-400"
                          >
                            {localStory.genre}
                          </span>
                        {/if}
                      </div>
                      <div class="text-xs text-surface-500 mt-1">
                        Updated {formatDate(localStory.updatedAt)}
                      </div>
                    </button>
                  {/each}
                </div>
              </div>
            {/if}
          {/if}
        {:else if ui.syncMode === 'syncing'}
          <!-- Syncing State -->
          <div class="flex flex-col items-center justify-center py-12">
            <Loader2 class="h-8 w-8 text-accent-400 animate-spin" />
            <p class="mt-4 text-surface-400">
              {selectedRemoteStory ? 'Pulling' : 'Pushing'} story...
            </p>
            <p class="text-surface-500 text-sm mt-1">Please wait</p>
          </div>
        {/if}
      </div>

      <!-- Footer -->
      {#if ui.syncMode === 'connected' && !showConflictWarning && !loading && !syncSuccess}
        <div class="border-t border-surface-700 px-4 pt-4 pb-modal-safe -mx-4 -mb-4 sm:mx-0 sm:mb-0">
          <div class="flex justify-end gap-2">
            <button class="btn btn-secondary" onclick={close}>Cancel</button>
            {#if selectedRemoteStory}
              <button class="btn btn-primary flex items-center gap-2" onclick={pullStory}>
                <Download class="h-4 w-4" />
                Pull Story
              </button>
            {:else if selectedLocalStory}
              <button class="btn btn-primary flex items-center gap-2" onclick={pushStory}>
                <Upload class="h-4 w-4" />
                Push Story
              </button>
            {/if}
          </div>
        </div>
      {/if}
    </div>
  </div>
{/if}
