# Presently 🎀

A birthday and gift-reminder app: track friends' birthdays, save gift ideas
or links, and get emailed a week before each birthday.

**What's built (v2):**
- Add/edit/remove friends with birthday, event type, timezone, city, address, and a short bio
- Event types: Birthday 🎂, Wedding anniversary 💍, Celebration 🎉, Child's birthday 🧸
- Add gift ideas by pasting a link (auto-fetches title, image, and price where the page exposes it — otherwise shows "$TBD") or typing free text
- Typed (unlinked) gift ideas open a Google search for that idea when clicked
- "✨ Magic idea" button drafts a gift suggestion from a friend's bio
- Mark gifts as idea / purchased / sent
- Dashboard sorted by soonest birthday; the "coming up this week" cards also preview the latest gift idea and its price
- Email reminder 7 days before each birthday (daily automated check)
- Login by email magic link — built multi-user-ready, even though it's just you for now

**Deliberately deferred:** true bio-driven web search for gift recommendations
(the current magic idea button uses a keyword-matched suggestion pool, not a
live search) — a good next step once this is in daily use.

---

## Upgrading from v1 (already deployed)

If you deployed the earlier version already, run this once in Supabase
**SQL Editor** before pulling the new code — it adds the two new columns
without touching your existing friends or gifts:

```
supabase/migration_002_event_type_and_price.sql
```

New installs don't need this — `supabase/schema.sql` already includes it.

---

## 1. Create your accounts (all free tiers)

You'll need three accounts. Takes about 10 minutes total.

### Supabase (database + login)
1. Go to https://supabase.com → sign up → **New project**.
2. Pick any name/region and a database password (save it somewhere, you likely won't need it again).
3. Once the project finishes provisioning, go to **Project Settings → API**. You'll need three values from this page in step 3 below: `Project URL`, `anon public` key, and `service_role` key (click "Reveal" on the last one).
4. Go to **SQL Editor → New query**, paste in the entire contents of `supabase/schema.sql` from this project, and click **Run**. This creates the `friends` and `gifts` tables with the right security rules.
5. Go to **Authentication → Providers**, confirm **Email** is enabled (it is by default).
6. Go to **Authentication → URL Configuration** and add your future site URL to "Redirect URLs" — for now add `http://localhost:3000/auth/callback`; you'll add your real domain later in step 5.

**Known issue — Outlook/Hotmail link scanning:** login uses a magic link (not a
password). Outlook and Hotmail's "Safe Links" feature automatically pre-visits
every link in an email to scan it, which silently uses up the one-time login
link before you ever click it yourself — you'll just get bounced back to the
login page with no error. **Workaround for now:** log in with a non-Microsoft
email address (Gmail, iCloud, etc.) if you have one.

**Real fix, once you're ready:** switch login to a typed 6-digit code instead
of a link — a scanner can't "click" a code you haven't read yet. This requires
editing Supabase's email template, which (as of June 2026) requires a custom
SMTP provider to be configured first. If you don't own a domain, the
lowest-effort option is your own **Gmail account** — no domain needed:
1. Turn on 2-Step Verification at https://myaccount.google.com
2. Under **Security → App passwords**, generate one for "Mail"
3. In Supabase: **Authentication → SMTP Settings** → enable Custom SMTP →
   Host `smtp.gmail.com`, Port `587`, Username your Gmail address, Password
   the app password you generated
4. Ping me once that's done and I'll switch the login page back to the code flow and give you the email template to paste in.

### Resend (sends the reminder emails)
1. Go to https://resend.com → sign up.
2. Go to **API Keys → Create API Key**. Copy it — you'll need it in step 3.
3. That's it for now. Resend lets you send from `onboarding@resend.dev` immediately with no setup, which is fine for personal use. (Later, if you want emails to say "from you," add and verify your own domain under **Domains**.)

### Vercel (hosting)
1. Go to https://vercel.com → sign up (easiest: "Continue with GitHub").
2. If you don't already have a GitHub account, make one at https://github.com — you'll push this project's code there so Vercel can deploy it.

---

## 2. Push this code to GitHub

From this project folder on your computer:

```bash
git init
git add .
git commit -m "Initial commit"
```

Then create a new empty repo on GitHub (github.com → New repository → don't
initialize with a README), and run the two commands it shows you, e.g.:

```bash
git remote add origin https://github.com/YOUR_USERNAME/presently.git
git branch -M main
git push -u origin main
```

---

## 3. Import the project into Vercel

1. In Vercel: **Add New → Project**, choose the `presently` repo you just pushed.
2. Before deploying, expand **Environment Variables** and add these (values from step 1):

   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | from Supabase API settings |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | from Supabase API settings |
   | `SUPABASE_SERVICE_ROLE_KEY` | from Supabase API settings |
   | `RESEND_API_KEY` | from Resend |
   | `CRON_SECRET` | any random long string you make up (e.g. run `openssl rand -hex 32`) |

3. Click **Deploy**. In a minute or two you'll get a live URL like `presently-yourname.vercel.app`.

---

## 4. Connect the pieces

1. Copy your live Vercel URL.
2. Back in Supabase → **Authentication → URL Configuration**, add
   `https://your-vercel-url.vercel.app/auth/callback` to Redirect URLs.
3. Visit your live URL, enter your email, and check your inbox for the magic link. (If you're on Outlook/Hotmail and it bounces you back to login, see the known issue above.)

You're in. The daily reminder check is already scheduled (see `vercel.json`) —
Vercel will call it once a day automatically; no extra setup needed.

---

## 5. (Optional) Add a custom domain

In your Vercel project → **Settings → Domains**, add a domain you own and
follow the DNS instructions shown. Then add
`https://yourdomain.com/auth/callback` to Supabase's Redirect URLs too.

---

## Local development

```bash
npm install
cp .env.example .env.local   # fill in the same values as step 3 above
npm run dev
```

Visit http://localhost:3000.

## Notes on the "shipping heads-up" and gift suggestions

The order-by date shown on each friend's page is a simple 5-day-before
heuristic based on their timezone, not a live shipping-carrier lookup — real
regional delivery-cutoff data is a bigger integration to add later if it's
worth it. Gift auto-suggestions from a friend's bio (feature 3) work the same
way: intentionally left out of v1 so we can get the core flow live and tested
first.
