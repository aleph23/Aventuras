# World State
  
```mermaid
flowchart TD
    direction TB 
    subgraph Live World State
        Character["Character\ntraits, status, relationship"]
        Location["Location\ncurrent, visited, connections"]
        Item["Item\ninventory, equipped, quantity"]
        StoryBeat["StoryBeat\nquests, status, type"]
    end

    subgraph Lorebook Entries
        CharEntry["CharacterEntryStateisPresent, relationship.level"]
        LocEntry["LocationEntryStatevisitCount, presentCharacters"]
        ItemEntry["ItemEntryStateinInventory, condition"]
        ConceptEntry["ConceptEntryStaterevealed, comprehensionLevel"]
        EventEntry["EventEntryStateoccurred, witnesses"]
    end

    ClassifierService["ClassifierService=classifyResponse()"]

    StoryStore["StoryStore=story.svelte.ts"]

    Character -->|corresponds to| CharEntry
    Location -->|corresponds to| LocEntry
    Item -->|corresponds to| ItemEntry

    ClassifierService --> Character
    ClassifierService --> Location
    ClassifierService --> Item
    ClassifierService --> StoryBeat
    ClassifierService --> CharEntry
    ClassifierService --> LocEntry
    ClassifierService --> ItemEntry

    Character --> StoryStore
    Location --> StoryStore
    Item --> StoryStore
    StoryBeat --> StoryStore
    CharEntry --> StoryStore
```

This Mermaid diagram represents a flowchart showing relationships between:
1. Live World State entities (Character, Location, Item, StoryBeat)
2. Lorebook Entry states (CharEntry, LocEntry, ItemEntry, etc.)
3. A ClassifierService that connects to all entities
4. A StoryStore that receives information from all entities

The diagram shows how these components interact in what appears to be a game or narrative system architecture.
