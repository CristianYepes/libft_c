# libft — Portable C Standard Library + Buffered Line Reader

**A from-scratch implementation of 45+ essential C functions — memory operations, string manipulation, character classification, formatted output, a generic linked list, and a buffered line reader (get_next_line) — compiled as a single zero-dependency static archive. Every allocation path is NULL-checked, every failure is recoverable, and the entire codebase compiles clean under `-Wall -Wextra -Werror`.**

![Build](https://img.shields.io/badge/build-passing-brightgreen.svg)
![Language](https://img.shields.io/badge/language-C-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Functions](https://img.shields.io/badge/functions-45+-informational.svg)
![Dependencies](https://img.shields.io/badge/dependencies-0-brightgreen.svg)

---

## The Problem

Production C systems frequently operate where the standard library is unavailable, incomplete, or undesirable. Embedded firmware has no `glibc`. Kernel modules cannot call `malloc`. WebAssembly targets lack POSIX headers. Security-critical code demands full control over memory behavior — no opaque allocator, no hidden global state, no undefined behavior hiding behind a vendor implementation.

Beyond the standard library gaps, one of the most common C programming needs — reading input line by line from a file descriptor — has no standard solution. The `fgets` family requires `FILE *` streams; raw `read()` returns arbitrary chunks unaligned to line boundaries. A correct buffered reader must handle partial reads, variable buffer sizes, multiple calls across the same descriptor's lifetime, and clean memory management with zero leaks whether the caller reads to EOF or stops mid-file.

A correct replacement library must guarantee: null-termination on every string operation regardless of truncation, zero memory leaks on any failure path (including partial allocations mid-operation), defined behavior for edge cases the standard leaves unspecified (overlapping regions in `memmove`, `INT_MIN` in integer-to-string), and a stateful line reader that works correctly with any `BUFFER_SIZE` from 1 byte to system limits.

---

## Solution Architecture

| Module | Count | Key Functions | Responsibility |
|--------|------:|---------------|----------------|
| Memory | 7 | `memset` `bzero` `memcpy` `memmove` `memchr` `memcmp` `calloc` | Raw byte-level ops on `void *` buffers |
| String | 8 | `strlen` `strlcpy` `strlcat` `strchr` `strrchr` `strncmp` `strnstr` `strdup` | Search, copy, comparison |
| Builders | 7 | `substr` `strjoin` `strtrim` `split` `free_split` `strmapi` `striteri` | Heap-allocated string construction |
| Char | 7 | `isalpha` `isdigit` `isalnum` `isascii` `isprint` `toupper` `tolower` | Classification and case conversion |
| Numeric | 3 | `atoi` `itoa` `calloc` | Type conversion + zeroed allocation |
| FD I/O | 4 | `putchar_fd` `putstr_fd` `putendl_fd` `putnbr_fd` | Direct `write()` to any fd |
| Linked List | 9 | `lstnew` `lstadd_front/back` `lstsize` `lstlast` `lstdelone` `lstclear` `lstiter` `lstmap` | Generic singly-linked list (`void *`) |
| GNL | 10 | `get_next_line` `ft_read_line` `ft_parse_line` `join_strs` `ft_free_strs` | Buffered line reader (configurable `BUFFER_SIZE`) |

**46 source files | ~1700 lines of C | 1 header | 0 external dependencies**

---

## Build and Usage

### Requirements

| Dependency | Purpose |
|------------|---------|
| GCC or Clang (C99+) | Compilation |
| GNU Make 3.81+ | Build orchestration |
| ar (binutils) | Static archive creation |
| Node.js 18+ | MCP server runtime (optional) |

### Build the Library

```sh
make          # Compile core (36 functions including GNL) -> libft.a
make bonus    # Compile all 45+ functions (includes linked list) -> libft.a
make clean    # Remove object files
make fclean   # Remove objects + archive
make re       # Full rebuild
```

### Link Into Your Project

```sh
gcc -Wall -Wextra -Werror your_program.c -I/path/to/libft -L/path/to/libft -lft -o program
```

Then use any function by including the header:

```c
#include "libft.h"
```

| Need | Function | Free? |
|------|----------|-------|
| Split a string | `ft_split("a:b:c", ':')` | `ft_free_split(result)` |
| Read file line by line | `get_next_line(fd)` | `free(line)` each call |
| Safe string copy | `ft_strlcpy(dst, src, size)` | No |
| Integer to string | `ft_itoa(42)` | `free(result)` |
| Write to stderr | `ft_putendl_fd("error", 2)` | No |

### Validation

```sh
# Memory leak detection
valgrind --leak-check=full --show-leak-kinds=all ./test_program

# Address and undefined behavior sanitizers
gcc -fsanitize=address,undefined -g *.c -o test_sanitized && ./test_sanitized

# GNL edge cases
gcc -D BUFFER_SIZE=1 -Wall -Wextra -Werror test_gnl.c -L. -lft -o test_bs1 && ./test_bs1
gcc -D BUFFER_SIZE=10000 -Wall -Wextra -Werror test_gnl.c -L. -lft -o test_bs10k && ./test_bs10k

# Relink check
make && make    # Second invocation should produce no compilation output
```

---

## Engineering Deep Dive

### Overlap-Safe Memory Copy (ft_memmove)

**The challenge:** When source and destination buffers overlap, forward copying corrupts unread bytes before they are consumed. The standard says `memcpy` is undefined for overlapping regions — but `memmove` must work correctly regardless.

**The approach:** Compare pointer addresses at runtime to select copy direction. When `dest < src`, forward copying is safe. When `dest >= src`, backward copying preserves unread data:

```c
if (d < s)
    while (i < len) { d[i] = s[i]; i++; }
else
    while (len-- > 0) { d[len] = s[len]; }
```

### Buffered Line Reader (get_next_line)

**The challenge:** `read()` returns arbitrary byte chunks regardless of line boundaries. A line reader must accumulate bytes across multiple `read()` calls, detect `\n` delimiters, return exactly one line per invocation, and preserve leftover bytes for the next call — all while handling any `BUFFER_SIZE` from 1 to gigabytes without leaking memory on any code path.

**The approach:** A `static char *keep` variable persists between calls, holding unprocessed bytes from previous reads. Each invocation:

1. **Read phase** (`ft_read_line`): Read into a temporary buffer in a loop. After each `read()`, join the buffer onto `keep`. If `keep` now contains `\n`, break early. If `read()` returns -1 (error), free all state and return NULL.

2. **Parse phase** (`ft_parse_line`): Split `keep` at the first `\n` — everything before (inclusive of `\n`) becomes the returned line, everything after becomes the new `keep` for the next call.

3. **Cleanup**: On EOF or empty result, all state is freed via `ft_free_strs` which NULLs every pointer after freeing.

The `BUFFER_SIZE` is configurable at compile time via `-D BUFFER_SIZE=N`, defaulting to `BUFSIZ` (system-optimal). A guard prevents absurdly large values:

```c
#if BUFFER_SIZE > 9223372036854775806
# undef BUFFER_SIZE
# define BUFFER_SIZE 0
#endif
```

### Cascading Allocation Cleanup (ft_split)

**The challenge:** `ft_split` allocates `N + 1` pointers for the array, then allocates each word individually. If the 5th allocation fails, the previous 4 strings and the array pointer itself must be freed.

**The approach:** A static cleanup function walks backward through the array:

```c
static void *ft_free(char **tab, int i)
{
    while (i--)
        if (tab[i])
            free(tab[i]);
    free(tab);
    return (NULL);
}
```

Paired with `ft_free_split` as a public API for callers who need to free the result.

### INT_MIN Handling in ft_itoa

**The challenge:** `INT_MIN` (-2147483648) cannot be negated in a 32-bit `int` because +2147483648 exceeds `INT_MAX`. `n = -n` causes undefined behavior.

**The approach:** Cast to `long int` before any arithmetic. The 64-bit range handles the full int domain without overflow.

### Generic Linked List with Safe Cleanup

**The challenge:** A `void *` list cannot know how to free its contents. `lstmap` must handle partial allocation failure mid-transform without leaking already-transformed nodes.

**The approach:** All destructive operations accept a `del` function pointer. `lstmap` frees the failed content and tears down the partial result if any node allocation fails:

```c
if (!node)
{
    (*del)(content);
    ft_lstclear(&res, del);
    return (NULL);
}
```

---

## Key Properties

| Property | Guarantee | Mechanism |
|----------|-----------|-----------|
| Memory safety | Zero leaks on all failure paths | NULL-checks on every malloc; cascading cleanup; ft_free_strs |
| Buffer safety | No overflows via string API | `strlcpy`/`strlcat` guarantee null-termination within bounds |
| Defined behavior | No UB for edge cases | `long` cast for INT_MIN; direction-aware copy; NULL guards |
| GNL correctness | Works with any BUFFER_SIZE (1 to BUFSIZ+) | Static accumulator; early-break on newline; compile-time guard |
| GNL error safety | read() failure frees all state | `ft_free_strs` nulls every pointer on -1 return |
| Zero dependencies | Only uses write/malloc/free/read | Links nothing but the C runtime |
| Strict compilation | No warnings under `-Wall -Wextra -Werror -fPIE` | All paths return values; proper casts; no unused vars |

---

## Design Decisions

| Decision | Alternatives Considered | Why This Approach |
|----------|------------------------|-------------------|
| GNL integrated into libft.a | Separate library; header-only | Single archive simplifies linking for downstream projects |
| `static char *keep` for GNL state | Struct passed by caller; global array | Minimal API surface; caller just calls `get_next_line(fd)` |
| `BUFFER_SIZE` as compile-time define | Runtime parameter; fixed constant | Zero runtime overhead; optimizable by compiler; configurable per build |
| `ft_free_split` as public utility | Force callers to write their own loop | Common pattern deserves a named function; prevents off-by-one frees |
| `long int` cast for INT_MIN | Unsigned arithmetic; special-case string | Cleaner, no conditional logic, works on all LP64 platforms |
| BSD `strlcpy`/`strlcat` semantics | `strncpy` (no null guarantee); `snprintf` | Prevents overflows by design; return value enables truncation detection |
| Static archive (`.a`) | `.so` shared library; header-only | Zero runtime deps; linker discards unused functions automatically |
| `void *` list content | Typed list via macros; union variant | Maximum genericity; user owns the type contract |
| `ft_malloc_zero` in GNL (own calloc) | Reuse ft_calloc; raw malloc+memset | GNL self-contained within its own files; no cross-dependency |
| `-fPIE` in CFLAGS | None (default non-PIE) | Position-independent code for security (ASLR compatibility) |

---

## AI-Assistive Development Tooling (MCP Server)

This project includes a custom MCP (Model Context Protocol) server that exposes development tools purpose-built for this library. The tools provide capabilities that are genuinely difficult to achieve by reading files and running ad-hoc commands.

### Why an MCP Server?

When working with a 45+ function library that spans two integrated systems (standard library reimplementations + stateful buffered I/O), certain questions recur: "Does this function allocate?" "What's the call chain from `ft_split` down to `ft_bzero`?" "Does my GNL handle `BUFFER_SIZE=1` correctly?" "Is my Makefile going to relink?"

The MCP server pre-computes function metadata at startup and exposes structured tools:

| Tool | What it does | Value |
|------|--------------|-------|
| `function_lookup` | Semantic search: prototype, category, allocation, deps | Avoids opening 4+ files to trace one question |
| `dependency_graph` | Call graph traversal with depth control | Traces `ft_split -> ft_calloc -> ft_bzero` automatically |
| `test_against_libc` | Compile-and-run harness comparing ft_ vs libc | Eliminates throwaway .c file boilerplate |
| `allocation_map` | Complete "must I free?" reference | Critical for downstream consumers of the library |
| `validate_makefile` | Relink detection, flag check, target check | Encodes rules `make` alone cannot verify |
| `test_gnl` | Test GNL with custom content + BUFFER_SIZE | Creates temp file, compiles with -D flag, reports per-call output |

### Build the MCP Server (Optional)

```sh
cd .mcp && npm install && npm run build
```

Auto-configured in `.claude/settings.json` for Claude Code integration.

---

## License

This project is released under the MIT License.

---

<p align="center">
  <em>45+ functions. Zero dependencies. Buffered I/O to memory safety. One archive.</em>
</p>
