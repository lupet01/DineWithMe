"use server";

import { auth } from "@clerk/nextjs/server";
import { userRepository, safetyReportRepository, trustProfileRepository } from "@dinewithme/db";
import { Role } from "@dinewithme/shared";
import { revalidatePath } from "next/cache";

interface ActionResult {
  success: boolean;
  error?: string;
}

async function requirePlatformAdmin() {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return { error: "Unauthorized" as const };
  }
  const dbUser = await userRepository.findByAuthProviderId(clerkUserId);
  if (!dbUser || dbUser.role !== Role.PLATFORM_ADMIN) {
    return { error: "Only platform admins can review safety reports" as const };
  }
  return { dbUser };
}

export async function dismissReport(reportId: string, resolution?: string): Promise<ActionResult> {
  const authResult = await requirePlatformAdmin();
  if ("error" in authResult) {
    return { success: false, error: authResult.error };
  }

  try {
    await safetyReportRepository.setStatus(
      reportId,
      "DISMISSED",
      authResult.dbUser.id,
      resolution || null
    );
    revalidatePath("/admin/ops/trust-safety");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to dismiss report",
    };
  }
}

export async function warnReportedUser(reportId: string, resolution: string): Promise<ActionResult> {
  const authResult = await requirePlatformAdmin();
  if ("error" in authResult) {
    return { success: false, error: authResult.error };
  }

  try {
    const report = await safetyReportRepository.findById(reportId);
    if (!report) {
      return { success: false, error: "Report not found" };
    }

    await safetyReportRepository.setStatus(reportId, "ACTIONED", authResult.dbUser.id, resolution);

    if (report.reportedUserId) {
      await trustProfileRepository.updateTrustScore(report.reportedUserId, -0.15);
      await trustProfileRepository.flagUser(report.reportedUserId);
    }

    revalidatePath("/admin/ops/trust-safety");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to warn user",
    };
  }
}

export async function suspendReportedUser(reportId: string, resolution: string): Promise<ActionResult> {
  const authResult = await requirePlatformAdmin();
  if ("error" in authResult) {
    return { success: false, error: authResult.error };
  }

  try {
    const report = await safetyReportRepository.findById(reportId);
    if (!report) {
      return { success: false, error: "Report not found" };
    }
    if (!report.reportedUserId) {
      return {
        success: false,
        error: "This report doesn't name a specific user to suspend",
      };
    }

    await safetyReportRepository.setStatus(reportId, "ACTIONED", authResult.dbUser.id, resolution);
    await userRepository.update(report.reportedUserId, { status: "suspended" });
    await trustProfileRepository.flagUser(report.reportedUserId);

    revalidatePath("/admin/ops/trust-safety");
    revalidatePath(`/admin/ops/users/${report.reportedUserId}`);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to suspend user",
    };
  }
}
