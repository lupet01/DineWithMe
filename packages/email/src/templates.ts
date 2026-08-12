export interface RestaurantApprovedEmailData {
  ownerEmail: string;
  ownerName: string;
  restaurantName: string;
  dashboardUrl: string;
}

export interface RestaurantRejectedEmailData {
  ownerEmail: string;
  ownerName: string;
  restaurantName: string;
  reason?: string;
  supportEmail: string;
}

export interface TeamInviteEmailData {
  inviteeEmail: string;
  inviterName: string;
  /** Restaurant name for a restaurant invite; omitted for a platform invite */
  restaurantName?: string;
  role: string;
  acceptUrl: string;
  expiresAt: string;
}

export function teamInviteTemplate(data: TeamInviteEmailData): string {
  const context = data.restaurantName
    ? `join <strong>${data.restaurantName}</strong>'s team on DineWithMe as a ${data.role}`
    : `join the DineWithMe platform team as a ${data.role}`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're Invited</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">You're Invited</h1>
  </div>

  <div style="background: white; padding: 40px 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hi,</p>

    <p style="font-size: 16px; margin-bottom: 30px;">
      <strong>${data.inviterName}</strong> has invited you to ${context}.
    </p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.acceptUrl}" style="display: inline-block; background: #667eea; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
        Accept Invite
      </a>
    </div>

    <p style="font-size: 14px; color: #6b7280; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
      This invite expires on ${data.expiresAt}. If you weren't expecting this, you can safely ignore this email.
    </p>

    <p style="font-size: 14px; color: #6b7280; margin-bottom: 0;">
      Best regards,<br>
      <strong>The DineWithMe Team</strong>
    </p>
  </div>
</body>
</html>
  `.trim();
}

export function restaurantApprovedTemplate(data: RestaurantApprovedEmailData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Restaurant Approved</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Congratulations!</h1>
  </div>
  
  <div style="background: white; padding: 40px 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hi ${data.ownerName},</p>
    
    <p style="font-size: 16px; margin-bottom: 20px;">
      Great news! Your restaurant <strong>${data.restaurantName}</strong> has been approved and is now live on DineWithMe.
    </p>
    
    <p style="font-size: 16px; margin-bottom: 30px;">
      You can now start creating dinner experiences and welcoming guests to your restaurant.
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.dashboardUrl}" style="display: inline-block; background: #667eea; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
        Go to Dashboard
      </a>
    </div>
    
    <div style="background: #f9fafb; padding: 20px; border-radius: 6px; margin-top: 30px;">
      <h3 style="margin-top: 0; font-size: 18px; color: #374151;">Next Steps:</h3>
      <ol style="margin: 0; padding-left: 20px; color: #6b7280;">
        <li style="margin-bottom: 10px;">Set up your restaurant themes and preferences</li>
        <li style="margin-bottom: 10px;">Create your first dinner experience</li>
        <li style="margin-bottom: 10px;">Upload photos to showcase your venue</li>
        <li>Start accepting bookings!</li>
      </ol>
    </div>
    
    <p style="font-size: 14px; color: #6b7280; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
      If you have any questions, feel free to reach out to our support team.
    </p>
    
    <p style="font-size: 14px; color: #6b7280; margin-bottom: 0;">
      Best regards,<br>
      <strong>The DineWithMe Team</strong>
    </p>
  </div>
</body>
</html>
  `.trim();
}

