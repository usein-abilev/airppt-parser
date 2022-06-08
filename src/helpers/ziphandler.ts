//handle all zip file actions here
import JSZip from "jszip";
import { Buffer } from "buffer";
import convertXMLToJSON from "./xmlToJSON";

export default class ZipHandler {
	private static zip = new JSZip();
	private static zipResult: JSZip;

	public static loadZip(zipFilePath: string): Promise<Boolean> {
		return new Promise(async resolve => {
			let data = await this.readFileBuffer(zipFilePath);
			this.zipResult = await this.zip.loadAsync(data);
			resolve(true);
		});
	}

	public static async parseSlideAttributes(fileName) {
		const presentationSlide = await this.zipResult.file(fileName).async("text");
		const parsedPresentationSlide = await convertXMLToJSON(presentationSlide, {
			trim: true,
			preserveChildrenOrderForMixedContent: true
		});

		return parsedPresentationSlide;
	}

	public static async getFileInZip(fileName, resultType?: any) {
		let file = await this.zipResult.file(fileName).async(resultType?.toLowerCase() || "base64");
		return file;
	}

	public static async readFileBuffer(filePath): Promise<Buffer> {
		if (typeof filePath === "string" && filePath.startsWith("http")) {
			const response = await fetch(filePath);
			const buffer = await response.arrayBuffer();
			return Buffer.from(buffer);
		}

		return Buffer.from(filePath);
	}
}
