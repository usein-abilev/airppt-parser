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
    var _a, _b, _c, _d, _e, _f, _g;
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
            const placeholder = (_d = (_c = (_b = (_a = shapeNonVisual[0]["p:nvPr"]) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b["p:ph"]) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.$;
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
            const bodyProperties = (_f = (_e = shapeText[0]["a:bodyPr"]) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.$;
            const levelStyle = (_g = shapeText[0]["a:lstStyle"]) === null || _g === void 0 ? void 0 : _g[0];
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
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p;
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
        resultProperties.properties = Object.assign(Object.assign({}, resultProperties.properties), parseParagraphProperties(properties));
    }
    if (textContent["a:r"]) {
        const paragraphs = textContent["a:r"] || [];
        const text = paragraphs.reduce((acc, paragraph) => {
            var _a;
            const text = paragraph["a:t"];
            const textProperties = (_a = paragraph["a:rPr"]) === null || _a === void 0 ? void 0 : _a[0];
            return {
                value: [...(acc.value || []), text],
                properties: Object.assign(Object.assign({}, textProperties), acc.properties)
            };
        }, {});
        if (text.properties) {
            if ((_b = (_a = text.properties) === null || _a === void 0 ? void 0 : _a["$"]) === null || _b === void 0 ? void 0 : _b.b)
                resultProperties.properties.attributes.push(FontStyle.BOLD);
            if ((_d = (_c = text.properties) === null || _c === void 0 ? void 0 : _c["$"]) === null || _d === void 0 ? void 0 : _d.i)
                resultProperties.properties.attributes.push(FontStyle.ITALIC);
            if ((_f = (_e = text.properties) === null || _e === void 0 ? void 0 : _e["$"]) === null || _f === void 0 ? void 0 : _f.u)
                resultProperties.properties.attributes.push(FontStyle.UNDERLINE);
            if ((_h = (_g = text.properties) === null || _g === void 0 ? void 0 : _g["$"]) === null || _h === void 0 ? void 0 : _h.strike)
                resultProperties.properties.attributes.push(FontStyle.STRIKE);
            if ((_k = (_j = text.properties) === null || _j === void 0 ? void 0 : _j["$"]) === null || _k === void 0 ? void 0 : _k.sz)
                resultProperties.properties.fontSize = (text.properties["$"].sz || 1200) / 96;
            if ((_p = (_o = (_m = (_l = text.properties) === null || _l === void 0 ? void 0 : _l["a:latin"]) === null || _m === void 0 ? void 0 : _m[0]) === null || _o === void 0 ? void 0 : _o.$) === null || _p === void 0 ? void 0 : _p.typeface)
                resultProperties.properties.fontFamily = text.properties["a:latin"][0].$.typeface;
            const color = parseShapeFill(text.properties, props);
            resultProperties.properties.fill = color;
        }
        return Object.assign(Object.assign({}, resultProperties), { type: TextType.PARAGRAPH, text: text.value.join(" ") });
    }
    if (textContent["a:fld"]) {
        const field = textContent["a:fld"][0];
        const fieldText = field["a:t"] || "";
        return Object.assign(Object.assign({}, resultProperties), { type: TextType.SYSTEM_FIELD, field: {
                id: field.$.id,
                type: field.$.type,
                text: fieldText.join(" "),
            }, text: fieldText.join(" ") });
    }
    return Object.assign(Object.assign({}, resultProperties), { type: TextType.NON_VISUAL });
};
export const parseListStyle = (levelStyle) => {
    const result = {};
    if (!levelStyle)
        return result;
    Object.keys(levelStyle).forEach(key => {
        var _a, _b, _c, _d, _e;
        if (!result.levels)
            result.levels = [];
        result.levels.push(key);
        const item = levelStyle[key][0];
        const attributes = {};
        const runElement = (_a = item["a:defRPr"]) === null || _a === void 0 ? void 0 : _a[0];
        if (runElement) {
            attributes.fontSize = (((_b = runElement === null || runElement === void 0 ? void 0 : runElement.$) === null || _b === void 0 ? void 0 : _b.sz) || 1400) / 100;
            attributes.fontFamily = (_e = (_d = (_c = runElement["a:latin"]) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.$) === null || _e === void 0 ? void 0 : _e.typeface;
            attributes.fill = parseShapeFill(runElement, {});
        }
        result[key] = Object.assign(Object.assign({}, parseParagraphProperties(item)), attributes);
    });
    return result;
};
const parseParagraphProperties = (textPropertiesRoot) => {
    var _a, _b, _c, _d, _e, _f, _g;
    const properties = {};
    if (textPropertiesRoot === null || textPropertiesRoot === void 0 ? void 0 : textPropertiesRoot.$) {
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
    if ((_a = textPropertiesRoot["a:spcBef"]) === null || _a === void 0 ? void 0 : _a[0]) {
        const spaceBeforeElement = textPropertiesRoot["a:spcBef"][0];
        const spaceBefore = (_d = (_c = (_b = (spaceBeforeElement["a:spcPts"] || spaceBeforeElement["a:spcPct"])) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.$) === null || _d === void 0 ? void 0 : _d.val;
        properties.spaceBefore = spaceBefore / 72;
    }
    if (textPropertiesRoot["a:spcAft"]) {
        const spaceAfterElement = textPropertiesRoot["a:spcAft"][0];
        const spaceAfter = (_g = (_f = (_e = (spaceAfterElement["a:spcPts"] || spaceAfterElement["a:spcPct"])) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.$) === null || _g === void 0 ? void 0 : _g.val;
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
        return parseBlipFill(blipFill === null || blipFill === void 0 ? void 0 : blipFill[0]);
    }
    if (shape["a:gradFill"]) {
        const gradFill = shape["a:gradFill"];
        return parseGradientFill(gradFill === null || gradFill === void 0 ? void 0 : gradFill[0]);
    }
    if (shape["a:grpFill"]) {
        const groupFill = shape["a:grpFill"];
        return parseGroupFill(groupFill === null || groupFill === void 0 ? void 0 : groupFill[0]);
    }
    if (shape["a:noFill"]) {
        return { type: FillType.NO_FILL, opacity: 0, };
    }
    if (shape["a:pattFill"]) {
        const patternFill = shape["a:pattFill"];
        return parsePatternFill(patternFill === null || patternFill === void 0 ? void 0 : patternFill[0]);
    }
    if (shape["a:solidFill"]) {
        const solidFill = shape["a:solidFill"];
        return parseSolidFill(solidFill === null || solidFill === void 0 ? void 0 : solidFill[0]);
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
    var _a, _b;
    if (hasChild(shapeProperties["a:ln"]) && !((_b = (_a = shapeProperties["a:ln"]) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b["a:noFill"])) {
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
