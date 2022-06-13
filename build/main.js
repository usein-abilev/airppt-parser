var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
//require("module-alias/register");
import zipHandler from "./helpers/ziphandler";
import { emusToPoints } from "./helpers/ooxmlConverter";
import { parseSlide } from "./parsers/slide.parser";
const convertDimensionToPixels = (object) => {
    return {
        width: emusToPoints(object.cx),
        height: emusToPoints(object.cy)
    };
};
export class AirParser {
    constructor(filePath) {
        this.filePath = filePath;
    }
    parse() {
        return __awaiter(this, void 0, void 0, function* () {
            yield zipHandler.loadZip(this.filePath);
            const presentationFileContent = yield zipHandler.parseSlideAttributes("ppt/presentation.xml");
            const presentation = presentationFileContent["p:presentation"];
            const presentationDimension = convertDimensionToPixels(presentation["p:sldSz"][0].$);
            const presentationSlidesCount = presentation["p:sldIdLst"][0]["p:sldId"].length;
            const presentationSlides = [];
            for (let slideIndex = 0; slideIndex < presentationSlidesCount; slideIndex++) {
                const slide = yield parseSlide(slideIndex + 1);
                presentationSlides.push(slide);
                // const slideAttributes = await zipHandler.parseSlideAttributes(format("ppt/slides/slide{0}.xml", slideIndex + 1));
                // const slideRelations = await zipHandler.parseSlideAttributes(format("ppt/slides/_rels/slide{0}.xml.rels", slideIndex + 1));
                // const slideTheme = await zipHandler.parseSlideAttributes(format("ppt/theme/theme{0}.xml", slideIndex + 1));
                // const slideShapes = slideAttributes["p:sld"]["p:cSld"][0]["p:spTree"][0]["p:sp"] || [];
                // const slideImages = slideAttributes["p:sld"]["p:cSld"][0]["p:spTree"][0]["p:pic"] || [];
                // const allSlideElements = slideShapes.concat(slideImages);
                // const slideElements = [];
                // const elementParser = new PowerpointElementParser(presentationFileContent, slideTheme);
                // // Initialize relation parser
                // SlideRelationsParser.setSlideRelations(slideRelations);
                // const relations = SlideRelationsParser.getRelations();
                // const { content: slideMaster, relations: slideMasterRelations } = await parseSlideMaster(relations);
                // for (let slideElement of allSlideElements) {
                // 	const pptElement: any = elementParser.getProcessedElement(slideElement);
                // 	if (pptElement) {
                // 		if (pptElement.specialtyType === SpecialityType.Image && pptElement.links.type === "Asset") {
                // 			const binary = await zipHandler.getFileInZip(pptElement.links.url, "arraybuffer");
                // 			pptElement.imageBuffer = Buffer.from(binary);
                // 		}
                // 		slideElements.push(pptElement);
                // 	}
                // }
                // presentationSlides.push({
                // 	size: presentationDimension,
                // 	elements: slideElements,
                // 	relations: SlideRelationsParser.getRelations(),
                // 	master: slideMaster,
                // 	shapes: parseSlideShapes(slideMaster),
                // 	style: await parseSlideStyle(slideMaster, slideMasterRelations)
                // });
            }
            return {
                size: presentationDimension,
                slides: presentationSlides,
            };
        });
    }
}
