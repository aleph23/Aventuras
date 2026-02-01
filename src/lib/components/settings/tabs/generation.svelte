<script lang="ts">
  import MainNarrative from "../MainNarrative.svelte";
  import AgentProfiles from "../AgentProfiles.svelte";

  interface Props {
    onOpenManualBodyEditor: (title: string, value: string, onSave: (v: string) => void) => void;
  }

  let { onOpenManualBodyEditor }: Props = $props();
</script>

<div class="space-y-6">
  <MainNarrative
    onOpenManualBodyEditor={onOpenManualBodyEditor}
  />
  <AgentProfiles />
</div>
