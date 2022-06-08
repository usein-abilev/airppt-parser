import { CheckValidObject } from "../helpers/checkobj";
import ColorParser from "./colorparser";
import { TextAlignment, FontAttributes } from "airppt-models/pptelement";
/**
 * Parse the paragraph elements
 */
export default class ParagraphParser {
    static extractParagraphElements(textElement) {
        if (!textElement || !textElement["a:r"]) {
            return null;
        }
        let pptTextElement = {
            text: this.ConcatenateParagraphLines(textElement["a:r"]) || "",
            textCharacterProperties: this.determineTextProperties(CheckValidObject(textElement, '["a:r"][0]["a:rPr"][0]')),
            paragraphProperties: this.determineParagraphProperties(textElement)
        };
        return pptTextElement;
    }
    /**a:rPr */
    static determineTextProperties(textProperties) {
        if (!textProperties) {
            return null;
        }
        let textPropertiesElement = {
            size: CheckValidObject(textProperties, '["$"].sz') || 1200,
            fontAttributes: this.determineFontAttributes(textProperties["$"]),
            font: CheckValidObject(textProperties, '["a:latin"][0]["$"]["typeface"]') || "Helvetica",
            fillColor: ColorParser.getTextColors(textProperties) || "000000"
        };
        return textPropertiesElement;
    }
    /**a:pPr */
    static determineParagraphProperties(paragraphProperties) {
        if (!paragraphProperties) {
            return null;
        }
        let alignment = TextAlignment.Left;
        let alignProps = CheckValidObject(paragraphProperties, '["a:pPr"][0]["$"]["algn"]');
        if (alignProps) {
            switch (alignProps) {
                case "ctr":
                    alignment = TextAlignment.Center;
                    break;
                case "l":
                    alignment = TextAlignment.Left;
                    break;
                case "r":
                    alignment = TextAlignment.Right;
                    break;
                case "j":
                    alignment = TextAlignment.Justified;
                    break;
            }
        }
        let paragraphPropertiesElement = {
            alignment
        };
        return paragraphPropertiesElement;
    }
    /** Parse for italics, bold, underline */
    static determineFontAttributes(attributesList) {
        let attributesArray = [];
        if (!attributesList) {
            return null;
        }
        Object.keys(attributesList).forEach(element => {
            if (element == "b" && attributesList[element] == 1) {
                attributesArray.push(FontAttributes.Bold);
            }
            if (element == "i" && attributesList[element] == 1) {
                attributesArray.push(FontAttributes.Italics);
            }
            if (element == "u" && attributesList[element] == 1) {
                attributesArray.push(FontAttributes.Underline);
            }
            if (element == "s" && attributesList[element] == 1) {
                attributesArray.push(FontAttributes.StrikeThrough);
            }
        });
        return attributesArray;
    }
    /*["a:r"]*/
    static ConcatenateParagraphLines(lines) {
        if (!lines) {
            return null;
        }
        let text = [];
        for (var i in lines) {
            text.push(lines[i]["a:t"]);
        }
        return text.join(" ");
    }
}
