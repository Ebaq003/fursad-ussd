require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { createClient } = require('@supabase/supabase-js');
const { mainMenu, opportunitiesMenu, mentorsMenu } = require('./menus');

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

app.post('/ussd', async (req, res) => {
  const { sessionId, serviceCode, phoneNumber, text } = req.body;
  const input = text.trim();
  let response = '';

  // Main menu
  if (input === '') {
    response = mainMenu();

  // View Opportunities
  } else if (input === '1') {
    const { data } = await supabase.from('opportunities').select('title').limit(5);
    response = opportunitiesMenu(data);

  // Submit Anonymous Report
  } else if (input === '2') {
    response = `CON Submit Anonymous Report
Type your report and press Send:`;

  } else if (input.startsWith('2*')) {
    const reportText = input.split('*').slice(1).join(' ');
    await supabase.from('reports').insert([{
      content: reportText,
      phone: 'anonymous',
      source: 'ussd'
    }]);
    response = `END Report submitted successfully. Thank you for speaking up!`;

  // Find a Mentor
  } else if (input === '3') {
    const { data } = await supabase.from('mentors').select('name').limit(5);
    response = mentorsMenu(data);

  // Session Status
  } else if (input === '4') {
    response = `CON Enter your Session ID:`;

  } else if (input.startsWith('4*')) {
    const sessionCode = input.split('*')[1];
    const { data } = await supabase
      .from('sessions')
      .select('status')
      .eq('code', sessionCode)
      .single();
    if (data) {
      response = `END Session Status: ${data.status}`;
    } else {
      response = `END Session not found. Check your ID and try again.`;
    }

  // Exit
  } else if (input === '0') {
    response = `END Thank you for using FURSAD. Goodbye!`;

  } else {
    response = `END Invalid option. Please try again.`;
  }

  res.set('Content-Type', 'text/plain');
  res.send(response);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`FURSAD USSD server running on port ${PORT}`);
});