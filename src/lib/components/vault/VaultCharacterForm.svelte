<script lang="ts">
  import type { VaultCharacter, VaultCharacterType } from '$lib/types';
  import { characterVault } from '$lib/stores/characterVault.svelte';
  import { X, User, Users, ImageUp, Loader2 } from 'lucide-svelte';
  import { normalizeImageDataUrl } from '$lib/utils/image';
  import TagInput from '$lib/components/tags/TagInput.svelte';

  interface Props {
    character?: VaultCharacter | null;
    defaultType?: VaultCharacterType;
    onClose: () => void;
    onSaved?: (character: VaultCharacter) => void;
  }

  let { character = null, defaultType = 'protagonist', onClose, onSaved }: Props = $props();

  // Form state
  let characterType = $state<VaultCharacterType>(character?.characterType ?? defaultType);
  let name = $state(character?.name ?? '');
  let description = $state(character?.description ?? '');
  let background = $state(character?.background ?? '');
  let motivation = $state(character?.motivation ?? '');
  let role = $state(character?.role ?? '');
  let relationshipTemplate = $state(character?.relationshipTemplate ?? '');
  let traits = $state(character?.traits.join(', ') ?? '');
  let visualDescriptors = $state(character?.visualDescriptors.join(', ') ?? '');
  let tags = $state<string[]>(character?.tags ?? []);
  let portrait = $state<string | null>(character?.portrait ?? null);

  let saving = $state(false);
  let error = $state<string | null>(null);
  let uploadingPortrait = $state(false);

  const isEditing = $derived(!!character);

  async function handleSubmit() {
    if (!name.trim()) {
      error = 'Name is required';
      return;
    }

    saving = true;
    error = null;

    try {
      const traitsArray = traits.split(',').map(t => t.trim()).filter(Boolean);
      const visualDescriptorsArray = visualDescriptors.split(',').map(d => d.trim()).filter(Boolean);
      
      if (isEditing && character) {
        // Update existing
        await characterVault.update(character.id, {
          name: name.trim(),
          description: description.trim() || null,
          characterType,
          background: background.trim() || null,
          motivation: motivation.trim() || null,
          role: role.trim() || null,
          relationshipTemplate: relationshipTemplate.trim() || null,
          traits: traitsArray,
          visualDescriptors: visualDescriptorsArray,
          tags,
          portrait,
        });
        onSaved?.(characterVault.getById(character.id)!);
      } else {
        // Create new
        const newCharacter = await characterVault.add({
          name: name.trim(),
          description: description.trim() || null,
          characterType,
          background: background.trim() || null,
          motivation: motivation.trim() || null,
          role: role.trim() || null,
          relationshipTemplate: relationshipTemplate.trim() || null,
          traits: traitsArray,
          visualDescriptors: visualDescriptorsArray,
          tags,
          portrait,
          favorite: false,
          source: 'manual',
          originalStoryId: null,
          metadata: null,
        });
        onSaved?.(newCharacter);
      }
      onClose();
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to save character';
    } finally {
      saving = false;
    }
  }

  function handlePortraitUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      error = 'Please select an image file';
      return;
    }

    uploadingPortrait = true;
    const reader = new FileReader();
    reader.onload = (e) => {
      portrait = e.target?.result as string;
      uploadingPortrait = false;
    };
    reader.onerror = () => {
      error = 'Failed to read image file';
      uploadingPortrait = false;
    };
    reader.readAsDataURL(file);
    input.value = '';
  }

  function removePortrait() {
    portrait = null;
  }
</script>

<!-- Modal backdrop -->
<div
  class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
  onclick={(e) => { if (e.target === e.currentTarget) onClose(); }}
  role="dialog"
  aria-modal="true"
