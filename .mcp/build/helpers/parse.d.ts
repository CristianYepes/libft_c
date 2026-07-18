export interface FunctionInfo {
    name: string;
    prototype: string;
    category: string;
    allocates: boolean;
    allocationType: string | null;
    dependencies: string[];
    returnType: string;
    file: string;
    description: string;
}
export declare function parseProject(projectDir: string): FunctionInfo[];