export function restaurantRejectedTemplate(data: RestaurantRejectedEmailData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Restaurant Application Update</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #f3f4f6; padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: #374151; margin: 0; font-size: 28px;">Application Update</h1>
  </div>
  
  <div style="background: white; padding: 40px 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hi ${data.ownerName},</p>
    
    <p style="font-size: 16px; margin-bottom: 20px;">
      Thank you for your interest in joining DineWithMe with <strong>${data.restaurantName}</strong>.
    </p>
    
    <p style="font-size: 16px; margin-bottom: 20px;">
      After reviewing your application, we're unable to approve it at this time.
    </p>
    
    ${data.reason ? `
    <div style="background: #fef3c7; padding: 20px; border-radius: 6px; border-left: 4px solid #f59e0b; margin: 20px 0;">
      <p style="margin: 0; font-size: 15px; color: #92400e;">
        <strong>Reason:</strong> ${data.reason}
      </p>
    </div>
    ` : ''}
    
    <p style="font-size: 16px; margin-bottom: 20px;">
      If you'd like to discuss this decision or reapply in the future, please don't hesitate to contact us.
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="mailto:${data.supportEmail}" style="display: inline-block; background: #6b7280; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
        Contact Support
      </a>
    </div>
    
    <p style="font-size: 14px; color: #6b7280; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
      We appreciate your interest in DineWithMe and wish you all the best.
    </p>
    
    <p style="font-size: 14px; color: #6b7280; margin-bottom: 0;">
      Best regards,<br>
      <strong>The DineWithMe Team</strong>
    </p>
  </div>
</body>
</html>
  `.trim();
}


// ============================================================================
// BOOKING CONFIRMATION EMAIL
// ============================================================================

export interface BookingConfirmationEmailData {
  userEmail: string;
  userName: string;
  dinnerTitle: string;
  restaurantName: string;
  dinnerDate: string;
  dinnerTime: string;
  restaurantAddress: string;
  seatNumber?: number;
  totalSeats: number;
  myDinnersUrl: string;
}

export function bookingConfirmationTemplate(data: BookingConfirmationEmailData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Confirmed</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">🎉 You're Going!</h1>
  </div>
  
  <div style="background: white; padding: 40px 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hi ${data.userName},</p>
    
    <p style="font-size: 16px; margin-bottom: 30px;">
      Your seat is confirmed! Get ready for an amazing dinner experience.
    </p>
    
    <div style="background: #f9fafb; padding: 24px; border-radius: 8px; margin: 30px 0;">
      <h2 style="margin-top: 0; font-size: 20px; color: #374151;">${data.dinnerTitle}</h2>
      
      <div style="margin: 16px 0; padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
        <div style="color: #6b7280; font-size: 14px; margin-bottom: 4px;">📍 Location</div>
        <div style="font-size: 16px; font-weight: 500;">${data.restaurantName}</div>
        <div style="font-size: 14px; color: #6b7280;">${data.restaurantAddress}</div>
      </div>
      
      <div style="margin: 16px 0; padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
        <div style="color: #6b7280; font-size: 14px; margin-bottom: 4px;">📅 Date & Time</div>
        <div style="font-size: 16px; font-weight: 500;">${data.dinnerDate}</div>
        <div style="font-size: 14px; color: #6b7280;">${data.dinnerTime}</div>
      </div>
      
      <div style="margin: 16px 0; padding: 12px 0;">
        <div style="color: #6b7280; font-size: 14px; margin-bottom: 4px;">👥 Your Seat</div>
        <div style="font-size: 16px; font-weight: 500;">
          ${data.seatNumber ? `Seat ${data.seatNumber} of ${data.totalSeats}` : `1 of ${data.totalSeats} seats`}
        </div>
      </div>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.myDinnersUrl}" style="display: inline-block; background: #667eea; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
        View My Dinners
      </a>
    </div>
    
    <div style="background: #fef3c7; padding: 16px; border-radius: 6px; border-left: 4px solid #f59e0b; margin-top: 30px;">
      <p style="margin: 0; font-size: 14px; color: #92400e;">
        <strong>Important:</strong> Please arrive on time. We'll send you a reminder 24 hours before the dinner.
      </p>
    </div>
    
    <p style="font-size: 14px; color: #6b7280; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
      Questions? Reply to this email or check your booking details.
    </p>
    
    <p style="font-size: 14px; color: #6b7280; margin-bottom: 0;">
      See you soon!<br>
      <strong>The DineWithMe Team</strong>
    </p>
  </div>
</body>
</html>
  `.trim();
}

// ============================================================================
// PAYMENT RECEIPT EMAIL
// ============================================================================

export interface PaymentReceiptEmailData {
  userEmail: string;
  userName: string;
  dinnerTitle: string;
  restaurantName: string;
  amount: number;
  currency: string;
  paymentDate: string;
  transactionId: string;
  receiptUrl?: string;
}

