import React from "react";
import { createRoot } from "react-dom/client";
import { AirParser } from "./main";
function hexToRgbA(hex) {
    var c;
    if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
        c = hex.substring(1).split('');
        if (c.length == 3) {
            c = [c[0], c[0], c[1], c[1], c[2], c[2]];
        }
        c = '0x' + c.join('');
        return [(c >> 16) & 255, (c >> 8) & 255, c & 255];
    }
    throw new Error('Bad Hex');
}
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
        const parser = new AirParser("https://test.cabinet24.com.ua/api/file/4f0b51154272e2cd308b255eb60c1e7e/presentation.pptx");
        parser.parse().then(result => setPresentation(result));
    }, []);
    const getFillColor = (context, shape) => {
        var _a, _b;
        if (((_a = shape.style.fill) === null || _a === void 0 ? void 0 : _a.type) === "GradientLinear") {
            const angle = (shape.style.fill.angle / 210000) * Math.PI / 180;
            const length = 500;
            const gradient = context.createLinearGradient(0, 0, Math.cos(angle) + length, Math.sin(angle) + length);
            shape.style.fill.points.forEach((point, index) => {
                gradient.addColorStop(point.position / 100000, "#" + point.color);
            });
            return gradient;
        }
        else if (((_b = shape.style.fill) === null || _b === void 0 ? void 0 : _b.type) === "GradientPath") {
            const top = shape.style.fill.fillToRect.t / 100000;
            const bottom = shape.style.fill.fillToRect.b / 100000;
            const left = shape.style.fill.fillToRect.l / 100000;
            const right = shape.style.fill.fillToRect.r / 100000;
            const gradient = context.createRadialGradient(shape.box.x + shape.box.width * (left + right) / 2, shape.box.y + shape.box.height * (top + bottom) / 2, 0, shape.box.x + shape.box.width * (left + right) / 2, shape.box.y + shape.box.height * (top + bottom) / 2, shape.box.width);
            shape.style.fill.points.forEach((point, index) => {
                const rgb = hexToRgbA(`#${point.color}`);
                gradient.addColorStop(point.position / 100000, `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${point.opacity})`);
            });
            return gradient;
        }
        else {
            return shape.style.fill ? "#" + shape.style.fill.color : "transparent";
        }
    };
    React.useEffect(() => {
        if (!presentation)
            return;
        console.log("presentation:", presentation);
        // presentation.slides.forEach(async (slide, slideIndex) => {
        //     const canvas = document.getElementById(`canvas#${slideIndex + 1}`);
        //     const context = canvas.getContext('2d');
        //     if (slide.style.backgroundImage) {
        //         const image = await loadImage(slide.style.backgroundImage.binary);
        //         context.drawImage(image, 0, 0, canvas.width, canvas.height);
        //     }
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
