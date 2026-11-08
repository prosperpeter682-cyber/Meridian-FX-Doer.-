# Meridian FX

A multi-page currency trading site: Home, Buy / Trade, Deposit, Withdraw. Your available balance shows in the top bar and on every page.

## Put it on GitHub Pages

1. Create a new repository on GitHub (for example `meridian-fx`).
2. Upload `index.html`, `style.css`, `app.js`, `config.js` and this README.
3. Go to **Settings > Pages**, set **Source** to "Deploy from a branch", choose `main` and `/ (root)`, then save.
4. After a minute your site is live at `https://YOUR-USERNAME.github.io/meridian-fx/`.

## Set up your bank details

Open `config.js` and change `BANK` to your business bank account. Customers see these details on the Deposit page, plus a personal reference code to put in their transfer narration.

## How deposits and withdrawals work

- **Deposit:** the customer sends a transfer to your account with their reference, then taps "I’ve sent the money". The deposit shows as pending. It is added to their balance once you confirm the money arrived.
- **Withdraw:** the customer enters the amount and their bank details. The amount leaves their available balance straight away and the request shows as processing until you pay it out.

## Practice mode vs real money

The site starts with `DEMO_MODE: true`. In this mode balances live only in the visitor’s browser and deposits and withdrawals complete by themselves after 8 seconds. **No real money moves.**

GitHub Pages only serves static files, so it cannot hold real balances safely. Anyone can edit browser data, so the browser must never decide what a customer owns. To take real money you need:

1. **A backend** (Node, Python, or a service like Supabase or Firebase) that stores balances, and a login system.
2. **A payment provider** such as Paystack or Flutterwave to receive and send bank transfers and tell your backend when a payment lands (webhooks). This replaces manual confirmation.
3. **The right licence.** Holding customer money and dealing in foreign exchange is regulated. In Nigeria, speak to the CBN and a lawyer before launching.

Then set `DEMO_MODE: false` and `API_BASE` in `config.js`. The site will call these endpoints, sending the customer’s session cookie:

| Method | Path | Purpose |
|---|---|---|
| GET | `/account` | Returns `{ balances: {NGN: 0, USD: 0, ...}, transactions: [{id, type, cur, amt, status, note, t}] }` |
| POST | `/deposits` | `{amount, senderName, senderBank, reference}` creates a pending deposit |
| POST | `/withdrawals` | `{currency, amount, bank, accountNumber, accountName}` holds funds and creates a payout |
| POST | `/trades` | `{pair, side, amount}` fills an order at the server’s own price |

Your server must check every amount, price and balance itself.

## Rates

Prices come from the free `open.er-api.com` feed and refresh every minute. That feed updates about once a day, so for true tick-by-tick prices use a paid market-data provider and change `RATES_URL` and the mapping in `fetchRates()` in `app.js`.
