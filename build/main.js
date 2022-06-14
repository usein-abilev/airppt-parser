var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
            }
            return {
                size: presentationDimension,
                slides: presentationSlides,
            };
        });
    }
}
