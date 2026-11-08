// Edit this file to set up your site. No other file needs to change for basic setup.
window.CONFIG = {
  BRAND: "Meridian FX",

  // The bank account customers send deposits to (YOUR business account).
  BANK: {
    bank: "United Bank for Africa",
    accountNumber: "2350615431",
    accountName: "Oasis.Ltd"
  },
  MIN_DEPOSIT: 1000,          // minimum deposit in NGN
  MIN_WITHDRAWAL: 1000,

  // true  = practice mode. Deposits and withdrawals complete by themselves after 8 seconds.
  // false = real mode. Requires API_BASE below, because only a server may change balances.
  DEMO_MODE: true,

  // Your backend URL, e.g. "https://api.yourdomain.com". Leave empty in demo mode.
  API_BASE: "",

  // Live exchange rates (free, updated about once a day). Swap for a paid feed for tick-by-tick prices.
  RATES_URL: "https://open.er-api.com/v6/latest/USD"
};
