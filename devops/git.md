# Git — Interview Preparation

---

## Git Rebase

### What is Git Rebase?

Rebase **re-applies your branch commits on top of another branch's latest commit**, creating a linear history instead of a merge commit.

```
BEFORE rebase (feature off main):
main:     A — B — C
                \
feature:         D — E

AFTER rebase (feature onto main):
main:     A — B — C
                    \
feature:             D' — E'
```

### Rebase vs Merge

| | `git merge` | `git rebase` |
|-|-------------|--------------|
| **History** | Preserves branch history (merge commit) | Linear, clean history |
| **Commit graph** | Non-linear (diamond shape) | Straight line |
| **Conflicts** | Resolve once | Resolve per commit being replayed |
| **Safety** | Safe for shared branches | **Never rebase shared/public branches** |
| **Use case** | Integrating feature → main | Updating feature with latest main |

### Commands

```bash
# Basic rebase: update feature branch with latest main
git checkout feature
git rebase main

# Interactive rebase: squash, reword, reorder last N commits
git rebase -i HEAD~3

# Abort a rebase in progress
git rebase --abort

# Continue after resolving conflicts
git rebase --continue

# Skip a conflicting commit
git rebase --skip
```

### Interactive Rebase Options

```
pick   → use commit as-is
reword → use commit but edit the message
squash → combine with previous commit (keep message)
fixup  → combine with previous commit (discard message)
drop   → remove the commit entirely
edit   → pause to amend the commit
```

### Golden Rule

> ⚠️ **Never rebase commits that have been pushed to a shared branch.** Rebase rewrites commit hashes — this forces others to reconcile diverged history.

### When to Use Rebase

| Scenario | Use |
|----------|-----|
| Update feature branch with latest main | `git rebase main` |
| Clean up messy local commits before PR | `git rebase -i HEAD~N` |
| Squash WIP commits into one meaningful commit | Interactive rebase with `squash`/`fixup` |
| Maintain linear project history | Rebase instead of merge |

### When NOT to Use Rebase

- On `main`/`develop` or any shared branch
- After commits are pushed and others have pulled
- When you want to preserve the exact merge history

### Common Interview Q&A

| # | Question | Answer |
|---|----------|--------|
| 1 | **Rebase vs Merge?** | Merge preserves history with merge commit. Rebase replays commits for **linear history** |
| 2 | **When to use rebase?** | Updating feature branch with latest main, cleaning up commits before PR |
| 3 | **Golden rule of rebase?** | **Never rebase shared/public branches** — it rewrites commit history |
| 4 | **What does interactive rebase do?** | Lets you squash, reword, reorder, or drop commits |
| 5 | **What happens during rebase conflict?** | Rebase pauses. Fix conflict → `git add` → `git rebase --continue` |
| 6 | **How to undo a rebase?** | `git reflog` to find pre-rebase commit → `git reset --hard <hash>` |

---

## Quick Reference

```
REBASE:       Replays commits on top of another branch → linear history
MERGE:        Creates merge commit → preserves branch history
INTERACTIVE:  git rebase -i HEAD~N → squash, reword, reorder, drop
GOLDEN RULE:  Never rebase shared/pushed branches
UNDO:         git reflog → git reset --hard <pre-rebase-hash>
CONFLICT:     Fix → git add → git rebase --continue
```
