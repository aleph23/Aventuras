<script lang="ts">
  import {
    Wand2,
    Rocket,
    Building,
    Skull,
    Search,
    Heart,
    Sparkles,
  } from "lucide-svelte";
  import type { Genre, GenreOption } from "../wizardTypes";
  import * as Card from "$lib/components/ui/card";
  import { Label } from "$lib/components/ui/label";
  import { Input } from "$lib/components/ui/input";

  interface Props {
    selectedGenre: Genre;
    customGenre: string;
    onGenreChange: (genre: Genre) => void;
    onCustomGenreChange: (value: string) => void;
  }

  let { selectedGenre, customGenre, onGenreChange, onCustomGenreChange }: Props = $props();

  // Genre options with icons
  const genres: GenreOption[] = [
    {
      id: "fantasy",
      name: "Fantasy",
      icon: Wand2,
      description: "Magic, quests, and mythical creatures",
    },
    {
      id: "scifi",
      name: "Sci-Fi",
      icon: Rocket,
      description: "Space, technology, and the future",
    },
    {
      id: "modern",
      name: "Modern",
      icon: Building,
      description: "Contemporary realistic settings",
    },
    {
      id: "horror",
      name: "Horror",
      icon: Skull,
      description: "Fear, suspense, and the unknown",
    },
    {
      id: "mystery",
      name: "Mystery",
      icon: Search,
      description: "Puzzles, clues, and investigations",
    },
    {
      id: "romance",
      name: "Romance",
      icon: Heart,
      description: "Love, relationships, and emotion",
    },
    {
      id: "custom",
      name: "Custom",
      icon: Sparkles,
      description: "Define your own genre",
    },
  ];
</script>

<div class="space-y-6">
  <div class="space-y-2">
    <h3 class="text-lg font-medium">Select Genre</h3>
    <p class="text-sm text-muted-foreground">
      What kind of story do you want to tell?
    </p>
  </div>

  <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {#each genres as genre}
      {@const Icon = genre.icon}
      <button
        class="text-left w-full focus:outline-none group"
        onclick={() => onGenreChange(genre.id)}
      >
        <Card.Root 
          class="h-full transition-all duration-200 border-border hover:border-primary hover:shadow-md hover:shadow-primary/5 {selectedGenre === genre.id ? 'ring-2 ring-primary border-primary' : ''}"
        >
          <Card.Content class="p-4">
            <div class="flex items-center gap-3 mb-2">
              <div class="rounded-md bg-primary/10 p-2">
                <Icon class="h-5 w-5 text-primary" />
              </div>
              <span class="font-medium text-foreground">{genre.name}</span>
            </div>
            <p class="text-xs text-muted-foreground leading-relaxed">{genre.description}</p>
          </Card.Content>
        </Card.Root>
      </button>
    {/each}
  </div>

  {#if selectedGenre === "custom"}
    <div class="space-y-2 max-w-md animate-in fade-in slide-in-from-top-2 duration-300">
      <Label for="custom-genre">Describe your genre</Label>
      <Input
        id="custom-genre"
        type="text"
        value={customGenre}
        oninput={(e) => onCustomGenreChange(e.currentTarget.value)}
        placeholder="e.g., Steampunk Western, Cosmic Horror, Slice-of-Life Fantasy..."
      />
    </div>
  {/if}
</div>
