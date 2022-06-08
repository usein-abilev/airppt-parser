var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
//handle all zip file actions here
import JSZip from "jszip";
import { Buffer } from "buffer";
import convertXMLToJSON from "./xmlToJSON";
export default class ZipHandler {
    static loadZip(zipFilePath) {
        return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
            let data = yield this.readFileBuffer(zipFilePath);
            this.zipResult = yield this.zip.loadAsync(data);
            resolve(true);
        }));
    }
    static parseSlideAttributes(fileName) {
        return __awaiter(this, void 0, void 0, function* () {
            const presentationSlide = yield this.zipResult.file(fileName).async("text");
            const parsedPresentationSlide = yield convertXMLToJSON(presentationSlide, {
                trim: true,
                preserveChildrenOrderForMixedContent: true
            });
            return parsedPresentationSlide;
        });
    }
    static getFileInZip(fileName, resultType) {
        return __awaiter(this, void 0, void 0, function* () {
            let file = yield this.zipResult.file(fileName).async((resultType === null || resultType === void 0 ? void 0 : resultType.toLowerCase()) || "base64");
            return file;
        });
    }
    static readFileBuffer(filePath) {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof filePath === "string" && filePath.startsWith("http")) {
                const response = yield fetch(filePath);
                const buffer = yield response.arrayBuffer();
                return Buffer.from(buffer);
            }
            return Buffer.from(filePath);
        });
    }
}
ZipHandler.zip = new JSZip();
