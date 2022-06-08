import { ElementType, SpecialityType } from "airppt-models/pptelement";
/**
 * Parse the shape types and etc.
 */
export default class ShapeParser {
    static determineShapeType(prst: any): ElementType;
    static determineSpecialityType(element: any): SpecialityType;
    static extractShapeElements(element: any): {
        fill: {
            type: import("airppt-models/pptelement").FillType;
            color: string;
        };
        border: {
            color: any;
            thickness: any;
            type: import("airppt-models/pptelement").BorderType;
        };
        opacity: number;
    };
}
