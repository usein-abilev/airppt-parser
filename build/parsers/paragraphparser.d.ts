import { PowerpointElement, TextAlignment, FontAttributes } from "airppt-models/pptelement";
/**
 * Parse the paragraph elements
 */
export default class ParagraphParser {
    static extractParagraphElements(textElement: any): {
        text: string;
        textCharacterProperties: {
            fontAttributes: FontAttributes[];
            font: string;
            size: number;
            fillColor: string;
        };
        paragraphProperties: {
            alignment: TextAlignment;
        };
    };
    /**a:rPr */
    static determineTextProperties(textProperties: any): {
        fontAttributes: FontAttributes[];
        font: string;
        size: number;
        fillColor: string;
    };
    /**a:pPr */
    static determineParagraphProperties(paragraphProperties: any): PowerpointElement["paragraph"]["paragraphProperties"];
    /** Parse for italics, bold, underline */
    static determineFontAttributes(attributesList: any): FontAttributes[];
    private static ConcatenateParagraphLines;
}
