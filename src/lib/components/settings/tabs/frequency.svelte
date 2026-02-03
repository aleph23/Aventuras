<script lang="ts">
  import { settings } from "$lib/stores/settings.svelte";
  import { Label } from "$lib/components/ui/label";
  import { Slider } from "$lib/components/ui/slider";
  import { Button } from "$lib/components/ui/button";
  import { RotateCcw } from "lucide-svelte";
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h3 class="text-lg font-medium">API Call Frequency</h3>
      <p class="text-sm text-muted-foreground">
        Configure how often AI services run (0 = Disabled, 1 = Every Turn, 10 =
        Every 10 Turns).
      </p>
    </div>
    <Button
      variant="outline"
      size="sm"
      onclick={() => {
        // Reset all frequencies to defaults
        settings.systemServicesSettings.classifier.triggerInterval = 1;
        settings.systemServicesSettings.entryRetrieval.triggerInterval = 1;
        settings.systemServicesSettings.suggestions.triggerInterval = 1;
        settings.systemServicesSettings.actionChoices.triggerInterval = 1;
        settings.systemServicesSettings.styleReviewer.triggerInterval = 5;
        settings.systemServicesSettings.imageGeneration.triggerInterval = 1;
        settings.systemServicesSettings.timelineFill.triggerInterval = 1;
        settings.systemServicesSettings.agenticRetrieval.triggerInterval = 1;
        settings.saveSystemServicesSettings();
      }}
    >
      <RotateCcw class="mr-2 h-4 w-4" />
      Reset All
    </Button>
  </div>

  <div class="grid gap-6">
    {#snippet FrequencySlider(
      label: string,
      value: number,
      onChange: (v: number) => void,
      description: string,
    )}
      <div class="space-y-3">
        <div class="flex justify-between items-center">
          <div class="space-y-0.5">
            <Label>{label}</Label>
            <p class="text-[12px] text-muted-foreground">{description}</p>
          </div>
          <span
            class="text-xs font-medium bg-muted px-2 py-0.5 rounded min-w-[3rem] text-center"
          >
            {value === 0
              ? "Off"
              : value === 1
                ? "Every Turn"
                : `Every ${value} Turns`}
          </span>
        </div>
        <Slider
          value={[value]}
          min={0}
          max={10}
          step={1}
          onValueChange={(v) => onChange(v[0])}
          class={value === 0 ? "opacity-60" : ""}
        />
      </div>
    {/snippet}

    {@render FrequencySlider(
      "World State Classifier",
      settings.systemServicesSettings.classifier.triggerInterval,
      (v) => {
        settings.systemServicesSettings.classifier.triggerInterval = v;
        settings.saveSystemServicesSettings();
      },
      "Detects characters, locations, and updates world state",
    )}

    {@render FrequencySlider(
      "Entry Retrieval",
      settings.systemServicesSettings.entryRetrieval.triggerInterval,
      (v) => {
        settings.systemServicesSettings.entryRetrieval.triggerInterval = v;
        settings.saveSystemServicesSettings();
      },
      "Fetches relevant lorebook entries for context",
    )}

    {@render FrequencySlider(
      "Timeline Fill (Memory)",
      settings.systemServicesSettings.timelineFill.triggerInterval,
      (v) => {
        settings.systemServicesSettings.timelineFill.triggerInterval = v;
        settings.saveSystemServicesSettings();
      },
      "Retrieves fast chronological context from past chapters",
    )}

    {@render FrequencySlider(
      "Agentic Retrieval",
      settings.systemServicesSettings.agenticRetrieval.triggerInterval,
      (v) => {
        settings.systemServicesSettings.agenticRetrieval.triggerInterval = v;
        settings.saveSystemServicesSettings();
      },
      "Deep search for complex context (resource intensive)",
    )}

    {@render FrequencySlider(
      "Action Choices",
      settings.systemServicesSettings.actionChoices.triggerInterval,
      (v) => {
        settings.systemServicesSettings.actionChoices.triggerInterval = v;
        settings.saveSystemServicesSettings();
      },
      "Generates RPG-style action suggestions (Adventure Mode only)",
    )}

    {@render FrequencySlider(
      "Suggestions",
      settings.systemServicesSettings.suggestions.triggerInterval,
      (v) => {
        settings.systemServicesSettings.suggestions.triggerInterval = v;
        settings.saveSystemServicesSettings();
      },
      "Generates story direction hints (Creative Mode only)",
    )}

    {@render FrequencySlider(
      "Image Generation",
      settings.systemServicesSettings.imageGeneration.triggerInterval,
      (v) => {
        settings.systemServicesSettings.imageGeneration.triggerInterval = v;
        settings.saveSystemServicesSettings();
      },
      "Generates scene images (requires Image Gen enabled)",
    )}

    {@render FrequencySlider(
      "Style Reviewer",
      settings.systemServicesSettings.styleReviewer.triggerInterval,
      (v) => {
        settings.systemServicesSettings.styleReviewer.triggerInterval = v;
        settings.saveSystemServicesSettings();
      },
      "Analyzes writing style match (Default: 5)",
      5,
    )}
  </div>
</div>