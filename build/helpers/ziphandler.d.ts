/// <reference types="node" />
export default class ZipHandler {
    private static zip;
    private static zipResult;
    static loadZip(zipFilePath: string): Promise<Boolean>;
    static parseSlideAttributes(fileName: any): Promise<unknown>;
    static getFileInZip(fileName: any, resultType?: any): Promise<any>;
    static readFileBuffer(filePath: any): Promise<Buffer>;
}
