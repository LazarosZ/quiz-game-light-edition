const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');

// SET UP DATABASE FILE
const dbPath = path.join(__dirname, 'quiz_game_db.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database.');
  }
});

// ARRAY OF USERS 
const users = [
  { username: 'tasos', password: 'tasos123', department: 'warehouse' },
  { username: 'chara', password: 'chara123', department: 'accounting' },
  { username: 'laz', password: 'laz123', department: 'warehouse' },
  { username: 'thanos', password: 'thanos123', department: 'accounting' },
  { username: 'alkis', password: 'alkis123', department: 'warehouse' },
  { username: 'admin', password: 'admin123', department: 'admin', role: 'admin' }
];

// "function" TO INSERT USERS WITH "PRE"HASHED PASSWORDS
db.serialize(() => {
  users.forEach(user => {
    bcrypt.hash(user.password, 10, (err, hash) => {
      if (err) {
        console.error('Error hashing password for', user.username, err);
      } else {
        // DEFAULT IS "user", UNLESS WRITEN OTHERWISE
        const role = user.role || 'user';
        db.run(
          'INSERT OR IGNORE INTO users (username, password, role, department) VALUES (?, ?, ?, ?)',
          [user.username, hash, role, user.department],
          function(err) {
            if (err) {
              console.error('Error inserting user:', err);
            } else {
              console.log(`User "${user.username}" inserted with id ${this.lastID}`);
            }
          }
        );
      }
    });
  });
  
  // IMPORTANT!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
  // THE IMAGES FOLDER IS IN THE ROOT FOLDER, WITH THE index.js, ANY CHANGES TO STRUCTURE WILL "BREAK" THE URLs, example: /images/manual_handling/1w.jpg ....



  // INSERT into IMAGE questions
  db.run(`
    INSERT OR IGNORE INTO image_questions (question, image1, image2, correct, category) VALUES
    ('Which is the appropriate way to pick an Object from the Ground', '/images/manual_handling/1c.jpg', '/images/manual_handling/1w.jpg', 'image1', 'manual-handling'),
    ('Which image shows the correct way to push a heavy object', '/images/manual_handling/2c.jpg', '/images/manual_handling/2w.jpg', 'image1', 'manual-handling'),
    ('Which from the following is the appropriate footwear', '/images/manual_handling/3w.jpg', '/images/manual_handling/3c.jpg', 'image2', 'manual-handling'),
    ('Which of the following image depicts the right way to carry Big Objects', '/images/manual_handling/4w.jpg', '/images/manual_handling/4c.jpg', 'image2', 'manual-handling'),
    ('Which Image depicts the right way of working at height', '/images/manual_handling/5c.jpg', '/images/manual_handling/5w.jpg', 'image1', 'manual-handling'),
    ('Proper way to stand on a Ladder', '/images/manual_handling/6c.jpg', '/images/manual_handling/6w.jpg', 'image1', 'manual-handling'),
    ('Proper Way to Clean Chemical Spills on the Floor', '/images/manual_handling/7w.jpg', '/images/manual_handling/7c.jpg', 'image2', 'manual-handling'),
    ('Which Image depicts the safest way to stand on a ladder', '/images/manual_handling/8c.jpg', '/images/manual_handling/8w.jpg', 'image1', 'manual-handling'),
    ('Proper Safety Equipment', '/images/manual_handling/9w.jpg', '/images/manual_handling/9c.jpg', 'image2', 'manual-handling'),
    ('Proper way to Extinguish Fire', '/images/manual_handling/10c.jpg', '/images/manual_handling/10w.jpg', 'image1', 'manual-handling'),
    ('Which image shows a workplace with a safety hazard', '/images/hazard_perception/1c.jpg', '/images/hazard_perception/1w.jpg', 'image1', 'hazard-perception'),
    ('Which image shows a well-maintained workspace', '/images/hazard_perception/2c.jpg', '/images/hazard_perception/2w.jpg', 'image1', 'hazard-perception'),
    ('Which image shows proper fire safety measures', '/images/hazard_perception/3w.jpg', '/images/hazard_perception/3c.jpg', 'image2', 'hazard-perception'),
    ('Which image shows unsafe machine use', '/images/hazard_perception/4c.jpg', '/images/hazard_perception/4w.jpg', 'image1', 'hazard-perception'),
    ('Which image shows poor safety procedures', '/images/hazard_perception/5w.jpg', '/images/hazard_perception/5c.jpg', 'image2', 'hazard-perception'),
    ('Which image indicates a potential fire risk', '/images/hazard_perception/6c.jpg', '/images/hazard_perception/6w.jpg', 'image1', 'hazard-perception'),
    ('Which image indicates a potential accident to occur', '/images/hazard_perception/7w.jpg', '/images/hazard_perception/7c.jpg', 'image2', 'hazard-perception'),
    ('Which image shows a proper way to store hazardous materials', '/images/hazard_perception/8c.jpg', '/images/hazard_perception/8w.jpg', 'image1', 'hazard-perception'),
    ('Which image shows a safe smoking area', '/images/hazard_perception/9w.jpg', '/images/hazard_perception/9c.jpg', 'image2', 'hazard-perception'),
    ('Which image shows proper cable management at a workstation', '/images/hazard_perception/10c.jpg', '/images/hazard_perception/10w.jpg', 'image1', 'hazard-perception'),
    ('Which image shows a strong password', '/images/cyber_awareness/1c.jpg', '/images/cyber_awareness/1w.jpg', 'image1', 'cyber-awareness'),
    ('Which image shows the safest way to handle suspicious emails', '/images/cyber_awareness/2w.jpg', '/images/cyber_awareness/2c.jpg', 'image2', 'cyber-awareness'),
    ('Which image shows safe web browsing practices', '/images/cyber_awareness/3c.jpg', '/images/cyber_awareness/3w.jpg', 'image1', 'cyber-awareness'),
    ('Which image shows a secure way to store passwords', '/images/cyber_awareness/4w.jpg', '/images/cyber_awareness/4c.jpg', 'image2', 'cyber-awareness'),
    ('Which image shows the safest way to enter a password', '/images/cyber_awareness/5c.jpg', '/images/cyber_awareness/5w.jpg', 'image1', 'cyber-awareness'),
    ('Which image depicts a fraudulent technical support scam', '/images/cyber_awareness/6c.jpg', '/images/cyber_awareness/6w.jpg', 'image1', 'cyber-awareness'),
    ('Which image demonstrates a secure method for handling external USB devices', '/images/cyber_awareness/7c.jpg', '/images/cyber_awareness/7w.jpg', 'image1', 'cyber-awareness'),
    ('Which image illustrates the correct use of Two-Factor Authentication (2FA)', '/images/cyber_awareness/8w.jpg', '/images/cyber_awareness/8c.jpg', 'image2', 'cyber-awareness'),
    ('Which image represents an email attempting to impersonate a legitimate company', '/images/cyber_awareness/9c.jpg', '/images/cyber_awareness/9w.jpg', 'image1', 'cyber-awareness'),
    ('Which image demonstrates the correct procedure for securing your workstation when leaving', '/images/cyber_awareness/10c.jpg', '/images/cyber_awareness/10w.jpg', 'image1', 'cyber-awareness')
  `);


  // INSERT into handling_questions
  db.run(`
    INSERT OR IGNORE INTO handling_questions (question, option1, option2, option3, option4, correct) VALUES
    ('What is the safest way to lift a heavy object', 'Twist your back while lifting', 'Lift with your back straight and knees bent', 'Lift with your knees straight and back bent', 'Lift quickly to reduce strain', 'option2'),
    ('When lifting, how should the load be positioned', 'Keep the load away from your body to prevent strain', 'Keep the load close to your body to reduce strain', 'Hold the load as far away from your body as possible', 'Keep the load at eye level', 'option2'),
    ('Which of the following is an example of using mechanical aids for manual handling', 'Lifting the load with your hands only', 'Using a forklift or trolley to carry the load', 'Carrying the load on your back', 'Lifting with your legs only', 'option2'),
    ('What should you do if the load is too heavy to lift alone', 'Attempt to lift it alone and take frequent breaks', 'Ask a coworker for help or use mechanical aids', 'Wait for someone else to lift it for you', 'Lift it slowly and cautiously without asking for help', 'option2'),
    ('What is a sign that a lifting technique may be unsafe', 'You feel no strain or discomfort while lifting', 'The load is within your bodys capability to lift', 'You experience back or shoulder strain when lifting', 'You are able to lift the load quickly without any effort', 'option3'),
    ('What is one of the most important considerations when lifting a heavy object', 'Lifting quickly to reduce time spent', 'Lifting while standing on one foot for balance', 'Make sure your feet are shoulder-width apart for stability', 'Lifting with one hand while carrying other items in the other hand', 'option3'),
    ('Which of the following can help reduce the risk of injury when lifting heavy items', 'Lifting quickly to reduce time spent lifting', 'Wearing proper footwear and using lifting aids', 'Lifting with one hand to balance your body', 'Stretching after the lift to relax muscles', 'option2'),
    ('What should you do before lifting a heavy load', 'Plan the lift, ensure a clear path, and make sure your grip is secure', 'Lift the object immediately without checking your surroundings', 'Attempt the lift with minimal preparation', 'Make sure the load is as heavy as possible for maximum strength', 'option1'),
    ('Which of the following is true regarding lifting heavy loads', 'You should always twist your body while lifting', 'It is safer to keep the load in front of your body rather than to one side', 'You should stretch first but can skip warming up', 'You can use your back and legs equally to lift', 'option2'),
    ('What is a Key Benefit of using a lifting aid like a trolley', 'It reduces the physical strain on your body', 'It speeds up the lifting process', 'It makes the load heavier', 'It prevents you from needing to lift the load', 'option1')
  `);

  // INSERT into height_questions
  db.run(`
    INSERT OR IGNORE INTO height_questions (question, option1, option2, option3, option4, correct) VALUES
    ('What is the risk of falling from any height', 'Falls from only high places can cause injuries', 'A fall from any height can result in serious injury', 'Only falls from ladders are dangerous', 'Falls from low heights are not a risk', 'option2'),
    ('When using a ladder, what is the safest practice?', 'Always stand on the top rung', 'Ensure the ladder is secured and placed on a stable surface', 'Use a ladder with missing rungs as long as you are careful', 'Climb the ladder with both hands full', 'option2'),
    ('When working on a scaffold, what safety measure is essential?', 'You do not need a harness if you have good balance', 'Wearing a safety harness is recommended', 'Only work on the scaffold if its less than 5 feet off the ground', 'A harness is not required for short jobs', 'option2'),
    ('What should you do before working at height?', 'Check the weather and ensure it is sunny', 'Secure tools and materials to prevent them from falling', 'Only check the ladder for stability, not the surface it is placed on', 'Wear any shoes you feel comfortable in', 'option2'),
    ('Which of the following should be avoided when working at height?', 'Standing on the top step of a ladder', 'Using a harness for extra safety', 'Ensuring tools are secured when climbing', 'Making sure the ground is clear of obstacles', 'option1'),
    ('What is a Key Safety Feature of a ladder when working at height?', 'It should be leaning at an angle of about 75 degrees', 'It should be placed at any angle you find comfortable', 'It should be at least 5 feet higher than the platform', 'You can use a ladder with broken or missing parts', 'option1'),
    ('What should you always do before using scaffolding?', 'Make sure the scaffolding is level and properly secured', 'Test the scaffolding by jumping up and down on it', 'Use the scaffolding even if it is missing safety rails', 'Set up the scaffolding without checking for any damage', 'option1'),
    ('What is the purpose of guardrails when working at height?', 'They help you climb faster', 'They prevent tools from falling', 'They act as decorations', 'They provide a barrier to prevent falls from the edge', 'option4'),
    ('What is the minimum requirement for fall protection when working at height above 6 feet?', 'Only a helmet is required', 'A safety harness or guardrails must be used', 'No protection is required as long as the worker is experienced', 'Workers can decide for themselves whether to use protection', 'option2'),
    ('Which of the following is a hazard when working at height?', 'Working with all tools secured', 'Having an unstable work platform', 'Wearing a safety harness', 'Using a properly secured ladder', 'option2')
  `);

  // INSERT perception_questions
  db.run(`
    INSERT OR IGNORE INTO perception_questions (question, option1, option2, option3, option4, correct) VALUES
    ('What should you do if you notice a spill on the floor at work?', 'Wait for someone else to notice and clean it up', 'Ignore it because it is not a major hazard', 'Immediately clean it up or report it to the proper authorities', 'Walk around it and continue working', 'option3'),
    ('Which of the following can increase the risk of accidents in the workplace?', 'Proper lighting and clear signage', 'Cluttered walkways or poorly lit areas', 'Well-organized and tidy workstations', 'Clear emergency exits', 'option2'),
    ('How can Personal Protective Equipment (PPE) help reduce workplace hazards?', 'PPE makes work easier but does not reduce hazards', 'PPE helps protect you from exposure to dangerous substances and accidents', 'PPE is only necessary for heavy machinery operators', 'PPE is unnecessary if you are careful enough', 'option2'),
    ('What should you do if you observe a safety hazard that could harm others?', 'Keep it to yourself and assume someone else will handle it', 'Immediately report it to a supervisor or safety officer', 'Ignore it if it does not directly affect you', 'Wait until the end of your shift to address it', 'option2'),
    ('What is the risk of taking shortcuts at work?', 'It can make your work faster without any risk', 'It can lead to mistakes, accidents, and injuries', 'Shortcuts are only unsafe if they are noticed', 'Shortcuts save time but do not affect safety', 'option2'),
    ('What is the main risk of having poor housekeeping in the workplace?', 'It makes the workplace look untidy but does not pose any serious risks', 'It can lead to slips, trips, and falls, and increase the risk of fire', 'It prevents employees from finding tools and equipment quickly', 'It only affects the aesthetic of the workspace', 'option2'),
    ('Why is it important to check your surroundings before operating machinery?', 'To ensure the machinery is clean', 'To ensure there are no hazards or obstacles that could cause injury', 'To increase the speed of the task', 'To reduce the amount of training needed', 'option2'),
    ('How can poor ergonomics affect your health in the workplace?', 'It can cause fatigue and discomfort but will not lead to serious injuries', 'It can lead to Chronic Musculoskeletal Disorders like back and wrist pain', 'It has no impact on health if you are careful', 'It only affects workers who are lifting heavy objects', 'option2'),
    ('What is an example of a fire hazard in a workplace?', 'Poor ventilation that causes discomfort', 'Faulty wiring or overloaded electrical outlets', 'Properly stored flammable materials', 'Properly functioning fire extinguishers', 'option2'),
    ('What is the best way to identify potential hazards in your workplace?', 'Rely on others to spot hazards', 'Perform a regular safety inspection and be alert to changing conditions', 'Wait until an accident happens before taking action', 'Assume all hazards are obvious and do not need attention', 'option2')
  `);

  //  INSERT unsafe_acts_questions
  db.run(`
    INSERT OR IGNORE INTO unsafe_acts_questions (question, option1, option2, option3, option4, correct) VALUES
    ('What is considered an unsafe act when using machinery?', 'Operating machinery without proper training', 'Checking the machinery before use', 'Wearing required PPE', 'Following the operating manual', 'option1'),
    ('What is the risk of engaging in horseplay at the workplace?', 'It can increase teamwork', 'It can lead to distractions and serious injuries', 'It makes the work environment more enjoyable', 'It helps relieve stress', 'option2'),
    ('Why is it unsafe to ignore safety protocols?', 'Ignoring safety protocols can improve efficiency', 'It increases the risk of accidents, injuries, and damage to equipment', 'Safety protocols are unnecessary when you are experienced', 'It helps you finish the task faster', 'option2'),
    ('What is the danger of not wearing Personal Protective Equipment (PPE)?', 'PPE is uncomfortable, but it is okay to skip it sometimes', 'It increases the risk of injury or exposure to hazardous materials', 'PPE is not necessary if you feel safe', 'It has no real impact on safety', 'option2'),
    ('What should you do if you observe an unsafe act in the workplace?', 'Ignore it, as it does not directly affect you', 'Report it to a supervisor or safety officer', 'Wait until the end of the shift to report it', 'Join in if the task looks easier or faster', 'option2'),
    ('What is the risk of taking shortcuts in a dangerous task?', 'Shortcuts make the task easier and faster without any risk', 'Shortcuts can lead to mistakes, accidents, and injuries', 'Taking shortcuts only increases productivity', 'Shortcuts are safe as long as you are careful', 'option2'),
    ('What is considered unsafe when working with hazardous chemicals?', 'Wearing the correct PPE', 'Not properly labeling or storing chemicals', 'Following the Safety Data Sheet (SDS) Instructions', 'Using chemicals in a well-ventilated area', 'option2'),
    ('Why is it unsafe to use damaged equipment?', 'It is less productive but still works fine', 'Damaged equipment can lead to malfunctions, accidents, or injuries', 'It will fix itself if left alone', 'It is only unsafe if you are not careful', 'option2'),
    ('What is the danger of lifting heavy objects improperly?', 'It can lead to injury, especially to your back', 'It is faster and saves time', 'It does not matter as long as you do not feel pain', 'It has no risk if you are strong enough', 'option1'),
    ('What is the consequence of working without proper lighting?', 'It makes the work environment more relaxed', 'It saves energy', 'It has no effect on safety', 'It can lead to accidents or mistakes due to poor visibility', 'option4'),
    ('What is the risk of ignoring designated smoking areas?', 'Smoking in unauthorized areas can harm the health of others and violate workplace policies', 'It helps keep the workplace smelling fresh', 'It allows for a more private smoking area', 'Smoking in non-designated areas helps you focus better', 'option1'),
    ('What should you do if you see a coworker eating or drinking around sensitive equipment?', 'Ignore it, as it does not directly affect you', 'Tell the coworker to clean up after themselves', 'Report the behavior to a supervisor or safety officer', 'Join in and eat or drink around sensitive equipment too', 'option3'),
    ('Why is it unsafe to eat at your workstation, especially around computers and paperwork?', 'It can lead to food spills that damage equipment or documents', 'It improves focus by keeping you energized', 'It allows you to multitask and be more productive', 'It is fine as long as you clean up afterward', 'option1'),
    ('Why is it unsafe to block fire exits with office furniture or equipment?', 'It creates a more organized office space', 'It could delay evacuation during an emergency, putting lives at risk', 'It helps keep the office tidy', 'It improves the aesthetic of the workspace', 'option2'),
    ('Why is using a mobile phone while walking through the office considered unsafe?', 'It increases your productivity by multitasking', 'It can distract you from potential hazards or obstacles, leading to accidents', 'It helps you complete tasks more efficiently', 'It has no impact if you are just checking the time', 'option2')
    `);

    //INSERT cyber_questions
    db.run(`
        INSERT OR IGNORE INTO cyber_questions (question, option1, option2, option3, option4, correct) VALUES
        ('What is the risk of using the same password for multiple accounts?', 'If one account is hacked, all your accounts are vulnerable', 'It simplifies remembering passwords', 'It does not pose any risk if the password is strong', 'It makes it easier to manage your accounts', 'option1'),
        ('What should you do if you receive a suspicious email asking for sensitive information?', 'Reply with the requested information', 'Click on any links in the email to verify the sender', 'Ignore the email and continue working', 'Delete the email and report it to IT', 'option4'),
        ('Why is it unsafe to connect to public Wi-Fi networks?', 'It is perfectly safe if you trust the network provider', 'Hackers can easily intercept and access your data on unsecured public networks', 'Public Wi-Fi speeds up your internet connection', 'Public Wi-Fi is secure as long as you use a password', 'option2'),
        ('What should you do if you suspect your work computer has been infected with malware?', 'Report it to your IT department immediately', 'Try to fix it yourself by downloading an antivirus tool', 'Restart the computer to see if the issue resolves', 'Ignore it and continue working', 'option1'),
        ('What is the risk of using weak or easily guessable passwords?', 'It makes your accounts vulnerable to being hacked', 'It makes your accounts more accessible and easier to manage', 'It does not affect security if your other protections are strong', 'It has no impact if you change your password regularly', 'option1'),
        ('Why is it unsafe to download files from untrusted sources, even if the website looks legitimate?', 'Files from unknown sources may contain malware or ransomware', 'All files from the internet are automatically scanned for viruses', 'You can delete the files later if you suspect they are unsafe', 'Files from reputable sites are safe, so there is no need for concern', 'option1'),
        ('What is the potential risk of sharing your work login credentials with a colleague for convenience?', 'It allows for more efficient collaboration', 'Your personal information may be exposed if they mishandle it', 'It doesn not pose a risk as long as you trust the colleague', 'It ensures that someone else can step in when you are unavailable', 'option2'),
        ('Why should you be cautious about what you post on social media, especially regarding your workplace?', 'Social media is an excellent platform for sharing workplace achievements', 'Sharing too much can make you a target for phishing or social engineering attacks', 'It has no impact on your personal security as long as your account is private', 'Posting about your workplace increases your professional network', 'option2'),
        ('Why is it risky to use the "Remember Me" feature for your work login on public or shared computers?', 'It helps you save time by not needing to enter your password each time', 'It makes it easier for cybercriminals to access your accounts if the device is compromised', 'Public computers are automatically secure, so it is safe to use this feature', 'It does not pose any risk if you log out after use', 'option2'),
        ('Why should you be cautious about clicking on pop-up ads, even if they appear on legitimate websites?', 'Pop-ups are often disguised as legitimate notifications, tricking you into downloading malware', 'They are always sponsored by the website, so they are safe', 'They help improve the websites user experience', 'They typically lead to exciting discounts or exclusive offers', 'option1')
        `);

        // INSERT time_attack_questions YES - NO QUESTIONS
    db.run(`
        INSERT OR IGNORE INTO time_attack_questions (question, correct, category) VALUES
        ('Is lifting with your back straight and knees bent the safest way to lift heavy objects', 'yes', 'manual handling'),
        ('Is it okay to lift heavy items alone if you feel strong enough', 'no', 'manual handling'),
        ('Does keeping a load close to your body while carrying reduce strain on your back', 'yes', 'manual handling'),
        ('Should you test the weight of an object before lifting it to determine if assistance is needed', 'yes', 'manual handling'),
        ('Can repetitive lifting and poor posture lead to long-term musculoskeletal injuries', 'yes', 'manual handling'),
        ('Is it safe to lift objects while twisting your body', 'no', 'manual handling'),
        ('Is it okay to lift a load above shoulder height without assistance', 'no', 'manual handling'),
        ('Is wearing gloves unnecessary when handling heavy materials', 'no', 'manual handling'),
        ('Should you warm up and stretch before lifting objects', 'yes', 'manual handling'),
        ('Should proper footwear be worn to prevent slips and trips while lifting', 'yes', 'manual handling'),
        ('Are heavy loads safer to carry if held at arms length', 'no', 'manual handling'),
        ('Should you maintain three points of contact when climbing a ladder', 'yes', 'working at height'),
        ('Can falls from any height cause serious injury', 'yes', 'working at height'),
        ('Should ladders always be inspected before use', 'yes', 'working at height'),
        ('Is it safe to stand on the top step of a ladder', 'no', 'working at height'),
        ('Should scaffolding be checked regularly for stability', 'yes', 'working at height'),
        ('Can strong winds increase the risk of falls when working at height', 'yes', 'working at height'),
        ('Is fall protection only necessary when working above 6 feet', 'no', 'working at height'),
        ('Is it safe to carry heavy tools while climbing a ladder', 'no', 'working at height'),
        ('Can wet or oily surfaces increase slip hazards at height', 'yes', 'working at height'),
        ('Can loose clothing increase the risk of entanglement when working at height', 'yes', 'working at height'),
        ('Should you report damaged fall protection equipment immediately', 'yes', 'working at height'),
        ('Is it safe to jump down from a height of less than 2 feet', 'no', 'working at height'),
        ('Are blocked Emergency Exits considered a safety hazard', 'yes', 'hazard perception'),
        ('Should spills be cleaned up immediately', 'yes', 'hazard perception'),
        ('Is wearing PPE (Personal Protective Equipment) optional if you are experienced', 'no', 'hazard perception'),
        ('Should cluttered work areas be cleaned regularly', 'yes', 'hazard perception'),
        ('Should fire extinguishers be checked regularly', 'yes', 'hazard perception'),
        ('Should hazards be reported even if no one is injured', 'yes', 'hazard perception'),
        ('Should machine guards be removed if they slow down work', 'no', 'hazard perception'),
        ('Should workers assume all hazards are visible', 'no', 'hazard perception'),
        ('Is workplace safety only the responsibility of managers', 'no', 'hazard perception'),
        ('Should workers be trained in hazard recognition', 'yes', 'hazard perception'),
        ('Taking shortcuts often lead to workplace accidents', 'yes', 'unsafe acts'),
        ('Is texting while walking through the office an unsafe act', 'yes', 'unsafe acts'),
        ('Can using personal mobile phones while driving for work purposes be dangerous', 'yes', 'unsafe acts'),
        ('Is it okay to ignore minor hazards if you are in a rush', 'no', 'unsafe acts'),
        ('Is it safe to leave a computer powered on when you leave your desk', 'no', 'unsafe acts'),
        ('Not following proper ergonomic guidelines lead to injuries over time', 'yes', 'unsafe acts'),
        ('Can overloading electrical outlets cause workplace fires', 'yes', 'unsafe acts'),
        ('Eating or drinking near equipment increase the risk of accidents', 'yes', 'unsafe acts'),
        ('Is it safe to ignore poor air quality in the office because it doesnt directly affect you', 'no', 'unsafe acts'),
        ('Can overworking without regular breaks lead to mental and physical fatigue', 'yes', 'unsafe acts'),
        ('Is failing to lock out machinery before maintenance a serious safety violation', 'yes', 'unsafe acts'),
        ('Can ignoring a coworkers unsafe behavior contribute to accidents', 'yes', 'unsafe acts'),
        ('Is it acceptable to skip training if you feel confident in your ability to perform tasks safely', 'no', 'unsafe acts'),
        ('Can weak passwords be easily guessed or cracked by hackers', 'yes', 'cyber awareness'),
        ('Is it safe to write down passwords and keep them under your keyboard for easy access', 'no', 'cyber awareness'),
        ('Should employees store sensitive data on personal USB drives', 'no', 'cyber awareness'),
        ('Can clicking on a suspicious link infect your device with malware', 'yes', 'cyber awareness'),
        ('Should employees avoid using public Wi-Fi when working remotely', 'yes', 'cyber awareness'),
        ('Is using a personal cloud storage service for company files a good practice', 'no', 'cyber awareness'),
        ('Can webcam covers help prevent unauthorized access to your camera', 'yes', 'cyber awareness'),
        ('Should sensitive conversations be held in private spaces rather than public areas', 'yes', 'cyber awareness'),
        ('If you receive an unexpected email with an attachment, should you open it immediately', 'no', 'cyber awareness'),
        ('Do scammers often pretend to be authority figures to gain trust', 'yes', 'cyber awareness'),
        ('Should you verify the identity of someone asking for sensitive information before responding', 'yes', 'cyber awareness'),
        ('Is it okay to leave Bluetooth and Wi-Fi on at all times, even when not in use', 'no', 'cyber awareness'),
        ('Should employees avoid downloading work-related apps from unofficial app stores', 'yes', 'cyber awareness'),
        ('Is it safe to use the same password for multiple accounts to make it easier to remember', 'no', 'cyber awareness'),
        ('Should you use long, complex passwords that include a mix of letters, numbers, and special characters', 'yes', 'cyber awareness'),
        ('Is it okay to share your password with coworkers if they need access to your account', 'no', 'cyber awareness'),
        ('Is it important to regularly update your passwords for better security', 'yes', 'cyber awareness'),
        ('Is two-factor authentication (2FA) an optional extra layer of security for your accounts', 'no', 'cyber awareness'),
        ('Is antivirus software only needed for computers, not mobile devices', 'no', 'cyber awareness'),
        ('Can regular software updates help protect your devices from cyber threats', 'yes', 'cyber awareness')
        `);
});

// CLOSE DATABASE CONNECTION
setTimeout(() => {
  db.close(err => {
    if (err) {
      console.error('Error closing database:', err);
    } else {
      console.log('Database connection closed.');
    }
  });
}, 5000);
