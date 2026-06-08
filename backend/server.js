'use strict';
require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

// Fail fast if required env vars are missing
const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ALLOWED_ORIGIN } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.');
  process.exit(1);
}

// Service-role key is used server-side only — never exposed to the browser
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// ── Security headers ──────────────────────────────────────────────────────────
app.use(helmet());

// ── Body parser (tight size limit to block oversized payloads) ────────────────
app.use(express.json({ limit: '16kb' }));

// ── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = (ALLOWED_ORIGIN || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, cb) {
      // No origin = same-origin or server-to-server; block in production
      if (!origin) {
        return process.env.NODE_ENV === 'production'
          ? cb(new Error('Origin required'))
          : cb(null, true);
      }
      if (allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error(`CORS: ${origin} not allowed`));
    },
    methods: ['POST'],
    allowedHeaders: ['Content-Type'],
  })
);

// ── Rate limiting: 5 enquiries per IP per 15 min ──────────────────────────────
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again in 15 minutes.' },
  skip: () => process.env.NODE_ENV === 'test',
});

// ── Validation rules ──────────────────────────────────────────────────────────
const ALLOWED_SERVICES = [
  'architectural', 'landscape', 'commercial',
  'retail', 'hospitality', 'residential', 'facade', 'other',
];

const contactValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required.')
    .isLength({ max: 120 }).withMessage('Name too long.'),
  body('email')
    .trim()
    .isEmail().withMessage('A valid email address is required.')
    .normalizeEmail({ gmail_remove_dots: false }),
  body('phone')
    .trim()
    .notEmpty().withMessage('Phone number is required.')
    .isLength({ max: 25 }).withMessage('Phone number too long.'),
  body('details')
    .trim()
    .notEmpty().withMessage('Project details are required.')
    .isLength({ max: 3000 }).withMessage('Project details too long (max 3000 chars).'),
  body('company')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 120 }).withMessage('Company name too long.'),
  body('service')
    .optional({ checkFalsy: true })
    .trim()
    .isIn(ALLOWED_SERVICES).withMessage('Invalid service selection.'),
];

// ── Routes ────────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.post('/api/contact', contactLimiter, contactValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array().map((e) => e.msg) });
  }

  const { name, email, phone, company, service, details } = req.body;

  const { error } = await supabase.from('enquiries').insert({
    name,
    email,
    phone,
    company: company || null,
    service: service || null,
    details,
  });

  if (error) {
    console.error('DB insert error:', error.message);
    return res.status(500).json({ error: 'Could not save enquiry. Please try again.' });
  }

  res.status(201).json({ message: "Enquiry received. We'll be in touch within one business day." });
});

// ── 404 catch-all ─────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Not found.' }));

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err.message);
  res.status(500).json({ error: 'Internal server error.' });
});

app.listen(PORT, () => console.log(`Studio Quetzal API running on port ${PORT}`));

module.exports = app;
