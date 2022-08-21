var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import ZipHandler from "../helpers/ziphandler";
import { readSlideFile } from "./file.parser";
import { getThemeColor, parseThemeStyles } from "./theme.parser";
import { parseListStyle, parseShapeFill, parseSlideShapes } from "./shape.parser";
import { FillType, TextAlignment } from "../types";
;
export const parseSlide = (slideId, presentation) => __awaiter(void 0, void 0, void 0, function* () {
    const slide = {
        theme: null,
    };
    const slideDocument = yield parseSlideComponent(`ppt/slides/slide${slideId}.xml`, {
        root: "p:sld",
    });
    const slideLayout = yield parseSlideComponent(slideDocument.relations.find(relation => relation.type.includes("relationships/slideLayout")).url, { root: "p:sldLayout", relations: slideDocument.relations });
    const slideMaster = yield parseSlideComponent(slideLayout.relations.find(relation => relation.type.includes("relationships/slideMaster")).url, { root: "p:sldMaster", relations: slideLayout.relations });
    const slideThemeFile = slideMaster.relations.find(relation => relation.type.includes("relationships/theme"));
    if (slideThemeFile) {
        const slideTheme = yield ZipHandler.parseSlideAttributes(slideThemeFile.url);
        const slideThemeStyles = yield parseThemeStyles(slideTheme);
        slide.theme = Object.assign(Object.assign({}, slideThemeStyles), { colorSchemeMap: Object.assign(Object.assign({}, slideThemeStyles.colorSchemeMap), slideMaster.colorMap) });
    }
    const slideDocumentLayer = slideDocument.shapes.map(slideShape => {
        if (slideShape.expired)
            return;
        slideShape.expired = true;
        const layoutPart = slideLayout.shapes.find(shape => !shape.expired && shapePlaceholderAreEqual(shape.placeholder, slideShape.placeholder));
        const masterPart = slideMaster.shapes.find(shape => !shape.expired && shapePlaceholderAreEqual(shape.placeholder, slideShape.placeholder));
        let merged = slideShape;
        if (layoutPart) {
            merged = mergeShapeLayers(layoutPart, slideShape);
            layoutPart.expired = true;
        }
        if (masterPart) {
            merged = mergeShapeLayers(masterPart, merged);
            masterPart.expired = true;
        }
        return merged;
    }).filter(item => item);
    const slideLayoutLayer = slideLayout.shapes.map(layoutShape => {
        if (layoutShape.expired)
            return;
        layoutShape.expired = true;
        const masterPart = slideMaster.shapes.find(shape => !shape.expired && shapePlaceholderAreEqual(shape.placeholder, layoutShape.placeholder));
        if (masterPart) {
            masterPart.expired = true;
            return mergeShapeLayers(masterPart, layoutShape);
        }
        else {
            return layoutShape;
        }
    }).filter(item => item);
    const slideMasterLayer = slideMaster.shapes.map(master => {
        if (master.expired)
            return;
        master.expired = true;
        return Object.assign({ master: true }, master);
    }).filter(item => item);
    const slideDocumentLayerChanged = applyThemeToShapes(slide.theme, slideMaster.textStyles
        ? applyTextStylesToLayer(slideMaster.textStyles, slideDocumentLayer)
        : slideDocumentLayer);
    return Object.assign(Object.assign({}, slide), { properties: Object.assign(Object.assign(Object.assign({}, slideMaster.properties), slideLayout.properties), slideDocument.properties), background: resolveBackground(slideDocument.background || slideLayout.background || slideMaster.background, slide.theme), layers: [
            slideMasterLayer,
            slideLayoutLayer,
            slideDocumentLayerChanged.reverse(),
        ].filter(item => item.length) });
});
const applyTextStylesToLayer = (textStyles, shapes) => {
    const titleTypes = ["title", "ctrTitle"];
    const bodyTypes = ["body", "subTitle"];
    return shapes.map(shape => {
        var _a, _b, _c;
        if (titleTypes.includes(shape.placeholder.type)) {
            const levelsStyle = mergeShapeTextStyles(shape.text.levelStyle, textStyles.title);
            const defaultLevelName = (_a = shape.text.levelStyle.levels) === null || _a === void 0 ? void 0 : _a.find(item => levelsStyle[item]);
            const defaultLevel = defaultLevelName && levelsStyle[defaultLevelName];
            shape.text.paragraphs = applyTextStylesToParagraphs(shape.text.paragraphs, levelsStyle, defaultLevel);
        }
        else if (bodyTypes.includes(shape.placeholder.type)) {
            const levelsStyle = mergeShapeTextStyles(shape.text.levelStyle, textStyles.body);
            const defaultLevelName = (_b = shape.text.levelStyle.levels) === null || _b === void 0 ? void 0 : _b.find(item => levelsStyle[item]);
            const defaultLevel = defaultLevelName && levelsStyle[defaultLevelName];
            shape.text.paragraphs = applyTextStylesToParagraphs(shape.text.paragraphs, levelsStyle, defaultLevel);
        }
        else if (shape.text) {
            const levelsStyle = mergeShapeTextStyles(shape.text.levelStyle, textStyles.other);
            const defaultLevelName = (_c = shape.text.levelStyle.levels) === null || _c === void 0 ? void 0 : _c.find(item => levelsStyle[item]);
            const defaultLevel = defaultLevelName && levelsStyle[defaultLevelName];
            shape.text.paragraphs = applyTextStylesToParagraphs(shape.text.paragraphs, levelsStyle, defaultLevel);
        }
        return shape;
    });
};
const applyTextStylesToParagraphs = (paragraphs, textStyles, defaultLevel) => {
    return paragraphs.map(paragraph => {
        const clone = Object.assign({}, paragraph);
        const level = clone.properties.level;
        if (level) {
            const levelKey = Object.keys(textStyles).find(item => item.includes(String(Number(level) + 1)));
            const currentStyle = textStyles[levelKey];
            clone.properties = Object.assign(Object.assign(Object.assign({}, currentStyle), clone.properties), { fill: clone.properties.fill.type === FillType.NO_FILL
                    ? currentStyle.fill
                    : clone.properties.fill });
        }
        if (defaultLevel) {
            clone.properties = Object.assign(Object.assign(Object.assign({}, defaultLevel), clone.properties), { fill: clone.properties.fill.type === FillType.NO_FILL
                    ? defaultLevel.fill
                    : clone.properties.fill });
        }
        return clone;
    });
};
const applyThemeToShapes = (theme, shapes) => {
    return shapes.map(shape => {
        var _a, _b, _c;
        const copy = Object.assign({}, shape);
        if (((_a = shape.containerStyle.fill) === null || _a === void 0 ? void 0 : _a.type) === FillType.VARIABLE) {
            copy.containerStyle.fill = getThemeColor(shape.containerStyle.fill.value, theme);
        }
        if ((_c = (_b = shape.text) === null || _b === void 0 ? void 0 : _b.paragraphs) === null || _c === void 0 ? void 0 : _c.length) {
            copy.text.paragraphs = shape.text.paragraphs.map(paragraph => {
                var _a, _b;
                if (paragraph.properties.fontFamily && ((_a = theme === null || theme === void 0 ? void 0 : theme.fontScheme) === null || _a === void 0 ? void 0 : _a.fonts)) {
                    const { fontFamily } = paragraph.properties;
                    switch (fontFamily) {
                        case "+mn-lt": {
                            paragraph.properties.fontFamily = theme.fontScheme.fonts.minor.latin;
                            break;
                        }
                        case "+mj-lt": {
                            paragraph.properties.fontFamily = theme.fontScheme.fonts.major.latin;
                            break;
                        }
                    }
                }
                if (((_b = paragraph.properties.fill) === null || _b === void 0 ? void 0 : _b.type) === FillType.VARIABLE) {
                    paragraph.properties = Object.assign(Object.assign({}, paragraph.properties), { fill: getThemeColor(paragraph.properties.fill.value, theme) });
                }
                return Object.assign(Object.assign({}, paragraph), { properties: Object.assign({ spaceAfter: 0, spaceBefore: 0, marginLeft: 0, marginRight: 0, lineSpacing: 0, alignment: TextAlignment.LEFT }, paragraph.properties) });
            });
        }
        return copy;
    });
};
const mergeShapeTextStyles = (shapeLevelStyles, textStyles) => {
    var _a;
    const result = {};
    (_a = textStyles.levels) === null || _a === void 0 ? void 0 : _a.forEach(level => {
        result[level] = (shapeLevelStyles === null || shapeLevelStyles === void 0 ? void 0 : shapeLevelStyles[level]) ? Object.assign(Object.assign({}, textStyles[level]), shapeLevelStyles[level]) : textStyles[level];
    });
    return result;
};
const mergeShapeLayers = (target, source) => {
    var _a, _b, _c, _d, _e, _f;
    const text = (source.text || target.text) && Object.assign(Object.assign(Object.assign({}, target.text), source.text), { levelStyle: Object.assign(Object.assign({}, (_a = target.text) === null || _a === void 0 ? void 0 : _a.levelStyle), (_b = source.text) === null || _b === void 0 ? void 0 : _b.levelStyle), paragraphs: ((_d = (_c = source.text) === null || _c === void 0 ? void 0 : _c.paragraphs) === null || _d === void 0 ? void 0 : _d.map((item, index) => {
            var _a, _b;
            const a = (_b = (_a = target.text) === null || _a === void 0 ? void 0 : _a.paragraphs) === null || _b === void 0 ? void 0 : _b[index];
            return (Object.assign(Object.assign(Object.assign({}, a), item), { properties: Object.assign(Object.assign({}, a === null || a === void 0 ? void 0 : a.properties), item === null || item === void 0 ? void 0 : item.properties) }));
        })) || [], style: Object.assign(Object.assign({}, (_e = target.text) === null || _e === void 0 ? void 0 : _e.style), (_f = source.text) === null || _f === void 0 ? void 0 : _f.style) });
    return Object.assign(Object.assign(Object.assign({}, target), source), { box: Object.assign(Object.assign({}, target.box), source.box), placeholder: {
            type: target.placeholder.type || source.placeholder.type,
            id: target.placeholder.id || source.placeholder.id,
        }, geometry: source.geometry || target.geometry, text });
};
const shapePlaceholderAreEqual = (placeholderA, placeholderB) => {
    if (!placeholderA.type && !placeholderA.id)
        return false;
    if (!placeholderA.type && !placeholderB.type)
        return placeholderA.id === placeholderB.id;
    if (!placeholderA.type || !placeholderB.type) {
        return placeholderA.id === placeholderB.id;
    }
    return placeholderA.type === placeholderB.type && placeholderA.id === placeholderB.id;
};
const parseSlideComponent = (path, options = {}) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const document = yield readSlideFile(path);
    const slide = {
        properties: {},
        colorMap: null,
        textStyles: null,
        shapes: [],
        background: null,
        relations: document.relations,
        raw: document.content,
    };
    const documentRoot = document.content[options.root];
    if (documentRoot.$.type)
        slide.properties.type = documentRoot.$.type;
    if (documentRoot["p:cSld"][0]) {
        const slideContent = documentRoot["p:cSld"][0];
        const slideBackground = yield parseSlideBackground(slideContent, {}, document.relations);
        const documentShapes = yield resolveRelations(parseSlideShapes(slideContent["p:spTree"][0], options), document.relations);
        slide.shapes = documentShapes;
        slide.background = slideBackground;
    }
    if (documentRoot["p:clrMap"]) {
        slide.colorMap = documentRoot["p:clrMap"][0].$;
    }
    if (documentRoot["p:clrMapOvr"]) {
        // TODO: Parse color map override
    }
    if (documentRoot["p:txStyles"]) {
        const textStylesElement = documentRoot["p:txStyles"][0];
        slide.textStyles = {
            title: parseListStyle((_a = textStylesElement["p:titleStyle"]) === null || _a === void 0 ? void 0 : _a[0]),
            body: parseListStyle((_b = textStylesElement["p:bodyStyle"]) === null || _b === void 0 ? void 0 : _b[0]),
            other: parseListStyle((_c = textStylesElement["p:otherStyle"]) === null || _c === void 0 ? void 0 : _c[0]),
        };
    }
    return slide;
});
const resolveRelations = (shapes, relations) => {
    return Promise.all(shapes.filter(shape => shape).map((shape) => __awaiter(void 0, void 0, void 0, function* () {
        if (shape.needPreload) {
            if (shape.containerStyle.fill.type === FillType.BLIP) {
                const blipRelation = relations.find(relation => relation.id === shape.containerStyle.fill.value.id);
                if (blipRelation) {
                    shape.containerStyle.fill.value.binary = yield ZipHandler.getFileInZip(blipRelation.url, "arraybuffer");
                }
            }
        }
        Reflect.deleteProperty(shape, "needPreload");
        return shape;
    })));
};
const resolveBackground = (background, theme) => {
    if (!background)
        return null;
    if (background.type === FillType.VARIABLE) {
        return getThemeColor(background.value, theme);
    }
    return background;
};
const parseSlideBackground = (slideCommonData, props, relations) => __awaiter(void 0, void 0, void 0, function* () {
    var _d, _e, _f, _g, _h, _j, _k;
    const background = (_d = slideCommonData === null || slideCommonData === void 0 ? void 0 : slideCommonData["p:bg"]) === null || _d === void 0 ? void 0 : _d[0];
    if (!background)
        return null;
    if (background["p:bgPr"]) {
        const fill = parseShapeFill(background["p:bgPr"][0], props);
        if (fill.type === FillType.BLIP) {
            if (!((_e = fill.value) === null || _e === void 0 ? void 0 : _e.id))
                return null;
            const blipRelation = relations.find(relation => relation.id === fill.value.id);
            if (blipRelation) {
                fill.value.binary = yield ZipHandler.getFileInZip(blipRelation.url, "arraybuffer");
            }
        }
        return fill;
    }
    if ((_f = background["p:bgRef"]) === null || _f === void 0 ? void 0 : _f[0]) {
        // http://officeopenxml.com/prSlide-background.php
        const backgroundReference = (_g = background["p:bgRef"]) === null || _g === void 0 ? void 0 : _g[0];
        if (!((_h = backgroundReference === null || backgroundReference === void 0 ? void 0 : backgroundReference.$) === null || _h === void 0 ? void 0 : _h.idx) || ((_j = backgroundReference === null || backgroundReference === void 0 ? void 0 : backgroundReference.$) === null || _j === void 0 ? void 0 : _j.idx) === "0" || ((_k = background === null || background === void 0 ? void 0 : background.$) === null || _k === void 0 ? void 0 : _k.idx) === "1000")
            return null;
        const referenceId = Number(backgroundReference.$.idx);
        return Object.assign({ referenceId }, getThemeColor(backgroundReference["a:schemeClr"][0]["$"].val, props.theme));
    }
    return null;
});
