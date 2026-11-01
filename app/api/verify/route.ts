import { NextRequest, NextResponse } from "next/server";
import { searchCertificates } from "@/lib/certificates";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim();
  if (!query) {
    return NextResponse.json({ error: "Please provide a certificate ID or student name" }, { status: 400 });
  }

  try {
    const result = await searchCertificates(query);
    if (result.kind === "none") {
      return NextResponse.json(
        {
          error:
            query.length < 3
              ? "Enter the full certificate ID, or at least 3 letters of the graduate's name."
              : "Certificate not found. Please verify the ID or name and try again.",
        },
        { status: 404 }
      );
    }
    if (result.kind === "matches") return NextResponse.json({ matches: result.matches });

    const { certificate } = result;
    return NextResponse.json({ verified: certificate.status === "ISSUED", certificate });
  } catch (error) {
    console.error("Verify error:", error);
    return NextResponse.json({ error: "An error occurred while verifying the certificate" }, { status: 500 });
  }
}
