import { CheckValidObject } from "../helpers/checkobj";

export const resolveShapeHyperLinks = (relationContent, element) => {
    let relationId = CheckValidObject(element, '["p:nvSpPr"][0]["p:cNvPr"][0]["a:hlinkClick"][0]["$"]["r:id"]');
    relationId = CheckValidObject(element, '["p:blipFill"][0]["a:blip"][0]["$"]["r:embed"]');

    if (!relationId) return null;

    return getRelationDetailsById(relationContent, relationId);
}

export const parseRelations = (relationContent: any) => {
    const relations = relationContent["Relationships"]["Relationship"];
    return relations.map(relation => {
        const element = relation.$;
        return {
            id: element.Id,
            type: element.Type,
            url: element.Target.replace("..", "ppt"),
        }
    });
}

export const getRelationDetailsById = (relationContent: string, id: string | number) => {
    const relations = parseRelations(relationContent);
    const relation = relations.find(relation => relation.id === id);

    return relation;
}