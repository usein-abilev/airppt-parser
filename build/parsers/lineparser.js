import { CheckValidObject as checkPath } from "../helpers/checkobj";
import ColorParser from "./colorparser";
import { BorderType } from "airppt-models/pptelement";
/**
 * Parses XML that deals with lines for shapes
 */
export default class LineParser {
    static extractLineElements(element) {
        let shapeProperties = element["p:spPr"][0];
        if (!shapeProperties["a:ln"] || shapeProperties["a:ln"][0]["a:noFill"]) {
            return null;
        }
        let lineElement = {
            color: this.getLineColor(shapeProperties),
            thickness: this.getLineWeight(shapeProperties),
            type: this.determineBorderType(shapeProperties)
        };
        return lineElement;
    }
    static determineBorderType(shapeProperties) {
        let lineProperties = shapeProperties["a:ln"][0];
        if (lineProperties["a:noFill"]) {
            return null;
        }
        let dashType = checkPath(lineProperties, '["a:prstDash"][0]["$"]["val"]') || "default";
        switch (dashType) {
            case "solid":
                return BorderType.solid;
            case "dot":
                return BorderType.dotted;
            case "dash":
                return BorderType.dashed;
            default:
                return BorderType.solid;
        }
    }
    static getLineWeight(shapeProperties) {
        let lineProperties = shapeProperties["a:ln"][0];
        if (lineProperties["a:noFill"]) {
            return null;
        }
        return checkPath(lineProperties, '["$"]["w"]') || 1000;
    }
    static getLineColor(shapeProperties) {
        let lineProperties = shapeProperties["a:ln"][0];
        //spPR[NOFILL] return null
        if (lineProperties["a:noFill"]) {
            return null;
        }
        return (checkPath(lineProperties, '["a:solidFill"]["0"]["a:srgbClr"]["0"]["$"]["val"]') ||
            ColorParser.getThemeColor(checkPath(lineProperties, '["a:solidFill"]["0"]["a:schemeClr"]["0"]["$"]["val"]')) ||
            "000000");
    }
}
