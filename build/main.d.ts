export declare class AirParser {
    private filePath;
    constructor(filePath: string);
    parse(): Promise<{
        size: any;
        slides: any[];
    }>;
}
