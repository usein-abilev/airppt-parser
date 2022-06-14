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
import * as format from "string-template";
import { parseSlideMaster } from "./master.parser";
import { parseRelations } from "./relation.parser";
import { parseThemeStyles } from "./theme.parser";
import { parseShapeFill, parseSlideShapes } from "./shape.parser";
import { FillType } from "../types";
export const parseSlide = (slideId) => __awaiter(void 0, void 0, void 0, function* () {
    const slideDocument = yield ZipHandler.parseSlideAttributes(format("ppt/slides/slide{0}.xml", slideId));
    const slideRelationsDocument = yield ZipHandler.parseSlideAttributes(format("ppt/slides/_rels/slide{0}.xml.rels", slideId));
    // Parse master slide and relations
    const slideRelations = yield parseRelations(slideRelationsDocument);
    const slideMaster = yield parseSlideMaster(slideId);
    // Parse slide theme styles
    const props = {
        slideRelations: slideRelations,
    };
    const backgroundToParse = [];
    const layersToParse = [];
    if (slideMaster) {
        const slideThemePath = slideMaster.relations.find(relation => relation.type.includes("relationships/theme"));
        const slideTheme = yield ZipHandler.parseSlideAttributes(slideThemePath.url);
        const slideThemeStyles = yield parseThemeStyles(slideTheme);
        props.slideThemeStyles = slideThemeStyles;
        props.slideMaster = slideMaster;
        backgroundToParse.push(parseSlideBackground(slideMaster.content["p:sldMaster"]["p:cSld"][0], props, slideMaster.relations));
        layersToParse.push(resolveRelations(parseSlideShapes(slideMaster.content["p:sldMaster"]["p:cSld"][0]["p:spTree"][0], Object.assign(Object.assign({}, props), { disableText: true })), slideMaster.relations));
    }
    backgroundToParse.push(parseSlideBackground(slideDocument["p:sld"]["p:cSld"][0], props, slideRelations));
    layersToParse.push(resolveRelations(parseSlideShapes(slideDocument["p:sld"]["p:cSld"][0]["p:spTree"][0], props), slideRelations));
    const slideBackgrounds = yield Promise.all(backgroundToParse);
    const layers = yield Promise.all(layersToParse);
    return {
        backgrounds: slideBackgrounds.filter(a => a),
        layers,
        theme: props.slideThemeStyles,
    };
});
const resolveRelations = (shapes, relations) => {
    return Promise.all(shapes.map((shape) => __awaiter(void 0, void 0, void 0, function* () {
        if (shape.needPreload) {
            if (shape.style.fill.type === FillType.BLIP) {
                const blipRelation = relations.find(relation => relation.id === shape.style.fill.value.id);
                if (blipRelation) {
                    shape.style.fill.value.binary = yield ZipHandler.getFileInZip(blipRelation.url, "arraybuffer");
                }
            }
        }
        Reflect.deleteProperty(shape, "needPreload");
        return shape;
    })));
};
const parseSlideBackground = (slideCommonData, props, relations) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const background = (_a = slideCommonData === null || slideCommonData === void 0 ? void 0 : slideCommonData["p:bg"]) === null || _a === void 0 ? void 0 : _a[0];
    if (!background)
        return null;
    if (background["p:bgPr"]) {
        const fill = parseShapeFill(background["p:bgPr"][0], props);
        if (fill.type === FillType.BLIP) {
            if (!((_b = fill.value) === null || _b === void 0 ? void 0 : _b.id))
                return null;
            const blipRelation = relations.find(relation => relation.id === fill.value.id);
            if (blipRelation) {
                fill.value.binary = yield ZipHandler.getFileInZip(blipRelation.url, "arraybuffer");
            }
        }
        return fill;
    }
    if (background["p:bgRef"]) {
        console.log("Background reference not supported!");
    }
    return null;
});
