import { Resend } from 'resend'

// Resend initialization relies natively on env availability
const resend = new Resend(process.env.RESEND_API_KEY)

interface EnquiryPayload {
  guestName: string
  guestEmail: string
  guestPhone?: string | null
  propertyName?: string
  checkInDate?: Date | null
  checkOutDate?: Date | null
  guests?: number | null
  message: string
}

export async function sendEnquiryToOwner(payload: EnquiryPayload): Promise<void> {
  const ownerEmail = process.env.OWNER_EMAIL
  if (!ownerEmail) throw new Error('OWNER_EMAIL is missing from environment variables')

  const {
    guestName, guestEmail, guestPhone, propertyName,
    checkInDate, checkOutDate, guests, message
  } = payload

  const subject = `New Enquiry — ${propertyName || 'General'}`

  const textBody = `
New Enquiry Details:
--------------------
Name: ${guestName}
Email: ${guestEmail}
Phone: ${guestPhone || 'Not provided'}
Property: ${propertyName || 'General Request'}
Check-In: ${checkInDate ? checkInDate.toISOString().split('T')[0] : 'Not provided'}
Check-Out: ${checkOutDate ? checkOutDate.toISOString().split('T')[0] : 'Not provided'}
Guests: ${guests || 'Not provided'}

Message:
${message}
`

  await resend.emails.send({
    from: 'Ronne Stays <enquiries@ronnestays.com>', // Assuming unverified domains trigger resend overrides unless connected 
    to: ownerEmail,
    replyTo: guestEmail, // Ensures the owner replies natively to the guest
    subject,
    text: textBody,
  })
}
