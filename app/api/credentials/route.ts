import { NextRequest, NextResponse } from 'next/server'
import { CredentialService } from '@/lib/services/credentialService'
import { CredentialPayload } from '@/types/credentials'

export async function GET() {
  try {
    const response = await CredentialService.getAllCredentials()
    return NextResponse.json(response)
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch credentials' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json() as CredentialPayload
    const response = await CredentialService.createCredential(payload)
    
    return NextResponse.json(
      response,
      { status: response.success ? 201 : 400 }
    )
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to create credential' },
      { status: 500 }
    )
  }
} 