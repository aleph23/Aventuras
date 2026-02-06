```
flowchart TD
    TokenCount["Token Counter story.tokensSinceLastChapter"] --> |Exceeds threshold| Analyze["MemoryService.analyzeForChapter()"]
    Analyze --> |shouldCreateChapter=true| Summarize["MemoryService.summarizeChapter()"]
    Summarize --> NewChapter["Chapter created addChapter()"]
    NewChapter --> VisibleEntries["Visible Entries story.visibleEntries (not summarized)"]
    NewChapter --> Chapters["Chapters story.chapters (summaries)"]

    UserInput["User Action"] --> Retrieval["Memory Retrieval (parallel with lorebook)"]
    Retrieval --> |Timeline Fill| TF["TimelineFillService Query generation"]
    Retrieval --> |Agentic| AR["AgenticRetrievalService Iterative questioning"]
    TF --> ChapterQuery["answerChapterQuestion()"]
    AR --> ChapterQuery
    ChapterQuery --> Chapters
    ChapterQuery --> Context["Chapter Context Block Injected into prompt"]

    MemoryConfig["MemoryConfig tokenThreshold: 24000
    chapterBuffer: 10"] -.-> |configures| Analyze 
    MemoryConfig -.-> |configures| Retrieval
```

This diagram shows a memory management system with:
1. A token counter that triggers chapter creation when a threshold is exceeded
2. A chapter creation flow (Analyze → Summarize → NewChapter)
3. A retrieval system with two parallel approaches (Timeline Fill and Agentic)
4. A memory configuration that sets parameters for the system
5. The resulting chapters and context blocks that get injected into prompts

The dotted lines indicate configuration relationships, while solid lines show the main data flow.
