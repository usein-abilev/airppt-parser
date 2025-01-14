import zipHandler from "./helpers/ziphandler";

import { emusToPoints } from "./helpers/ooxmlConverter";
import { parseSlideShapes } from "./parsers/shape.parser";
import { parseSlide } from "./parsers/slide.parser";
import { parseRelations } from "./parsers/relation.parser";

const convertDimensionToPixels = (object: any): any => {
	return {
		width: emusToPoints(object.cx),
		height: emusToPoints(object.cy)
	}
}

export class AirParser {
	constructor(private filePath: string | Buffer | ArrayBuffer) { }

	public async parse() {
		await zipHandler.loadZip(this.filePath);

		const presentationFileContent = await zipHandler.parseSlideAttributes("ppt/presentation.xml");
		const presentationRelationsFileContent = await zipHandler.parseSlideAttributes("ppt/_rels/presentation.xml.rels");
		const presentationRelations = parseRelations(presentationRelationsFileContent);
		const presentation = presentationFileContent["p:presentation"];
		const presentationDimension = convertDimensionToPixels(presentation["p:sldSz"][0].$);
		const presentationSlidesCount = presentation["p:sldIdLst"][0]["p:sldId"].length;
		const presentationSlides = [];

		for (let slideIndex = 0; slideIndex < presentationSlidesCount; slideIndex++) {
			const slide = await parseSlide(slideIndex + 1, {
				content: presentation,
				relations: presentationRelations,
			});
			presentationSlides.push(slide);
		}

		return {
			size: presentationDimension,
			slides: presentationSlides,
		};
	}
}
