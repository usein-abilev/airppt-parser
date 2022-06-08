//require("module-alias/register");
import zipHandler from "./helpers/ziphandler";
import PowerpointElementParser from "./parsers/elementparser";

import * as format from "string-template";
import { Buffer } from "buffer";
import { SpecialityType } from "airppt-models/pptelement";
import convertEmusToPixels from "./helpers/emusToPixels";

const convertDimensionToPixels = (object: any): any => {
	return {
		width: convertEmusToPixels(object.cx),
		height: convertEmusToPixels(object.cy)
	}
}

export class AirParser {
	constructor(private filePath: string) { }

	public async parse() {
		await zipHandler.loadZip(this.filePath);

		const presentationFileContent = await zipHandler.parseSlideAttributes("ppt/presentation.xml");
		const presentation = presentationFileContent["p:presentation"];
		const presentationDimension = convertDimensionToPixels(presentation["p:sldSz"][0].$);
		const presentationSlidesCount = presentation["p:sldIdLst"][0]["p:sldId"].length;
		const presentationSlides = [];

		for (let slideIndex = 0; slideIndex < presentationSlidesCount; slideIndex++) {
			const slideAttributes = await zipHandler.parseSlideAttributes(format("ppt/slides/slide{0}.xml", slideIndex + 1));
			const slideRelations = await zipHandler.parseSlideAttributes(format("ppt/slides/_rels/slide{0}.xml.rels", slideIndex + 1));
			const slideTheme = await zipHandler.parseSlideAttributes(format("ppt/theme/theme{0}.xml", slideIndex + 1));

			const slideShapes = slideAttributes["p:sld"]["p:cSld"][0]["p:spTree"][0]["p:sp"] || [];
			const slideImages = slideAttributes["p:sld"]["p:cSld"][0]["p:spTree"][0]["p:pic"] || [];
			const allSlideElements = slideShapes.concat(slideImages);
			const slideElements = [];

			const elementParser = new PowerpointElementParser(presentationFileContent, slideTheme);

			for (let slideElement of allSlideElements) {
				const pptElement: any = elementParser.getProcessedElement(slideElement, slideRelations);

				if (pptElement) {
					if (pptElement.specialtyType === SpecialityType.Image && pptElement.links.type === "Asset") {
						const binary = await zipHandler.getFileInZip(pptElement.links.url, "arraybuffer");
						pptElement.imageBuffer = Buffer.from(binary);
					}

					slideElements.push(pptElement);
				}
			}

			presentationSlides.push({
				size: presentationDimension,
				elements: slideElements,
			});
		}

		return {
			size: presentationDimension,
			slides: presentationSlides,
		};
	}
}
