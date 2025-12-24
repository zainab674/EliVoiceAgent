/**
 * Plan Configuration
 * Defines minutes allocation and features for each plan
 * Fetches from database with fallback to defaults
 */



export interface PlanConfig {
  key: string;
  name: string;
  price: number;
  features: string[];
  whitelabelEnabled?: boolean;
}

// Default fallback plans (used if database fetch fails)
const DEFAULT_PLAN_CONFIGS: Record<string, PlanConfig> = {
  starter: {
    key: "starter",
    name: "Starter",
    price: 19,
    features: [
      "Basic analytics",
      "Email support",
      "2 team members",
      "Standard integrations",
      "Minutes purchased separately"
    ],
    whitelabelEnabled: false
  },
  professional: {
    key: "professional",
    name: "Professional",
    price: 49,
    features: [
      "Advanced analytics & reporting",
      "Priority support",
      "10 team members",
      "All integrations",
      "Custom branding",
      "Minutes purchased separately"
    ],
    whitelabelEnabled: false
  },
  enterprise: {
    key: "enterprise",
    name: "Enterprise",
    price: 99,
    features: [
      "Real-time analytics",
      "24/7 phone support",
      "Unlimited team members",
      "Enterprise integrations",
      "Advanced security",
      "Dedicated account manager",
      "Minutes purchased separately"
    ],
    whitelabelEnabled: false
  },
  free: {
    key: "free",
    name: "Free",
    price: 0,
    features: [
      "Basic features",
      "Community support",
      "Minutes purchased separately"
    ],
    whitelabelEnabled: false
  }
};

// Cache for plan configs
let planConfigsCache: Record<string, PlanConfig> | null = null;
let planConfigsCacheTime: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes



/**
 * Fetch plan configs from database (filtered by tenant)
 */
/**
 * Fetch plan configs from database (filtered by tenant)
 */
async function fetchPlanConfigsFromDB(): Promise<Record<string, PlanConfig>> {
  try {
    let mergedPlans: Record<string, PlanConfig> = {};

    console.log('[Plan Config] Fetching global plans');

    const apiUrl = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const response = await fetch(`${apiUrl}/api/v1/plans`);

    if (!response.ok) {
      console.warn('Error fetching plans:', response.statusText);
      return {};
    }

    const json = await response.json();
    const data = json.data || {};

    // Transform from map to logic below, or if API returns map, just use it?
    // User expects Record<string, PlanConfig> and API returns Record<string, PlanConfig> in `data`.
    // But let's verify format. My admin.js/plans.js returns { success: true, data: { [key]: plan } }.

    // We can just return data if it matches structure.
    // The previous logic filtered and mapped.

    // let's iterate to be safe and ensure types
    Object.values(data).forEach((plan: any) => {
      mergedPlans[plan.plan_key] = {
        key: plan.plan_key,
        name: plan.name,
        price: Number(plan.price),
        features: Array.isArray(plan.features) ? plan.features : [],
        whitelabelEnabled: false
      };
    });

    return mergedPlans;
  } catch (error) {
    console.error('Error fetching plan configs:', error);
    return {};
  }
}

/**
 * Get plan configs (from cache or database)
 * @param tenant - Optional tenant identifier to fetch tenant-specific plans
 */
export async function getPlanConfigs(tenant?: string | null): Promise<Record<string, PlanConfig>> {
  const now = Date.now();

  // For tenant-specific requests, don't use cache (or use tenant-specific cache)
  // For now, we'll always fetch fresh data if tenant is specified
  if (!tenant && planConfigsCache && (now - planConfigsCacheTime) < CACHE_DURATION) {
    return planConfigsCache;
  }

  // Fetch from database
  const configs = await fetchPlanConfigsFromDB();

  planConfigsCache = configs;
  planConfigsCacheTime = now;

  return configs;
}

/**
 * Get plan configs synchronously (uses cache or defaults)
 * Use this for synchronous operations, but prefer getPlanConfigs() for async
 */
export function getPlanConfigsSync(): Record<string, PlanConfig> {
  return planConfigsCache || DEFAULT_PLAN_CONFIGS;
}

/**
 * Invalidate plan configs cache (call after admin updates plans)
 */
export function invalidatePlanConfigsCache(): void {
  planConfigsCache = null;
  planConfigsCacheTime = 0;
}

// Export default configs for backward compatibility
export const PLAN_CONFIGS = DEFAULT_PLAN_CONFIGS;



/**
 * Get plan configuration (synchronous - uses cache)
 * @param planKey - The plan key
 * @returns Plan configuration or free plan as default
 */
export function getPlanConfig(planKey: string | null | undefined): PlanConfig {
  const configs = getPlanConfigsSync();
  // Fallback to default free plan if the configured free plan was deleted/hidden
  const defaultFree = DEFAULT_PLAN_CONFIGS.free;

  if (!planKey) {
    return configs.free ?? defaultFree;
  }

  const plan = configs[planKey.toLowerCase()];
  return plan ?? configs.free ?? defaultFree;
}

/**
 * Get plan configuration (async - fetches from database if needed)
 * @param planKey - The plan key
 * @returns Plan configuration or free plan as default
 */
export async function getPlanConfigAsync(planKey: string | null | undefined): Promise<PlanConfig> {
  const configs = await getPlanConfigs();
  // Fallback to default free plan if the configured free plan was deleted/hidden
  const defaultFree = DEFAULT_PLAN_CONFIGS.free;

  if (!planKey) {
    return configs.free ?? defaultFree;
  }

  const plan = configs[planKey.toLowerCase()];
  return plan ?? configs.free ?? defaultFree;
}



