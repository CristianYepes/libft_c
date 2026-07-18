import { readFileSync, readdirSync } from "fs";
import { join } from "path";
const CATEGORY_MAP = {
    ft_memset: "memory", ft_bzero: "memory", ft_memcpy: "memory",
    ft_memmove: "memory", ft_memchr: "memory", ft_memcmp: "memory",
    ft_strlen: "string", ft_strlcpy: "string", ft_strlcat: "string",
    ft_strchr: "string", ft_strrchr: "string", ft_strncmp: "string",
    ft_strnstr: "string", ft_strdup: "string",
    ft_isalpha: "char", ft_isdigit: "char", ft_isalnum: "char",
    ft_isascii: "char", ft_isprint: "char", ft_tolower: "char",
    ft_toupper: "char",
    ft_atoi: "conversion", ft_itoa: "conversion", ft_calloc: "conversion",
    ft_substr: "builder", ft_strjoin: "builder", ft_strtrim: "builder",
    ft_split: "builder", ft_strmapi: "builder", ft_striteri: "builder",
    ft_free_split: "builder",
    ft_putchar_fd: "fd", ft_putstr_fd: "fd", ft_putendl_fd: "fd",
    ft_putnbr_fd: "fd",
    ft_lstnew: "list", ft_lstadd_front: "list", ft_lstsize: "list",
    ft_lstlast: "list", ft_lstadd_back: "list", ft_lstdelone: "list",
    ft_lstclear: "list", ft_lstiter: "list", ft_lstmap: "list",
    get_next_line: "gnl", get_before_newline: "gnl", get_after_newline: "gnl",
    ft_read_line: "gnl", ft_parse_line: "gnl",
    contains_newline: "gnl", join_strs: "gnl", ft_gnl_strdup: "gnl",
    ft_malloc_zero: "gnl", ft_free_strs: "gnl",
};
const DESCRIPTIONS = {
    ft_memset: "Fill memory with a constant byte",
    ft_bzero: "Zero out memory area",
    ft_memcpy: "Copy memory area (no overlap)",
    ft_memmove: "Copy memory area (handles overlap)",
    ft_memchr: "Scan memory for a byte",
    ft_memcmp: "Compare memory areas",
    ft_strlen: "Calculate string length",
    ft_strlcpy: "Size-bounded string copy",
    ft_strlcat: "Size-bounded string concatenation",
    ft_strchr: "Locate first occurrence of character in string",
    ft_strrchr: "Locate last occurrence of character in string",
    ft_strncmp: "Compare n bytes of two strings",
    ft_strnstr: "Locate substring within bounded length",
    ft_strdup: "Duplicate a string (allocates)",
    ft_isalpha: "Check if character is alphabetic",
    ft_isdigit: "Check if character is a digit",
    ft_isalnum: "Check if character is alphanumeric",
    ft_isascii: "Check if character is ASCII",
    ft_isprint: "Check if character is printable",
    ft_tolower: "Convert character to lowercase",
    ft_toupper: "Convert character to uppercase",
    ft_atoi: "Convert string to integer",
    ft_itoa: "Convert integer to string (allocates)",
    ft_calloc: "Allocate zeroed memory",
    ft_substr: "Extract substring (allocates)",
    ft_strjoin: "Concatenate two strings (allocates)",
    ft_strtrim: "Trim characters from both ends (allocates)",
    ft_split: "Split string by delimiter (allocates array)",
    ft_free_split: "Free a split result (char** array)",
    ft_strmapi: "Apply function to each char, returning new string (allocates)",
    ft_striteri: "Apply function to each char in place",
    ft_putchar_fd: "Write character to file descriptor",
    ft_putstr_fd: "Write string to file descriptor",
    ft_putendl_fd: "Write string + newline to file descriptor",
    ft_putnbr_fd: "Write integer to file descriptor",
    ft_lstnew: "Create new list node (allocates)",
    ft_lstadd_front: "Add node at beginning of list",
    ft_lstsize: "Count elements in list",
    ft_lstlast: "Return last node of list",
    ft_lstadd_back: "Add node at end of list",
    ft_lstdelone: "Delete one node using del function",
    ft_lstclear: "Delete and free entire list",
    ft_lstiter: "Apply function to each node's content",
    ft_lstmap: "Map function over list, returning new list (allocates)",
    get_next_line: "Read next line from file descriptor (static variable, allocates)",
    get_before_newline: "Extract content up to and including newline",
    get_after_newline: "Extract content after newline (remainder)",
    ft_read_line: "Read from fd into buffer until newline found",
    ft_parse_line: "Parse buffered content into line + remainder",
    contains_newline: "Check if string contains a newline character",
    join_strs: "Join two strings into new allocation (NULL-safe)",
    ft_gnl_strdup: "Duplicate string (NULL returns empty string)",
    ft_malloc_zero: "Allocate and zero-initialize memory",
    ft_free_strs: "Free up to 3 string pointers safely",
};
export function parseProject(projectDir) {
    const functions = [];
    const headerContent = readFileSync(join(projectDir, "libft.h"), "utf-8");
    const prototypes = new Map();
    const joinedHeader = headerContent.replace(/,\s*\n\s*/g, ", ");
    const protoLines = joinedHeader.split("\n");
    for (const line of protoLines) {
        const m = line.match(/^\s*([\w\s]+?)\s+(\*{0,2})\s*((?:ft_|get_|contains_|join_)\w+)\s*\((.+)\)\s*;/);
        if (m) {
            const returnType = (m[1].trim() + (m[2] ? " " + m[2] : "")).replace(/\s+/g, " ").trim();
            const funcName = m[3];
            const args = m[4].trim();
            const fullProto = `${returnType} ${funcName}(${args})`;
            prototypes.set(funcName, fullProto);
        }
    }
    const cFiles = readdirSync(projectDir).filter(f => f.endsWith(".c"));
    for (const file of cFiles) {
        const content = readFileSync(join(projectDir, file), "utf-8");
        const lines = content.split("\n");
        const staticFuncs = [...content.matchAll(/^static\s+\w+\s+\**\s*(\w+)\s*\(/gm)].map(m => m[1]);
        const funcBodies = extractFunctionBodies(lines);
        for (const [funcName, body] of funcBodies) {
            if (staticFuncs.includes(funcName))
                continue;
            if (!funcName.startsWith("ft_") && !funcName.startsWith("get_") && !funcName.startsWith("contains_") && !funcName.startsWith("join_"))
                continue;
            const allocates = /\bmalloc\s*\(/.test(body) || /\bft_calloc\s*\(/.test(body) || /\bft_malloc_zero\s*\(/.test(body) || /\bft_lstnew\s*\(/.test(body) || /\bft_parse_line\s*\(/.test(body);
            const deps = [];
            const depRegex = /\b((?:ft_|get_|contains_|join_)\w+)\s*\(/g;
            let depMatch;
            while ((depMatch = depRegex.exec(body)) !== null) {
                if (depMatch[1] !== funcName && !deps.includes(depMatch[1]) && !staticFuncs.includes(depMatch[1])) {
                    deps.push(depMatch[1]);
                }
            }
            const proto = prototypes.get(funcName);
            const returnTypeMatch = proto?.match(/^(.+?)\s+(?:ft_|get_|contains_|join_)/);
            const returnType = returnTypeMatch ? returnTypeMatch[1].trim() : "void";
            let allocationType = null;
            if (allocates) {
                if (returnType.includes("char **"))
                    allocationType = "array of strings (free each + free array, or use ft_free_split)";
                else if (returnType.includes("char *"))
                    allocationType = "string (free return value)";
                else if (returnType.includes("t_list"))
                    allocationType = "list node (use ft_lstdelone/ft_lstclear)";
                else if (returnType.includes("void *"))
                    allocationType = "generic allocation (free return value)";
                else if (returnType === "void")
                    allocationType = "internal (allocates buffers freed internally)";
            }
            functions.push({
                name: funcName,
                prototype: proto || `${returnType} ${funcName}(...)`,
                category: CATEGORY_MAP[funcName] || "other",
                allocates,
                allocationType,
                dependencies: deps,
                returnType,
                file,
                description: DESCRIPTIONS[funcName] || "",
            });
        }
    }
    return functions;
}
function extractFunctionBodies(lines) {
    const bodies = new Map();
    const defRegex = /^[a-z]\w*[\w\s]+\**\s*((?:ft_|get_|contains_|join_)\w+)\s*\(/;
    let currentFunc = null;
    let braceDepth = 0;
    let bodyLines = [];
    let inBody = false;
    for (const line of lines) {
        if (!inBody) {
            const m = line.match(defRegex);
            if (m) {
                currentFunc = m[1];
                bodyLines = [];
                braceDepth = 0;
                inBody = false;
            }
            if (currentFunc && line.includes("{")) {
                inBody = true;
                braceDepth = 1;
                bodyLines.push(line);
                continue;
            }
        }
        else {
            bodyLines.push(line);
            for (const ch of line) {
                if (ch === "{")
                    braceDepth++;
                else if (ch === "}")
                    braceDepth--;
            }
            if (braceDepth <= 0) {
                bodies.set(currentFunc, bodyLines.join("\n"));
                currentFunc = null;
                inBody = false;
            }
        }
    }
    return bodies;
}
