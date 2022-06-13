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
import { parseRelations } from "./relation.parser";
export const parseSlideMaster = (slideRelations) => __awaiter(void 0, void 0, void 0, function* () {
    const slideLayout = slideRelations.find(relation => relation.type.includes("relationships/slideLayout"));
    if (!slideLayout)
        return;
    const slideLayoutRelationPath = `${slideLayout.url.split("/").slice(0, 2).join("/")}/_rels/${slideLayout.url.split("/").pop()}.rels`;
    const slideLayoutRelationContent = yield ZipHandler.parseSlideAttributes(slideLayoutRelationPath);
    const slideLayoutRelations = parseRelations(slideLayoutRelationContent);
    const slideMasterRelation = slideLayoutRelations.find(relation => relation.type.includes("relationships/slideMaster"));
    const slideMasterContent = yield ZipHandler.parseSlideAttributes(slideMasterRelation.url);
    const slideMasterRelationsPath = `${slideMasterRelation.url.split("/").slice(0, 2).join("/")}/_rels/${slideMasterRelation.url.split("/").pop()}.rels`;
    const slideMasterRelationsContent = yield ZipHandler.parseSlideAttributes(slideMasterRelationsPath);
    return {
        content: slideMasterContent,
        relations: parseRelations(slideMasterRelationsContent),
    };
});
