import ColorParser from "./colorparser";
import LineParser from "./lineparser";
import { SpecialityType } from "airppt-models/pptelement";
/**
 * Parse the shape types and etc.
 */
export default class ShapeParser {
    static determineShapeType(prst) {
        //return the preset ppt shape type
        return prst;
    }
    static determineSpecialityType(element) {
        if (element["p:nvPicPr"]) {
            return SpecialityType.Image;
        }
        return SpecialityType.None;
    }
    static extractShapeElements(element) {
        const fill = ColorParser.getShapeFill(element);
        return {
            fill: { type: fill.type, color: fill.color },
            border: LineParser.extractLineElements(element),
            opacity: ColorParser.getOpacity(element)
        };
    }
}
