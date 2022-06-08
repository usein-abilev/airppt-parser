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
import PowerpointElementParser from "./parsers/elementparser";
import * as format from "string-template";
import { Buffer } from "buffer";
import { SpecialityType } from "airppt-models/pptelement";
import convertEmusToPixels from "./helpers/emusToPixels";
const convertDimensionToPixels = (object) => {
    return {
        width: convertEmusToPixels(object.cx),
        height: convertEmusToPixels(object.cy)
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
                const slideAttributes = yield zipHandler.parseSlideAttributes(format("ppt/slides/slide{0}.xml", slideIndex + 1));
                const slideRelations = yield zipHandler.parseSlideAttributes(format("ppt/slides/_rels/slide{0}.xml.rels", slideIndex + 1));
                const slideTheme = yield zipHandler.parseSlideAttributes(format("ppt/theme/theme{0}.xml", slideIndex + 1));
                const slideShapes = slideAttributes["p:sld"]["p:cSld"][0]["p:spTree"][0]["p:sp"] || [];
                const slideImages = slideAttributes["p:sld"]["p:cSld"][0]["p:spTree"][0]["p:pic"] || [];
                const allSlideElements = slideShapes.concat(slideImages);
                const slideElements = [];
                const elementParser = new PowerpointElementParser(presentationFileContent, slideTheme);
                for (let slideElement of allSlideElements) {
                    const pptElement = elementParser.getProcessedElement(slideElement, slideRelations);
                    if (pptElement) {
                        if (pptElement.specialtyType === SpecialityType.Image && pptElement.links.type === "Asset") {
                            const binary = yield zipHandler.getFileInZip(pptElement.links.url, "arraybuffer");
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
        });
    }
}
