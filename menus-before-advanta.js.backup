const mainMenu = () => {
  return `CON Welcome to FURSAD
1. View Opportunities
2. Submit Anonymous Report
3. Find a Mentor
4. Session Status
0. Exit`;
};

const opportunitiesMenu = (opportunities) => {
  if (!opportunities || opportunities.length === 0) {
    return `END No opportunities available right now. Check back soon!`;
  }
  let menu = `CON Available Opportunities:\n`;
  opportunities.slice(0, 5).forEach((opp, i) => {
    menu += `${i + 1}. ${opp.title}\n`;
  });
  menu += `0. Back`;
  return menu;
};

// Shows full opportunity detail, matching the website's opportunity card
const opportunityDetail = (opp) => {
  if (!opp) {
    return `END Opportunity not found.`;
  }
  let msg = `END ${opp.title}\n`;
  msg += `Type: ${opp.type}\n`;
  if (opp.location) msg += `Location: ${opp.location}\n`;
  if (opp.opp_date) msg += `Date: ${opp.opp_date}\n`;
  msg += `\n${opp.description}\n`;
  if (opp.apply_instructions) {
    msg += `\nHow to apply: ${opp.apply_instructions}`;
  }
  return msg;
};

// Matches the website's dropdown options exactly (src/routes/mentors.tsx)
const NEED_OPTIONS = [
  { key: "skills", label: "Skills training" },
  { key: "jobs", label: "Job opportunities" },
  { key: "life", label: "Life advice" },
  { key: "school", label: "School/education" },
  { key: "business", label: "Starting a business" },
  { key: "other", label: "Other" },
];

const CONTACT_METHODS = [
  { key: "check", label: "I'll check back myself" },
  { key: "text", label: "Text me" },
  { key: "call", label: "Call me" },
];

const mentorNeedMenu = () => {
  let menu = `CON What do you need help with?\n`;
  NEED_OPTIONS.forEach((opt, i) => {
    menu += `${i + 1}. ${opt.label}\n`;
  });
  return menu.trim();
};

const mentorContactMenu = () => {
  let menu = `CON How should we reach you?\n`;
  CONTACT_METHODS.forEach((opt, i) => {
    menu += `${i + 1}. ${opt.label}\n`;
  });
  return menu.trim();
};

const mentorPhonePrompt = () => {
  return `CON Enter your phone number:`;
};

const mentorConsentPrompt = () => {
  return `CON Share your number with a mentor?\n1. Yes, I consent\n2. No, cancel`;
};

const mentorConfirmation = (sessionId) => {
  return `END Your request has been received.\nYour session ID is: ${sessionId}\nKeep this code to check your status later.`;
};

const mentorsMenu = (mentors) => {
  if (!mentors || mentors.length === 0) {
    return `END No mentors available right now.`;
  }
  let menu = `CON Available Mentors:\n`;
  mentors.slice(0, 5).forEach((mentor, i) => {
    menu += `${i + 1}. ${mentor.name}\n`;
  });
  menu += `0. Back`;
  return menu;
};

module.exports = {
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
};