export function paymentReceiptTemplate(data: PaymentReceiptEmailData): string {
  const formattedAmount = new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: data.currency,
  }).format(data.amount / 100);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Receipt</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #f9fafb; padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0; border: 1px solid #e5e7eb; border-bottom: none;">
    <h1 style="color: #374151; margin: 0; font-size: 28px;">Payment Receipt</h1>
  </div>
  
  <div style="background: white; padding: 40px 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hi ${data.userName},</p>
    
    <p style="font-size: 16px; margin-bottom: 30px;">
      Thank you for your payment. Here's your receipt for your dinner booking.
    </p>
    
    <div style="background: #f9fafb; padding: 24px; border-radius: 8px; margin: 30px 0;">
      <h2 style="margin-top: 0; font-size: 20px; color: #374151;">Payment Details</h2>
      
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Dinner</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 500;">${data.dinnerTitle}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Restaurant</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 500;">${data.restaurantName}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Amount Paid</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600; font-size: 18px; color: #10b981;">${formattedAmount}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Payment Date</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">${data.paymentDate}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; color: #6b7280;">Transaction ID</td>
          <td style="padding: 12px 0; text-align: right; font-family: monospace; font-size: 12px;">${data.transactionId}</td>
        </tr>
      </table>
    </div>
    
    ${data.receiptUrl ? `
    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.receiptUrl}" style="display: inline-block; background: #6b7280; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 14px;">
        Download Receipt
      </a>
    </div>
    ` : ''}
    
    <p style="font-size: 14px; color: #6b7280; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
      Keep this receipt for your records. If you have any questions about this payment, please contact us.
    </p>
    
    <p style="font-size: 14px; color: #6b7280; margin-bottom: 0;">
      Best regards,<br>
      <strong>The DineWithMe Team</strong>
    </p>
  </div>
</body>
</html>
  `.trim();
}

// ============================================================================
// DINNER REMINDER EMAIL (24h before)
// ============================================================================

export interface DinnerReminderEmailData {
  userEmail: string;
  userName: string;
  dinnerTitle: string;
  restaurantName: string;
  dinnerDate: string;
  dinnerTime: string;
  restaurantAddress: string;
  mapUrl?: string;
  dinnerUrl: string;
}

export function dinnerReminderTemplate(data: DinnerReminderEmailData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dinner Reminder</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">⏰ Tomorrow's Dinner</h1>
  </div>
  
  <div style="background: white; padding: 40px 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hi ${data.userName},</p>
    
    <p style="font-size: 16px; margin-bottom: 30px;">
      Just a friendly reminder that your dinner is <strong>tomorrow</strong>! We're excited for you to meet new people and have a great time.
    </p>
    
    <div style="background: #fef3c7; padding: 24px; border-radius: 8px; margin: 30px 0; border-left: 4px solid #f59e0b;">
      <h2 style="margin-top: 0; font-size: 20px; color: #92400e;">${data.dinnerTitle}</h2>
      
      <div style="margin: 16px 0;">
        <div style="color: #92400e; font-size: 14px; margin-bottom: 4px;">📍 Where</div>
        <div style="font-size: 16px; font-weight: 500; color: #78350f;">${data.restaurantName}</div>
        <div style="font-size: 14px; color: #92400e;">${data.restaurantAddress}</div>
        ${data.mapUrl ? `<a href="${data.mapUrl}" style="color: #f59e0b; text-decoration: none; font-size: 14px; margin-top: 4px; display: inline-block;">Get Directions →</a>` : ''}
      </div>
      
      <div style="margin: 16px 0;">
        <div style="color: #92400e; font-size: 14px; margin-bottom: 4px;">⏰ When</div>
        <div style="font-size: 18px; font-weight: 600; color: #78350f;">${data.dinnerDate} at ${data.dinnerTime}</div>
      </div>
    </div>
    
    <div style="background: #f0fdf4; padding: 20px; border-radius: 6px; margin: 30px 0; border-left: 4px solid #10b981;">
      <h3 style="margin-top: 0; font-size: 16px; color: #065f46;">Tips for a Great Experience:</h3>
      <ul style="margin: 0; padding-left: 20px; color: #047857;">
        <li style="margin-bottom: 8px;">Arrive on time - others are counting on you!</li>
        <li style="margin-bottom: 8px;">Come with an open mind and ready to connect</li>
        <li style="margin-bottom: 8px;">Be respectful and inclusive of everyone</li>
        <li>Have fun and enjoy the conversation!</li>
      </ul>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.dinnerUrl}" style="display: inline-block; background: #f59e0b; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
        View Dinner Details
      </a>
    </div>
    
    <p style="font-size: 14px; color: #6b7280; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
      Need to cancel? Please do so as soon as possible so others can take your spot.
    </p>
    
    <p style="font-size: 14px; color: #6b7280; margin-bottom: 0;">
      See you tomorrow!<br>
      <strong>The DineWithMe Team</strong>
    </p>
  </div>
</body>
</html>
  `.trim();
}

// ============================================================================
// CHECK-IN CONFIRMATION EMAIL
// ============================================================================

export interface CheckInConfirmationEmailData {
  userEmail: string;
  userName: string;
  dinnerTitle: string;
  restaurantName: string;
  checkInTime: string;
}

