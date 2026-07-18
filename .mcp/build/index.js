#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { execSync } from "child_process";
import { existsSync, readFileSync, writeFileSync, mkdtempSync, rmSync } from "fs";
import { join, resolve } from "path";
import { tmpdir } from "os";
import { compileAndRun, ensureLibraryBuilt } from "./helpers/compile.js";
import { parseProject } from "./helpers/parse.js";
const PROJECT_DIR = resolve("/home/cristian/Desktop/libft_c");
const server = new McpServer({
    name: "libft-tools",
    version: "2.0.0",
});
let functionIndex = null;
function getFunctionIndex() {
    if (!functionIndex) {
        functionIndex = parseProject(PROJECT_DIR);
    }
    return functionIndex;
}
// ─── Tool 1: function_lookup ───────────────────────────────────────────────────
server.tool("function_lookup", "Semantic search across all libft + GNL functions. Returns prototype, category, allocation info, and dependencies.", {
    query: z.string().describe("Function name or keyword to search (use '*' for all)"),
    category: z.enum(["memory", "string", "char", "conversion", "fd", "list", "builder", "gnl", "all"]).optional().describe("Filter by category"),
}, async ({ query, category }) => {
    const index = getFunctionIndex();
    let results = index;
    if (category && category !== "all") {
        results = results.filter(f => f.category === category);
    }
    if (query !== "*") {
        const q = query.toLowerCase();
        results = results.filter(f => f.name.toLowerCase().includes(q) ||
            f.description.toLowerCase().includes(q) ||
            f.category.includes(q));
    }
    if (results.length === 0) {
        return { content: [{ type: "text", text: `No functions found matching "${query}"${category ? ` in category "${category}"` : ""}` }] };
    }
    const output = results.map(f => {
        let entry = `### ${f.name}\n`;
        entry += `- **Prototype**: \`${f.prototype}\`\n`;
        entry += `- **Category**: ${f.category}\n`;
        entry += `- **Description**: ${f.description}\n`;
        entry += `- **Allocates**: ${f.allocates ? `YES — ${f.allocationType}` : "No"}\n`;
        entry += `- **Dependencies**: ${f.dependencies.length > 0 ? f.dependencies.join(", ") : "None"}\n`;
        entry += `- **File**: ${f.file}\n`;
        return entry;
    }).join("\n");
    return { content: [{ type: "text", text: `Found ${results.length} function(s):\n\n${output}` }] };
});
// ─── Tool 2: dependency_graph ──────────────────────────────────────────────────
server.tool("dependency_graph", "Show the call graph for a function — what it calls (callees) and what calls it (callers) within the library.", {
    function_name: z.string().describe("Name of the function (with or without ft_/get_ prefix)"),
    direction: z.enum(["callees", "callers", "both"]).optional().describe("Direction of the graph"),
    depth: z.number().optional().describe("Maximum depth to traverse (default 3)"),
}, async ({ function_name, direction = "both", depth = 3 }) => {
    const index = getFunctionIndex();
    let name = function_name;
    if (!name.startsWith("ft_") && !name.startsWith("get_")) {
        const found = index.find(f => f.name === `ft_${name}` || f.name === `get_${name}`);
        name = found?.name || `ft_${name}`;
    }
    const target = index.find(f => f.name === name);
    if (!target) {
        return { content: [{ type: "text", text: `Function "${name}" not found. Available: ${index.map(f => f.name).join(", ")}` }] };
    }
    const lines = [`# Dependency Graph: ${name}\n`];
    if (direction === "callees" || direction === "both") {
        lines.push("## Callees (what this function calls)\n");
        const visited = new Set();
        function traceCallees(fn, level) {
            if (level > depth || visited.has(fn.name))
                return [];
            visited.add(fn.name);
            const result = [];
            for (const dep of fn.dependencies) {
                const depFn = index.find(f => f.name === dep);
                const indent = "  ".repeat(level);
                const allocTag = depFn?.allocates ? " [ALLOC]" : "";
                result.push(`${indent}- ${dep}${allocTag}`);
                if (depFn) {
                    result.push(...traceCallees(depFn, level + 1));
                }
            }
            return result;
        }
        const calleeLines = traceCallees(target, 1);
        lines.push(calleeLines.length > 0 ? calleeLines.join("\n") : "  (none)");
        lines.push("");
    }
    if (direction === "callers" || direction === "both") {
        lines.push("## Callers (what calls this function)\n");
        const callers = index.filter(f => f.dependencies.includes(name));
        if (callers.length > 0) {
            for (const caller of callers) {
                const allocTag = caller.allocates ? " [ALLOC]" : "";
                lines.push(`  - ${caller.name}${allocTag} (in ${caller.file})`);
            }
        }
        else {
            lines.push("  (none within the library)");
        }
        lines.push("");
    }
    return { content: [{ type: "text", text: lines.join("\n") }] };
});
// ─── Tool 3: test_against_libc ─────────────────────────────────────────────────
server.tool("test_against_libc", "Compile and run a test harness that compares libft functions against libc equivalents. Write your test logic in C.", {
    function_name: z.string().describe("Function to test (e.g., ft_strlen or strlen)"),
    test_code: z.string().describe("C code for the test body. Use printf to output results."),
}, async ({ function_name, test_code }) => {
    const buildResult = ensureLibraryBuilt(PROJECT_DIR);
    if (!buildResult.success) {
        return { content: [{ type: "text", text: `Build failed:\n${buildResult.error}` }] };
    }
    const source = `
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>
#include "libft.h"

int main(void)
{
${test_code}
    return (0);
}
`;
    const result = compileAndRun(source, PROJECT_DIR, [], 5000);
    if (!result.success) {
        return { content: [{ type: "text", text: `## Test Failed\n\n**Compilation/Runtime Error:**\n\`\`\`\n${result.error}\n\`\`\`` }] };
    }
    return { content: [{ type: "text", text: `## Test Results for ${function_name}\n\n\`\`\`\n${result.output}\n\`\`\`` }] };
});
// ─── Tool 4: allocation_map ────────────────────────────────────────────────────
server.tool("allocation_map", "Complete map of which functions allocate heap memory, what they return, and what the caller must free.", {}, async () => {
    const index = getFunctionIndex();
    const allocators = index.filter(f => f.allocates && f.allocationType !== "internal (allocates buffers freed internally)");
    const internalAllocators = index.filter(f => f.allocates && f.allocationType === "internal (allocates buffers freed internally)");
    const nonAllocators = index.filter(f => !f.allocates);
    let output = "# Libft Allocation Map\n\n";
    output += "## Functions that ALLOCATE (caller must free)\n\n";
    output += "| Function | Returns | Caller must free |\n";
    output += "|----------|---------|------------------|\n";
    for (const f of allocators) {
        output += `| \`${f.name}\` | \`${f.returnType}\` | ${f.allocationType} |\n`;
    }
    if (internalAllocators.length > 0) {
        output += "\n## Functions that allocate INTERNALLY (no caller action needed)\n\n";
        output += "| Function | Notes |\n";
        output += "|----------|-------|\n";
        for (const f of internalAllocators) {
            output += `| \`${f.name}\` | Allocates/frees buffers internally |\n`;
        }
    }
    output += "\n## Functions that DO NOT allocate\n\n";
    output += "| Function | Returns | Notes |\n";
    output += "|----------|---------|-------|\n";
    for (const f of nonAllocators) {
        const note = f.returnType.includes("*") ? "Returns pointer into existing memory (DO NOT free)" : "Value type";
        output += `| \`${f.name}\` | \`${f.returnType}\` | ${note} |\n`;
    }
    output += `\n---\n**Total**: ${allocators.length} allocating (caller frees), ${internalAllocators.length} internal allocators, ${nonAllocators.length} non-allocating.\n`;
    output += `\n**Convenience**: Use \`ft_free_split()\` to free results from \`ft_split()\`.`;
    return { content: [{ type: "text", text: output }] };
});
// ─── Tool 5: validate_makefile ─────────────────────────────────────────────────
server.tool("validate_makefile", "Validate the Makefile against all requirements: targets, flags, relinking, bonus separation, library name.", {}, async () => {
    const makefilePath = join(PROJECT_DIR, "Makefile");
    if (!existsSync(makefilePath)) {
        return { content: [{ type: "text", text: "ERROR: No Makefile found in project directory." }] };
    }
    const makefile = readFileSync(makefilePath, "utf-8");
    const checks = [];
    const nameMatch = makefile.match(/NAME\s*=\s*(.+)/);
    const libName = nameMatch?.[1]?.trim();
    checks.push({
        name: "Library name is libft.a",
        pass: libName === "libft.a",
        detail: libName ? `Found: ${libName}` : "NAME variable not found",
    });
    const hasWall = makefile.includes("-Wall");
    const hasWextra = makefile.includes("-Wextra");
    const hasWerror = makefile.includes("-Werror");
    checks.push({
        name: "Compilation flags (-Wall -Wextra -Werror)",
        pass: hasWall && hasWextra && hasWerror,
        detail: `Wall:${hasWall} Wextra:${hasWextra} Werror:${hasWerror}`,
    });
    const requiredTargets = ["all", "clean", "fclean", "re", "bonus"];
    for (const target of requiredTargets) {
        const hasTarget = new RegExp(`^${target}\\s*:`, "m").test(makefile);
        checks.push({
            name: `Target '${target}' exists`,
            pass: hasTarget,
            detail: hasTarget ? "Present" : "MISSING",
        });
    }
    const usesAr = makefile.includes("ar rcs") || makefile.includes("ar rc");
    checks.push({
        name: "Uses 'ar' for archiving",
        pass: usesAr,
        detail: usesAr ? "Found ar command" : "ar command not found",
    });
    const ccMatch = makefile.match(/CC\s*=\s*(.+)/);
    const compiler = ccMatch?.[1]?.trim();
    checks.push({
        name: "Compiler is cc",
        pass: compiler === "cc",
        detail: compiler ? `Found: ${compiler}` : "CC variable not found",
    });
    let relinkResult = "Not tested (library not built)";
    let relinkPass = false;
    try {
        execSync("make fclean && make", { cwd: PROJECT_DIR, timeout: 15000, stdio: "pipe" });
        const secondMake = execSync("make 2>&1", { cwd: PROJECT_DIR, timeout: 15000, encoding: "utf-8", stdio: "pipe" });
        const recompiles = secondMake.includes("Compiling") || /\w+\.c\b/.test(secondMake);
        relinkPass = !recompiles;
        relinkResult = relinkPass ? "No recompilation on second make" : `Relinks detected: ${secondMake.trim().substring(0, 200)}`;
    }
    catch (err) {
        relinkResult = `Build error: ${(err.stderr?.toString() || err.message).substring(0, 200)}`;
    }
    checks.push({
        name: "No relinking (make twice)",
        pass: relinkPass,
        detail: relinkResult,
    });
    const hasPhony = makefile.includes(".PHONY");
    checks.push({
        name: ".PHONY declared",
        pass: hasPhony,
        detail: hasPhony ? "Present" : "Missing (recommended)",
    });
    const hasGnl = makefile.includes("get_next_line.c");
    checks.push({
        name: "GNL integrated into library",
        pass: hasGnl,
        detail: hasGnl ? "get_next_line.c in SRCS" : "GNL not found in SRCS",
    });
    const passed = checks.filter(c => c.pass).length;
    const total = checks.length;
    let output = `# Makefile Validation: ${passed}/${total} checks passed\n\n`;
    for (const check of checks) {
        const icon = check.pass ? "PASS" : "FAIL";
        output += `- [${icon}] **${check.name}**: ${check.detail}\n`;
    }
    if (passed === total) {
        output += "\nAll checks passed.";
    }
    else {
        output += `\n${total - passed} issue(s) found.`;
    }
    return { content: [{ type: "text", text: output }] };
});
// ─── Tool 6: test_gnl ──────────────────────────────────────────────────────────
server.tool("test_gnl", "Test get_next_line with custom file content and BUFFER_SIZE. Creates a temp file, compiles with the specified buffer size, and reports each line returned.", {
    content: z.string().describe("Content to write to the test file (use \\n for newlines)"),
    buffer_size: z.number().optional().describe("BUFFER_SIZE to compile with (default: system BUFSIZ)"),
    max_calls: z.number().optional().describe("Maximum calls to get_next_line (default: 100)"),
}, async ({ content, buffer_size, max_calls = 100 }) => {
    const buildResult = ensureLibraryBuilt(PROJECT_DIR);
    if (!buildResult.success) {
        return { content: [{ type: "text", text: `Build failed:\n${buildResult.error}` }] };
    }
    const tmp = mkdtempSync(join(tmpdir(), "gnl-test-"));
    const testFile = join(tmp, "test_input.txt");
    const srcFile = join(tmp, "test_gnl.c");
    const binFile = join(tmp, "test_gnl");
    try {
        const fileContent = content.replace(/\\n/g, "\n");
        writeFileSync(testFile, fileContent);
        const source = `
#include <stdio.h>
#include <fcntl.h>
#include <stdlib.h>
#include "libft.h"

int main(void)
{
    int fd = open("${testFile.replace(/\\/g, "\\\\")}", O_RDONLY);
    if (fd < 0) { printf("ERROR: cannot open file\\n"); return 1; }
    char *line;
    int i = 0;
    while (i < ${max_calls})
    {
        line = get_next_line(fd);
        if (!line)
        {
            printf("Call %d: (NULL) — EOF reached\\n", i + 1);
            break;
        }
        printf("Call %d: [%s]\\n", i + 1, line);
        free(line);
        i++;
    }
    if (i == ${max_calls})
        printf("(stopped at max_calls=%d)\\n", ${max_calls});
    close(fd);
    return 0;
}
`;
        writeFileSync(srcFile, source);
        const bufFlag = buffer_size !== undefined ? `-D BUFFER_SIZE=${buffer_size}` : "";
        const compileCmd = [
            "cc", "-Wall", "-Wextra", "-Werror",
            bufFlag,
            srcFile,
            "-o", binFile,
            `-I${PROJECT_DIR}/src`,
            `${PROJECT_DIR}/libft.a`,
        ].filter(Boolean).join(" ");
        try {
            execSync(compileCmd, { cwd: PROJECT_DIR, timeout: 10000, encoding: "utf-8", stdio: "pipe" });
        }
        catch (err) {
            return { content: [{ type: "text", text: `## Compilation Error\n\`\`\`\n${err.stderr?.toString() || err.message}\n\`\`\`` }] };
        }
        const output = execSync(binFile, { timeout: 10000, encoding: "utf-8", stdio: "pipe" });
        let header = `## GNL Test Results\n\n`;
        header += `**File content**: ${content.length > 80 ? content.substring(0, 80) + "..." : content}\n`;
        header += `**BUFFER_SIZE**: ${buffer_size !== undefined ? buffer_size : "BUFSIZ (system default)"}\n\n`;
        header += `\`\`\`\n${output}\`\`\``;
        return { content: [{ type: "text", text: header }] };
    }
    catch (err) {
        return { content: [{ type: "text", text: `## Runtime Error\n\`\`\`\n${err.stderr?.toString() || err.message}\n\`\`\`` }] };
    }
    finally {
        try {
            rmSync(tmp, { recursive: true, force: true });
        }
        catch { }
    }
});
// ─── Start Server ──────────────────────────────────────────────────────────────
const transport = new StdioServerTransport();
await server.connect(transport);
