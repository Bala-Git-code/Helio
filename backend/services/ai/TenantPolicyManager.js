const AiTenantPolicy = require('../../models/AiTenantPolicy');
const AiBudgetReservation = require('../../models/AiBudgetReservation');

class TenantPolicyManager {
  /**
   * Fetches or initializes policy for a tenant
   */
  async resolvePolicy(tenantId) {
    let policy = await AiTenantPolicy.findOne({ tenantId });
    if (!policy) {
      policy = await AiTenantPolicy.create({ tenantId });
    }

    // Auto resets for daily / monthly budgets
    const now = new Date();
    let updated = false;

    // Reset daily spent if last reset was on a different day
    const lastDaily = new Date(policy.lastSpentResetDaily);
    if (
      lastDaily.getDate() !== now.getDate() ||
      lastDaily.getMonth() !== now.getMonth() ||
      lastDaily.getFullYear() !== now.getFullYear()
    ) {
      policy.dailySpent = 0;
      policy.lastSpentResetDaily = now;
      updated = true;
    }

    // Reset monthly spent if last reset was on a different month
    const lastMonthly = new Date(policy.lastSpentResetMonthly);
    if (
      lastMonthly.getMonth() !== now.getMonth() ||
      lastMonthly.getFullYear() !== now.getFullYear()
    ) {
      policy.monthlySpent = 0;
      policy.lastSpentResetMonthly = now;
      updated = true;
    }

    if (updated) {
      await policy.save();
    }

    return policy;
  }

  /**
   * Evaluates if tenant has sufficient budget for the estimated cost
   */
  async checkBudget(tenantId, estimatedCost) {
    const policy = await this.resolvePolicy(tenantId);

    if (estimatedCost > policy.perRequestCostLimit) {
      throw new Error(`AI_BUDGET_EXCEEDED: Estimated cost $${estimatedCost.toFixed(4)} exceeds request limit $${policy.perRequestCostLimit.toFixed(4)}.`);
    }

    const currentReservations = await AiBudgetReservation.find({ tenantId, status: 'RESERVED' });
    const reservedTotal = currentReservations.reduce((sum, r) => sum + r.reservedAmount, 0);

    const projectedDaily = policy.dailySpent + reservedTotal + estimatedCost;
    if (projectedDaily > policy.dailyBudget) {
      throw new Error(`AI_BUDGET_EXCEEDED: Estimated daily spend $${projectedDaily.toFixed(4)} exceeds daily budget $${policy.dailyBudget.toFixed(4)}.`);
    }

    const projectedMonthly = policy.monthlySpent + reservedTotal + estimatedCost;
    if (projectedMonthly > policy.monthlyBudget) {
      throw new Error(`AI_BUDGET_EXCEEDED: Estimated monthly spend $${projectedMonthly.toFixed(4)} exceeds monthly budget $${policy.monthlyBudget.toFixed(4)}.`);
    }

    return true;
  }

  /**
   * Reserves budget atomically before execution begins
   */
  async reserveBudget(tenantId, executionId, estimatedCost) {
    await this.checkBudget(tenantId, estimatedCost);

    // Create reservation record
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins expiration
    await AiBudgetReservation.create({
      tenantId,
      executionId,
      reservedAmount: estimatedCost,
      status: 'RESERVED',
      expiresAt
    });
  }

  /**
   * Reconciles estimated reservation with actual cost after execution
   */
  async reconcileReservation(executionId, actualCost) {
    const res = await AiBudgetReservation.findOne({ executionId });
    if (!res || res.status !== 'RESERVED') {
      return; // Already reconciled or expired
    }

    const { tenantId, reservedAmount } = res;

    // Transition reservation state
    res.status = 'RECONCILED';
    await res.save();

    // Increment tenant spent atomically
    await AiTenantPolicy.findOneAndUpdate(
      { tenantId },
      {
        $inc: {
          dailySpent: actualCost,
          monthlySpent: actualCost
        }
      }
    );
  }

  /**
   * Releases and reconciles failed reservation
   */
  async releaseReservation(executionId) {
    await AiBudgetReservation.findOneAndUpdate(
      { executionId, status: 'RESERVED' },
      { $set: { status: 'EXPIRED' } }
    );
  }
}

module.exports = new TenantPolicyManager();
