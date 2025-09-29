import { NextRequest, NextResponse } from "next/server";
import { CredentialService } from "@/lib/services/credentialService";
import { CredentialPayload } from "@/types/credentials";

// TypeScript corrects to: { params: Promise<{ id: string }> }
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const response = await CredentialService.getCredential(id);
    if (!response.success) {
      return NextResponse.json(response, { status: 404 });
    }
    return NextResponse.json(response);
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to fetch credential" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const payload = (await request.json()) as Partial<CredentialPayload>;
    const response = await CredentialService.updateCredential(id, payload);

    if (!response.success) {
      return NextResponse.json(response, { status: 404 });
    }
    return NextResponse.json(response);
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to update credential" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const response = await CredentialService.deleteCredential(id);
    if (!response.success) {
      return NextResponse.json(response, { status: 404 });
    }
    return NextResponse.json(response);
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to delete credential" },
      { status: 500 }
    );
  }
}
