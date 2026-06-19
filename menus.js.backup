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

module.exports = { mainMenu, opportunitiesMenu, mentorsMenu };