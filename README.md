# Virtual Reality Check

Are you living in a virtual world, or the real one? Guess eight numbers about your last week, set the line that would bother you, then look up the truth.

**[Open it →](https://amalmehta.github.io/VirtualRealityCheck/)**

![The result: a verdict for each part of your week, with guess, line and actual for every number](<docs/images/Result.jpg>)

| Start | Guess | Dark mode on a phone |
|---|---|---|
| ![Start screen](<docs/images/Start screen.jpg>) | ![A guess](<docs/images/Guess.jpg>) | ![Dark mode on a phone](<docs/images/Dark mode on a phone.jpg>) |

```mermaid
flowchart LR
  A[Guess from memory] --> B[Set your line] --> C[Look up the real number] --> D[Four parts, no blended score] --> E[One change] --> F[Retake in two weeks]
  F --> A
```

- Private: no account, no server, no analytics. Your answers stay in your browser, with export and delete.
- Honest: the verdict rules are invented and labelled that way, and every cited fact links to its source.

**Docs:** [Instructions](docs/INSTRUCTIONS.md) · [System design](docs/SYSTEM-DESIGN.md) · [File structure](docs/FILE-STRUCTURE.md) · [Prompt log](docs/PROMPTS.md) · [Review checklist](docs/REVIEW-CHECKLIST.md) · [Spec](VirtualRealityCheck.md)
