import qrcode from "qrcode-generator";

/** QR code as an inline SVG string (works on the server and in the browser). */
export function qrCodeSvg(text: string, color = "#0d1c32"): string {
  const qr = qrcode(0, "M");
  qr.addData(text);
  qr.make();

  const count = qr.getModuleCount();
  let path = "";
  for (let row = 0; row < count; row++) {
    for (let col = 0; col < count; col++) {
      if (qr.isDark(row, col)) path += `M${col} ${row}h1v1h-1z`;
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${count} ${count}" shape-rendering="crispEdges" role="img" aria-label="QR code"><path fill="${color}" d="${path}"/></svg>`;
}