>
  <div class="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-lg bg-surface-800 shadow-xl">
    <!-- Header -->
    <div class="flex items-center justify-between border-b border-surface-700 p-4">
      <h2 class="text-lg font-semibold text-surface-100">
        {isEditing ? 'Edit Character' : 'New Character'}
      </h2>
      <button
        class="rounded p-1.5 hover:bg-surface-700"
        onclick={onClose}
      >
        <X class="h-5 w-5 text-surface-400" />
      </button>
    </div>

    <!-- Form -->
    <form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="p-4 space-y-4">
      {#if error}
        <div class="rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-400">
          {error}
        </div>
      {/if}

      <!-- Character Type -->
      <div>
        <label class="block text-sm font-medium text-surface-300 mb-2">Character Type</label>
        <div class="flex gap-2">
          <button
            type="button"
            class="flex-1 flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm transition-colors {
              characterType === 'protagonist'
                ? 'border-accent-500 bg-accent-500/20 text-accent-300'
                : 'border-surface-600 bg-surface-700 text-surface-400 hover:border-surface-500'
            }"
            onclick={() => characterType = 'protagonist'}
          >
            <User class="h-4 w-4" />
            Protagonist
          </button>
          <button
            type="button"
            class="flex-1 flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm transition-colors {
              characterType === 'supporting'
                ? 'border-accent-500 bg-accent-500/20 text-accent-300'
                : 'border-surface-600 bg-surface-700 text-surface-400 hover:border-surface-500'
            }"
            onclick={() => characterType = 'supporting'}
          >
            <Users class="h-4 w-4" />
            Supporting
          </button>
        </div>
      </div>

      <!-- Name -->
      <div>
        <label for="name" class="block text-sm font-medium text-surface-300 mb-1">Name *</label>
        <input
          id="name"
          type="text"
          bind:value={name}
          placeholder="Character name"
          class="w-full rounded-lg border border-surface-600 bg-surface-700 px-3 py-2 text-surface-100 placeholder-surface-500 focus:border-accent-500 focus:outline-none"
        />
      </div>

      <!-- Description -->
      <div>
        <label for="description" class="block text-sm font-medium text-surface-300 mb-1">Description</label>
        <textarea
          id="description"
          bind:value={description}
          placeholder="Brief description of the character"
          rows="3"
          class="w-full rounded-lg border border-surface-600 bg-surface-700 px-3 py-2 text-surface-100 placeholder-surface-500 focus:border-accent-500 focus:outline-none resize-none"
        ></textarea>
      </div>

      <!-- Protagonist-specific fields -->
      {#if characterType === 'protagonist'}
        <div>
          <label for="background" class="block text-sm font-medium text-surface-300 mb-1">Background</label>
          <textarea
            id="background"
            bind:value={background}
            placeholder="Character's backstory and history"
            rows="2"
            class="w-full rounded-lg border border-surface-600 bg-surface-700 px-3 py-2 text-surface-100 placeholder-surface-500 focus:border-accent-500 focus:outline-none resize-none"
          ></textarea>
        </div>

        <div>
          <label for="motivation" class="block text-sm font-medium text-surface-300 mb-1">Motivation</label>
          <input
            id="motivation"
            type="text"
            bind:value={motivation}
            placeholder="What drives this character?"
            class="w-full rounded-lg border border-surface-600 bg-surface-700 px-3 py-2 text-surface-100 placeholder-surface-500 focus:border-accent-500 focus:outline-none"
          />
        </div>
      {/if}

      <!-- Supporting-specific fields -->
      {#if characterType === 'supporting'}
        <div>
          <label for="role" class="block text-sm font-medium text-surface-300 mb-1">Role</label>
          <input
            id="role"
            type="text"
            bind:value={role}
            placeholder="e.g., Mentor, Rival, Love Interest"
            class="w-full rounded-lg border border-surface-600 bg-surface-700 px-3 py-2 text-surface-100 placeholder-surface-500 focus:border-accent-500 focus:outline-none"
          />
        </div>

        <div>
          <label for="relationship" class="block text-sm font-medium text-surface-300 mb-1">Relationship Template</label>
          <input
            id="relationship"
            type="text"
            bind:value={relationshipTemplate}
            placeholder="Default relationship to protagonist"
            class="w-full rounded-lg border border-surface-600 bg-surface-700 px-3 py-2 text-surface-100 placeholder-surface-500 focus:border-accent-500 focus:outline-none"
          />
        </div>
      {/if}

      <!-- Traits -->
      <div>
        <label for="traits" class="block text-sm font-medium text-surface-300 mb-1">Traits</label>
        <input
          id="traits"
          type="text"
          bind:value={traits}
          placeholder="Brave, Curious, Stubborn (comma-separated)"
          class="w-full rounded-lg border border-surface-600 bg-surface-700 px-3 py-2 text-surface-100 placeholder-surface-500 focus:border-accent-500 focus:outline-none"
        />
        <p class="mt-1 text-xs text-surface-500">Comma-separated personality traits</p>
      </div>

      <!-- Visual Descriptors -->
      <div>
        <label for="visualDescriptors" class="block text-sm font-medium text-surface-300 mb-1">Visual Descriptors</label>
        <input
          id="visualDescriptors"
          type="text"
          bind:value={visualDescriptors}
          placeholder="Tall, dark hair, blue eyes (comma-separated)"
          class="w-full rounded-lg border border-surface-600 bg-surface-700 px-3 py-2 text-surface-100 placeholder-surface-500 focus:border-accent-500 focus:outline-none"
        />
        <p class="mt-1 text-xs text-surface-500">Used for portrait generation</p>
      </div>

      <!-- Portrait -->
      <div>
        <label class="block text-sm font-medium text-surface-300 mb-2">Portrait</label>
        <div class="flex items-start gap-4">
          {#if portrait}
            <div class="relative">
              <img
                src={normalizeImageDataUrl(portrait) ?? ''}
                alt="Portrait preview"
                class="h-20 w-20 rounded-lg object-cover ring-1 ring-surface-600"
              />
              <button
                type="button"
                class="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                onclick={removePortrait}
              >
                <X class="h-3 w-3" />
              </button>
            </div>
          {:else}
            <div class="flex h-20 w-20 items-center justify-center rounded-lg bg-surface-700 ring-1 ring-surface-600">
              {#if characterType === 'protagonist'}
                <User class="h-8 w-8 text-surface-500" />
              {:else}
                <Users class="h-8 w-8 text-surface-500" />
              {/if}
            </div>
          {/if}

          <label class="flex cursor-pointer items-center gap-2 rounded-lg border border-surface-600 bg-surface-700 px-3 py-2 text-sm text-surface-300 hover:border-surface-500">
            {#if uploadingPortrait}
              <Loader2 class="h-4 w-4 animate-spin" />
            {:else}
              <ImageUp class="h-4 w-4" />
            {/if}
            Upload Image
            <input
              type="file"
              accept="image/*"
              class="hidden"
              onchange={handlePortraitUpload}
              disabled={uploadingPortrait}
            />
          </label>
        </div>
      </div>

      <!-- Tags -->
      <div>
        <label for="tags" class="block text-sm font-medium text-surface-300 mb-1">Tags</label>
        <TagInput
          value={tags}
          type="character"
          onChange={(newTags) => tags = newTags}
          placeholder="Add tags..."
        />
        <p class="mt-1 text-xs text-surface-500">For organizing your vault</p>
      </div>

      <!-- Actions -->
      <div class="flex justify-end gap-3 pt-4 border-t border-surface-700">
        <button
          type="button"
          class="rounded-lg px-4 py-2 text-sm text-surface-400 hover:text-surface-200"
          onclick={onClose}
          disabled={saving}
        >
          Cancel
        </button>
        <button
          type="submit"
          class="flex items-center gap-2 rounded-lg bg-accent-500 px-4 py-2 text-sm font-medium text-white hover:bg-accent-600 disabled:opacity-50"
          disabled={saving || !name.trim()}
        >
          {#if saving}
            <Loader2 class="h-4 w-4 animate-spin" />
          {/if}
          {isEditing ? 'Save Changes' : 'Create Character'}
        </button>
      </div>
    </form>
  </div>
</div>
