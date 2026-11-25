# Bailey's Cake Mail

A kawaii birthday cake studio: decorate a cake, write a note, and schedule a birthday email.

## What's included

- Live cake and frosting colors, selectable toppings, and a custom cake inscription
- Glossy ceramic plate cake preview
- Email and delivery date form with a review step before scheduling
- Responsive layout for desktop and mobile
- Server-side Resend integration; the API key is never exposed to browser code

## Run locally

Requires Node.js 22.13 or newer.

```sh
npm install
npm run dev
```

Open the local URL printed by the development server. In the local Sites preview, use `/signin-with-chatgpt?return_to=/` if you need to sign in before trying the schedule endpoint.

## Enable scheduled email

The deployed app needs a Resend account, a verified sender address, and these **server-side runtime variables**:

- `RESEND_API_KEY` — mark this value as a secret
- `CAKE_FROM_EMAIL` — the verified sender, for example `Bailey's Cake Mail <hello@yourdomain.com>`

Set them in the hosting platform's environment or secret settings. Do not add the API key to the source code, browser code, or a committed `.env` file. Without both variables, the site displays a setup message instead of scheduling an email.

The sender must sign in to this private Site to schedule a cake. The recipient does not need an account. Delivery time is interpreted in the sender's local timezone. Resend currently supports scheduling up to 30 days ahead.

## Build

```sh
npm run build
```

This project uses Next-compatible Vinext routes and the Cloudflare Workers runtime. The scheduled-email route requires a compatible deployment that provides `cloudflare:workers` runtime bindings.
