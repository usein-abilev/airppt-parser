/**
 *
 * Important function that allows for undefined objects that maybe nested deeper and missing
 */
import * as format from "string-template";
export function CheckValidObject(obj, path) {
    try {
        return eval(format("obj{0}", path));
    }
    catch (e) {
        return undefined;
    }
}
export const queryElement = (root, name) => {
    for (let item in root) {
        if (item.includes(name)) {
            return root[item];
        }
    }
};
export const hasChild = (root) => {
    return (root === null || root === void 0 ? void 0 : root.length) && root.some(child => typeof child === "object");
};
