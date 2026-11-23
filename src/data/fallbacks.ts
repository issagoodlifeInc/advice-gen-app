// Clearly-labelled example slips, shown only when the live Advice Slip API
// cannot be reached (e.g. offline) on first load.
export interface FallbackSlip { id: number; advice: string; }
export const FALLBACKS: FallbackSlip[] = [
  {
    "id": 117,
    "advice": "It is easy to sit up and take notice, what's difficult is getting up and taking action."
  },
  {
    "id": 55,
    "advice": "Happiness is not something ready made. It comes from your own actions."
  },
  {
    "id": 48,
    "advice": "Do not fear growing slowly, fear only standing still."
  },
  {
    "id": 89,
    "advice": "Remember, staying quiet is sometimes the best answer."
  },
  {
    "id": 118,
    "advice": "When in doubt, just take the next small step."
  },
  {
    "id": 2,
    "advice": "Smile and the world smiles with you. Frown and you're on your own."
  }
];
