import { hasChild, queryElement } from "../helpers/checkobj";
import { emusToPoints } from "../helpers/ooxmlConverter";
import { BorderType, FillType, FontStyle, TextAlignment, TextType, TextVerticalAlignment } from "../types";
import { parseBlipFill, parseGradientFill, parseGroupFill, parsePatternFill, parseSolidFill } from "./fill.parser";
export const parseSlideShapes = (shapeTree, props = {}) => {
    const shapes = shapeTree["p:sp"] || shapeTree["xdr:sp"] || [];
    const pictures = shapeTree["p:pic"] || [];
    return [...shapes, ...pictures].map((shape) => parseSlideShape(shape, props));
};
const parseSlideShape = (shape, props) => {
    try {
        const shapeNonVisual = shape["p:nvSpPr"] || shape["xdr:nvSpPr"];
        const shapeProperties = shape["p:spPr"] || shape["xdr:spPr"];
        const shapeText = shape["p:txBody"] || shape["xdr:txBody"];
        const element = {
            needPreload: Boolean(shape["p:nvPicPr"]),
            raw: shape,
            geometry: {},
            box: null,
            placeholder: {},
            containerStyle: {},
        };
        if (shapeNonVisual) {
            element.id = shapeNonVisual[0]["p:cNvPr"][0]["$"].id;
            element.name = shapeNonVisual[0]["p:cNvPr"][0]["$"].name;
            const placeholder = shapeNonVisual[0]["p:nvPr"]?.[0]?.["p:ph"]?.[0]?.$;
            if (placeholder) {
                element.placeholder.type = placeholder.type;
                element.placeholder.id = placeholder.idx;
            }
        }
        if (shapeProperties) {
            const validShapeProperties = Array.isArray(shapeProperties) && shapeProperties.every(item => typeof item === "object");
            if (validShapeProperties) {
                element.box = parseBoundingBox(shapeProperties[0]);
                const geometry = parseShapeGeometry(shapeProperties[0]);
                const border = parseShapeStrokeLine(shapeProperties[0], props);
                const shapeRootFillStyle = parseShapeFill(shape, props);
                const shapeFillStyle = parseShapeFill(shapeProperties[0], props);
                if (geometry)
                    element.geometry = geometry;
                if (border)
                    element.containerStyle.border = border;
                if (shapeRootFillStyle.type !== FillType.NO_FILL) {
                    element.containerStyle.fill = shapeRootFillStyle;
                }
                else {
                    element.containerStyle.fill = shapeFillStyle;
                }
            }
        }
        if (shapeText && !props.disableText) {
            const bodyProperties = shapeText[0]["a:bodyPr"]?.[0]?.$;
            const levelStyle = shapeText[0]["a:lstStyle"]?.[0];
            const paragraphs = shapeText[0]["a:p"].map(paragraph => parseTextContent(paragraph, props));
            const textBody = {
                paragraphs,
                levelStyle: parseListStyle(levelStyle),
            };
            if (bodyProperties) {
                textBody.style = {
                    marginLeft: bodyProperties.lIns ? (bodyProperties.lIns / 45720) * 72 : 0,
                    marginRight: bodyProperties.rIns ? (bodyProperties.rIns / 45720) * 72 : 0,
                    marginTop: bodyProperties.tIns ? (bodyProperties.tIns / 45720) * 72 : 0,
                    marginBottom: bodyProperties.bIns ? (bodyProperties.bIns / 45720) * 72 : 0,
                    verticalAlign: bodyProperties.anchor ? parseTextVerticalAlignment(bodyProperties.anchor) : TextVerticalAlignment.TOP,
                };
            }
            element.text = textBody;
        }
        return element;
    }
    catch (error) {
        console.error("Parse slide error:", shape, error);
    }
};
export const parseTextContent = (textContent, props) => {
    const resultProperties = {
        properties: {
            attributes: [],
        },
    };
    if (textContent["a:br"]) {
        resultProperties.lineBreak = true;
    }
    if (textContent["a:endParaRPr"]) {
        resultProperties.endParagraph = true;
    }
    if (textContent["a:pPr"]) {
        const properties = textContent["a:pPr"][0];
        resultProperties.properties = {
            ...resultProperties.properties,
            ...parseParagraphProperties(properties),
        };
    }
    if (textContent["a:r"]) {
        const paragraphs = textContent["a:r"] || [];
        const text = paragraphs.reduce((acc, paragraph) => {
            const text = paragraph["a:t"];
            const textProperties = paragraph["a:rPr"]?.[0];
            return {
                value: [...(acc.value || []), text],
                properties: { ...textProperties, ...acc.properties }
            };
        }, {});
        if (text.properties) {
            if (text.properties?.["$"]?.b)
                resultProperties.properties.attributes.push(FontStyle.BOLD);
            if (text.properties?.["$"]?.i)
                resultProperties.properties.attributes.push(FontStyle.ITALIC);
            if (text.properties?.["$"]?.u)
                resultProperties.properties.attributes.push(FontStyle.UNDERLINE);
            if (text.properties?.["$"]?.strike)
                resultProperties.properties.attributes.push(FontStyle.STRIKE);
            if (text.properties?.["$"]?.sz)
                resultProperties.properties.fontSize = (text.properties["$"].sz || 1200) / 96;
            if (text.properties?.["a:latin"]?.[0]?.$?.typeface)
                resultProperties.properties.fontFamily = text.properties["a:latin"][0].$.typeface;
            const color = parseShapeFill(text.properties, props);
            resultProperties.properties.fill = color;
        }
        return {
            ...resultProperties,
            type: TextType.PARAGRAPH,
            text: text.value.join(" "),
        };
    }
    if (textContent["a:fld"]) {
        const field = textContent["a:fld"][0];
        const fieldText = field["a:t"] || "";
        return {
            ...resultProperties,
            type: TextType.SYSTEM_FIELD,
            field: {
                id: field.$.id,
                type: field.$.type,
                text: fieldText.join(" "),
            },
            text: fieldText.join(" "),
        };
    }
    return {
        ...resultProperties,
        type: TextType.NON_VISUAL,
    };
};
export const parseListStyle = (levelStyle) => {
    const result = {};
    if (!levelStyle)
        return result;
    Object.keys(levelStyle).forEach(key => {
        if (!result.levels)
            result.levels = [];
        result.levels.push(key);
        const item = levelStyle[key][0];
        const attributes = {};
        const runElement = item["a:defRPr"]?.[0];
        if (runElement) {
            attributes.fontSize = (runElement?.$?.sz || 1400) / 100;
            attributes.fontFamily = runElement["a:latin"]?.[0]?.$?.typeface;
            attributes.fill = parseShapeFill(runElement, {});
        }
        result[key] = {
            ...parseParagraphProperties(item),
            ...attributes,
        };
    });
    return result;
};
const parseParagraphProperties = (textPropertiesRoot) => {
    const properties = {};
    if (textPropertiesRoot?.$) {
        if (textPropertiesRoot.$.lvl) {
            properties.level = textPropertiesRoot.$.lvl;
        }
        if (textPropertiesRoot.$.algn) {
            properties.alignment = parseTextAlignment(textPropertiesRoot.$.algn);
        }
        if (textPropertiesRoot.$.fontAlgn) {
        }
        if (textPropertiesRoot.$.indent) {
            properties.indent = emusToPoints(textPropertiesRoot.$.indent);
        }
        if (textPropertiesRoot.$.marL) {
            properties.marginLeft = emusToPoints(textPropertiesRoot.$.marL);
        }
        if (textPropertiesRoot.$.marR) {
            properties.marginRight = emusToPoints(textPropertiesRoot.$.marR);
        }
    }
    if (textPropertiesRoot["a:spcBef"]?.[0]) {
        const spaceBeforeElement = textPropertiesRoot["a:spcBef"][0];
        const spaceBefore = (spaceBeforeElement["a:spcPts"] || spaceBeforeElement["a:spcPct"])?.[0]?.$?.val;
        properties.spaceBefore = spaceBefore / 72;
    }
    if (textPropertiesRoot["a:spcAft"]) {
        const spaceAfterElement = textPropertiesRoot["a:spcAft"][0];
        const spaceAfter = (spaceAfterElement["a:spcPts"] || spaceAfterElement["a:spcPct"])?.[0]?.$?.val;
        properties.spaceAfter = spaceAfter / 72;
    }
    if (textPropertiesRoot["a:lnSpc"]) {
        const lineSpacing = textPropertiesRoot["a:lnSpc"][0]["a:spcPct"][0].$.val;
        properties.lineSpacing = lineSpacing / 100000;
    }
    return properties;
};
const parseTextVerticalAlignment = (alignment) => {
    switch (alignment) {
        case "base": return TextVerticalAlignment.BASELINE;
        case "auto": return TextVerticalAlignment.AUTO;
        case "ctr": return TextVerticalAlignment.CENTER;
        case "t": return TextVerticalAlignment.TOP;
        case "b": return TextVerticalAlignment.BOTTOM;
        default: return TextVerticalAlignment.BASELINE;
    }
};
const parseTextAlignment = (alignment) => {
    switch (alignment) {
        case "ctr":
            return TextAlignment.CENTER;
        case "l":
            return TextAlignment.LEFT;
        case "r":
            return TextAlignment.RIGHT;
        case "j":
            return TextAlignment.JUSTIFY;
    }
    return TextAlignment.LEFT;
};
export const parseBoundingBox = (element) => {
    const boxElement = element["a:xfrm"];
    if (!boxElement)
        return null;
    const elementPosition = boxElement[0]["a:off"][0]["$"];
    const elementSize = element["a:xfrm"][0]["a:ext"][0]["$"];
    return {
        x: emusToPoints(elementPosition.x),
        y: emusToPoints(elementPosition.y),
        width: emusToPoints(elementSize.cx),
        height: emusToPoints(elementSize.cy),
    };
};
export const parseShapeGeometry = (shapeProperties) => {
    if (shapeProperties["a:prstGeom"]) {
        return {
            type: shapeProperties["a:prstGeom"][0]["$"].prst,
        };
    }
    if (shapeProperties["a:custGeom"]) {
        return {
            type: "custom",
            path: getGeometryPath(shapeProperties["a:custGeom"][0]),
        };
    }
    return null;
};
export const parseShapeFill = (shape, props) => {
    if (!shape)
        return { type: FillType.NO_FILL, opacity: 1, };
    if (shape["a:blipFill"] || shape["p:blipFill"]) {
        const blipFill = queryElement(shape, "blipFill");
        return parseBlipFill(blipFill?.[0]);
    }
    if (shape["a:gradFill"]) {
        const gradFill = shape["a:gradFill"];
        return parseGradientFill(gradFill?.[0]);
    }
    if (shape["a:grpFill"]) {
        const groupFill = shape["a:grpFill"];
        return parseGroupFill(groupFill?.[0]);
    }
    if (shape["a:noFill"]) {
        return { type: FillType.NO_FILL, opacity: 0, };
    }
    if (shape["a:pattFill"]) {
        const patternFill = shape["a:pattFill"];
        return parsePatternFill(patternFill?.[0]);
    }
    if (shape["a:solidFill"]) {
        const solidFill = shape["a:solidFill"];
        return parseSolidFill(solidFill?.[0]);
    }
    return { type: FillType.NO_FILL, opacity: 1, };
};
const getGeometryPath = (geometry) => {
    const path = geometry["a:pathLst"][0]["a:path"];
    // TODO: Add another geometry type (cubicBezier, quadBezier, etc.)
    return {
        size: {
            width: emusToPoints(path[0]["$"].w),
            height: emusToPoints(path[0]["$"].h),
        },
        points: path[0]["a:lnTo"].map(parsePathPoint),
        moveTo: parsePathPoint(path[0]["a:moveTo"][0]),
    };
};
const parsePathPoint = (point) => {
    const pointTag = point["a:pt"][0]["$"];
    return {
        x: emusToPoints(pointTag.x),
        y: emusToPoints(pointTag.y),
    };
};
const parseShapeStrokeLine = (shapeProperties, props) => {
    if (hasChild(shapeProperties["a:ln"]) && !shapeProperties["a:ln"]?.[0]?.["a:noFill"]) {
        const line = shapeProperties["a:ln"][0];
        const lineWidth = line["$"]["w"] || 12500;
        const lineStyle = parseShapeFill(line, props);
        const borderType = parseBorderType(line);
        return {
            type: borderType,
            fill: lineStyle,
            thickness: lineWidth / 12500, // pt to px
        };
    }
    return null;
};
const parseBorderType = (line) => {
    if (line["a:noFill"]) {
        return null;
    }
    if (line["a:prstDash"]) {
        const borderType = line["a:prstDash"][0]["$"]["val"] || "default";
        switch (borderType) {
            case "solid":
                return BorderType.SOLID;
            case "dot":
                return BorderType.DOTTED;
            case "dash":
                return BorderType.DASHED;
            default:
                return BorderType.SOLID;
        }
    }
    return BorderType.SOLID;
};
