/// <reference types="node" />
export declare class AirParser {
    private filePath;
    constructor(filePath: string | Buffer | ArrayBuffer);
    parse(): Promise<{
        size: any;
        slides: any[];
    }>;
}
