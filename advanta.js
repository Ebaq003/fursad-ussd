// Advanta USSD route — separate from /ussd (Africa's Talking) so neither
// platform's integration can break the other.
//
// Advanta sends a GET request with these query params:
//   SESSIONID, USSDCODE, MSISDN, INPUT
// INPUT accumulates every step, e.g. 43*1*2 — but the FIRST segment (43)
// is the shared-code extension, not real user input. We strip it so the
// rest of our menu logic (which expects AT-style "1*2") works unchanged.

function registerAdvantaRoute(app, { handleUssdLogic }) {
  app.get('/advanta-ussd', async (req, res) => {
    const { SESSIONID, USSDCODE, MSISDN, INPUT } = req.query;
    res.set('Content-Type', 'text/plain');

    if (!SESSIONID || !MSISDN) {
      return res.status(400).send('END Missing required parameters.');
    }

    const rawInput = (INPUT || '').toString();
    const segments = rawInput.split('*');

    // First segment is the extension (e.g. "43") on a shared code — drop it.
    // If there's nothing after it, treat it as the start of the session ('').
    const userInput = segments.length > 1 ? segments.slice(1).join('*') : '';

    // Reuse the exact same menu/state logic as the Africa's Talking route.
    const response = await handleUssdLogic({
      sessionId: `advanta-${SESSIONID}`, // prefix avoids collision with AT session IDs
      phoneNumber: MSISDN,
      text: userInput,
    });

    res.send(response);
  });
}

module.exports = { registerAdvantaRoute };