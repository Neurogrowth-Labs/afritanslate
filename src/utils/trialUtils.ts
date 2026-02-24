export interface TrialStatus {
  isOnTrial: boolean;
  isPremium: boolean;
  isFree: boolean;
  daysRemaining: number;
  trialExpired: boolean;
}

export function getTrialStatus(profile: {
  plan: string;
  trial_start_date: string | null | undefined;
}): TrialStatus {
  
  const TRIAL_DAYS = 7;
  
  if (!profile.trial_start_date) {
    return {
      isOnTrial: false,
      isPremium: profile.plan === 'Premium',
      isFree: profile.plan === 'Free',
      daysRemaining: 0,
      trialExpired: false
    };
  }

  const trialStart = new Date(profile.trial_start_date);
  const now = new Date();
  
  // Calculate difference in milliseconds and convert to days
  const diffInMs = now.getTime() - trialStart.getTime();
  const daysPassed = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  const daysRemaining = Math.max(0, TRIAL_DAYS - daysPassed);
  const trialExpired = daysPassed >= TRIAL_DAYS;

  // isOnTrial is true if the plan is Premium and trial hasn't expired yet
  // However, we also need to consider if they are on Premium because they paid.
  // The logic from instructions:
  // isOnTrial: !trialExpired && profile.plan === 'Premium'
  // isPremium: profile.plan === 'Premium' && !trialExpired
  // isFree: profile.plan === 'Free' || trialExpired
  
  return {
    isOnTrial: !trialExpired && profile.plan === 'Premium',
    isPremium: profile.plan === 'Premium' && !trialExpired,
    isFree: profile.plan === 'Free' || trialExpired,
    daysRemaining,
    trialExpired
  };
}
