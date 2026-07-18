export interface CompileResult {
    success: boolean;
    output?: string;
    error?: string;
    exitCode: number;
}
export declare function compileAndRun(sourceCode: string, projectDir: string, extraFlags?: string[], timeout?: number): CompileResult;
export declare function ensureLibraryBuilt(projectDir: string): {
    success: boolean;
    error?: string;
};
