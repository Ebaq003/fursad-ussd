require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { createClient } = require('@supabase/supabase-js');
const {
  mainMenu,
  opportunitiesMenu,
  opportunityDetail,
  mentorsMenu,
  mentorNeedMenu,
  mentorContactMenu,
  mentorPhonePrompt,
  mentorConsentPrompt,
  mentorConfirmation,
  NEED_OPTIONS,
  CONTACT_METHODS,
} = require('./menus');
const { generateSessionId, hashSessionId, obfuscatePhone } = require('./session');

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// ---- 1-minute inactivity timeout ----
// Africa's Talking controls the real session length, but we track our own
// "last seen" time per sessionId and force-end if more than 60s has passed
// since the previous request for that session.
const SESSION_TIMEOUT_MS = 60 * 1000;
const lastSeen = new Map();

function isExpired(sessionId) {
  const last = lastSeen.get(sessionId);
  if (!last) return false;
  return Date.now() - last > SESSION_TIMEOUT_MS;
}

function touch(sessionId) {
  lastSeen.set(sessionId, Date.now());
}

// Clean up old sessions every 5 minutes so the map doesn't grow forever
setInterval(() => {
  const now = Date.now();
  for (const [id, time] of lastSeen.entries()) {
    if (now - time > SESSION_TIMEOUT_MS * 5) lastSeen.delete(id);
  }
}, 5 * 60 * 1000);

// In-memory cache of fetched opportunities per session, so when a user
// picks "2" we know which opportunity that refers to without re-querying
// in a fragile way. Cleared on session end/expiry.
const opportunityCache = new Map();

app.post('/ussd', async (req, res) => {
  const { sessionId, serviceCode, phoneNumber, text } = req.body;
  const input = (text || '').trim();
  const parts = input.split('*');
  let response = '';

  res.set('Content-Type', 'text/plain');

  // ---- Timeout check ----
  if (isExpired(sessionId)) {
    opportunityCache.delete(sessionId);
    lastSeen.delete(sessionId);
    return res.send(`END Session timed out due to inactivity. Please dial again.`);
  }
  touch(sessionId);

  try {
    // Main menu
    if (input === '') {
      response = mainMenu();

    // ===== 1. View Opportunities =====
    } else if (input === '1') {
      const { data } = await supabase
        .from('opportunities')
        .select('id, title')
        .limit(5);
      opportunityCache.set(sessionId, data || []);
      response = opportunitiesMenu(data);

    } else if (parts[0] === '1' && parts.length === 2 && parts[1] !== '0') {
      const cached = opportunityCache.get(sessionId) || [];
      const choice = parseInt(parts[1], 10);
      const picked = cached[choice - 1];
      if (!picked) {
        response = `END Invalid selection.`;
      } else {
        const { data: full } = await supabase
          .from('opportunities')
          .select('title, type, location, opp_date, description, apply_instructions')
          .eq('id', picked.id)
          .single();
        response = opportunityDetail(full);
      }

    // ===== 2. Submit Anonymous Report =====
    } else if (input === '2') {
      response = `CON Submit Anonymous Report\nType your report and press Send:`;

    } else if (parts[0] === '2' && parts.length >= 2) {
      const reportText = parts.slice(1).join(' ');
      const sid = generateSessionId();
      const hash = hashSessionId(sid);
      await supabase.from('reports').insert([{
        description: reportText,
        incident_type: 'other',
        when_bucket: 'unspecified',
        session_id_hash: hash,
      }]);
      response = `END Report submitted. Thank you for speaking up.\nYour session ID: ${sid}`;

    // ===== 3. Find a Mentor (matches website flow) =====
    } else if (input === '3') {
      response = mentorNeedMenu();

    // Step: need selected -> ask contact method
    } else if (parts[0] === '3' && parts.length === 2) {
      const needIdx = parseInt(parts[1], 10) - 1;
      if (!NEED_OPTIONS[needIdx]) {
        response = `END Invalid selection.`;
      } else {
        response = mentorContactMenu();
      }

    // Step: contact method selected
    } else if (parts[0] === '3' && parts.length === 3) {
      const methodIdx = parseInt(parts[2], 10) - 1;
      const method = CONTACT_METHODS[methodIdx];
      if (!method) {
        response = `END Invalid selection.`;
      } else if (method.key === 'check') {
        // No phone needed — submit immediately
        response = await submitMentorRequest({ parts, phone: null, consent: false });
      } else {
        response = mentorPhonePrompt();
      }

    // Step: phone entered -> ask consent
    } else if (parts[0] === '3' && parts.length === 4) {
      response = mentorConsentPrompt();

    // Step: consent answered -> submit
    } else if (parts[0] === '3' && parts.length === 5) {
      const consentChoice = parts[4];
      if (consentChoice === '1') {
        const phone = parts[3];
        response = await submitMentorRequest({ parts, phone, consent: true });
      } else {
        response = `END Request cancelled. No information was saved.`;
      }

    // ===== 4. Session Status =====
    } else if (input === '4') {
      response = `CON Enter your Session ID:`;

    } else if (parts[0] === '4' && parts.length === 2) {
      const code = parts[1];
      const hash = hashSessionId(code);

      // Check both reports and mentorship_requests since either can produce a session ID
      const { data: report } = await supabase
        .from('reports').select('status').eq('session_id_hash', hash).maybeSingle();
      const { data: mentor } = await supabase
        .from('mentorship_requests').select('status').eq('session_id_hash', hash).maybeSingle();

      if (report) {
        response = `END Report status: ${report.status}`;
      } else if (mentor) {
        response = `END Mentor request status: ${mentor.status}`;
      } else {
        response = `END Session not found. Check your ID and try again.`;
      }

    // Exit
    } else if (input === '0') {
      response = `END Thank you for using FURSAD. Goodbye!`;

    } else {
      response = `END Invalid option. Please try again.`;
    }
  } catch (err) {
    console.error('USSD error:', err);
    response = `END Something went wrong. Please try again later.`;
  }

  // Clean up cache once session ends
  if (response.startsWith('END')) {
    opportunityCache.delete(sessionId);
    lastSeen.delete(sessionId);
  }

  res.send(response);
});

// Helper: builds and inserts a mentorship_request, matching website fields
async function submitMentorRequest({ parts, phone, consent }) {
  const needIdx = parseInt(parts[1], 10) - 1;
  const methodIdx = parseInt(parts[2], 10) - 1;
  const need = NEED_OPTIONS[needIdx];
  const method = CONTACT_METHODS[methodIdx];

  const sid = generateSessionId();
  const hash = hashSessionId(sid);
  const phoneEnc = phone ? obfuscatePhone(phone.trim()) : null;

  await supabase.from('mentorship_requests').insert([{
    session_id_hash: hash,
    need: need.label,
    contact_method: method.key,
    phone_encrypted: phoneEnc,
    consent,
  }]);

  return mentorConfirmation(sid);
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`FURSAD USSD server running on port ${PORT}`);
});