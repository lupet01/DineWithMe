import { Resend } from "resend";
import {
  restaurantApprovedTemplate,
  restaurantRejectedTemplate,
  bookingConfirmationTemplate,
  paymentReceiptTemplate,
  dinnerReminderTemplate,
  checkInConfirmationTemplate,
  feedbackRequestTemplate,
  refundConfirmationTemplate,
  teamInviteTemplate,
  payoutPaidTemplate,
} from "./templates";
import type {
  RestaurantApprovedEmailData,
  RestaurantRejectedEmailData,
  BookingConfirmationEmailData,
  PaymentReceiptEmailData,
  DinnerReminderEmailData,
  CheckInConfirmationEmailData,
  FeedbackRequestEmailData,
  RefundConfirmationEmailData,
  TeamInviteEmailData,
  PayoutPaidEmailData,
} from "./templates";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const FROM_EMAIL = process.env.EMAIL_FROM || "DineWithMe <noreply@dinewithme.co>";

class EmailService {
  private isConfigured(): boolean {
    return !!resend;
  }

  async sendRestaurantApproved(data: RestaurantApprovedEmailData): Promise<{ success: boolean; error?: string }> {
    if (!this.isConfigured()) {
      console.warn("Email service not configured. Skipping restaurant approval email.");
      return { success: false, error: "Email service not configured" };
    }

    try {
      const { error } = await resend!.emails.send({
        from: FROM_EMAIL,
        to: data.ownerEmail,
        subject: `🎉 ${data.restaurantName} has been approved!`,
        html: restaurantApprovedTemplate(data),
      });

      if (error) {
        console.error("Error sending restaurant approval email:", error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error("Error sending restaurant approval email:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async sendTeamInvite(data: TeamInviteEmailData): Promise<{ success: boolean; error?: string }> {
    if (!this.isConfigured()) {
      console.warn("Email service not configured. Skipping team invite email.");
      return { success: false, error: "Email service not configured" };
    }

    try {
      const { error } = await resend!.emails.send({
        from: FROM_EMAIL,
        to: data.inviteeEmail,
        subject: data.restaurantName
          ? `You're invited to join ${data.restaurantName} on DineWithMe`
          : "You're invited to join the DineWithMe platform team",
        html: teamInviteTemplate(data),
      });

      if (error) {
        console.error("Error sending team invite email:", error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error("Error sending team invite email:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async sendRestaurantRejected(data: RestaurantRejectedEmailData): Promise<{ success: boolean; error?: string }> {
    if (!this.isConfigured()) {
      console.warn("Email service not configured. Skipping restaurant rejection email.");
      return { success: false, error: "Email service not configured" };
    }

    try {
      const { error } = await resend!.emails.send({
        from: FROM_EMAIL,
        to: data.ownerEmail,
        subject: `Update on your ${data.restaurantName} application`,
        html: restaurantRejectedTemplate(data),
      });

      if (error) {
        console.error("Error sending restaurant rejection email:", error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error("Error sending restaurant rejection email:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async sendBookingConfirmation(data: BookingConfirmationEmailData): Promise<{ success: boolean; error?: string }> {
    if (!this.isConfigured()) {
      console.warn("Email service not configured. Skipping booking confirmation email.");
      return { success: false, error: "Email service not configured" };
    }

    try {
      const { error } = await resend!.emails.send({
        from: FROM_EMAIL,
        to: data.userEmail,
        subject: `🎉 You're confirmed for ${data.dinnerTitle}!`,
        html: bookingConfirmationTemplate(data),
      });

      if (error) {
        console.error("Error sending booking confirmation email:", error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error("Error sending booking confirmation email:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async sendPaymentReceipt(data: PaymentReceiptEmailData): Promise<{ success: boolean; error?: string }> {
    if (!this.isConfigured()) {
      console.warn("Email service not configured. Skipping payment receipt email.");
      return { success: false, error: "Email service not configured" };
    }

    try {
      const { error } = await resend!.emails.send({
        from: FROM_EMAIL,
        to: data.userEmail,
        subject: `Payment Receipt - ${data.dinnerTitle}`,
        html: paymentReceiptTemplate(data),
      });

      if (error) {
        console.error("Error sending payment receipt email:", error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error("Error sending payment receipt email:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async sendDinnerReminder(data: DinnerReminderEmailData): Promise<{ success: boolean; error?: string }> {
    if (!this.isConfigured()) {
      console.warn("Email service not configured. Skipping dinner reminder email.");
      return { success: false, error: "Email service not configured" };
    }

    try {
      const { error } = await resend!.emails.send({
        from: FROM_EMAIL,
        to: data.userEmail,
        subject: `⏰ Reminder: ${data.dinnerTitle} is tomorrow!`,
        html: dinnerReminderTemplate(data),
      });

      if (error) {
        console.error("Error sending dinner reminder email:", error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error("Error sending dinner reminder email:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async sendCheckInConfirmation(data: CheckInConfirmationEmailData): Promise<{ success: boolean; error?: string }> {
    if (!this.isConfigured()) {
      console.warn("Email service not configured. Skipping check-in confirmation email.");
      return { success: false, error: "Email service not configured" };
    }

    try {
      const { error } = await resend!.emails.send({
        from: FROM_EMAIL,
        to: data.userEmail,
        subject: `✓ Checked in to ${data.dinnerTitle}`,
        html: checkInConfirmationTemplate(data),
      });

      if (error) {
        console.error("Error sending check-in confirmation email:", error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error("Error sending check-in confirmation email:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async sendFeedbackRequest(data: FeedbackRequestEmailData): Promise<{ success: boolean; error?: string }> {
    if (!this.isConfigured()) {
      console.warn("Email service not configured. Skipping feedback request email.");
      return { success: false, error: "Email service not configured" };
    }

    try {
      const { error } = await resend!.emails.send({
        from: FROM_EMAIL,
        to: data.userEmail,
        subject: `How was your dinner at ${data.restaurantName}?`,
        html: feedbackRequestTemplate(data),
      });

      if (error) {
        console.error("Error sending feedback request email:", error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error("Error sending feedback request email:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async sendRefundConfirmation(data: RefundConfirmationEmailData): Promise<{ success: boolean; error?: string }> {
    if (!this.isConfigured()) {
      console.warn("Email service not configured. Skipping refund confirmation email.");
      return { success: false, error: "Email service not configured" };
    }

    try {
      const { error } = await resend!.emails.send({
        from: FROM_EMAIL,
        to: data.userEmail,
        subject: `Refund Processed - ${data.dinnerTitle}`,
        html: refundConfirmationTemplate(data),
      });

      if (error) {
        console.error("Error sending refund confirmation email:", error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error("Error sending refund confirmation email:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async sendPayoutPaid(data: PayoutPaidEmailData): Promise<{ success: boolean; error?: string }> {
    if (!this.isConfigured()) {
      console.warn("Email service not configured. Skipping payout paid email.");
      return { success: false, error: "Email service not configured" };
    }

    try {
      const { error } = await resend!.emails.send({
        from: FROM_EMAIL,
        to: data.ownerEmail,
        subject: `Payout sent - ${data.restaurantName}`,
        html: payoutPaidTemplate(data),
      });

      if (error) {
        console.error("Error sending payout paid email:", error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error("Error sending payout paid email:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

export const emailService = new EmailService();
