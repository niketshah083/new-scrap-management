import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, MoreThanOrEqual, LessThan } from "typeorm";
import { GRN } from "../../entities/grn.entity";
import { GatePass } from "../../entities/gate-pass.entity";
import { QCInspection } from "../../entities/qc-inspection.entity";
import { Subscription } from "../../entities/subscription.entity";
import { User } from "../../entities/user.entity";
import { Vendor } from "../../entities/vendor.entity";
import { Material } from "../../entities/material.entity";
import { PurchaseOrder } from "../../entities/purchase-order.entity";

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(GRN)
    private grnRepository: Repository<GRN>,
    @InjectRepository(GatePass)
    private gatePassRepository: Repository<GatePass>,
    @InjectRepository(QCInspection)
    private qcRepository: Repository<QCInspection>,
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Vendor)
    private vendorRepository: Repository<Vendor>,
    @InjectRepository(Material)
    private materialRepository: Repository<Material>,
    @InjectRepository(PurchaseOrder)
    private purchaseOrderRepository: Repository<PurchaseOrder>
  ) {}

  // Get today's GRN count by status
  async getTodayGRNStats(
    tenantId: number
  ): Promise<{ status: string; count: number }[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await this.grnRepository
      .createQueryBuilder("grn")
      .select("grn.status", "status")
      .addSelect("COUNT(*)", "count")
      .where("grn.tenant_id = :tenantId", { tenantId })
      .andWhere("grn.created_at >= :today", { today })
      .groupBy("grn.status")
      .getRawMany();

    return result;
  }

  // Get pending QC count - GRNs that are completed but don't have QC inspection yet
  async getPendingQCCount(tenantId: number): Promise<number> {
    // Get all completed GRNs
    const completedGRNs = await this.grnRepository.find({
      where: { tenantId, status: "completed" },
      select: ["id"],
    });

    if (completedGRNs.length === 0) return 0;

    // Get GRN IDs that already have QC inspections
    const qcInspections = await this.qcRepository.find({
      where: { tenantId },
      select: ["grnId"],
    });

    const qcGrnIds = new Set(qcInspections.map((qc) => qc.grnId));

    // Count completed GRNs without QC inspection
    return completedGRNs.filter((grn) => !qcGrnIds.has(grn.id)).length;
  }

  // Get active gate passes count
  async getActiveGatePassCount(tenantId: number): Promise<number> {
    return this.gatePassRepository.count({
      where: { tenantId, status: "active" },
    });
  }

  // Get recent GRN activity
  async getRecentGRNActivity(
    tenantId: number,
    limit: number = 10
  ): Promise<GRN[]> {
    return this.grnRepository.find({
      where: { tenantId },
      relations: ["vendor"],
      order: { updatedAt: "DESC" },
      take: limit,
    });
  }

  // Get dashboard summary
  async getDashboardSummary(tenantId: number): Promise<{
    todayGRNStats: { status: string; count: number }[];
    pendingQCCount: number;
    activeGatePassCount: number;
    recentActivity: GRN[];
    // New metrics
    totalGRNsThisMonth: number;
    totalWeightThisMonth: number;
    vendorCount: number;
    materialCount: number;
    qcPassRate: number;
    avgProcessingTime: number;
    weeklyTrend: { date: string; count: number; weight: number }[];
    topVendors: {
      vendorId: number;
      vendorName: string;
      grnCount: number;
      totalWeight: number;
    }[];
    grnByStep: { step: number; count: number }[];
    expiredGatePassCount: number;
    pendingPOCount: number;
  }> {
    const [
      todayGRNStats,
      pendingQCCount,
      activeGatePassCount,
      recentActivity,
      totalGRNsThisMonth,
      totalWeightThisMonth,
      vendorCount,
      materialCount,
      qcPassRate,
      avgProcessingTime,
      weeklyTrend,
      topVendors,
      grnByStep,
      expiredGatePassCount,
      pendingPOCount,
    ] = await Promise.all([
      this.getTodayGRNStats(tenantId),
      this.getPendingQCCount(tenantId),
      this.getActiveGatePassCount(tenantId),
      this.getRecentGRNActivity(tenantId),
      this.getTotalGRNsThisMonth(tenantId),
      this.getTotalWeightThisMonth(tenantId),
      this.getVendorCount(tenantId),
      this.getMaterialCount(tenantId),
      this.getQCPassRate(tenantId),
      this.getAvgProcessingTime(tenantId),
      this.getWeeklyTrend(tenantId),
      this.getTopVendors(tenantId),
      this.getGRNByStep(tenantId),
      this.getExpiredGatePassCount(tenantId),
      this.getPendingPOCount(tenantId),
    ]);

    return {
      todayGRNStats,
      pendingQCCount,
      activeGatePassCount,
      recentActivity,
      totalGRNsThisMonth,
      totalWeightThisMonth,
      vendorCount,
      materialCount,
      qcPassRate,
      avgProcessingTime,
      weeklyTrend,
      topVendors,
      grnByStep,
      expiredGatePassCount,
      pendingPOCount,
    };
  }

  // Get total GRNs this month
  async getTotalGRNsThisMonth(tenantId: number): Promise<number> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    return this.grnRepository.count({
      where: {
        tenantId,
        createdAt: MoreThanOrEqual(startOfMonth),
      },
    });
  }

  // Get total weight processed this month
  async getTotalWeightThisMonth(tenantId: number): Promise<number> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const result = await this.grnRepository
      .createQueryBuilder("grn")
      .select("COALESCE(SUM(grn.net_weight), 0)", "totalWeight")
      .where("grn.tenant_id = :tenantId", { tenantId })
      .andWhere("grn.created_at >= :startOfMonth", { startOfMonth })
      .getRawOne();

    return parseFloat(result?.totalWeight || 0);
  }

  // Get vendor count
  async getVendorCount(tenantId: number): Promise<number> {
    return this.vendorRepository.count({
      where: { tenantId, isActive: true },
    });
  }

  // Get material count
  async getMaterialCount(tenantId: number): Promise<number> {
    return this.materialRepository.count({
      where: { tenantId, isActive: true },
    });
  }

  // Get QC pass rate (last 30 days)
  async getQCPassRate(tenantId: number): Promise<number> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await this.qcRepository
      .createQueryBuilder("qc")
      .select("qc.status", "status")
      .addSelect("COUNT(*)", "count")
      .where("qc.tenant_id = :tenantId", { tenantId })
      .andWhere("qc.created_at >= :thirtyDaysAgo", { thirtyDaysAgo })
      .andWhere("qc.status IN (:...statuses)", { statuses: ["pass", "fail"] })
      .groupBy("qc.status")
      .getRawMany();

    const passCount = result.find((r) => r.status === "pass")?.count || 0;
    const failCount = result.find((r) => r.status === "fail")?.count || 0;
    const total = parseInt(passCount) + parseInt(failCount);

    return total > 0 ? Math.round((parseInt(passCount) / total) * 100) : 0;
  }

  // Get average processing time (in hours) for completed GRNs
  async getAvgProcessingTime(tenantId: number): Promise<number> {
    const result = await this.grnRepository
      .createQueryBuilder("grn")
      .select(
        "AVG(TIMESTAMPDIFF(HOUR, grn.created_at, grn.updated_at))",
        "avgHours"
      )
      .where("grn.tenant_id = :tenantId", { tenantId })
      .andWhere("grn.status = :status", { status: "completed" })
      .getRawOne();

    return Math.round(parseFloat(result?.avgHours || 0) * 10) / 10;
  }

  // Get weekly trend (last 7 days)
  async getWeeklyTrend(
    tenantId: number
  ): Promise<{ date: string; count: number; weight: number }[]> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const result = await this.grnRepository
      .createQueryBuilder("grn")
      .select("DATE(grn.created_at)", "date")
      .addSelect("COUNT(*)", "count")
      .addSelect("COALESCE(SUM(grn.net_weight), 0)", "weight")
      .where("grn.tenant_id = :tenantId", { tenantId })
      .andWhere("grn.created_at >= :sevenDaysAgo", { sevenDaysAgo })
      .groupBy("DATE(grn.created_at)")
      .orderBy("date", "ASC")
      .getRawMany();

    // Fill in missing days with 0
    const trend: { date: string; count: number; weight: number }[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(sevenDaysAgo);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split("T")[0];
      const existing = result.find(
        (r) =>
          r.date?.toISOString?.()?.split("T")[0] === dateStr ||
          r.date === dateStr
      );
      trend.push({
        date: dateStr,
        count: parseInt(existing?.count || 0),
        weight: parseFloat(existing?.weight || 0),
      });
    }

    return trend;
  }

  // Get top vendors by GRN count
  async getTopVendors(tenantId: number): Promise<
    {
      vendorId: number;
      vendorName: string;
      grnCount: number;
      totalWeight: number;
    }[]
  > {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const result = await this.grnRepository
      .createQueryBuilder("grn")
      .leftJoin("grn.vendor", "vendor")
      .select("grn.vendor_id", "vendorId")
      .addSelect("vendor.company_name", "vendorName")
      .addSelect("COUNT(*)", "grnCount")
      .addSelect("COALESCE(SUM(grn.net_weight), 0)", "totalWeight")
      .where("grn.tenant_id = :tenantId", { tenantId })
      .andWhere("grn.created_at >= :startOfMonth", { startOfMonth })
      .groupBy("grn.vendor_id")
      .addGroupBy("vendor.company_name")
      .orderBy("grnCount", "DESC")
      .limit(5)
      .getRawMany();

    return result.map((r) => ({
      vendorId: r.vendorId,
      vendorName: r.vendorName || "Unknown",
      grnCount: parseInt(r.grnCount),
      totalWeight: parseFloat(r.totalWeight),
    }));
  }

  // Get GRN count by current step (in-progress GRNs)
  async getGRNByStep(
    tenantId: number
  ): Promise<{ step: number; count: number }[]> {
    const result = await this.grnRepository
      .createQueryBuilder("grn")
      .select("grn.current_step", "step")
      .addSelect("COUNT(*)", "count")
      .where("grn.tenant_id = :tenantId", { tenantId })
      .andWhere("grn.status = :status", { status: "in_progress" })
      .groupBy("grn.current_step")
      .orderBy("step", "ASC")
      .getRawMany();

    return result.map((r) => ({
      step: parseInt(r.step),
      count: parseInt(r.count),
    }));
  }

  // Get expired gate pass count
  async getExpiredGatePassCount(tenantId: number): Promise<number> {
    const now = new Date();
    return this.gatePassRepository.count({
      where: [
        { tenantId, status: "expired" },
        { tenantId, status: "active", expiresAt: LessThan(now) },
      ],
    });
  }

  // Get pending PO count
  async getPendingPOCount(tenantId: number): Promise<number> {
    return this.purchaseOrderRepository.count({
      where: { tenantId, status: "pending" },
    });
  }

  // Get user's available menu items based on plan and permissions
  async getUserMenuItems(
    tenantId: number,
    userId: number
  ): Promise<{ module: string; operations: string[] }[]> {
    // Get user with role and permissions
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ["role", "role.permissions", "role.permissions.module"],
    });

    if (!user || !user.role) {
      return [];
    }

    // Get tenant's subscription and plan modules
    const subscription = await this.subscriptionRepository.findOne({
      where: { tenantId, status: "active" },
      relations: ["plan", "plan.modules"],
    });

    if (!subscription) {
      return [];
    }

    const planModuleCodes = subscription.plan.modules.map((m) => m.code);

    // Group permissions by module
    const menuItems: Map<string, Set<string>> = new Map();

    for (const permission of user.role.permissions) {
      const moduleCode = permission.module.code;

      // Only include if module is in the plan
      if (planModuleCodes.includes(moduleCode)) {
        if (!menuItems.has(moduleCode)) {
          menuItems.set(moduleCode, new Set());
        }
        // Extract operation from permission code (e.g., "GRN:Create" -> "Create")
        const operation = permission.code.split(":")[1];
        if (operation) {
          menuItems.get(moduleCode)!.add(operation);
        }
      }
    }

    // Convert to array format
    return Array.from(menuItems.entries()).map(([module, operations]) => ({
      module,
      operations: Array.from(operations),
    }));
  }

  // Get GRN statistics for a date range
  async getGRNStatsByDateRange(
    tenantId: number,
    startDate: Date,
    endDate: Date
  ): Promise<{
    total: number;
    byStatus: { status: string; count: number }[];
    byDay: { date: string; count: number }[];
  }> {
    const total = await this.grnRepository.count({
      where: {
        tenantId,
        createdAt: MoreThanOrEqual(startDate),
      },
    });

    const byStatus = await this.grnRepository
      .createQueryBuilder("grn")
      .select("grn.status", "status")
      .addSelect("COUNT(*)", "count")
      .where("grn.tenant_id = :tenantId", { tenantId })
      .andWhere("grn.created_at >= :startDate", { startDate })
      .andWhere("grn.created_at <= :endDate", { endDate })
      .groupBy("grn.status")
      .getRawMany();

    const byDay = await this.grnRepository
      .createQueryBuilder("grn")
      .select("DATE(grn.created_at)", "date")
      .addSelect("COUNT(*)", "count")
      .where("grn.tenant_id = :tenantId", { tenantId })
      .andWhere("grn.created_at >= :startDate", { startDate })
      .andWhere("grn.created_at <= :endDate", { endDate })
      .groupBy("DATE(grn.created_at)")
      .orderBy("date", "ASC")
      .getRawMany();

    return { total, byStatus, byDay };
  }
}
