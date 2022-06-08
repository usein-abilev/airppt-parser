import { CheckValidObject as checkPath, CheckValidObject } from "../helpers/checkobj";
import RelationParser from "./relparser";

import { PowerpointElement, FillType } from "airppt-models/pptelement";

/**
 * Parse the color of elements
 */
export default class ColorParser {
	static slideShowTheme;
	/**
	 *
	 * @param theme Parsed XML with theme colors
	 */
	public static setSlideShowTheme(theme) {
		this.slideShowTheme = theme;
	}
	public static getShapeFill(element) {
		//spPR takes precdence
		let shapeProperties = element["p:spPr"][0];

		let fillType = {
			type: FillType.Solid,
			color: "00FFFFF"
		};

		//spPR[NOFILL] return null
		if (shapeProperties["a:noFill"]) {
			return fillType;
		}

		//Shape fill is an image
		if (shapeProperties["a:blipFill"]) {
			let relId = shapeProperties["a:blipFill"][0]["a:blip"][0]["$"]["r:embed"];
			fillType.type = FillType.Image;
			fillType.color = RelationParser.getRelationDetails(relId).url || "NONE";
			return fillType;
		}

		if (shapeProperties["a:solidFill"]) {
			//determine if it is theme or solid fill
			let solidColor =
				checkPath(shapeProperties, '["a:solidFill"]["0"]["a:srgbClr"]["0"]["$"]["val"]') ||
				this.getThemeColor(checkPath(shapeProperties, '["a:solidFill"]["0"]["a:schemeClr"]["0"]["$"]["val"]')) ||
				"FFFFFF";

			fillType.color = solidColor;
			return fillType;
		}

		//look at p:style for shape default theme values
		let shapeStyle = checkPath(element, '["p:style"][0]');
		fillType.color = this.getThemeColor(checkPath(shapeStyle, '["a:fillRef"]["0"]["a:schemeClr"]["0"]["$"]["val"]')) || "FFFFFF";
		return fillType;
	}

	public static getOpacity(element): number {
		//spPR takes precdence
		let shapeProperties = element["p:spPr"][0];
		if (shapeProperties["a:solidFill"]) {
			//determine if it is theme or solid fill
			if (checkPath(shapeProperties, '["a:solidFill"]["0"]["a:srgbClr"]["0"]["a:alpha"][0]["$"]["val"]') != undefined) {
				return shapeProperties["a:solidFill"]["0"]["a:srgbClr"]["0"]["a:alpha"][0]["$"]["val"];
			}

			if (checkPath(shapeProperties, '["a:solidFill"]["0"]["a:schemeClr"]["0"]["a:alpha"][0]["$"]["val"]') != undefined) {
				return shapeProperties["a:solidFill"]["0"]["a:schemeClr"]["0"]["a:alpha"][0]["$"]["val"];
			}
		}

		//spPR[NOFILL] return null
		if (shapeProperties["a:noFill"]) {
			return 0;
		}

		return 1;
	}

	public static getTextColors(textElement): string {
		if ("a:solidFill" in textElement) {
			return (
				checkPath(textElement, '["a:solidFill"]["0"]["a:srgbClr"]["0"]["$"]["val"]') ||
				this.getThemeColor(checkPath(textElement, '["a:solidFill"]["0"]["a:schemeClr"]["0"]["$"]["val"]')) ||
				"000000"
			);
		}
	}

	public static getThemeColor(themeClr) {
		if (!themeClr) {
			return null;
		}

		let colors = this.slideShowTheme["a:theme"]["a:themeElements"][0]["a:clrScheme"][0];
		let targetTheme = "a:" + themeClr;
		if (targetTheme in colors) {
			return colors[targetTheme][0]["a:srgbClr"][0]["$"]["val"];
		}

		return null;
	}

	public static determineShapeOpacity(element) { }
}
