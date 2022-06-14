var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import React from "react";
import { createRoot } from "react-dom/client";
import { AirParser } from "./main";
function hexToRgbA(hex, opacity = 1) {
    var c;
    if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
        c = hex.substring(1).split('');
        if (c.length == 3) {
            c = [c[0], c[0], c[1], c[1], c[2], c[2]];
        }
        c = '0x' + c.join('');
        return `rgba(${[(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',')}, ${opacity})`;
    }
    return hex;
}
const getFillColor = (context, colorLikeObject, shape) => __awaiter(void 0, void 0, void 0, function* () {
    if (colorLikeObject.type === "SOLID") {
        return colorLikeObject.value;
    }
    if (colorLikeObject.type === "GRADIENT") {
        console.log("Radial or not gradient", colorLikeObject.value);
        if (colorLikeObject.value.path === "circle") {
            return "black";
        }
        const radians = ((colorLikeObject.value.angle || 0) * Math.PI) / 180;
        const gradient = context.createLinearGradient(shape.boundingBox.x, shape.boundingBox.y, Math.cos(radians) + shape.boundingBox.width, Math.sin(radians) + shape.boundingBox.height);
        colorLikeObject.value.points.forEach((point) => {
            gradient.addColorStop(point.position, point.color);
        });
        return gradient;
    }
    if (colorLikeObject.type === "BLIP") {
        const image = yield loadImage(colorLikeObject.value.binary);
        context.drawImage(image, shape.boundingBox.x, shape.boundingBox.y, shape.boundingBox.width, shape.boundingBox.height);
        return "transparent";
    }
    if (colorLikeObject.type === "NO_FILL") {
        return "transparent";
    }
    console.log("Unknown shape fill type:", colorLikeObject.type);
    return "#000";
    // if (shape.style.fill?.type === "GradientLinear") {
    //     const angle = (shape.style.fill.angle / 210000) * Math.PI / 180;
    //     const length = 500;
    //     const gradient = context.createLinearGradient(0, 0, Math.cos(angle) + length, Math.sin(angle) + length);
    //     shape.style.fill.points.forEach((point, index) => {
    //         gradient.addColorStop(point.position / 100000, "#" + point.color);
    //     });
    //     return gradient;
    // } else if (shape.style.fill?.type === "GradientPath") {
    //     const top = shape.style.fill.fillToRect.t / 100000;
    //     const bottom = shape.style.fill.fillToRect.b / 100000;
    //     const left = shape.style.fill.fillToRect.l / 100000;
    //     const right = shape.style.fill.fillToRect.r / 100000;
    //     const gradient = context.createRadialGradient(
    //         shape.box.x + shape.box.width * (left + right) / 2,
    //         shape.box.y + shape.box.height * (top + bottom) / 2, 0,
    //         shape.box.x + shape.box.width * (left + right) / 2,
    //         shape.box.y + shape.box.height * (top + bottom) / 2,
    //         shape.box.width
    //     );
    //     shape.style.fill.points.forEach((point, index) => {
    //         const rgb = hexToRgbA(`#${point.color}`);
    //         gradient.addColorStop(point.position / 100000, `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${point.opacity})`);
    //     });
    //     return gradient;
    // } else {
    //     return shape.style.fill ? "#" + shape.style.fill.color : "transparent";
    // }
    return "red";
});
const loadImage = (binary) => {
    return new Promise(resolve => {
        const blob = new Blob([binary], { type: "image/png" });
        const img = new Image();
        img.src = URL.createObjectURL(blob);
        img.onload = () => {
            resolve(img);
        };
    });
};
const renderBackgrounds = (context, backgrounds) => __awaiter(void 0, void 0, void 0, function* () {
    return Promise.all(backgrounds.map((background) => __awaiter(void 0, void 0, void 0, function* () {
        if (background.type === "SOLID") {
            context.fillStyle = `#${background.color}`;
            context.fillRect(0, 0, context.canvas.width, context.canvas.height);
        }
        else if (background.type === "GRADIENT") {
            const radians = (background.value.angle * Math.PI) / 180;
            const gradient = context.createLinearGradient(0, 0, Math.cos(radians) * context.canvas.width, Math.sin(radians) * context.canvas.height);
            background.value.points.forEach((point) => {
                gradient.addColorStop(point.position, point.color);
            });
            context.fillStyle = gradient;
            context.fillRect(0, 0, context.canvas.width, context.canvas.height);
        }
        else if (background.type === "BLIP") {
            const image = yield loadImage(background.value.binary);
            context.drawImage(image, 0, 0, context.canvas.width, context.canvas.height);
        }
        else {
            console.log("Unrecognized background:", background);
        }
    })));
});
const renderShape = (context, layer) => __awaiter(void 0, void 0, void 0, function* () {
    return Promise.all(layer.map((shape) => __awaiter(void 0, void 0, void 0, function* () {
        context.save();
        const fillColor = yield getFillColor(context, shape.style.fill, shape);
        if (shape.geometry.type === "custom") {
            context.beginPath();
            context.fillStyle = fillColor;
            context.lineWidth = shape.style.border
                ? shape.style.border.thickness
                : 0;
            context.strokeStyle = shape.style.border
                ? shape.style.border.fill.value
                : "transparent";
            context.moveTo(shape.boundingBox.x + shape.geometry.path.moveTo.x / 2, shape.boundingBox.y + shape.geometry.path.moveTo.y / 2);
            shape.geometry.path.points.forEach((point) => {
                context.lineTo(shape.boundingBox.x + point.x / 2, shape.boundingBox.y + point.y / 2);
            });
            context.fill();
            context.stroke();
            context.closePath();
        }
        else if (shape.geometry.type === "rect") {
            context.beginPath();
            context.globalAlpha = shape.style.opacity;
            context.fillStyle = fillColor;
            context.rect(shape.boundingBox.x, shape.boundingBox.y, shape.boundingBox.width, shape.boundingBox.height);
            context.fill();
            context.closePath();
            context.globalAlpha = 1;
        }
        else {
            console.log("Unknown shape geometry type:", shape.geometry.type);
        }
        if (shape.text) {
            console.log(shape.text);
            context.fillStyle = "red";
            context.fillRect(shape.boundingBox.x, shape.boundingBox.y, shape.boundingBox.width, shape.boundingBox.height);
            shape.text.paragraphs.forEach((paragraph, i) => {
                context.globalAlpha = paragraph.style.opacity;
                context.font = `${paragraph.style.fontSize}px ${paragraph.style.fontFamily}`;
                context.fillStyle = paragraph.style.color;
                context.textAlign = paragraph.style.alignment;
                context.fillText(paragraph.text, shape.boundingBox.x, shape.boundingBox.y + paragraph.style.fontSize + (paragraph.style.fontSize + paragraph.style.spaceAfter) * i);
                context.globalAlpha = 1;
            });
        }
        context.restore();
        // await this.drawTextElement(context, shape);
    })));
});
function printAtWordWrap(context, text, x, y, lineHeight, fitWidth) {
    fitWidth = fitWidth || 0;
    lineHeight = lineHeight || 20;
    var currentLine = 0;
    var lines = text.split(/\r\n|\r|\n/);
    for (var line = 0; line < lines.length; line++) {
        if (fitWidth <= 0) {
            context.fillText(lines[line], x, y + (lineHeight * currentLine));
        }
        else {
            var words = lines[line].split(' ');
            var idx = 1;
            while (words.length > 0 && idx <= words.length) {
                var str = words.slice(0, idx).join(' ');
                var w = context.measureText(str).width;
                if (w > fitWidth) {
                    if (idx == 1) {
                        idx = 2;
                    }
                    context.fillText(words.slice(0, idx - 1).join(' '), x, y + (lineHeight * currentLine));
                    currentLine++;
                    words = words.splice(idx - 1);
                    idx = 1;
                }
                else {
                    idx++;
                }
            }
            if (idx > 0)
                context.fillText(words.join(' '), x, y + (lineHeight * currentLine));
        }
        currentLine++;
    }
}
function App() {
    const [presentation, setPresentation] = React.useState(null);
    React.useEffect(() => {
        const parser = new AirParser("https://test.cabinet24.com.ua/api/file/c29bb85495298111f3e0a8a2e4b37cc4/test.pptx");
        parser.parse().then(result => setPresentation(result));
    }, []);
    React.useEffect(() => {
        if (!presentation)
            return;
        console.log("presentation:", presentation);
        presentation.slides.forEach((slide, slideIndex) => __awaiter(this, void 0, void 0, function* () {
            const canvas = document.getElementById(`canvas#${slideIndex + 1}`);
            const context = canvas.getContext('2d');
            canvas.width = presentation.size.width;
            canvas.height = presentation.size.height;
            yield renderBackgrounds(context, slide.backgrounds);
            yield Promise.all(slide.layers.map((shape) => __awaiter(this, void 0, void 0, function* () { return renderShape(context, shape); })));
        }));
        // presentation.slides.forEach(async (slide, slideIndex) => {
        //     slide.shapes.forEach(shape => {
        //         context.globalAlpha = shape.style.opacity;
        //         if (shape.type === "ellipse") {
        //             context.beginPath();
        //             context.fillStyle = "#fff";
        //             context.ellipse(shape.box.x, shape.box.y, shape.box.width / 1.3, shape.box.height / 1.3, 0, 0, 2 * Math.PI);
        //             context.fill();
        //             context.fillStyle = getFillColor(context, shape);
        //             context.closePath();
        //         } else if (shape.type === "rect") {
        //             context.beginPath();
        //             context.fillStyle = getFillColor(context, shape);
        //             context.rect(shape.box.x, shape.box.y, shape.box.width, shape.box.height);
        //             context.fill();
        //             context.closePath();
        //         } else if (shape.type === "custom") {
        //             context.beginPath();
        //             context.fillStyle = getFillColor(context, shape);
        //             context.lineWidth = shape.style.stroke ? `${shape.style.stroke.width}px` : 0;
        //             context.strokeStyle = shape.style.stroke ? "#" + shape.style.stroke.style.color : "transparent";
        //             context.moveTo(shape.box.x + shape.path.moveTo.x / 2, shape.box.y + shape.path.moveTo.y / 2);
        //             shape.path.points.forEach(point => {
        //                 context.lineTo(shape.box.x + point.x / 2, shape.box.y + point.y / 2);
        //             });
        //             context.fill();
        //             context.stroke();
        //             context.closePath();
        //         } else {
        //             console.log("Unknown type", shape);
        //         }
        //     });
        //     context.globalAlpha = 1;
        //     slide.elements.forEach((element) => {
        //         if (element.shapeType === "rect") {
        //             context.beginPath();
        //             context.fillStyle = element.shape.fill ? `#${element.shape.fill.color}` : "transparent";
        //             context.rect(element.position.x, element.position.y, element.offsetPosition.x, element.offsetPosition.y);
        //             context.fill();
        //             context.closePath();
        //             if (element.paragraph) {
        //                 const fontSize = element.paragraph.textCharacterProperties.size / 72;
        //                 context.fillStyle = `#${element.paragraph.textCharacterProperties.fillColor}`;
        //                 context.textAlign = element.paragraph.paragraphProperties.alignment || "left";
        //                 console.log("alignment:", element.paragraph.paragraphProperties);
        //                 context.font = `${fontSize}px ${element.paragraph.textCharacterProperties.font}`;
        //                 const measureText = context.measureText(element.paragraph.text);
        //                 const lines = Math.floor(measureText.width / (measureText.actualBoundingBoxRight));
        //                 context.fillText(element.paragraph.text, element.position.x + (context.textAlign === "center" ? element.offsetPosition.x / 2 : 0), element.position.y + fontSize);
        //             }
        //             if (element.specialtyType === "Image") {
        //                 const blob = new Blob([element.imageBuffer], { type: "image/png" });
        //                 const img = new Image();
        //                 img.src = URL.createObjectURL(blob);
        //                 img.onload = () => {
        //                     context.drawImage(img, element.position.x, element.position.y, element.offsetPosition.x, element.offsetPosition.y);
        //                 }
        //             }
        //         } else {
        //             console.log("unknown element", element);
        //         }
        //     })
        // });
    }, [presentation]);
    return React.createElement("div", { style: {
            display: "flex",
            width: "fit-content",
            margin: "20px",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
        } }, presentation && presentation.slides.map((item, index) => React.createElement("canvas", { style: { background: "rgba(0, 0, 0, .8)" }, key: index + 1, id: `canvas#${index + 1}`, width: presentation.size.width, height: presentation.size.height })));
}
const container = document.getElementById("root");
const root = createRoot(container);
root.render(React.createElement(App, null));
