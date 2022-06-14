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
export const parseSlideMaster = (slideId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const slideMasterPath = `ppt/slideMasters/slideMaster${slideId}.xml`;
        const slideMasterRelationPath = `ppt/slideMasters/_rels/slideMaster${slideId}.xml.rels`;
        const slideMasterContent = yield ZipHandler.parseSlideAttributes(slideMasterPath);
        const slideMasterRelationsContent = yield ZipHandler.parseSlideAttributes(slideMasterRelationPath);
        return {
            content: slideMasterContent,
            relations: parseRelations(slideMasterRelationsContent),
        };
    }
    catch (error) {
        return null;
    }
});
