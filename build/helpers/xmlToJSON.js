import * as xml2js from "xml2js";
export default function convertXMLToJSON(buffer, options) {
    return new Promise((resolve, reject) => {
        xml2js.parseString(buffer, options, (err, result) => {
            if (err) {
                reject(err);
            }
            resolve(result);
        });
    });
}
