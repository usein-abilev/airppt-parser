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
const convertToRelationPath = (path) => {
    if (!path.length)
        return;
    const lastSlashIndex = path.lastIndexOf("/");
    const lastFolder = path.slice(0, lastSlashIndex);
    const lastPathPart = path.slice(lastSlashIndex + 1, path.length);
    return `${lastFolder}/_rels/${lastPathPart}.rels`;
};
export const readSlideFile = (slidePath) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const slideRelationPath = convertToRelationPath(slidePath);
        const slideContent = yield ZipHandler.parseSlideAttributes(slidePath);
        const slideRelationsContent = yield ZipHandler.parseSlideAttributes(slideRelationPath);
        return {
            content: slideContent,
            relations: parseRelations(slideRelationsContent),
        };
    }
    catch (error) {
        console.error("Reading presentation file error:", error);
        return null;
    }
});