export function checkInConfirmationTemplate(data: CheckInConfirmationEmailData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Check-In Confirmed</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">✓ Checked In!</h1>
  </div>
  
  <div style="background: white; padding: 40px 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hi ${data.userName},</p>
    
    <p style="font-size: 16px; margin-bottom: 30px;">
      You're all checked in! Enjoy your dinner experience.
    </p>
    
    <div style="background: #f0fdf4; padding: 24px; border-radius: 8px; margin: 30px 0; text-align: center; border: 2px solid #10b981;">
      <div style="font-size: 48px; margin-bottom: 16px;">✓</div>
      <h2 style="margin: 0 0 8px 0; font-size: 20px; color: #065f46;">${data.dinnerTitle}</h2>
      <div style="font-size: 16px; color: #047857; margin-bottom: 4px;">${data.restaurantName}</div>
      <div style="font-size: 14px; color: #6b7280;">Checked in at ${data.checkInTime}</div>
    </div>
    
    <div style="background: #fef3c7; padding: 16px; border-radius: 6px; border-left: 4px solid #f59e0b; margin-top: 30px;">
      <p style="margin: 0; font-size: 14px; color: #92400e;">
        <strong>After the dinner:</strong> We'll send you a quick feedback form to help us improve and connect you with other diners.
      </p>
    </div>
    
    <p style="font-size: 14px; color: #6b7280; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
      Have a wonderful time and enjoy the conversation!
    </p>
    
    <p style="font-size: 14px; color: #6b7280; margin-bottom: 0;">
      Bon appétit!<br>
      <strong>The DineWithMe Team</strong>
    </p>
  </div>
</body>
</html>
  `.trim();
}

// ============================================================================
// FEEDBACK REQUEST EMAIL
// ============================================================================

export interface FeedbackRequestEmailData {
  userEmail: string;
  userName: string;
  dinnerTitle: string;
  restaurantName: string;
  feedbackUrl: string;
}

export function feedbackRequestTemplate(data: FeedbackRequestEmailData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>How Was Your Dinner?</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">How Was Your Dinner?</h1>
  </div>
  
  <div style="background: white; padding: 40px 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hi ${data.userName},</p>
    
    <p style="font-size: 16px; margin-bottom: 30px;">
      We hope you had a great time at <strong>${data.dinnerTitle}</strong> at ${data.restaurantName}!
    </p>
    
    <p style="font-size: 16px; margin-bottom: 30px;">
      Your feedback helps us create better experiences and connect you with people you enjoyed meeting.
    </p>
    
    <div style="text-align: center; margin: 40px 0;">
      <a href="${data.feedbackUrl}" style="display: inline-block; background: #8b5cf6; color: white; padding: 16px 40px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 18px;">
        Share Your Feedback
      </a>
      <p style="font-size: 14px; color: #6b7280; margin-top: 12px;">Takes only 2 minutes</p>
    </div>
    
    <div style="background: #f9fafb; padding: 20px; border-radius: 6px; margin: 30px 0;">
      <h3 style="margin-top: 0; font-size: 16px; color: #374151;">We'll ask you about:</h3>
      <ul style="margin: 0; padding-left: 20px; color: #6b7280;">
        <li style="margin-bottom: 8px;">Your overall experience</li>
        <li style="margin-bottom: 8px;">The people you met</li>
        <li style="margin-bottom: 8px;">The restaurant and atmosphere</li>
        <li>Who you'd like to connect with again</li>
      </ul>
    </div>
    
    <p style="font-size: 14px; color: #6b7280; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
      Your responses are confidential and help us match you with compatible people in the future.
    </p>
    
    <p style="font-size: 14px; color: #6b7280; margin-bottom: 0;">
      Thank you for being part of DineWithMe!<br>
      <strong>The DineWithMe Team</strong>
    </p>
  </div>
</body>
</html>
  `.trim();
}

// ============================================================================
// REFUND CONFIRMATION EMAIL
// ============================================================================

export interface RefundConfirmationEmailData {
  userEmail: string;
  userName: string;
  dinnerTitle: string;
  restaurantName: string;
  refundAmount: number;
  currency: string;
  refundReason: string;
  processingDays: number;
  transactionId: string;
}

