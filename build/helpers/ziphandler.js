//handle all zip file actions here
import JSZip from "jszip";
import { Buffer } from "buffer";
import convertXMLToJSON from "./xmlToJSON";
export default class ZipHandler {
    static zip = new JSZip();
    static zipResult;
    static loadZip(zipFilePath) {
        return new Promise(async (resolve) => {
            let data = await this.readFileBuffer(zipFilePath);
            this.zipResult = await this.zip.loadAsync(data);
            resolve(true);
        });
    }
    static async parseSlideAttributes(fileName) {
        const presentationSlide = await this.zipResult.file(fileName).async("text");
        const parsedPresentationSlide = await convertXMLToJSON(presentationSlide, {
            trim: true,
            preserveChildrenOrderForMixedContent: true
        });
        return parsedPresentationSlide;
    }
    static async getFileInZip(fileName, resultType) {
        let file = await this.zipResult.file(fileName).async(resultType?.toLowerCase() || "base64");
        return file;
    }
    static async readFileBuffer(filePath) {
        if (typeof filePath === "string") {
            if (filePath.startsWith("http")) {
                const response = await fetch(filePath);
                const buffer = await response.arrayBuffer();
                return Buffer.from(buffer);
            }
            if (filePath.startsWith("data:application")) {
                const base64 = filePath.split(",")[1];
                const buffer = Buffer.from(base64, "base64");
                return buffer;
            }
        }
        return Buffer.from(filePath);
    }
}
