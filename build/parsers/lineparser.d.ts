import { BorderType } from "airppt-models/pptelement";
/**
 * Parses XML that deals with lines for shapes
 */
export default class LineParser {
    static extractLineElements(element: any): {
        color: any;
        thickness: any;
        type: BorderType;
    };
    static determineBorderType(shapeProperties: any): BorderType;
    static getLineWeight(shapeProperties: any): any;
    static getLineColor(shapeProperties: any): any;
}