export function refundConfirmationTemplate(data: RefundConfirmationEmailData): string {
  const formattedAmount = new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: data.currency,
  }).format(data.refundAmount / 100);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Refund Confirmation</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #f9fafb; padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0; border: 1px solid #e5e7eb; border-bottom: none;">
    <h1 style="color: #374151; margin: 0; font-size: 28px;">Refund Processed</h1>
  </div>
  
  <div style="background: white; padding: 40px 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hi ${data.userName},</p>
    
    <p style="font-size: 16px; margin-bottom: 30px;">
      Your refund has been processed for your cancelled booking.
    </p>
    
    <div style="background: #f0fdf4; padding: 24px; border-radius: 8px; margin: 30px 0; border-left: 4px solid #10b981;">
      <h2 style="margin-top: 0; font-size: 20px; color: #065f46;">Refund Details</h2>
      
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #d1fae5; color: #047857;">Dinner</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #d1fae5; text-align: right; font-weight: 500;">${data.dinnerTitle}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #d1fae5; color: #047857;">Restaurant</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #d1fae5; text-align: right; font-weight: 500;">${data.restaurantName}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #d1fae5; color: #047857;">Refund Amount</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #d1fae5; text-align: right; font-weight: 600; font-size: 18px; color: #10b981;">${formattedAmount}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #d1fae5; color: #047857;">Reason</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #d1fae5; text-align: right;">${data.refundReason}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; color: #047857;">Transaction ID</td>
          <td style="padding: 12px 0; text-align: right; font-family: monospace; font-size: 12px;">${data.transactionId}</td>
        </tr>
      </table>
    </div>
    
    <div style="background: #fef3c7; padding: 16px; border-radius: 6px; border-left: 4px solid #f59e0b; margin-top: 30px;">
      <p style="margin: 0; font-size: 14px; color: #92400e;">
        <strong>Processing Time:</strong> The refund will appear in your account within ${data.processingDays} business days, depending on your bank.
      </p>
    </div>
    
    <p style="font-size: 16px; margin-top: 30px;">
      We're sorry you couldn't make it this time. We hope to see you at another dinner soon!
    </p>
    
    <p style="font-size: 14px; color: #6b7280; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
      If you have any questions about this refund, please contact our support team.
    </p>
    
    <p style="font-size: 14px; color: #6b7280; margin-bottom: 0;">
      Best regards,<br>
      <strong>The DineWithMe Team</strong>
    </p>
  </div>
</body>
</html>
  `.trim();
}

export interface PayoutPaidEmailData {
  ownerEmail: string;
  ownerName: string;
  restaurantName: string;
  dinnerTitle: string;
  payoutAmount: number;
  currency: string;
  payoutId: string;
}

export function payoutPaidTemplate(data: PayoutPaidEmailData): string {
  const formattedAmount = new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: data.currency,
  }).format(data.payoutAmount / 100);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payout Sent</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #f9fafb; padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0; border: 1px solid #e5e7eb; border-bottom: none;">
    <h1 style="color: #374151; margin: 0; font-size: 28px;">Payout Sent</h1>
  </div>

  <div style="background: white; padding: 40px 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hi ${data.ownerName},</p>

    <p style="font-size: 16px; margin-bottom: 30px;">
      Good news &mdash; we've sent a payout to ${data.restaurantName}'s bank account.
    </p>

    <div style="background: #f0fdf4; padding: 24px; border-radius: 8px; margin: 30px 0; border-left: 4px solid #10b981;">
      <h2 style="margin-top: 0; font-size: 20px; color: #065f46;">Payout Details</h2>

      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #d1fae5; color: #047857;">Dinner</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #d1fae5; text-align: right; font-weight: 500;">${data.dinnerTitle}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #d1fae5; color: #047857;">Restaurant</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #d1fae5; text-align: right; font-weight: 500;">${data.restaurantName}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #d1fae5; color: #047857;">Net Payout</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #d1fae5; text-align: right; font-weight: 600; font-size: 18px; color: #10b981;">${formattedAmount}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; color: #047857;">Payout ID</td>
          <td style="padding: 12px 0; text-align: right; font-family: monospace; font-size: 12px;">${data.payoutId}</td>
        </tr>
      </table>
    </div>

    <div style="background: #fef3c7; padding: 16px; border-radius: 6px; border-left: 4px solid #f59e0b; margin-top: 30px;">
      <p style="margin: 0; font-size: 14px; color: #92400e;">
        <strong>Processing Time:</strong> The funds should reflect in your account within a few business days, depending on your bank.
      </p>
    </div>

    <p style="font-size: 16px; margin-top: 30px;">
      Thank you for hosting with DineWithMe.
    </p>

    <p style="font-size: 14px; color: #6b7280; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
      If anything looks wrong with this payout, please contact our support team.
    </p>

    <p style="font-size: 14px; color: #6b7280; margin-bottom: 0;">
      Best regards,<br>
      <strong>The DineWithMe Team</strong>
    </p>
  </div>
</body>
</html>
  `.trim();
}
