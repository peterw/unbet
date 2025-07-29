// Define valid referral codes and their effects
export const REFERRAL_CODES = {
  'NIETORP': { type: 'free', duration: 'lifetime' },
  'ROTAERC': { type: 'paywall', paywallId: 'creator_offer' },
} as const;

export type ReferralCodeType = keyof typeof REFERRAL_CODES;

export const validateReferralCode = (code: string): boolean => {
  return code.toUpperCase() in REFERRAL_CODES;
};

export const getReferralDetails = (code: string) => {
  const upperCode = code.toUpperCase() as ReferralCodeType;
  if (!(upperCode in REFERRAL_CODES)) {
    return null;
  }
  return REFERRAL_CODES[upperCode];
}; 