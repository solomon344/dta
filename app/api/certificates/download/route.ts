import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { getCertificateViewByNumber } from "@/lib/certificates";
import {
  CERTIFICATE_HEIGHT,
  CERTIFICATE_WIDTH,
  generateCertificateHTML,
} from "@/lib/certificate-generator";

// Embedded as a data URI so the downloaded HTML and the headless browser
// render the real logo without needing to reach this server.
async function getLogoDataURI(): Promise<string> {
  const file = await readFile(path.join(process.cwd(), "public", "assets", "dta-logo-full.png"));
  return `data:image/png;base64,${file.toString("base64")}`;
}

async function renderWithBrowser<T>(
  html: string,
  render: (page: import("puppeteer").Page) => Promise<T>
): Promise<T> {
  const puppeteer = (await import("puppeteer")).default;
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: CERTIFICATE_WIDTH, height: CERTIFICATE_HEIGHT, deviceScaleFactor: 2 });
    // Fonts come from Google Fonts so the certificate looks the same on any server OS.
    await page.setContent(html, { waitUntil: "networkidle0", timeout: 15000 });
    await page.evaluate(() => document.fonts.ready);
    return await render(page);
  } finally {
    await browser.close();
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const certificateId = searchParams.get("id");
  const format = searchParams.get("format") || "html";

  if (!certificateId) {
    return NextResponse.json({ error: "Certificate ID is required" }, { status: 400 });
  }

  if (!["html", "pdf", "png"].includes(format)) {
    return NextResponse.json(
      { error: "Invalid format. Supported formats: html, pdf, png" },
      { status: 400 }
    );
  }

  const certificate = await getCertificateViewByNumber(certificateId);
  if (!certificate) {
    return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
  }
  if (certificate.status === "REVOKED") {
    return NextResponse.json({ error: "This certificate has been revoked." }, { status: 410 });
  }

  const filename = `${certificate.number}_${certificate.studentName.replace(/[^A-Za-z0-9]+/g, "_")}_certificate`;

  try {
    const logoSrc = await getLogoDataURI();
    // The public URL (not the container's internal address) goes into the QR code.
    const siteUrl = process.env.BETTER_AUTH_URL || request.nextUrl.origin;

    if (format === "html") {
      const html = generateCertificateHTML(certificate, { logoSrc, siteUrl, mode: "standalone" });
      return new NextResponse(html, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}.html"`,
        },
      });
    }

    const html = generateCertificateHTML(certificate, { logoSrc, siteUrl, mode: "render" });

    if (format === "pdf") {
      const pdf = await renderWithBrowser(html, (page) =>
        page.pdf({
          width: `${CERTIFICATE_WIDTH}px`,
          height: `${CERTIFICATE_HEIGHT}px`,
          printBackground: true,
          pageRanges: "1",
        })
      );
      return new NextResponse(Buffer.from(pdf), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${filename}.pdf"`,
        },
      });
    }

    const png = await renderWithBrowser(html, (page) =>
      page.screenshot({
        type: "png",
        clip: { x: 0, y: 0, width: CERTIFICATE_WIDTH, height: CERTIFICATE_HEIGHT },
      })
    );
    return new NextResponse(Buffer.from(png), {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="${filename}.png"`,
      },
    });
  } catch (error) {
    console.error(`Certificate ${format} generation error:`, error);
    return NextResponse.json(
      {
        error: `Failed to generate ${format.toUpperCase()}. Download the HTML version and use your browser's Print → Save as PDF instead.`,
      },
      { status: 500 }
    );
  }
}
