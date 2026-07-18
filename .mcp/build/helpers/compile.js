import { execSync } from "child_process";
import { writeFileSync, rmSync, mkdtempSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
export function compileAndRun(sourceCode, projectDir, extraFlags = [], timeout = 5000) {
    const tmp = mkdtempSync(join(tmpdir(), "libft-mcp-"));
    const srcFile = join(tmp, "test.c");
    const binFile = join(tmp, "test");
    try {
        writeFileSync(srcFile, sourceCode);
        const compileCmd = [
            "cc", "-Wall", "-Wextra", "-Werror",
            ...extraFlags,
            srcFile,
            "-o", binFile,
            `-I${projectDir}/src`,
            `${projectDir}/libft.a`,
        ].join(" ");
        try {
            execSync(compileCmd, { cwd: projectDir, timeout, encoding: "utf-8", stdio: "pipe" });
        }
        catch (err) {
            return {
                success: false,
                error: err.stderr?.toString() || err.message,
                exitCode: err.status || 1,
            };
        }
        const output = execSync(binFile, { timeout, encoding: "utf-8", stdio: "pipe" });
        return { success: true, output, exitCode: 0 };
    }
    catch (err) {
        return {
            success: false,
            error: err.stderr?.toString() || err.stdout?.toString() || err.message,
            exitCode: err.status || 1,
        };
    }
    finally {
        try {
            rmSync(tmp, { recursive: true, force: true });
        }
        catch { }
    }
}
export function ensureLibraryBuilt(projectDir) {
    try {
        execSync("make bonus", { cwd: projectDir, timeout: 15000, encoding: "utf-8", stdio: "pipe" });
        return { success: true };
    }
    catch (err) {
        return { success: false, error: err.stderr?.toString() || err.message };
    }
}
