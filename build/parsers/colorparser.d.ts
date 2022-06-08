import { FillType } from "airppt-models/pptelement";
/**
 * Parse the color of elements
 */
export default class ColorParser {
    static slideShowTheme: any;
    /**
     *
     * @param theme Parsed XML with theme colors
     */
    static setSlideShowTheme(theme: any): void;
    static getShapeFill(element: any): {
        type: FillType;
        color: string;
    };
    static getOpacity(element: any): number;
    static getTextColors(textElement: any): string;
    static getThemeColor(themeClr: any): any;
    static determineShapeOpacity(element: any): void;
}
