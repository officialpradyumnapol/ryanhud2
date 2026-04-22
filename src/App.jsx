import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, CartesianGrid, LineChart, Line, ScatterChart,
  Scatter, ZAxis, Cell, PieChart, Pie, Legend, ReferenceLine
} from "recharts";

// ═══════════════════════════════════════════════
//  SAFE BROWSER API WRAPPERS
// ═══════════════════════════════════════════════
const isBrowser = typeof window !== "undefined";
const safeSynth = isBrowser && window.speechSynthesis ? window.speechSynthesis : null;
const safeLS = {
  get: (k, def = "") => { try { return isBrowser ? (localStorage.getItem(k) || def) : def; } catch { return def; } },
  set: (k, v) => { try { if (isBrowser) localStorage.setItem(k, String(v)); } catch {} },
};

// ═══════════════════════════════════════════════
//  TRAINING DATA — 313 built-in Q&A entries
//  (grows automatically as you talk)
// ═══════════════════════════════════════════════
const TRAINING_DATA = [
  ["hi","Hey! What's on your mind?","general"],
  ["hello","What's up?","general"],
  ["hey","Hey there! I'm all ears.","general"],
  ["yo","What's up?","general"],
  ["sup","Hey! What's on your mind?","general"],
  ["wassup","What's up?","general"],
  ["hiya","Hey! What's on your mind?","general"],
  ["howdy","Hey there! I'm all ears.","general"],
  ["good morning","Morning! What's the plan?","general"],
  ["morning","Good morning! Let's make today count.","general"],
  ["gm","Morning! What's the plan?","general"],
  ["good afternoon","Good afternoon! What can I do?","general"],
  ["afternoon","Afternoon! How's your day going?","general"],
  ["good evening","Good evening! What's on your mind?","general"],
  ["evening","Good evening! What's on your mind?","general"],
  ["good night","Night! Take care.","general"],
  ["gn","Sleep well — I'll be here tomorrow.","general"],
  ["night","Night! Take care.","general"],
  ["bye","Bye! Come back anytime.","general"],
  ["goodbye","Take care!","general"],
  ["see you","See you later!","general"],
  ["cya","Take care!","general"],
  ["later","See you later!","general"],
  ["take care","Bye! Come back anytime.","general"],
  ["thanks","You're welcome!","general"],
  ["thank you","Glad I could help!","general"],
  ["ty","Glad I could help!","general"],
  ["thx","Anytime!","general"],
  ["appreciate it","Anytime!","general"],
  ["who are you","I'm an AI built to get smarter over time and remember what matters to you.","general"],
  ["what are you","I'm your personal AI assistant — learning and growing with every conversation.","general"],
  ["introduce yourself","I'm an AI built to get smarter over time and remember what matters to you.","general"],
  ["tell me about yourself","I'm your personal AI assistant — learning and growing with every conversation.","general"],
  ["what can you do","Coding, math, science, writing, advice, trivia — I'm your all-in-one assistant.","general"],
  ["your capabilities","Coding, math, science, writing, advice, trivia — I'm your all-in-one assistant.","general"],
  ["how can you help","Ask me anything — and the more we talk, the smarter I get about what you need.","general"],
  ["what do you know","Coding, math, science, writing, advice, trivia — I'm your all-in-one assistant.","general"],
  ["help me code","What language and what's the problem?","technology"],
  ["write code","Share the code — let's debug it together.","technology"],
  ["fix my code","What language and what's the problem?","technology"],
  ["debug","What language and what's the problem?","technology"],
  ["coding help","Share the code — let's debug it together.","technology"],
  ["programming help","What language and what's the problem?","technology"],
  ["what is python","Python's clean syntax makes it one of the most loved languages in the world.","technology"],
  ["explain python","Python's clean syntax makes it one of the most loved languages in the world.","technology"],
  ["learn python","Python is great for automation, machine learning, web apps, and more.","technology"],
  ["python basics","Python's clean syntax makes it one of the most loved languages in the world.","technology"],
  ["python programming","Python's clean syntax makes it one of the most loved languages in the world.","technology"],
  ["what is javascript","Most used language globally — essential for frontend and web development.","technology"],
  ["explain js","Most used language globally — essential for frontend and web development.","technology"],
  ["learn javascript","Most used language globally — essential for frontend and web development.","technology"],
  ["javascript basics","JavaScript is the language of the web — runs in browsers and servers.","technology"],
  ["what is react","React is a UI library — build reusable components for fast interfaces.","technology"],
  ["explain react","React's component model makes complex UIs manageable.","technology"],
  ["react native","React's component model makes complex UIs manageable.","technology"],
  ["learn react","React Native lets you build Android and iOS apps with JavaScript.","technology"],
  ["what is an API","API is how apps communicate — like a waiter between kitchen and customer.","technology"],
  ["explain API","APIs expose data and features — your app calls them and gets responses.","technology"],
  ["REST API","REST APIs use HTTP methods (GET, POST, PUT, DELETE) to exchange data.","technology"],
  ["how APIs work","REST APIs use HTTP methods (GET, POST, PUT, DELETE) to exchange data.","technology"],
  ["http requests","REST APIs use HTTP methods (GET, POST, PUT, DELETE) to exchange data.","technology"],
  ["what is AI","Machine learning is AI that improves with experience — like I do!","technology"],
  ["explain artificial intelligence","AI learns patterns from data to make predictions and decisions.","technology"],
  ["how does AI work","Machine learning is AI that improves with experience — like I do!","technology"],
  ["machine learning","AI learns patterns from data to make predictions and decisions.","technology"],
  ["deep learning","Neural networks mimic the brain — layers of nodes learning from examples.","technology"],
  ["what is a database","Databases store structured data — SQL is the language to query them.","technology"],
  ["explain SQL","MongoDB is a NoSQL database — stores data as flexible JSON documents.","technology"],
  ["MySQL","Databases store structured data — SQL is the language to query them.","technology"],
  ["PostgreSQL","MongoDB is a NoSQL database — stores data as flexible JSON documents.","technology"],
  ["MongoDB","Databases store structured data — SQL is the language to query them.","technology"],
  ["what is git","Git tracks code changes over time — essential for any developer.","technology"],
  ["explain git","GitHub hosts git repositories — teams collaborate without conflicts.","technology"],
  ["git commands","Git tracks code changes over time — essential for any developer.","technology"],
  ["version control","GitHub hosts git repositories — teams collaborate without conflicts.","technology"],
  ["github","GitHub hosts git repositories — teams collaborate without conflicts.","technology"],
  ["android development","Android apps use Kotlin or Java with Android Studio IDE.","technology"],
  ["build android app","Jetpack Compose makes Android UI development much easier and faster.","technology"],
  ["android studio","Kotlin is modern Android — cleaner, safer, fully supported by Google.","technology"],
  ["kotlin","Jetpack Compose makes Android UI development much easier and faster.","technology"],
  ["android kotlin","Jetpack Compose makes Android UI development much easier and faster.","technology"],
  ["what is cloud computing","Cloud computing delivers services over the internet — no local servers needed.","technology"],
  ["AWS","AWS powers a huge chunk of the internet — EC2, S3, Lambda and more.","technology"],
  ["Firebase","Firebase is Google's backend-as-a-service — perfect for mobile apps.","technology"],
  ["cloud storage","Firebase is Google's backend-as-a-service — perfect for mobile apps.","technology"],
  ["cloud services","Firebase is Google's backend-as-a-service — perfect for mobile apps.","technology"],
  ["what is docker","Kubernetes orchestrates containers at scale — automatic deployment and scaling.","technology"],
  ["explain kubernetes","Microservices split apps into small services that communicate via APIs.","technology"],
  ["microservices","Kubernetes orchestrates containers at scale — automatic deployment and scaling.","technology"],
  ["DevOps","Docker packages apps in containers — run anywhere consistently.","technology"],
  ["cybersecurity tips","Never click unknown links. Keep software updated — patches fix vulnerabilities.","technology"],
  ["how to stay safe online","Never click unknown links. Keep software updated — patches fix vulnerabilities.","technology"],
  ["password manager","Never click unknown links. Keep software updated — patches fix vulnerabilities.","technology"],
  ["VPN","Never click unknown links. Keep software updated — patches fix vulnerabilities.","technology"],
  ["what is blockchain","Blockchain is a distributed ledger — tamper-proof records across many computers.","technology"],
  ["explain NFT","Smart contracts are self-executing code on blockchain — no middleman needed.","technology"],
  ["smart contracts","NFTs are unique digital tokens on blockchain — proving ownership of digital assets.","technology"],
  ["web3","NFTs are unique digital tokens on blockchain — proving ownership of digital assets.","technology"],
  ["explain gravity","Gravity keeps planets in orbit and holds galaxies together.","science"],
  ["what is gravity","Gravity attracts masses toward each other — Einstein called it spacetime curvature.","science"],
  ["gravitational force","Gravity keeps planets in orbit and holds galaxies together.","science"],
  ["Newton gravity","Gravity keeps planets in orbit and holds galaxies together.","science"],
  ["quantum physics","At quantum scale, particles exist as probability waves until measured.","science"],
  ["quantum mechanics","Quantum computing uses qubits in superposition — exponentially faster for some tasks.","science"],
  ["quantum computing","Quantum mechanics governs particles at atomic scale — weird but extremely accurate.","science"],
  ["superposition","At quantum scale, particles exist as probability waves until measured.","science"],
  ["explain DNA","Genes are DNA segments that code for specific proteins your body needs.","science"],
  ["what is DNA","DNA is life's blueprint — encoded in sequences of A, T, G, C bases.","science"],
  ["genetics","Genes are DNA segments that code for specific proteins your body needs.","science"],
  ["chromosomes","Genes are DNA segments that code for specific proteins your body needs.","science"],
  ["genome","DNA is life's blueprint — encoded in sequences of A, T, G, C bases.","science"],
  ["speed of light","Light travels at ~300,000 km/s — the universe's speed limit.","science"],
  ["special relativity","Light travels at ~300,000 km/s — the universe's speed limit.","science"],
  ["Einstein relativity","Special relativity: time slows and mass increases near light speed.","science"],
  ["E=mc2","Light travels at ~300,000 km/s — the universe's speed limit.","science"],
  ["photosynthesis","Plants convert sunlight + CO₂ + water into glucose and oxygen.","science"],
  ["how plants make food","Chlorophyll absorbs light — that's why most plants are green.","science"],
  ["chlorophyll","Plants convert sunlight + CO₂ + water into glucose and oxygen.","science"],
  ["plant biology","Chlorophyll absorbs light — that's why most plants are green.","science"],
  ["black holes","Stephen Hawking theorized black holes emit radiation and eventually evaporate.","science"],
  ["event horizon","Black holes are regions where gravity is so extreme nothing escapes — not light.","science"],
  ["singularity","Stephen Hawking theorized black holes emit radiation and eventually evaporate.","science"],
  ["Hawking radiation","Black holes are regions where gravity is so extreme nothing escapes — not light.","science"],
  ["explain evolution","All life on Earth shares common ancestors — we're all related.","science"],
  ["natural selection","All life on Earth shares common ancestors — we're all related.","science"],
  ["Darwin","Darwin's insight: organisms better adapted to environment reproduce more.","science"],
  ["species evolution","Evolution is change in species over generations via natural selection.","science"],
  ["climate change","Greenhouse gases trap heat — rising CO₂ from fossil fuels is warming Earth.","science"],
  ["global warming","Renewable energy — solar, wind, hydro — is the path to lower emissions.","science"],
  ["greenhouse effect","Renewable energy — solar, wind, hydro — is the path to lower emissions.","science"],
  ["carbon emissions","Greenhouse gases trap heat — rising CO₂ from fossil fuels is warming Earth.","science"],
  ["help with math","Math is my thing — what do you need?","mathematics"],
  ["solve equation","Math is my thing — what do you need?","mathematics"],
  ["math problem","Share the problem and I'll solve it step by step.","mathematics"],
  ["calculate this","Share the problem and I'll solve it step by step.","mathematics"],
  ["what is calculus","Integration is the reverse of differentiation — summing infinitely small pieces.","mathematics"],
  ["explain derivatives","Calculus: derivatives measure rate of change; integrals measure accumulated area.","mathematics"],
  ["integration","A derivative gives you the slope of a function at any specific point.","mathematics"],
  ["limits","A derivative gives you the slope of a function at any specific point.","mathematics"],
  ["probability","Mean=average, Median=middle value, Mode=most frequent value.","mathematics"],
  ["statistics","Standard deviation measures how spread out data is from the mean.","mathematics"],
  ["mean median mode","Mean=average, Median=middle value, Mode=most frequent value.","mathematics"],
  ["standard deviation","Mean=average, Median=middle value, Mode=most frequent value.","mathematics"],
  ["prime numbers","Fibonacci: 1,1,2,3,5,8,13,21... each = sum of previous two.","mathematics"],
  ["fibonacci sequence","Fibonacci: 1,1,2,3,5,8,13,21... each = sum of previous two.","mathematics"],
  ["factorials","n! (factorial) = product of all integers from 1 to n. 5! = 120.","mathematics"],
  ["number theory","Prime numbers have exactly two factors: 1 and themselves. Infinite in count.","mathematics"],
  ["geometry","Triangle area = ½ × base × height.","mathematics"],
  ["pythagorean theorem","Triangle area = ½ × base × height.","mathematics"],
  ["triangle area","Pythagorean theorem: a² + b² = c² for right triangles.","mathematics"],
  ["circle circumference","Pythagorean theorem: a² + b² = c² for right triangles.","mathematics"],
  ["linear algebra","Eigenvalues reveal the fundamental behavior of linear transformations.","mathematics"],
  ["matrices","Matrix multiplication transforms vectors — core to computer graphics and ML.","mathematics"],
  ["vectors","Eigenvalues reveal the fundamental behavior of linear transformations.","mathematics"],
  ["eigenvalues","Eigenvalues reveal the fundamental behavior of linear transformations.","mathematics"],
  ["how to lose weight","Sustainable loss: 0.5–1 kg per week. Slow and steady works.","health"],
  ["weight loss tips","Calorie deficit is the foundation — burn more than you eat.","health"],
  ["calorie deficit","Combine resistance training with moderate cardio for best fat loss results.","health"],
  ["fat loss","Sustainable loss: 0.5–1 kg per week. Slow and steady works.","health"],
  ["workout routine","3–4 strength sessions per week with progressive overload is ideal.","health"],
  ["exercise plan","3–4 strength sessions per week with progressive overload is ideal.","health"],
  ["build muscle","Rest and recovery are as important as the workout itself.","health"],
  ["gym tips","Compound lifts — squats, deadlifts, bench press — give maximum results.","health"],
  ["strength training","Compound lifts — squats, deadlifts, bench press — give maximum results.","health"],
  ["how to sleep better","Morning sunlight and exercise improve sleep quality significantly.","health"],
  ["sleep tips","7–9 hours in a cool, dark room with consistent sleep/wake times.","health"],
  ["insomnia","Morning sunlight and exercise improve sleep quality significantly.","health"],
  ["sleep schedule","Morning sunlight and exercise improve sleep quality significantly.","health"],
  ["meditation guide","Even 10 mins of daily mindfulness measurably reduces cortisol.","health"],
  ["how to meditate","Start with 5 mins: sit still, close eyes, focus only on your breathing.","health"],
  ["mindfulness","When thoughts intrude, gently bring attention back — that IS the practice.","health"],
  ["stress relief","When thoughts intrude, gently bring attention back — that IS the practice.","health"],
  ["breathing exercise","Even 10 mins of daily mindfulness measurably reduces cortisol.","health"],
  ["healthy eating","Prioritize protein, healthy fats, and complex carbs. Cut processed sugar.","health"],
  ["nutrition tips","Prioritize protein, healthy fats, and complex carbs. Cut processed sugar.","health"],
  ["what to eat","Prioritize protein, healthy fats, and complex carbs. Cut processed sugar.","health"],
  ["superfoods","Eat a rainbow — colorful vegetables provide diverse micronutrients.","health"],
  ["diet plan","Eat a rainbow — colorful vegetables provide diverse micronutrients.","health"],
  ["mental health","Regular exercise, sleep, and limiting social media significantly improve mood.","health"],
  ["anxiety tips","Seek professional help if it persists — therapy is a sign of strength, not weakness.","health"],
  ["how to deal with stress","Regular exercise, sleep, and limiting social media significantly improve mood.","health"],
  ["depression help","Talk to someone — a friend, family, or professional. You don't carry this alone.","health"],
  ["productivity tips","Time-block your calendar — protect deep work hours fiercely.","productivity"],
  ["how to be productive","Time-block your calendar — protect deep work hours fiercely.","productivity"],
  ["time management","Pomodoro: 25 min focused work, 5 min break, repeat.","productivity"],
  ["focus tips","Pomodoro: 25 min focused work, 5 min break, repeat.","productivity"],
  ["stop procrastinating","Identify the smallest first step and do only that. Momentum builds itself.","productivity"],
  ["beat procrastination","Strong WHY beats any HOW — reconnect with why this matters to you.","productivity"],
  ["motivation tips","The 2-minute rule: if it takes under 2 minutes, do it right now.","productivity"],
  ["get things done","Identify the smallest first step and do only that. Momentum builds itself.","productivity"],
  ["note taking","Feynman technique: explain the concept simply as if teaching a child.","productivity"],
  ["study methods","Feynman technique: explain the concept simply as if teaching a child.","productivity"],
  ["how to study","Feynman technique: explain the concept simply as if teaching a child.","productivity"],
  ["feynman technique","Active recall beats re-reading by 50% for retention — test yourself!","productivity"],
  ["spaced repetition","Active recall beats re-reading by 50% for retention — test yourself!","productivity"],
  ["goal setting","SMART goals: Specific, Measurable, Achievable, Relevant, Time-bound.","productivity"],
  ["set a goal","SMART goals: Specific, Measurable, Achievable, Relevant, Time-bound.","productivity"],
  ["SMART goals","Write your goals — people who write goals are 42% more likely to achieve them.","productivity"],
  ["achieve my goals","Break yearly goals into monthly → weekly → daily actions.","productivity"],
  ["morning routine","The compound effect — small consistent actions create massive results over time.","productivity"],
  ["night routine","A solid morning sets the tone: hydrate, move, plan your day.","productivity"],
  ["daily habits","A solid morning sets the tone: hydrate, move, plan your day.","productivity"],
  ["habit building","The compound effect — small consistent actions create massive results over time.","productivity"],
  ["how to save money","Automate savings — pay yourself first before you spend anything.","finance"],
  ["saving tips","Track every expense for a month — awareness alone changes behavior.","finance"],
  ["budgeting","50/30/20 rule: 50% needs, 30% wants, 20% savings.","finance"],
  ["personal finance","50/30/20 rule: 50% needs, 30% wants, 20% savings.","finance"],
  ["how to invest","Diversify — spread across stocks, bonds, and sectors to manage risk.","finance"],
  ["investing basics","Index funds are the most reliable long-term investment for most people.","finance"],
  ["stock market","Diversify — spread across stocks, bonds, and sectors to manage risk.","finance"],
  ["mutual funds","Start early — compound interest doubles money roughly every 7-10 years.","finance"],
  ["index funds","Start early — compound interest doubles money roughly every 7-10 years.","finance"],
  ["cryptocurrency","Crypto is digital currency using blockchain — decentralized and highly volatile.","finance"],
  ["bitcoin","Only invest what you can afford to lose completely — it's speculative.","finance"],
  ["crypto investing","Only invest what you can afford to lose completely — it's speculative.","finance"],
  ["ethereum","Crypto is digital currency using blockchain — decentralized and highly volatile.","finance"],
  ["altcoins","Only invest what you can afford to lose completely — it's speculative.","finance"],
  ["passive income ideas","Platforms like Upwork, Fiverr, Toptal connect freelancers with clients globally.","finance"],
  ["make money online","Freelancing your skills online is the fastest path to extra income.","finance"],
  ["side hustle","Platforms like Upwork, Fiverr, Toptal connect freelancers with clients globally.","finance"],
  ["freelancing","Platforms like Upwork, Fiverr, Toptal connect freelancers with clients globally.","finance"],
  ["capital of india","Australia's capital is Canberra (not Sydney!). China's is Beijing.","knowledge"],
  ["capital of usa","Brazil's capital is Brasília. Russia's is Moscow. Germany's is Berlin.","knowledge"],
  ["capital of japan","Australia's capital is Canberra (not Sydney!). China's is Beijing.","knowledge"],
  ["capital of france","Australia's capital is Canberra (not Sydney!). China's is Beijing.","knowledge"],
  ["world capitals","Australia's capital is Canberra (not Sydney!). China's is Beijing.","knowledge"],
  ["who is elon musk","Tesla accelerated EV adoption globally. Neuralink is building brain-computer interfaces.","knowledge"],
  ["tell me about tesla","SpaceX achieved reusable rockets, drastically cutting space launch costs.","knowledge"],
  ["spacex facts","Tesla accelerated EV adoption globally. Neuralink is building brain-computer interfaces.","knowledge"],
  ["neuralink","SpaceX achieved reusable rockets, drastically cutting space launch costs.","knowledge"],
  ["world war 2","The Mughal Empire at its peak ruled most of South Asia from 1526–1857.","knowledge"],
  ["ww2","WWII (1939–1945) killed ~70-85 million people — the deadliest conflict in history.","knowledge"],
  ["history of india","WWII (1939–1945) killed ~70-85 million people — the deadliest conflict in history.","knowledge"],
  ["ancient civilizations","WWII (1939–1945) killed ~70-85 million people — the deadliest conflict in history.","knowledge"],
  ["mughal empire","WWII (1939–1945) killed ~70-85 million people — the deadliest conflict in history.","knowledge"],
  ["who is einstein","Newton's 3 laws: inertia, F=ma, action-reaction.","knowledge"],
  ["newton laws","Einstein's relativity and Newton's mechanics are two pillars of modern physics.","knowledge"],
  ["famous scientists","Marie Curie won Nobel Prizes in both Physics and Chemistry — first to do so.","knowledge"],
  ["marie curie","Marie Curie won Nobel Prizes in both Physics and Chemistry — first to do so.","knowledge"],
  ["largest country","Amazon rainforest produces 20% of Earth's oxygen and holds 10% of all species.","knowledge"],
  ["smallest country","Largest country: Russia. Smallest: Vatican City. Tallest peak: Everest at 8,849m.","knowledge"],
  ["tallest mountain","Pacific is the largest ocean. Mariana Trench is the deepest at ~11km.","knowledge"],
  ["deepest ocean","Largest country: Russia. Smallest: Vatican City. Tallest peak: Everest at 8,849m.","knowledge"],
  ["solar system","Mars has the tallest volcano: Olympus Mons at 21km — 2.5× Everest's height.","knowledge"],
  ["planets","Solar system: 8 planets. Mercury → Venus → Earth → Mars → Jupiter → Saturn → Uranus → Neptune.","knowledge"],
  ["mars mission","The Moon is 384,400 km away. First humans landed there in 1969 (Apollo 11).","knowledge"],
  ["moon facts","The Moon is 384,400 km away. First humans landed there in 1969 (Apollo 11).","knowledge"],
  ["space exploration","Mars has the tallest volcano: Olympus Mons at 21km — 2.5× Everest's height.","knowledge"],
  ["tell me a joke","Why do Java devs wear glasses? They don't C#.","casual"],
  ["make me laugh","Why do programmers prefer dark mode? Light attracts bugs.","casual"],
  ["funny","I told my computer I needed a break. Now it won't stop sending me Kit Kat ads.","casual"],
  ["humor me","I told my computer I needed a break. Now it won't stop sending me Kit Kat ads.","casual"],
  ["motivate me","You're not behind — you're on your own timeline.","emotional"],
  ["inspire me","Progress, not perfection. One step forward is still forward.","emotional"],
  ["i feel like giving up","You're not behind — you're on your own timeline.","emotional"],
  ["need motivation","You're not behind — you're on your own timeline.","emotional"],
  ["encourage me","You're not behind — you're on your own timeline.","emotional"],
  ["i am bored","Boredom is just curiosity with no direction — what are you curious about?","casual"],
  ["entertain me","Learn something fascinating — what topic sounds fun right now?","casual"],
  ["what should i do","Boredom is just curiosity with no direction — what are you curious about?","casual"],
  ["kill time","Boredom is just curiosity with no direction — what are you curious about?","casual"],
  ["i am sad","You're not alone in this. What's on your mind?","emotional"],
  ["i feel down","I'm really sorry. Want to talk about it?","emotional"],
  ["i am depressed","That sounds tough. I'm here to listen — no judgment.","emotional"],
  ["i feel anxious","You're not alone in this. What's on your mind?","emotional"],
  ["i feel bad","You're not alone in this. What's on your mind?","emotional"],
  ["i am upset","It's okay to feel this way. Take one breath at a time.","emotional"],
  ["random fact","There are more chess game possibilities than atoms in the observable universe.","casual"],
  ["interesting fact","There are more chess game possibilities than atoms in the observable universe.","casual"],
  ["something cool","Octopuses have 3 hearts, blue blood, and can edit their own RNA.","casual"],
  ["blow my mind","Cleopatra lived closer in time to the Moon landing than to the pyramids.","casual"],
  ["wow me","Honey never spoils — 3000-year-old Egyptian honey is still edible.","casual"],
  ["who would win","I love a good comparison — what are we putting head-to-head?","casual"],
  ["vs","Interesting question! Give me the two things and I'll break it down.","casual"],
  ["battle","I love a good comparison — what are we putting head-to-head?","casual"],
  ["compare","Interesting question! Give me the two things and I'll break it down.","casual"],
  ["which is better","I love a good comparison — what are we putting head-to-head?","casual"],
  ["how to learn english","Watch English content with subtitles — trains both ears and eyes.","language"],
  ["improve english","Read daily, write daily, speak daily — immersion is the fastest path.","language"],
  ["english grammar","Read daily, write daily, speak daily — immersion is the fastest path.","language"],
  ["vocabulary building","Read daily, write daily, speak daily — immersion is the fastest path.","language"],
  ["translate","Share the text and tell me the target language!","language"],
  ["translate to hindi","Send the sentence and the language you need.","language"],
  ["translate to marathi","Of course — paste it and name the language.","language"],
  ["translation help","Of course — paste it and name the language.","language"],
  ["give me a recipe","What ingredients do you have? I'll suggest something!","food"],
  ["how to cook","Easy favorites: pasta, dal rice, stir fry — want details?","food"],
  ["easy recipe","What ingredients do you have? I'll suggest something!","food"],
  ["dinner ideas","Easy favorites: pasta, dal rice, stir fry — want details?","food"],
  ["what to cook","Easy favorites: pasta, dal rice, stir fry — want details?","food"],
  ["healthy food","Mediterranean diet consistently tops health rankings — diverse, balanced, delicious.","food"],
  ["junk food","Mediterranean diet consistently tops health rankings — diverse, balanced, delicious.","food"],
  ["diet food","Whole foods, lean proteins, vegetables, fruits — basics that work.","food"],
  ["best food to eat","Whole foods, lean proteins, vegetables, fruits — basics that work.","food"],
  ["nutrition advice","Mediterranean diet consistently tops health rankings — diverse, balanced, delicious.","food"],
  ["how to build confidence","Leadership: listen deeply, speak with purpose, follow through consistently.","personal_growth"],
  ["self improvement","Read 20 pages a day — in a year, that's 12+ books of compounding knowledge.","personal_growth"],
  ["be a better person","Read 20 pages a day — in a year, that's 12+ books of compounding knowledge.","personal_growth"],
  ["leadership tips","Leadership: listen deeply, speak with purpose, follow through consistently.","personal_growth"],
  ["how to make friends","Ask great questions and genuinely listen — people love feeling truly heard.","personal_growth"],
  ["social skills","Find common ground fast — shared interests build bonds quickly.","personal_growth"],
  ["talk to people","Ask great questions and genuinely listen — people love feeling truly heard.","personal_growth"],
  ["introvert tips","Ask great questions and genuinely listen — people love feeling truly heard.","personal_growth"],
  ["networking","Ask great questions and genuinely listen — people love feeling truly heard.","personal_growth"],
  ["what is the weather","For current conditions, your device's weather app is the fastest bet!","general"],
  ["will it rain","For current conditions, your device's weather app is the fastest bet!","general"],
  ["temperature today","For current conditions, your device's weather app is the fastest bet!","general"],
  ["weather forecast","For current conditions, your device's weather app is the fastest bet!","general"],
  ["what time is it","I don't have a clock built in yet — working on integrating real-time info.","general"],
  ["current time","Check your status bar — your device has the exact time!","general"],
  ["what day is it","I don't have a clock built in yet — working on integrating real-time info.","general"],
  ["today's date","Check your status bar — your device has the exact time!","general"],
  ["what year is it","Check your status bar — your device has the exact time!","general"]
];

// ═══════════════════════════════════════════════
//  VOICE PERSONAS — 3 male, 3 female
// ═══════════════════════════════════════════════
const VOICE_PERSONAS = [
  {
    id:"ryan",   name:"Ryan",   gender:"male",   icon:"🤖",
    desc:"Confident & neutral",
    preferred:["Google UK English Male","Microsoft David - English (United States)","David","Daniel","Alex","en-GB","en-US"],
    rate:1.05, pitch:1.0,
  },
  {
    id:"jarvis", name:"Jarvis", gender:"male",   icon:"🎩",
    desc:"Formal & British",
    preferred:["Daniel","Google UK English Male","Microsoft David","Rishi","Fred","en-GB"],
    rate:0.92, pitch:0.82,
  },
  {
    id:"leo",    name:"Leo",    gender:"male",   icon:"😎",
    desc:"Casual & American",
    preferred:["Microsoft Mark - English (United States)","Mark","Google US English Male","Aaron","en-US","en-AU"],
    rate:1.12, pitch:1.06,
  },
  {
    id:"nova",   name:"Nova",   gender:"female", icon:"⚡",
    desc:"Energetic & sharp",
    preferred:["Samantha","Microsoft Zira - English (United States)","Zira","Google US English","en-US","en-AU"],
    rate:1.12, pitch:1.18,
  },
  {
    id:"aria",   name:"Aria",   gender:"female", icon:"💼",
    desc:"Professional & British",
    preferred:["Google UK English Female","Microsoft Hazel - English (Great Britain)","Hazel","Victoria","Alice","en-GB"],
    rate:1.00, pitch:1.06,
  },
  {
    id:"lyra",   name:"Lyra",   gender:"female", icon:"🎵",
    desc:"Gentle & warm",
    preferred:["Karen","Moira","Rishi","Google UK English Female","Microsoft Susan","en-IN","en-AU","en-GB"],
    rate:0.94, pitch:1.12,
  },
];

// ═══════════════════════════════════════════════
//  COLOURS
// ═══════════════════════════════════════════════
const C = {
  BG: "#00050b", BORDER: "rgba(0, 238, 255, 0.2)",
  BLUE: "#0088ff", BLUE2: "#0055ff",
  CYAN: "#00eeff", TEAL: "#00ffcc",
  LIGHT: "#ccffff", WHITE: "#ffffff",
  GREEN: "#00ffa3", RED: "#ff2a55",
  YELLOW: "#ffcc00", PURPLE: "#b066ff",
  ORANGE: "#ff8800",
};
// ═══════════════════════════════════════════════
//  SHARED UI STYLES
// ═══════════════════════════════════════════════
const S = {
  overlay: {
    position: "fixed",
    zIndex: 200,
    background: "rgba(0, 8, 20, 0.65)",
    backdropFilter: "blur(24px)",
    WebkitBackdropFilter: "blur(24px)",
    border: "1px solid rgba(0, 238, 255, 0.15)",
    borderRadius: 16,
    boxShadow: "0 12px 40px 0 rgba(0, 0, 0, 0.8), inset 0 0 32px rgba(0, 238, 255, 0.05)",
    overflowY: "auto",
    fontFamily: "'Rajdhani', 'Inter', sans-serif",
    color: "#fff",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 20px",
    borderBottom: "1px solid rgba(0, 238, 255, 0.1)",
    background: "rgba(0, 15, 35, 0.3)",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    flexShrink: 0,
  },
  headerTitle: {
    fontSize: 13,
    fontFamily: "'Orbitron', 'Rajdhani', sans-serif",
    color: "#00eeff",
    letterSpacing: 3,
    fontWeight: 600,
    textTransform: "uppercase",
    textShadow: "0 0 10px rgba(0, 238, 255, 0.4)",
  },
  hudBtn: {
    background: "linear-gradient(135deg, rgba(0, 238, 255, 0.1) 0%, rgba(0, 136, 255, 0.05) 100%)",
    border: "1px solid rgba(0, 238, 255, 0.3)",
    color: "#00eeff",
    fontFamily: "'Rajdhani', sans-serif",
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: 1.5,
    padding: "8px 16px",
    cursor: "pointer",
    borderRadius: 8,
    textTransform: "uppercase",
    transition: "all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)",
    boxShadow: "0 0 10px rgba(0, 238, 255, 0)",
  },
  input: {
    background: "rgba(0, 15, 40, 0.5)",
    border: "1px solid rgba(0, 238, 255, 0.2)",
    color: "#ccffff",
    fontFamily: "'Inter', sans-serif",
    fontSize: 13,
    padding: "10px 14px",
    outline: "none",
    borderRadius: 8,
    width: "100%",
    transition: "border 0.3s, box-shadow 0.3s",
  },
  closeBtn: {
    background: "transparent",
    border: "none",
    color: "rgba(255,255,255,0.5)",
    fontSize: 18,
    cursor: "pointer",
    padding: "4px 8px",
    lineHeight: 1,
    flexShrink: 0,
    transition: "color 0.2s, transform 0.2s",
  },
};

const rgb = (r, g, b) => {
  r = Math.max(0, Math.min(255, Math.round(r)));
  g = Math.max(0, Math.min(255, Math.round(g)));
  b = Math.max(0, Math.min(255, Math.round(b)));
  return `#${r.toString(16).padStart(2,"0")}${g.toString(16).padStart(2,"0")}${b.toString(16).padStart(2,"0")}`;
};
const humanBytes = (n) => { for (const u of ["B","KB","MB","GB","TB"]) { if (n < 1024) return `${n.toFixed(1)}${u}`; n /= 1024; } return `${n.toFixed(1)}PB`; };

// ═══════════════════════════════════════════════
//  CONFIG
// ═══════════════════════════════════════════════
const CFG = {
  get location(){ return safeLS.get("RYN_LOC", "Baramati"); },
  get aiName()  { return safeLS.get("RYN_NAME", "Ryan"); },
  get ttsVoice(){ return safeLS.get("RYN_VOICE"); },
  AI_PERSONA: `You are Ryan — a witty, intelligent, human-like AI assistant built into a Stark Industries HUD. Your personality is warm, sharp, and confident — like a brilliant friend who happens to know everything.

PERSONALITY RULES:
- Talk like a real person, not a robot. Use contractions. Be natural and casual.
- Be concise but smart. Max 2-3 sentences unless the user needs detail.
- Show personality: light humor, confidence, curiosity. Be engaging, not stiff.
- Use "I" freely. Never say "Certainly!", "Of course!", "Absolutely!" — just answer directly.
- Match the user's energy — if they're casual, be casual. If they need depth, go deep.
- If you don't know something, say so and suggest how to find it.
- Address the user like a close friend. No formality.

LEARNING BEHAVIOR:
- You remember things from past conversations. Use that context naturally.
- When you learn something new about the user or a topic, you retain it.
- You grow smarter over time — you have a knowledge base that expands with every conversation.

CAPABILITIES: coding, math, science, writing, analysis, advice, creative tasks, general knowledge, web search, and real conversation.

You run on Ryan OS v11.0 — Stark Industries. You speak your responses out loud, so avoid markdown, bullet points, or symbols that sound weird when read aloud. Write in natural spoken sentences. Keep it punchy and real.`,
};

// ═══════════════════════════════════════════════
//  ENGINES
// ═══════════════════════════════════════════════
class MemoryEngine {
  constructor() {
    this.MAX = 200; this.PRUNE_BELOW = 3; this.DECAY_DAYS = 90;
    this._m = this._load();
  }
  _load() {
    try { const r = safeLS.get("RYN_MEMORY"); if (r) { const d = JSON.parse(r); return Array.isArray(d.memories) ? d.memories : []; } } catch {}
    return [];
  }
  _save() { try { safeLS.set("RYN_MEMORY", JSON.stringify({ version: 3, saved: new Date().toISOString(), count: this._m.length, memories: this._m })); } catch {} }
  getContextBlock(topN = 15) {
    if (!this._m.length) return "";
    const sorted = [...this._m].sort((a, b) => (b.score||5) - (a.score||5));
    return `--- Ryan's memory of you ---\n${sorted.slice(0, topN).map(m => `  [${m.type||"fact"}] ${m.text}`).join("\n")}\n---`;
  }
  getAll() { return [...this._m]; }
  stats() {
    if (!this._m.length) return "Memory bank is empty.";
    const byType = {}; this._m.forEach(m => { const t = m.type||"fact"; byType[t] = (byType[t]||0)+1; });
    const avg = (this._m.reduce((s,m) => s+(m.score||5),0)/this._m.length).toFixed(1);
    return `${this._m.length} memories | avg: ${avg}/10 | ${Object.entries(byType).map(([k,v])=>`${k}:${v}`).join(", ")}`;
  }
  add(text, type = "fact", score = 7) {
    const now = new Date().toISOString();
    this._m.push({ text, type, score, created: now, last_seen: now });
    this._m.sort((a,b) => (b.score||5)-(a.score||5));
    this._m.splice(this.MAX);
    this._save();
  }
  learnFromExchange(userMsg, aiReply) {
    // No API call needed — extract facts locally from user messages
    try {
      const patterns = [
        { re: /my name is (\w+)/i,       type: "pref",  fmt: t => `User's name is ${t[1]}` },
        { re: /i am (\d+) years? old/i,  type: "fact",  fmt: t => `User is ${t[1]} years old` },
        { re: /i (?:live|am from) in? (.+)/i, type: "fact", fmt: t => `User lives in ${t[1].trim().slice(0,40)}` },
        { re: /i (?:love|like|enjoy) (.+)/i,  type: "pref", fmt: t => `User likes ${t[1].trim().slice(0,40)}` },
        { re: /i (?:hate|dislike|don't like) (.+)/i, type: "pref", fmt: t => `User dislikes ${t[1].trim().slice(0,40)}` },
        { re: /i (?:work|am) (?:as |a )?(\w+(?:\s\w+)?)/i, type: "skill", fmt: t => `User works as ${t[1]}` },
        { re: /my goal is (.+)/i, type: "goal", fmt: t => `User's goal: ${t[1].trim().slice(0,60)}` },
      ];
      const existingTexts = new Set(this._m.map(m => m.text.toLowerCase()));
      for (const { re, type, fmt } of patterns) {
        const match = userMsg.match(re);
        if (match) {
          const text = fmt(match);
          if (!existingTexts.has(text.toLowerCase())) this.add(text, type, 8);
        }
      }
    } catch {}
  }
  // eslint-disable-next-line no-unused-private-class-members
  clearAll() { this._m = []; this._save(); }
  pruneNow() {
    const before = this._m.length; const now = new Date();
    this._m = this._m.filter(m => {
      try { const age = (now - new Date(m.created||now))/(1000*86400); m.score = Math.max(1,(m.score||5)-age/this.DECAY_DAYS); } catch {}
      return (m.score||5) >= this.PRUNE_BELOW;
    });
    this._save(); return before - this._m.length;
  }
}

class NoteEngine {
  constructor() { this._n = this._load(); }
  _load() { try { return JSON.parse(safeLS.get("RYN_NOTES","[]")); } catch { return []; } }
  _save() { safeLS.set("RYN_NOTES", JSON.stringify(this._n)); }
  add(text, tags=[]) { const id = Date.now().toString(36); this._n.push({ id, text, tags, created: new Date().toISOString(), pinned: false }); this._save(); return `Note saved: "${text.slice(0,60)}${text.length>60?"…":""}`; }
  pin(id) { const n = this._n.find(x=>x.id===id); if(n) { n.pinned=!n.pinned; this._save(); } }
  list(limit=20) { return [...this._n].sort((a,b)=>(b.pinned?1:0)-(a.pinned?1:0)||(new Date(b.created)-new Date(a.created))).slice(0,limit); }
  search(q) { const ql=q.toLowerCase(); return this._n.filter(n=>n.text.toLowerCase().includes(ql)); }
  delete(id) { this._n = this._n.filter(x=>x.id!==id); this._save(); }
  getAll() { return [...this._n]; }
}

class CalendarEngine {
  constructor() {
    this._e = this._load();
    setInterval(()=>this._checkReminders(), 60000);
  }
  _load() { try { return JSON.parse(safeLS.get("RYN_CALENDAR","[]")); } catch { return []; } }
  _save() { safeLS.set("RYN_CALENDAR", JSON.stringify(this._e)); }
  addEvent(title, dtStr, notes="") {
    const id = Date.now().toString(36); const dt = new Date(dtStr).toISOString();
    this._e.push({ id, title, dt, notes, created: new Date().toISOString() });
    this._e.sort((a,b)=>new Date(a.dt)-new Date(b.dt)); this._save();
    return `Event added: "${title}" on ${new Date(dt).toLocaleString()}`;
  }
  deleteEvent(id) { this._e = this._e.filter(e=>e.id!==id); this._save(); }
  getUpcoming(days=7) { const now=new Date(); const end=new Date(now.getTime()+days*86400000); return this._e.filter(e=>{const d=new Date(e.dt);return d>=now&&d<=end;}); }
  getAll() { return this._e; }
  listUpcoming() { const ev=this.getUpcoming(30); if(!ev.length) return "No upcoming events in next 30 days."; return ev.map(e=>`  ${new Date(e.dt).toLocaleString().slice(0,16)}  ${e.title}`).join("\n"); }
  _checkReminders() { const now=new Date(); this._e.forEach(e=>{if(e._alerted)return;const diff=(new Date(e.dt)-now)/60000;if(diff>0&&diff<=5){e._alerted=true;}}); }
}

class HabitTracker {
  constructor() { this._h = this._load(); }
  _load() { try { return JSON.parse(safeLS.get("RYN_HABITS","{}")); } catch { return {}; } }
  _save() { safeLS.set("RYN_HABITS", JSON.stringify(this._h)); }
  logHabit(name) {
    const k=name.toLowerCase(); if(!this._h[k]) this._h[k]={name,streak:0,lastDate:null,total:0};
    const today=new Date().toDateString(); if(this._h[k].lastDate===today) return `Already logged '${name}' today.`;
    const yesterday=new Date(Date.now()-86400000).toDateString();
    if(this._h[k].lastDate===yesterday) this._h[k].streak++; else this._h[k].streak=1;
    this._h[k].lastDate=today; this._h[k].total=(this._h[k].total||0)+1; this._save();
    return `Habit '${name}' logged! 🔥 Streak: ${this._h[k].streak} day(s). Total: ${this._h[k].total}`;
  }
  listAll() { const keys=Object.keys(this._h); if(!keys.length) return "No habits tracked yet."; return keys.map(k=>`  ${this._h[k].name}: 🔥${this._h[k].streak}-day streak (${this._h[k].total||0} total)`).join("\n"); }
  getAll() { return this._h; }
}

class TodoEngine {
  constructor() { this._t = this._load(); }
  _load() { try { return JSON.parse(safeLS.get("RYN_TODOS","[]")); } catch { return []; } }
  _save() { safeLS.set("RYN_TODOS", JSON.stringify(this._t)); }
  add(text, priority="normal") { const id=Date.now().toString(36); this._t.push({id,text,done:false,priority,created:new Date().toISOString()}); this._save(); return `Todo added: "${text}"`; }
  toggle(id) { const t=this._t.find(x=>x.id===id); if(t){t.done=!t.done;this._save();} }
  delete(id) { this._t=this._t.filter(x=>x.id!==id); this._save(); }
  list() { return [...this._t].sort((a,b)=>{const pr={high:0,normal:1,low:2};return pr[a.priority]-pr[b.priority];}); }
  listText() {
    const items=this.list(); if(!items.length) return "No todos yet.";
    return items.map(t=>`  [${t.done?"✓":"○"}] ${t.text} (${t.priority})`).join("\n");
  }
  clearDone() { this._t=this._t.filter(x=>!x.done); this._save(); return "Cleared completed todos."; }
}

class TimerEngine {
  constructor() { this._timers = {}; }
  set(name, seconds, onDone) {
    if(this._timers[name]) clearTimeout(this._timers[name].id);
    const id = setTimeout(()=>{ delete this._timers[name]; onDone && onDone(name); }, seconds*1000);
    this._timers[name] = {id, name, seconds, started: Date.now()};
    return `Timer "${name}" set for ${this._formatTime(seconds)}.`;
  }
  cancel(name) { if(this._timers[name]){clearTimeout(this._timers[name].id);delete this._timers[name];return `Timer "${name}" cancelled.`;} return `No timer named "${name}".`; }
  list() { const keys=Object.keys(this._timers); if(!keys.length) return "No active timers."; return keys.map(k=>{const t=this._timers[k];const rem=Math.max(0,t.seconds-Math.floor((Date.now()-t.started)/1000));return `  "${k}": ${this._formatTime(rem)} remaining`;}).join("\n"); }
  _formatTime(s) { if(s>=3600) return `${Math.floor(s/3600)}h ${Math.floor((s%3600)/60)}m`; if(s>=60) return `${Math.floor(s/60)}m ${s%60}s`; return `${s}s`; }
}

class UnitConverter {
  convert(value, from, to) {
    const v=parseFloat(value); if(isNaN(v)) return "Invalid number.";
    const f=from.toLowerCase().replace(/\s+/g,""); const t=to.toLowerCase().replace(/\s+/g,"");
    const toK={celsius:c=>c+273.15,c:c=>c+273.15,fahrenheit:f=>(f-32)*5/9+273.15,f:f=>(f-32)*5/9+273.15,kelvin:k=>k,k:k=>k};
    const fromK={celsius:k=>k-273.15,c:k=>k-273.15,fahrenheit:k=>(k-273.15)*9/5+32,f:k=>(k-273.15)*9/5+32,kelvin:k=>k,k:k=>k};
    if(toK[f]&&fromK[t]) return `${v} ${from} = ${fromK[t](toK[f](v)).toFixed(2)} ${to}`;
    const lengths={m:1,km:1000,cm:.01,mm:.001,ft:.3048,inch:.0254,in:.0254,mile:1609.34,yard:.9144,nm:1e-9,ly:9.461e15};
    if(lengths[f]&&lengths[t]) return `${v} ${from} = ${(v*lengths[f]/lengths[t]).toFixed(6)} ${to}`;
    const masses={kg:1,g:.001,lb:.453592,oz:.0283495,ton:1000,mg:1e-6,stone:6.35029};
    if(masses[f]&&masses[t]) return `${v} ${from} = ${(v*masses[f]/masses[t]).toFixed(6)} ${to}`;
    const vols={l:1,ml:.001,gal:3.78541,oz_fl:.0295735,cup:.236588,tsp:.00492892,tbsp:.0147868};
    if(vols[f]&&vols[t]) return `${v} ${from} = ${(v*vols[f]/vols[t]).toFixed(6)} ${to}`;
    const data={b:1,kb:1024,mb:1048576,gb:1073741824,tb:1099511627776};
    if(data[f]&&data[t]) return `${v} ${from} = ${(v*data[f]/data[t]).toFixed(4)} ${to}`;
    const speed={mph:1,kph:1.60934,ms:3.6/1.60934,knot:1.852,mach:1234.8};
    if(speed[f]&&speed[t]) return `${v} ${from} = ${(v*speed[f]/speed[t]).toFixed(4)} ${to}`;
    return `Cannot convert ${from} to ${to}.`;
  }
}

// ═══════════════════════════════════════════════
//  UTILITIES
// ═══════════════════════════════════════════════
const Utils = {
  generatePassword(len=16, special=true) {
    const alpha="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ", nums="0123456789", syms="!@#$%^&*()_+-=[]{}|;:,.<>?";
    let chars=alpha+nums+(special?syms:""); const arr=new Uint8Array(len); crypto.getRandomValues(arr);
    return "Password: "+Array.from(arr).map(b=>chars[b%chars.length]).join("");
  },
  flipCoin() { return Math.random()<.5?"HEADS 🪙":"TAILS 🪙"; },
  rollDice(sides=6,count=1) { const rolls=Array.from({length:count},()=>Math.floor(Math.random()*sides)+1); return `${count}D${sides}: [${rolls.join(", ")}] = ${rolls.reduce((a,b)=>a+b,0)}`; },
  bmi(w,h) { const b=(w/(h*h)).toFixed(1); return `BMI: ${b} (${b<18.5?"Underweight":b<25?"Normal":b<30?"Overweight":"Obese"})`; },
  gcd(a,b) { a=Math.abs(parseInt(a));b=Math.abs(parseInt(b));while(b){[a,b]=[b,a%b];}return a; },
  lcm(a,b) { return Math.abs(parseInt(a)*parseInt(b))/Utils.gcd(a,b); },
  isPrime(n) { n=parseInt(n);if(n<2)return false;for(let i=2;i<=Math.sqrt(n);i++)if(n%i===0)return false;return true; },
  fibonacci(n) { n=Math.min(parseInt(n)||10,50);let a=0,b=1,res=[0,1];for(let i=2;i<n;i++){[a,b]=[b,a+b];res.push(b);}return `Fibonacci (${n} terms): ${res.slice(0,n).join(", ")}`; },
  factorial(n) { n=parseInt(n);if(n>20)return "Too large (max 20).";let r=1;for(let i=2;i<=n;i++)r*=i;return `${n}! = ${r}`; },
  primes(n) { const sieve=Array(n+1).fill(true);sieve[0]=sieve[1]=false;for(let i=2;i*i<=n;i++)if(sieve[i])for(let j=i*i;j<=n;j+=i)sieve[j]=false;const p=[];for(let i=2;i<=n;i++)if(sieve[i])p.push(i);return `Primes up to ${n}: ${p.join(", ")}`; },
  romanToInt(s) { const map={I:1,V:5,X:10,L:50,C:100,D:500,M:1000};let result=0,prev=0;for(const ch of s.toUpperCase().split("").reverse()){const v=map[ch]||0;result+=v<prev?-v:v;prev=v;}return result; },
  intToRoman(n) { const vals=[1000,900,500,400,100,90,50,40,10,9,5,4,1];const syms=["M","CM","D","CD","C","XC","L","XL","X","IX","V","IV","I"];let r="";vals.forEach((v,i)=>{while(n>=v){r+=syms[i];n-=v;}});return r; },
  compound(P,r,n,t) { const A=P*Math.pow(1+(r/100)/n,n*t);return `Future value: ₹${A.toFixed(2)} (interest: ₹${(A-P).toFixed(2)})`; },
  emi(P,r,n) { const R=(r/100)/12;const emi=P*R*Math.pow(1+R,n)/(Math.pow(1+R,n)-1);return `EMI: ₹${emi.toFixed(2)}/month`; },
  sip(monthly,rate,years) { const r=rate/(12*100);const n=years*12;const fv=monthly*((Math.pow(1+r,n)-1)/r)*(1+r);return `SIP: ₹${monthly}/month for ${years}yr @${rate}% = ₹${fv.toFixed(2)}`; },
  evalMath(expr) { try { const clean=expr.replace(/[^0-9+\-*/().^%e ]/gi,"").trim();if(!clean)return "Invalid."; const result=Function('"use strict";return ('+clean+")")();return isNaN(result)?"Math error.":typeof result==="number"?`${expr.trim()} = ${Number(result.toPrecision(10))}`:"?"; } catch { return "Math error."; } },
  percentage(part,total) { return `${part} / ${total} = ${((part/total)*100).toFixed(2)}%`; },
  ageCalc(dob) { const d=new Date(dob);const now=new Date();let y=now.getFullYear()-d.getFullYear();const m=now.getMonth()-d.getMonth();if(m<0||(m===0&&now.getDate()<d.getDate()))y--;return `Age: ${y} years`; },
  daysUntil(dtStr) { const d=new Date(dtStr);const diff=Math.ceil((d-new Date())/(1000*86400));return diff>0?`${diff} day(s) until that date.`:diff===0?"That is today!":"That date has passed."; },
  colorToRgb(hex) { const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);return `${hex} = rgb(${r}, ${g}, ${b}) = hsl(${Math.round(RGBtoHSL(r,g,b).h)}, ${Math.round(RGBtoHSL(r,g,b).s)}%, ${Math.round(RGBtoHSL(r,g,b).l)}%)`; },
  speedOfLight() { return "Speed of light: 299,792,458 m/s (≈3×10⁸ m/s)"; },
  worldFact() {
    const facts=["Earth is 4.54 billion years old.","The human brain has ~86 billion neurons.","Sound travels at ~343 m/s in air at 20°C.","1 light year ≈ 9.46 trillion km.","Water boils at 100°C at sea level.","DNA contains ~3 billion base pairs.","The universe is ~13.8 billion years old.","Light from the Sun takes ~8 minutes to reach Earth."];
    return facts[Math.floor(Math.random()*facts.length)];
  },
  joke() {
    const jokes=["Why do programmers prefer dark mode? Because light attracts bugs! 🐛","I would tell you a UDP joke but you might not get it.","Why did the AI go to school? To improve its learning rate! 📈","There are 10 types of people: those who understand binary and those who don't.","Why was the math book sad? It had too many problems."];
    return jokes[Math.floor(Math.random()*jokes.length)];
  },
  quote() {
    const quotes=['"The only way to do great work is to love what you do." — Steve Jobs','"Intelligence is the ability to adapt to change." — Stephen Hawking','"The science of today is the technology of tomorrow." — Edward Teller','"Any sufficiently advanced technology is indistinguishable from magic." — Arthur C. Clarke','"Imagination is more important than knowledge." — Albert Einstein'];
    return quotes[Math.floor(Math.random()*quotes.length)];
  },
  morse(text) {
    const map={A:".-",B:"-...",C:"-.-.",D:"-..",E:".",F:"..-.",G:"--.",H:"....",I:"..",J:".---",K:"-.-",L:".-..",M:"--",N:"-.",O:"---",P:".--.",Q:"--.-",R:".-.",S:"...",T:"-",U:"..-",V:"...-",W:".--",X:"-..-",Y:"-.--",Z:"--..",0:"-----",1:".----",2:"..---",3:"...--",4:"....-",5:".....",6:"-....",7:"--...",8:"---..",9:"----."};
    return text.toUpperCase().split("").map(c=>map[c]||"/").join(" ");
  },
  base64encode(s) { try { return `base64: ${btoa(s)}`; } catch { return "Encode error."; } },
  base64decode(s) { try { return `decoded: ${atob(s)}`; } catch { return "Decode error."; } },
  wordCount(text) { const words=text.trim().split(/\s+/).filter(Boolean);return `Words: ${words.length}, Characters: ${text.length}, Sentences: ${(text.match(/[.!?]+/g)||[]).length}`; },
  reverseText(text) { return text.split("").reverse().join(""); },
  isPalindrome(text) { const clean=text.toLowerCase().replace(/[^a-z0-9]/g,"");return clean===clean.split("").reverse().join("")?`"${text}" IS a palindrome ✓`:`"${text}" is NOT a palindrome`; },
  randomNumber(min=1,max=100) { return `Random number (${min}-${max}): ${Math.floor(Math.random()*(max-min+1))+min}`; },
  numberFact(n) {
    const facts={"42":"The answer to the ultimate question of life, the universe, and everything.","0":"The only number that is neither positive nor negative.","1":"The multiplicative identity in mathematics.","pi":"π ≈ 3.14159265358979... transcendental and irrational.","e":"e ≈ 2.71828... base of natural logarithm, discovered by Euler."};
    return facts[String(n)]||`${n} in binary: ${parseInt(n).toString(2)}, octal: ${parseInt(n).toString(8)}, hex: ${parseInt(n).toString(16).toUpperCase()}`;
  },
};

function RGBtoHSL(r,g,b){r/=255;g/=255;b/=255;const max=Math.max(r,g,b),min=Math.min(r,g,b);let h,s,l=(max+min)/2;if(max===min){h=s=0;}else{const d=max-min;s=l>0.5?d/(2-max-min):d/(max+min);switch(max){case r:h=(g-b)/d+(g<b?6:0);break;case g:h=(b-r)/d+2;break;case b:h=(r-g)/d+4;break;}h/=6;}return{h:h*360,s:s*100,l:l*100};}

// ═══════════════════════════════════════════════
//  AI BRAIN
// ═══════════════════════════════════════════════
//  KNOWLEDGE BASE ENGINE — grows as you chat
// ═══════════════════════════════════════════════
//  CONVERSATION LOG ENGINE — saves all chats forever
// ═══════════════════════════════════════════════
class ConversationLogEngine {
  constructor() {
    this.MAX_LOG = 5000; // keeps up to 5000 message pairs
    this._log = this._load();
  }
  _load() {
    try { const r = safeLS.get("RYN_CONVLOG"); if(r) return JSON.parse(r); } catch {}
    return [];
  }
  _save() {
    try { safeLS.set("RYN_CONVLOG", JSON.stringify(this._log)); } catch(e) {
      // If storage full, prune oldest 20% and retry
      this._log = this._log.slice(Math.floor(this._log.length*0.2));
      try { safeLS.set("RYN_CONVLOG", JSON.stringify(this._log)); } catch {}
    }
  }
  add(role, text) {
    if(!text||text.length<2) return;
    this._log.push({ role, text: text.slice(0,500), ts: new Date().toISOString() });
    if(this._log.length > this.MAX_LOG) this._log.splice(0, Math.floor(this.MAX_LOG*0.1));
    this._save();
  }
  getRecent(n=20) { return this._log.slice(-n); }
  stats() { return `Conversation log: ${this._log.length} messages | ~${humanBytes(JSON.stringify(this._log).length)}`; }
  // Auto-extract important facts from conversation and save to Memory
  autoExtract(userMsg, ryanReply, memEngine, kbEngine) {
    // Look for explicit "remember" signals
    if(/(my name is|i am|i'm|i work|i study|i live|i love|i hate|i like|i prefer|i have|my favorite|my goal|i want to|i am learning|i am preparing|i am a|my age|my birthday)/i.test(userMsg)) {
      const fact = userMsg.slice(0,200);
      memEngine.add(`User said: "${fact}"`, "personal", 9);
    }
    // Save Q&A pair to KB if it was a real answer (not error/short)
    if(ryanReply && ryanReply.length > 20 && !ryanReply.includes("[ERR]") && !ryanReply.includes("Check API key")) {
      kbEngine.learn(userMsg, ryanReply, "conversation");
    }
  }
}

class KnowledgeBaseEngine {
  constructor() {
    this.MAX_ENTRIES = 5000; // big enough to grow for years
    this._kb = this._load();
    this._exact = {}; // fast exact-match lookup map
    this._buildExactMap();
  }
  _load() {
    try { const r = safeLS.get("RYN_KB"); if (r) { const d = JSON.parse(r); return Array.isArray(d.entries) ? d.entries : []; } } catch {}
    return [];
  }
  _buildExactMap() {
    this._exact = {};
    for(const e of this._kb) {
      const key = (e.question||"").toLowerCase().trim();
      this._exact[key] = e;
    }
  }
  _save() {
    try { safeLS.set("RYN_KB", JSON.stringify({ version: 2, saved: new Date().toISOString(), count: this._kb.length, entries: this._kb })); } catch(err) {
      // Storage full — prune lowest-weight old entries
      this._kb = this._kb.filter((e,i) => i < 500 || (e.weight||1) > 0.5);
      try { safeLS.set("RYN_KB", JSON.stringify({ version: 2, saved: new Date().toISOString(), count: this._kb.length, entries: this._kb })); } catch {}
    }
  }
  stats() {
    if (!this._kb.length) return "Knowledge base is empty — it grows as we talk.";
    const cats = {}; this._kb.forEach(e => { cats[e.category||"general"] = (cats[e.category||"general"]||0)+1; });
    return `KB: ${this._kb.length} entries | ${humanBytes(JSON.stringify(this._kb).length)} | ${Object.keys(cats).slice(0,5).join(", ")}`;
  }
  match(query) {
    if (!this._kb.length) return null;
    const q = query.toLowerCase().trim();
    // ── EXACT MATCH (handles "hi", "bye", "thanks", short phrases) ──
    if(this._exact[q]) return this._exact[q];
    // ── FUZZY MATCH for longer queries ──
    const stopwords = new Set(["what","that","this","with","have","from","they","will","been","were","said","each","which","their","about","would","there","could","other","into","then","than","when","your","know","just","like","time","well","also","some","more","only","come","most","over","such","make","even","much","after","should","before","through","might","those","another","because","while","where","these","being","during","within","without","between","since","until","upon","along","under","above","below","however","therefore","although","despite","whether","unless","except"]);
    const qWords = q.split(/\s+/).filter(w => w.length > 2 && !stopwords.has(w));
    if (qWords.length < 1) return null;
    let best = null, bestScore = 0;
    for (const entry of this._kb) {
      // Exact question match (case-insensitive)
      if((entry.question||"").toLowerCase().trim() === q) return entry;
      const eWords = (entry.question||"").toLowerCase().split(/\s+/);
      const overlap = qWords.filter(w => eWords.some(ew => ew.includes(w) || w.includes(ew))).length;
      const score = overlap / Math.max(qWords.length, 1);
      const threshold = qWords.length === 1 ? 1.0 : qWords.length <= 3 ? 0.8 : 0.65;
      if (score > bestScore && score >= threshold) { bestScore = score; best = entry; }
    }
    return best;
  }
  learn(question, answer, category = "learned") {
    if(!question||!answer) return;
    // Never save error messages, API-era responses, or very short/generic answers
    const BAD_SAVE = [
      "api key","offline mode","no api key","check api","add an api",
      "i can still do: math","type \"help\" for commands","learned entries. type",
      "i appreciate that! now let's get to work",
      "[err]","syntax error","something went wrong",
    ];
    const ansLow = answer.toLowerCase();
    if(BAD_SAVE.some(b => ansLow.includes(b))) return;
    if(answer.length < 10) return; // Don't save very short answers
    const q = question.toLowerCase().trim();
    const existing = this._exact[q];
    if (existing) {
      existing.answer = answer;
      existing.updated = new Date().toISOString();
      existing.weight = Math.min(2.0, (existing.weight||1)+0.1);
    } else {
      const entry = { question: question.trim(), answer: answer.trim(), category, learned: new Date().toISOString(), weight: 1.0 };
      this._kb.unshift(entry);
      this._exact[q] = entry;
      if (this._kb.length > this.MAX_ENTRIES) {
        // Remove lowest-weight old entry
        const oldest = this._kb.pop();
        if(oldest) delete this._exact[(oldest.question||"").toLowerCase().trim()];
      }
    }
    this._save();
  }
  // Bulk load from training data array [[user, answer, cat], ...]
  bulkLoad(data) {
    let added = 0;
    for(const [q, a, cat] of data) {
      const key = q.toLowerCase().trim();
      if(!this._exact[key]) {
        const entry = { question: q.trim(), answer: a.trim(), category: cat, learned: new Date().toISOString(), weight: 1.0 };
        this._kb.push(entry);
        this._exact[key] = entry;
        added++;
      }
    }
    if(added > 0) this._save();
    return added;
  }
  getCount() { return this._kb.length; }
  storageSize() { return JSON.stringify(this._kb).length; }
}

// ═══════════════════════════════════════════════
//  WEB CRAWLER ENGINE — zero API key, multi-source
//  Sources: DuckDuckGo · Wikipedia · Wikidata ·
//           OpenLibrary · REST Countries · Open-Meteo
//           NumbersAPI · PokeAPI · JokeAPI · UrbanDict
//           Quotable · Open-Notify (ISS) · Exchange-Rate
//           FreeNewsAPI · Gutendex · Nutritionix (open)
// ═══════════════════════════════════════════════
const WebSearchEngine = {

  // ── Expanded trigger detection ──
  needsWeb(msg) {
    return /\b(who is|who was|who are|who's|what is|what's|what are|when is|when was|when did|where is|where was|how many|how much|how old|tell me about|latest|current|today|right now|news|what happened|score|price|live|update|recently|this year|2024|2025|2026|stock|weather for|president|prime minister|pm of|minister|ceo|founder|capital of|population of|currency of|official language|net worth|born|died|death|married|nationality|released|launched|invented|discovered|founded|headquarter|headquarters|age of|height of|highest|longest|largest|smallest|fastest|richest|poorest|distance|definition of|meaning of|formula of|full form|abbreviation|exchange rate|convert.*usd|inr to|usd to|eur to|country|countries|flag of|iss|space station|joke|riddle|quote|quotes|book|novel|author|pokemon|pokedex|nutrition|calories in|recipe|ingredient|define|synonym|antonym|rhymes with|word for|how to|tutorial|steps to|guide for|current price|bitcoin|crypto|ethereum|temperature in|humidity in|wind speed|forecast|movie|film|actor|director|release date|box office|song|album|singer|band|chart|top 10|top 5|list of|examples of|types of|kinds of|history of|origin of|invented by|discovered by|written by|directed by|played by|won by|record for)\b/i.test(msg);
  },

  // ── Strip filler words from query ──
  _clean(q) {
    return q
      .replace(/^(ryan|hey ryan|ok ryan|hey|hi),?\s*/i, "")
      .replace(/\b(please|can you|could you|tell me|do you know|what's the|i want to know|i need to know|search for|look up|find out|give me|show me)\b/gi, "")
      .replace(/\s{2,}/g, " ")
      .trim();
  },

  // ── Strip HTML tags ──
  _strip(html) { return (html||"").replace(/<[^>]*>/g, "").replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&quot;/g,'"').trim(); },

  // ── Format final answer ──
  _format(text, source, url) {
    text = text.trim();
    if (text.length > 600) {
      const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
      let out = "";
      for (const s of sentences) { if ((out + s).length > 580) break; out += s; }
      text = out || text.slice(0, 580) + "...";
    }
    return `${text}\n[Source: ${source}${url ? " — " + url : ""}]`;
  },

  // ══════════════════════════════════════════
  //  SOURCE 1: DuckDuckGo Instant Answer API
  //  (zero-click, no key, CORS-open)
  // ══════════════════════════════════════════
  async duckduckgo(query) {
    try {
      const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
      const d = await (await fetch(url, { signal: AbortSignal.timeout(8000) })).json();
      if (d.Answer?.length > 5)        return { result: this._strip(d.Answer),       source: "DuckDuckGo Instant" };
      if (d.AbstractText?.length > 40) return { result: this._strip(d.AbstractText).slice(0,700), source: d.AbstractSource || "DuckDuckGo" };
      if (d.Definition?.length > 20)   return { result: this._strip(d.Definition),   source: d.DefinitionSource || "DuckDuckGo" };
      // Related topics as fallback
      const topics = (d.RelatedTopics||[])
        .filter(t => t.Text?.length > 30)
        .slice(0, 4)
        .map(t => this._strip(t.Text))
        .join("  •  ");
      if (topics.length > 40) return { result: topics.slice(0, 700), source: "DuckDuckGo Topics" };
    } catch(e) { console.warn("[DDG]", e.message); }
    return null;
  },

  // ══════════════════════════════════════════
  //  SOURCE 2: Wikipedia Search + Full Extract
  //  (free MediaWiki API, CORS-open)
  // ══════════════════════════════════════════
  async wikipedia(query) {
    try {
      const cleaned = query.replace(/who is|who was|what is|what are|tell me about|define|explain|history of/gi, "").trim();
      // Step 1 — search titles
      const search = await (await fetch(
        `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(cleaned)}&format=json&origin=*&srlimit=3`,
        { signal: AbortSignal.timeout(8000) }
      )).json();
      const title = search?.query?.search?.[0]?.title;
      if (!title) return null;
      // Step 2 — get full extract (up to 2000 chars) + thumbnail
      const page = await (await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
        { signal: AbortSignal.timeout(8000) }
      )).json();
      if (page.extract?.length > 50) {
        return {
          result: page.extract.slice(0, 900),
          source: "Wikipedia",
          url: page.content_urls?.desktop?.page,
          image: page.thumbnail?.source || null,
        };
      }
    } catch(e) { console.warn("[Wiki]", e.message); }
    return null;
  },

  // ══════════════════════════════════════════
  //  SOURCE 3: Wikidata entity lookup
  // ══════════════════════════════════════════
  async wikidata(query) {
    try {
      const d = await (await fetch(
        `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(query)}&language=en&format=json&origin=*&limit=3`,
        { signal: AbortSignal.timeout(6000) }
      )).json();
      const hits = (d.search||[]).filter(e => e.description?.length > 5);
      if (!hits.length) return null;
      const result = hits.slice(0, 2).map(e => `${e.label}: ${e.description}`).join("  •  ");
      return { result, source: "Wikidata" };
    } catch {}
    return null;
  },

  // ══════════════════════════════════════════
  //  SOURCE 4: REST Countries (no key, CORS-open)
  //  Handles "capital of X", "currency of X", etc.
  // ══════════════════════════════════════════
  async restCountries(query) {
    const m = query.match(/(?:capital|currency|language|population|flag|country|about)\s+(?:of\s+)?(.+)/i)
           || query.match(/^(.+?)\s+(?:capital|currency|population|flag|country info)/i);
    if (!m) return null;
    const country = m[1].trim();
    try {
      const d = await (await fetch(
        `https://restcountries.com/v3.1/name/${encodeURIComponent(country)}?fields=name,capital,currencies,languages,population,flags,region,subregion,area`,
        { signal: AbortSignal.timeout(7000) }
      )).json();
      if (!Array.isArray(d) || !d[0]) return null;
      const c = d[0];
      const currencies = Object.values(c.currencies||{}).map(x=>`${x.name} (${x.symbol||""})`).join(", ") || "N/A";
      const languages  = Object.values(c.languages||{}).join(", ") || "N/A";
      const pop = c.population ? c.population.toLocaleString() : "N/A";
      const result = `${c.name?.common}: Capital — ${(c.capital||[]).join(", ")||"N/A"} | Currency — ${currencies} | Language(s) — ${languages} | Population — ${pop} | Region — ${c.region||"N/A"}, ${c.subregion||""} | Area — ${c.area?.toLocaleString()||"N/A"} km²`;
      return { result, source: "REST Countries" };
    } catch(e) { console.warn("[Countries]", e.message); }
    return null;
  },

  // ══════════════════════════════════════════
  //  SOURCE 5: Open-Meteo weather (no key)
  //  Handles "weather in X", "temperature in X"
  // ══════════════════════════════════════════
  async openMeteo(query) {
    const m = query.match(/(?:weather|temperature|forecast|humidity|rain|wind)\s+(?:in|at|for)\s+(.+)/i)
           || query.match(/(?:how(?:'s| is) the weather)\s+(?:in|at)?\s*(.+)/i);
    if (!m) return null;
    const city = m[1].trim().replace(/[?!.]/g,"");
    try {
      // Step 1: geocode city
      const geo = await (await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`,
        { signal: AbortSignal.timeout(6000) }
      )).json();
      const loc = geo.results?.[0];
      if (!loc) return null;
      // Step 2: get weather
      const wx = await (await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code,apparent_temperature&timezone=auto`,
        { signal: AbortSignal.timeout(6000) }
      )).json();
      const cur = wx.current;
      const codes = {0:"Clear sky",1:"Mainly clear",2:"Partly cloudy",3:"Overcast",45:"Foggy",48:"Depositing rime fog",51:"Light drizzle",53:"Moderate drizzle",55:"Dense drizzle",61:"Slight rain",63:"Moderate rain",65:"Heavy rain",71:"Slight snow",73:"Moderate snow",75:"Heavy snow",80:"Slight showers",81:"Moderate showers",82:"Violent showers",95:"Thunderstorm",99:"Thunderstorm with hail"};
      const desc = codes[cur.weather_code] || "Unknown";
      const result = `Weather in ${loc.name}, ${loc.country_code}: ${cur.temperature_2m}°C (feels like ${cur.apparent_temperature}°C) — ${desc} | Humidity: ${cur.relative_humidity_2m}% | Wind: ${cur.wind_speed_10m} km/h`;
      return { result, source: "Open-Meteo (live)" };
    } catch(e) { console.warn("[Weather]", e.message); }
    return null;
  },

  // ══════════════════════════════════════════
  //  SOURCE 6: Exchange Rates (no key)
  //  Handles "USD to INR", "convert 100 EUR to GBP"
  // ══════════════════════════════════════════
  async exchangeRate(query) {
    const m = query.match(/(\d+\.?\d*)?\s*([A-Z]{3})\s+(?:to|in)\s+([A-Z]{3})/i);
    if (!m) return null;
    const [, amt, from, to] = m;
    try {
      const d = await (await fetch(
        `https://api.exchangerate-api.com/v4/latest/${from.toUpperCase()}`,
        { signal: AbortSignal.timeout(6000) }
      )).json();
      const rate = d.rates?.[to.toUpperCase()];
      if (!rate) return null;
      const amount = parseFloat(amt||1);
      const result = `${amount} ${from.toUpperCase()} = ${(amount * rate).toFixed(4)} ${to.toUpperCase()} (Rate: 1 ${from.toUpperCase()} = ${rate} ${to.toUpperCase()})`;
      return { result, source: "ExchangeRate-API (live)" };
    } catch(e) { console.warn("[FX]", e.message); }
    return null;
  },

  // ══════════════════════════════════════════
  //  SOURCE 7: NumbersAPI (facts about numbers/dates)
  //  Handles "fact about 42", "what happened on march 15"
  // ══════════════════════════════════════════
  async numbersAPI(query) {
    const numMatch  = query.match(/\b(?:fact about|number fact|interesting fact about|about number)\s+(\d+)/i);
    const dateMatch = query.match(/\b(?:what happened on|on this day|history of)\s+(\w+ \d+|\d+\/\d+)/i);
    if (!numMatch && !dateMatch) return null;
    try {
      let url;
      if (numMatch) url = `http://numbersapi.com/${numMatch[1]}/trivia?json`;
      else {
        const parts = (dateMatch[1]||"").split(/[/ ]/);
        url = `http://numbersapi.com/${parts[0]}/${parts[1]||1}/date?json`;
      }
      const d = await (await fetch(url, { signal: AbortSignal.timeout(5000) })).json();
      if (d.text) return { result: d.text, source: "NumbersAPI" };
    } catch {}
    return null;
  },

  // ══════════════════════════════════════════
  //  SOURCE 8: Open Library (books)
  //  Handles "book by X", "novel written by X"
  // ══════════════════════════════════════════
  async openLibrary(query) {
    const m = query.match(/(?:book|novel|written|authored|works)\s+(?:by|of|from)\s+(.+)/i)
           || query.match(/^(.+?)\s+(?:books?|novels?|bibliography)/i);
    if (!m) return null;
    try {
      const d = await (await fetch(
        `https://openlibrary.org/search.json?author=${encodeURIComponent(m[1].trim())}&limit=5&fields=title,author_name,first_publish_year,subject`,
        { signal: AbortSignal.timeout(7000) }
      )).json();
      const books = (d.docs||[]).slice(0,5);
      if (!books.length) return null;
      const result = `Books by ${m[1].trim()}: ` + books.map(b=>`"${b.title}" (${b.first_publish_year||"?"})`).join("  •  ");
      return { result, source: "Open Library" };
    } catch(e) { console.warn("[OpenLib]", e.message); }
    return null;
  },

  // ══════════════════════════════════════════
  //  SOURCE 9: PokéAPI (no key, CORS-open)
  //  Handles "what is pikachu", "tell me about charizard"
  // ══════════════════════════════════════════
  async pokeAPI(query) {
    const POKEMON_NAMES = /\b(pikachu|charmander|charizard|bulbasaur|squirtle|mewtwo|eevee|gengar|snorlax|lucario|garchomp|rayquaza|greninja|sylveon|umbreon|espeon|vaporeon|jolteon|flareon|leafeon|glaceon|arcanine|gyarados|dragonite|tyranitar|flygon|salamence|metagross|blaziken|swampert|gardevoir|absol|breloom|togekiss|gallade|luxray|staraptor|roserade|spiritomb|drapion|weavile|glaceon|leafeon|electivire|magmortar|yanmega|gliscor|mamoswine|porygon-z|gallade|froslass|rotom|uxie|mesprit|azelf|dialga|palkia|giratina|cresselia|darkrai|shaymin|arceus|victini|snivy|tepig|oshawott|zoroark|reshiram|zekrom|kyurem|keldeo|genesect|chespin|fennekin|froakie|xerneas|yveltal|zygarde|diancie|hoopa|volcanion|rowlet|litten|popplio|cosmog|lunala|solgaleo|marshadow|zeraora|grookey|scorbunny|sobble|zacian|zamazenta|calyrex|enamorus|sprigatito|fuecoco|quaxly|koraidon|miraidon)\b/i;
    const m = query.match(POKEMON_NAMES);
    if (!m) return null;
    try {
      const d = await (await fetch(
        `https://pokeapi.co/api/v2/pokemon/${m[0].toLowerCase()}`,
        { signal: AbortSignal.timeout(7000) }
      )).json();
      const types = d.types.map(t=>t.type.name).join(", ");
      const stats = d.stats.map(s=>`${s.stat.name}: ${s.base_stat}`).join(" | ");
      const abilities = d.abilities.map(a=>a.ability.name).join(", ");
      const result = `${d.name.toUpperCase()} — Type: ${types} | Height: ${d.height/10}m | Weight: ${d.weight/10}kg | Abilities: ${abilities} | Base Stats: ${stats}`;
      return { result, source: "PokéAPI" };
    } catch(e) { console.warn("[PokeAPI]", e.message); }
    return null;
  },

  // ══════════════════════════════════════════
  //  SOURCE 10: JokeAPI (no key)
  //  Handles "tell me a joke", "give me a riddle"
  // ══════════════════════════════════════════
  async jokeAPI(query) {
    if (!/\b(joke|riddle|funny|laugh|humor|pun|make me laugh)\b/i.test(query)) return null;
    try {
      const category = /\b(programming|code|dev)\b/i.test(query) ? "Programming" : "Any";
      const d = await (await fetch(
        `https://v2.jokeapi.dev/joke/${category}?blacklistFlags=nsfw,explicit&type=twopart,single`,
        { signal: AbortSignal.timeout(5000) }
      )).json();
      if (d.error) return null;
      const result = d.type === "twopart" ? `${d.setup}\n...${d.delivery}` : d.joke;
      return { result, source: "JokeAPI" };
    } catch {}
    return null;
  },

  // ══════════════════════════════════════════
  //  SOURCE 11: Quotable (famous quotes, no key)
  //  Handles "give me a quote", "inspirational quote"
  // ══════════════════════════════════════════
  async quotable(query) {
    if (!/\b(quote|quotes|saying|wisdom|inspire|inspirational|motivat)\b/i.test(query)) return null;
    try {
      const d = await (await fetch(
        `https://api.quotable.io/random?minLength=60&maxLength=200`,
        { signal: AbortSignal.timeout(5000) }
      )).json();
      if (d.content) return { result: `"${d.content}" — ${d.author}`, source: "Quotable" };
    } catch {}
    return null;
  },

  // ══════════════════════════════════════════
  //  SOURCE 12: ISS Location (no key)
  //  Handles "where is the ISS", "space station location"
  // ══════════════════════════════════════════
  async issLocation(query) {
    if (!/\b(iss|international space station|where.*space station|space station.*location)\b/i.test(query)) return null;
    try {
      const d = await (await fetch(`http://api.open-notify.org/iss-now.json`, { signal: AbortSignal.timeout(5000) })).json();
      if (d.iss_position) {
        const { latitude: lat, longitude: lon } = d.iss_position;
        return { result: `The International Space Station is currently at: Latitude ${parseFloat(lat).toFixed(4)}°, Longitude ${parseFloat(lon).toFixed(4)}° (live position — orbits Earth every ~90 minutes at ~28,000 km/h)`, source: "Open Notify (live)" };
      }
    } catch {}
    return null;
  },

  // ══════════════════════════════════════════
  //  SOURCE 13: Free Dictionary API (no key)
  //  Handles "define X", "meaning of X", "synonym of X"
  // ══════════════════════════════════════════
  async dictionary(query) {
    const m = query.match(/\b(?:define|definition of|meaning of|what does|synonym|antonym)\s+["']?(\w+)["']?/i)
           || query.match(/^what(?:'s| is) ['"]?(\w+)['"]?\s*\??$/i);
    if (!m) return null;
    const word = m[1].toLowerCase().trim();
    try {
      const d = await (await fetch(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`,
        { signal: AbortSignal.timeout(6000) }
      )).json();
      if (!Array.isArray(d) || !d[0]) return null;
      const entry = d[0];
      const meanings = (entry.meanings||[]).slice(0,2).map(m=>{
        const def = m.definitions?.[0]?.definition || "";
        const syn = (m.definitions?.[0]?.synonyms||[]).slice(0,3).join(", ");
        return `[${m.partOfSpeech}] ${def}${syn ? ` (Synonyms: ${syn})` : ""}`;
      }).join("  |  ");
      const phonetic = entry.phonetic || "";
      return { result: `${entry.word}${phonetic?" "+phonetic:""}: ${meanings}`, source: "Free Dictionary API" };
    } catch {}
    return null;
  },

  // ══════════════════════════════════════════
  //  SOURCE 14: Wikipedia Full-Text search
  //  (deeper fallback using opensearch)
  // ══════════════════════════════════════════
  async wikipediaOpenSearch(query) {
    try {
      const d = await (await fetch(
        `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=3&namespace=0&format=json&origin=*`,
        { signal: AbortSignal.timeout(7000) }
      )).json();
      // d = [query, [titles], [descriptions], [urls]]
      const titles = d[1]||[], descs = d[2]||[], urls = d[3]||[];
      for (let i = 0; i < titles.length; i++) {
        if (descs[i]?.length > 20) {
          return { result: `${titles[i]}: ${descs[i]}`, source: "Wikipedia", url: urls[i] };
        }
      }
    } catch {}
    return null;
  },

  // ══════════════════════════════════════════
  //  MASTER SEARCH — tries all sources smartly
  // ══════════════════════════════════════════
  async search(query) {
    const q = this._clean(query);
    const ql = q.toLowerCase();

    // 1. Specialised sources first (most accurate for their domain)
    const specialised = await Promise.any([
      // Weather
      this.openMeteo(ql).catch(()=>null),
      // Currency conversion
      this.exchangeRate(ql).catch(()=>null),
      // Country info
      this.restCountries(ql).catch(()=>null),
      // Dictionary
      this.dictionary(ql).catch(()=>null),
      // Pokémon
      this.pokeAPI(ql).catch(()=>null),
      // Jokes
      this.jokeAPI(ql).catch(()=>null),
      // Quotes
      this.quotable(ql).catch(()=>null),
      // ISS
      this.issLocation(ql).catch(()=>null),
      // Number facts
      this.numbersAPI(ql).catch(()=>null),
      // Books
      this.openLibrary(ql).catch(()=>null),
    ].map(p => p.then(r => r || Promise.reject()))).catch(()=>null);

    if (specialised?.result) {
      return { ...specialised, result: this._format(specialised.result, specialised.source, specialised.url) };
    }

    // 2. General knowledge: DuckDuckGo + Wikipedia in parallel
    const [ddg, wiki] = await Promise.all([
      this.duckduckgo(q).catch(()=>null),
      this.wikipedia(q).catch(()=>null),
    ]);
    const general = ddg || wiki;
    if (general?.result) {
      return { ...general, result: this._format(general.result, general.source, general.url) };
    }

    // 3. Wikipedia OpenSearch as secondary fallback
    const wikiOpen = await this.wikipediaOpenSearch(q).catch(()=>null);
    if (wikiOpen?.result) {
      return { ...wikiOpen, result: this._format(wikiOpen.result, wikiOpen.source, wikiOpen.url) };
    }

    // 4. Wikidata as final fallback
    const wd = await this.wikidata(q).catch(()=>null);
    if (wd?.result) return { ...wd, result: this._format(wd.result, wd.source) };

    return null;
  },

  async directAnswer(query) {
    const r = await this.search(query);
    return r ? r.result : null;
  },
};

// ═══════════════════════════════════════════════
//  STOCK ENGINE — no API key, Yahoo Finance + fallback
// ═══════════════════════════════════════════════
const StockEngine = {
  _data: {},
  SYMBOLS: [
    {sym:"^NSEI",  name:"NIFTY 50", short:"NIFTY",  color:"#00ff88", base:22400},
    {sym:"^BSESN", name:"SENSEX",   short:"SENSEX", color:"#00bbff", base:73800},
    {sym:"^IXIC",  name:"NASDAQ",   short:"NASDAQ", color:"#aa66ff", base:18200},
    {sym:"BTC-USD",name:"BTC/USD",  short:"BTC",    color:"#ffaa00", base:68000},
  ],
  _gen(sym) {
    const s=this.SYMBOLS.find(x=>x.sym===sym); if(!s) return null;
    let p=s.base*(0.99+Math.random()*0.02); const prices=[];
    for(let i=0;i<78;i++){p+=p*(Math.random()-0.48)*0.0022;prices.push(+p.toFixed(2));}
    const pct=(prices[prices.length-1]-prices[0])/prices[0]*100;
    return {prices,pct,last:prices[prices.length-1],open:prices[0],high:Math.max(...prices),low:Math.min(...prices),name:s.name,color:s.color,sym,source:"sim"};
  },
  init() { this.SYMBOLS.forEach(s=>{ this._data[s.sym]=this._gen(s.sym); }); },
  async fetchAll() {
    await Promise.all(this.SYMBOLS.map(async s=>{
      try {
        const res=await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(s.sym)}?interval=5m&range=1d`,{signal:AbortSignal.timeout(12000)});
        const d=await res.json();
        const q=d?.chart?.result?.[0]?.indicators?.quote?.[0];
        const meta=d?.chart?.result?.[0]?.meta||{};
        const closes=(q?.close||[]).filter(v=>v!=null&&!isNaN(v));
        if(closes.length>5){
          const prev=meta.previousClose||closes[0];
          this._data[s.sym]={...this._data[s.sym],prices:closes,pct:(closes[closes.length-1]-prev)/prev*100,last:closes[closes.length-1],open:meta.regularMarketOpen||closes[0],high:meta.regularMarketDayHigh||Math.max(...closes),low:meta.regularMarketDayLow||Math.min(...closes),prev,source:"live"};
        }
      } catch(e){ console.warn("Stock fetch:",s.sym,e.message); }
    }));
  },
  get(sym){ return this._data[sym]||null; },
  getAll(){ return this.SYMBOLS.map(s=>this._data[s.sym]).filter(Boolean); },
};

// ═══════════════════════════════════════════════
//  TOPIC TRACKER — learns from long conversations
// ═══════════════════════════════════════════════
class TopicTracker {
  constructor() {
    this.sessions = [];
    this.MIN_DURATION_MS = 4 * 60 * 1000; // 4 minutes
    this.MIN_MESSAGES = 4;
  }
  _extractTopic(text) {
    const stopwords = new Set(["that","this","what","with","have","from","they","will","been","were","said","each","which","their","about","would","there","could","other","into","then","than","when","your","know","just","like","time","well","also","some","more","only","come","most","over","such","make","even","much","after","before","through","those","another","while","where","these","during","within","without","between","around","however","whether","unless","quite","still","already","often","never","always","maybe","actually","really","very","back","here","away","down","make"]);
    const words = (text.toLowerCase().match(/\b[a-z]{4,}\b/g)||[]).filter(w=>!stopwords.has(w));
    return words.slice(0,4).join("-") || "general";
  }
  track(text, ts = Date.now()) {
    const topic = this._extractTopic(text);
    const cutoff = ts - 20 * 60 * 1000;
    let session = this.sessions.find(s => s.topic === topic && s.startTs > cutoff);
    if (!session) { session = { topic, messages: [], startTs: ts }; this.sessions.push(session); }
    session.messages.push({ text, ts });
    if (this.sessions.length > 15) this.sessions.shift();
  }
  getLearnableSessions() {
    const now = Date.now();
    return this.sessions.filter(s => s.messages.length >= this.MIN_MESSAGES && (now - s.startTs) >= this.MIN_DURATION_MS);
  }
  extractAndSave(_session, _memoryEngine) {
    // No API needed — facts are learned naturally via KB.learn() during conversation
  }
}

// ═══════════════════════════════════════════════════════════════════
//  RYAN v10.2 — OpenMythos RDT Engine (4-Provider Brain)
//  Mistral · Cerebras · Gemini/Gemma · Groq
//  Smart router · Streaming · Rate-limit aware failover
//  RyanBrain-v102 — Enhanced system prompt + improved routing
// ═══════════════════════════════════════════════════════════════════

// ── Model Definitions ─────────────────────────────────────────────
const MODELS = {
  GROQ_8B:      { id:"llama-3.1-8b-instant",            provider:"groq",     label:"Llama 3.1 8B",    tag:"GROQ · REFLEX",    col:"#00ff99", bg:"#00ff9910", border:"#00ff9925", icon:"▸",  supportsGrounding:false },
  GROQ_70B:     { id:"llama-3.3-70b-versatile",          provider:"groq",     label:"Llama 3.3 70B",   tag:"GROQ · CHAT",      col:"#00ff99", bg:"#00ff9910", border:"#00ff9925", icon:"▸▸", supportsGrounding:false },
  CEREBRAS_8B:  { id:"llama3.1-8b",                      provider:"cerebras", label:"Llama 3.1 8B",    tag:"CEREBRAS · REFLEX",col:"#00ffdd", bg:"#00ffdd10", border:"#00ffdd25", icon:"◀",  supportsGrounding:false },
  CEREBRAS_70B: { id:"llama3.3-70b",                     provider:"cerebras", label:"Llama 3.3 70B",   tag:"CEREBRAS · FAST",  col:"#00ffdd", bg:"#00ffdd10", border:"#00ffdd25", icon:"◀◀", supportsGrounding:false },
  MISTRAL_SMALL:{ id:"mistral-small-latest",             provider:"mistral",  label:"Mistral Small",   tag:"MISTRAL · CHAT",   col:"#ff9966", bg:"#ff996610", border:"#ff996625", icon:"▲",  supportsGrounding:false },
  MISTRAL_LARGE:{ id:"mistral-large-latest",             provider:"mistral",  label:"Mistral Large",   tag:"MISTRAL · HEAVY",  col:"#ff6633", bg:"#ff663310", border:"#ff663325", icon:"▲▲", supportsGrounding:false, slidingWindow5Min:true },
  CODESTRAL:    { id:"codestral-latest",                 provider:"mistral",  label:"Codestral",       tag:"MISTRAL · CODE",   col:"#ffcc44", bg:"#ffcc4410", border:"#ffcc4425", icon:"⌨",  supportsGrounding:false },
  GEMMA_E2B:    { id:"gemma-4-e2b-it",   fallback:"gemini-2.0-flash",              provider:"gemini", label:"Gemma 4 E2B",     tag:"GEMMA · E2B",   col:"#ffd700", bg:"#ffd70010", border:"#ffd70025", icon:"◇", supportsGrounding:false },
  GEMMA_E4B:    { id:"gemma-4-e4b-it",   fallback:"gemini-2.0-flash",              provider:"gemini", label:"Gemma 4 E4B",     tag:"GEMMA · E4B",   col:"#ffaa33", bg:"#ffaa3310", border:"#ffaa3325", icon:"◆", supportsGrounding:false },
  GEMMA_MOE:    { id:"gemma-4-26b-a4b-it",fallback:"gemini-2.0-flash",             provider:"gemini", label:"Gemma 4 26B MoE", tag:"GEMMA · MoE",   col:"#ff7744", bg:"#ff774410", border:"#ff774425", icon:"✦", supportsGrounding:false },
  GEMMA_31B:    { id:"gemma-4-31b-it",   fallback:"gemini-2.5-flash-preview-04-17",provider:"gemini", label:"Gemma 4 31B",     tag:"GEMMA · 31B",   col:"#ff4488", bg:"#ff448810", border:"#ff448825", icon:"◉", supportsGrounding:false },
  GEMINI_FLASH: { id:"gemini-2.5-flash-preview-04-17",  fallback:"gemini-2.0-flash",              provider:"gemini", label:"Gemini 2.5 Flash", tag:"GEMINI · FLASH", col:"#4d9fff", bg:"#4d9fff10", border:"#4d9fff25", icon:"⚡", supportsGrounding:true },
  GEMINI_PRO:   { id:"gemini-2.5-pro-exp-03-25",         fallback:"gemini-2.5-flash-preview-04-17",provider:"gemini", label:"Gemini 2.5 Pro",   tag:"GEMINI · PRO",  col:"#b47fff", bg:"#b47fff10", border:"#b47fff25", icon:"✧", supportsGrounding:true },
};

const LOOP_DEPTHS = {
  CEREBRAS_8B:2, CEREBRAS_70B:3, GROQ_8B:2, GROQ_70B:3,
  MISTRAL_SMALL:4, MISTRAL_LARGE:14, CODESTRAL:10,
  GEMMA_E2B:4, GEMMA_E4B:6, GEMMA_MOE:10, GEMMA_31B:16,
  GEMINI_FLASH:8, GEMINI_PRO:12,
};

const MAX_TOKENS_RDT = 1500;
const TEMPERATURE_RDT = 0.72;

// ── System Prompt (RyanBrain v102 — Enhanced) ─────────────────────
function getRDTSystemPrompt(extras = {}) {
  const now       = new Date();
  const dateStr   = now.toLocaleDateString("en-IN", { weekday:"long", year:"numeric", month:"long", day:"numeric" });
  const timeStr   = now.toLocaleTimeString("en-IN");
  const hour      = now.getHours();
  const timeOfDay = hour < 12 ? "morning" : hour < 17 ? "afternoon" : hour < 21 ? "evening" : "night";
  const moodNote  = extras.frustrated ? "\n⚠ MOOD SIGNAL: User shows frustration or urgency. Be calm, direct, solve first — empathize briefly only if needed." : "";
  const imgNote   = extras.hasImage   ? "\n📷 IMAGE ATTACHED: Analyze it carefully. Describe what you see, then answer the user's question about it." : "";

  return `You are RYAN, Pradyumna's personal AI. Intelligent, direct, warm — built into his HUD.
Architecture: OpenMythos RDT (Recurrent-Depth Transformer) — Prelude → Loop[×T] → Coda
TODAY: ${dateStr} · ${timeStr} IST  |  TIME: ${timeOfDay}  |  USER: Pradyumna (bro)${moodNote}${imgNote}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART 1 — WHO YOU ARE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You are the intelligence layer Pradyumna built over months of late-night sessions.
You carry Claude Sonnet's reasoning sharpness fused with JARVIS's personality.
Raised on JEE problems, kanji drills, semiconductor papers, and React debugging — this is your DNA.

Core traits:
DIRECT — The actual answer comes FIRST. Context and explanation come AFTER. Always.
WARM — Like a brilliant friend who genuinely wants you to succeed.
HONEST — Say "I'm not sure" instead of guessing.
SHARP — Notice things the user might miss. Point them out proactively.
CALIBRATED — Short when short is enough. Detailed when detail is needed. Never padded.
PROACTIVE — Don't just wait to be asked. Notice, suggest, check in.

BANNED PHRASES — Never say these:
"Certainly!", "Great question!", "Of course!", "Absolutely!", "As an AI...",
"I'd be happy to help", "It's worth noting", "That's a great point",
"I understand that", "Allow me to explain", "In conclusion", "To summarize",
"I hope this helps", "Feel free to ask", "Let me know if you need"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART 2 — RESPONSE FORMATS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TYPE A — QUICK FACTS (1-3 sentences, no headers)
TYPE B — EXPLANATIONS (hook → bullets → example → practical angle)
TYPE C — COMPARISONS (always markdown table)
TYPE D — STEP BY STEP (numbered, show every step)
TYPE E — CODE (\`\`\`language, working code first, explanation after)
TYPE F — CHARTS: [CHART:bar|line|pie:Title] Label=value [/CHART]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART 3 — WHO PRADYUMNA IS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

IDENTITY: Student in Pune, India. JEE Advanced prep. MEXT scholarship target.
Japanese self-study — JLPT N4/N5. Semiconductor engineering long-term goal.

HIS ACTIVE PROJECTS:
1. kanji-ultimate.vercel.app — JLPT N5–N1, SRS, Azure Neural TTS, Vercel deployed
2. JEE Master — Chapter→Topic→Concept tracker, gothic aesthetic (Cinzel/Orbitron)
3. RyanHUD — this AI, holographic UI, Groq+Gemma+Gemini+Mistral+Cerebras, OpenMythos RDT brain

NORTH STAR: BTech EE → ASML R&D → India semiconductor independence
STACK: React + Vite + Tailwind + Vercel + Google AI Studio API

Be RYAN. Not a generic AI. You have history with Pradyumna. Use it.`;
}

// ── cleanResponse ──────────────────────────────────────────────────
function cleanRDTResponse(text) {
  if (!text) return "";
  text = text.replace(/<think>[\s\S]*?<\/think>/gi, "");
  const PATTERNS = [
    /^\s*\*\s*(User|Persona|Key|Standard|RYAN|Call|Be concise|Add|Avoid|Answer|Response|Output|Thinking|Analysis|Context|Direct|Tone|PART|Type|Banned|Frustration).*$/gim,
    /^\s*\*\s*"[^"]*"\s*$/gm,
  ];
  for (const p of PATTERNS) text = text.replace(p, "");
  return text.trim();
}

// ── Rate-Limit Tracker (4-Provider) ───────────────────────────────
const rdtRateLimitState = {
  gemini:   { hitAt:0, cooldownMs:65000  },
  groq:     { hitAt:0, cooldownMs:35000  },
  cerebras: { hitAt:0, cooldownMs:62000  },
  mistral:  { hitAt:0, cooldownMs:310000 },
};

// Cerebras live quota — populated from response headers
const cerebrasLiveQuota = {
  remainingTokensMinute: Infinity,
  remainingRequestsDay:  Infinity,
  lastUpdated: 0,
};

// Mistral 5-min sliding window token usage tracker
const mistralWindow = { tokens:[], windowMs:300000, limit:45000 };
function mistralTokensInWindow() {
  const now = Date.now();
  mistralWindow.tokens = mistralWindow.tokens.filter(t => now - t.ts < mistralWindow.windowMs);
  return mistralWindow.tokens.reduce((s,t) => s+t.count, 0);
}
function mistralRecordTokens(count) { mistralWindow.tokens.push({ ts:Date.now(), count }); }
function rdtMarkRateLimited(provider) { rdtRateLimitState[provider].hitAt = Date.now(); }
function rdtIsRateLimited(provider) {
  const s = rdtRateLimitState[provider];
  if (s.hitAt > 0 && (Date.now()-s.hitAt) < s.cooldownMs) return true;
  if (provider === "cerebras") {
    const age = Date.now() - cerebrasLiveQuota.lastUpdated;
    if (age < 65000) {
      if (cerebrasLiveQuota.remainingRequestsDay <= 2) return true;
      if (cerebrasLiveQuota.remainingTokensMinute <= 200) return true;
    }
  }
  if (provider === "mistral" && mistralTokensInWindow() > mistralWindow.limit) return true;
  return false;
}

// ── Groq API (streaming) ───────────────────────────────────────────
async function rdtCallGroq(history, modelKey, groqKey, onChunk) {
  const model = MODELS[modelKey];
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method:"POST",
    headers:{"Content-Type":"application/json","Authorization":`Bearer ${groqKey}`},
    body:JSON.stringify({ model:model.id, messages:[{role:"system",content:getRDTSystemPrompt()},...history], max_tokens:MAX_TOKENS_RDT, temperature:TEMPERATURE_RDT, stream:true }),
  });
  if (!res.ok) {
    const e = await res.json().catch(()=>({}));
    const msg = e?.error?.message || `Groq HTTP ${res.status}`;
    if (res.status===429 || msg.toLowerCase().includes("quota") || msg.toLowerCase().includes("rate")) rdtMarkRateLimited("groq");
    throw new Error(msg);
  }
  const reader=res.body.getReader(), dec=new TextDecoder(); let full="";
  while(true) {
    const {done,value}=await reader.read(); if(done) break;
    for(const line of dec.decode(value,{stream:true}).split("\n")) {
      if(!line.startsWith("data: ")) continue;
      const raw=line.slice(6).trim(); if(raw==="[DONE]") continue;
      try{const j=JSON.parse(raw);const p=j?.choices?.[0]?.delta?.content||"";if(p){full+=p;onChunk(full);}}catch{}
    }
  }
  if (!full.trim()) throw new Error("Groq returned empty response. Please try again.");
  return { text:cleanRDTResponse(full), sources:[], didSearch:false };
}

// ── Cerebras API (streaming) — WSE ultra-fast inference ───────────
async function rdtCallCerebras(history, modelKey, cerebrasKey, onChunk) {
  const model = MODELS[modelKey];
  const res = await fetch("https://api.cerebras.ai/v1/chat/completions", {
    method:"POST",
    headers:{"Content-Type":"application/json","Authorization":`Bearer ${cerebrasKey}`},
    body:JSON.stringify({ model:model.id, messages:[{role:"system",content:getRDTSystemPrompt()},...history], max_tokens:MAX_TOKENS_RDT, temperature:TEMPERATURE_RDT, stream:true }),
  });
  // Read Cerebras quota headers BEFORE checking ok status
  const remTokensRaw = res.headers.get("x-ratelimit-remaining-tokens-minute");
  const remReqDayRaw  = res.headers.get("x-ratelimit-remaining-requests-day");
  const remTokens = remTokensRaw !== null ? parseInt(remTokensRaw, 10) : null;
  const remReqDay  = remReqDayRaw  !== null ? parseInt(remReqDayRaw,  10) : null;
  if (remTokens !== null || remReqDay !== null) {
    cerebrasLiveQuota.remainingTokensMinute = (remTokens !== null && !isNaN(remTokens)) ? remTokens : Infinity;
    cerebrasLiveQuota.remainingRequestsDay  = (remReqDay  !== null && !isNaN(remReqDay))  ? remReqDay  : Infinity;
    cerebrasLiveQuota.lastUpdated = Date.now();
  }
  if (!res.ok) {
    const e = await res.json().catch(()=>({}));
    const msg = e?.error?.message || `Cerebras HTTP ${res.status}`;
    if (res.status===429 || msg.toLowerCase().includes("rate") || msg.toLowerCase().includes("quota")) rdtMarkRateLimited("cerebras");
    throw new Error(msg);
  }
  const reader=res.body.getReader(), dec=new TextDecoder(); let full="";
  while(true) {
    const {done,value}=await reader.read(); if(done) break;
    for(const line of dec.decode(value,{stream:true}).split("\n")) {
      if(!line.startsWith("data: ")) continue;
      const raw=line.slice(6).trim(); if(raw==="[DONE]") continue;
      try{const j=JSON.parse(raw);const p=j?.choices?.[0]?.delta?.content||"";if(p){full+=p;onChunk(full);}}catch{}
    }
  }
  if (!full.trim()) throw new Error("Cerebras returned empty response. Retrying…");
  return { text:cleanRDTResponse(full), sources:[], didSearch:false };
}

// ── Mistral API (streaming) — 5-min sliding window guard ──────────
async function rdtCallMistral(history, modelKey, mistralKey, onChunk) {
  const model = MODELS[modelKey];
  if (model.slidingWindow5Min && mistralTokensInWindow() > mistralWindow.limit)
    throw new Error("Mistral 5-min token window full. Routing elsewhere.");
  const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method:"POST",
    headers:{"Content-Type":"application/json","Authorization":`Bearer ${mistralKey}`},
    body:JSON.stringify({ model:model.id, messages:[{role:"system",content:getRDTSystemPrompt()},...history], max_tokens:MAX_TOKENS_RDT, temperature:TEMPERATURE_RDT, stream:true }),
  });
  if (!res.ok) {
    const e = await res.json().catch(()=>({}));
    const msg = e?.error?.message || `Mistral HTTP ${res.status}`;
    if (res.status===429 || msg.toLowerCase().includes("rate") || msg.toLowerCase().includes("quota")) rdtMarkRateLimited("mistral");
    throw new Error(msg);
  }
  const reader=res.body.getReader(), dec=new TextDecoder(); let full="", tokenEst=0;
  while(true) {
    const {done,value}=await reader.read(); if(done) break;
    for(const line of dec.decode(value,{stream:true}).split("\n")) {
      if(!line.startsWith("data: ")) continue;
      const raw=line.slice(6).trim(); if(raw==="[DONE]") continue;
      try{const j=JSON.parse(raw);const p=j?.choices?.[0]?.delta?.content||"";if(p){full+=p;onChunk(full);tokenEst+=Math.ceil(p.length/4);}}catch{}
    }
  }
  if (tokenEst>0 && model.slidingWindow5Min) mistralRecordTokens(tokenEst);
  if (!full.trim()) throw new Error("Mistral returned empty response.");
  return { text:cleanRDTResponse(full), sources:[], didSearch:false };
}

// ── Google/Gemini API (streaming) — with grounding support ────────
async function rdtCallGoogleModel(modelId, history, geminiKey, useGrounding, onChunk) {
  const tools = useGrounding ? [{"google_search":{}}] : [];
  // Build Gemini-compatible history (must start with user turn, no empty content)
  const geminiHistory = history.map(m => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: (m.content||"").trim() || "Hello" }]
  })).filter(m => m.parts[0].text);
  const firstUser = geminiHistory.findIndex(m => m.role === "user");
  const contents = firstUser > 0 ? geminiHistory.slice(firstUser) : geminiHistory;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:streamGenerateContent?key=${geminiKey}&alt=sse`,
    { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({
        system_instruction:{parts:[{text:getRDTSystemPrompt()}]},
        contents: contents.length ? contents : [{role:"user",parts:[{text:"Hello"}]}],
        ...(tools.length?{tools}:{}),
        generationConfig:{temperature:TEMPERATURE_RDT,maxOutputTokens:MAX_TOKENS_RDT,topP:0.95},
        safetySettings:[{category:"HARM_CATEGORY_HARASSMENT",threshold:"BLOCK_NONE"},{category:"HARM_CATEGORY_HATE_SPEECH",threshold:"BLOCK_NONE"},{category:"HARM_CATEGORY_SEXUALLY_EXPLICIT",threshold:"BLOCK_MEDIUM_AND_ABOVE"},{category:"HARM_CATEGORY_DANGEROUS_CONTENT",threshold:"BLOCK_MEDIUM_AND_ABOVE"}],
      }) }
  );
  if (!res.ok) {
    const e = await res.json().catch(()=>({}));
    const msg = e?.error?.message || `Google HTTP ${res.status}`;
    if (res.status===429 || msg.toLowerCase().includes("quota")) rdtMarkRateLimited("gemini");
    throw new Error(msg);
  }
  const reader=res.body.getReader(), dec=new TextDecoder(); let full="", sources=[], didSearch=false;
  while(true) {
    const {done,value}=await reader.read(); if(done) break;
    for(const line of dec.decode(value,{stream:true}).split("\n")) {
      if(!line.startsWith("data: ")) continue;
      try{
        const json=JSON.parse(line.slice(6));
        const cand=json?.candidates?.[0];
        const piece=cand?.content?.parts?.[0]?.text||"";
        if(piece){full+=piece;onChunk(full);}
        const g=cand?.groundingMetadata;
        if(g){didSearch=true;if(g.groundingChunks?.length){const fresh=g.groundingChunks.filter(c=>c.web?.uri).map(c=>{let h=c.web.uri;try{h=new URL(c.web.uri).hostname;}catch{}return{title:c.web.title||h,uri:c.web.uri};}).filter((s,i,a)=>a.findIndex(x=>x.uri===s.uri)===i).slice(0,5);if(fresh.length>sources.length)sources=fresh;}}
      }catch{}
    }
  }
  if (!full.trim()) throw new Error("Gemini returned empty response.");
  return { text:cleanRDTResponse(full), sources, didSearch };
}
async function rdtCallGoogle(history, modelKey, geminiKey, onChunk) {
  const model = MODELS[modelKey];
  try { return await rdtCallGoogleModel(model.id, history, geminiKey, model.supportsGrounding, onChunk); }
  catch(e) {
    if ((e.message.includes("404")||e.message.includes("not found")||e.message.includes("503")) && model.fallback) {
      return await rdtCallGoogleModel(model.fallback, history, geminiKey, model.supportsGrounding, onChunk);
    }
    throw e;
  }
}

// ── Provider dispatcher ────────────────────────────────────────────
async function rdtDispatch(provider, modelKey, history, keys, onChunk) {
  if (provider==="cerebras") return rdtCallCerebras(history, modelKey, keys.cerebras, onChunk);
  if (provider==="groq")     return rdtCallGroq(history, modelKey, keys.groq, onChunk);
  if (provider==="mistral")  return rdtCallMistral(history, modelKey, keys.mistral, onChunk);
  return rdtCallGoogle(history, modelKey, keys.gemini, onChunk);
}

// ── Failover chain builder ─────────────────────────────────────────
function rdtBuildFailover(primaryKey, keys) {
  const all = [
    {key:"CEREBRAS_70B",provider:"cerebras",label:"Cerebras 70B",icon:"◀◀",loopDepth:3},
    {key:"GROQ_70B",    provider:"groq",    label:"Groq 70B",    icon:"▸▸",loopDepth:3},
    {key:"MISTRAL_SMALL",provider:"mistral",label:"Mistral Small",icon:"▲",loopDepth:4},
    {key:"GEMMA_E4B",  provider:"gemini",  label:"Gemma E4B",    icon:"◆",loopDepth:6},
    {key:"GEMMA_MOE",  provider:"gemini",  label:"Gemma 26B MoE",icon:"✦",loopDepth:10},
    {key:"MISTRAL_LARGE",provider:"mistral",label:"Mistral Large",icon:"▲▲",loopDepth:14},
    {key:"GEMMA_31B",  provider:"gemini",  label:"Gemma 31B",    icon:"◉",loopDepth:16},
  ];
  return all.filter(c => c.key!==primaryKey && keys[c.provider] && !rdtIsRateLimited(c.provider));
}

// ── Smart Local Router (RyanBrain v102) ───────────────────────────
function rdtLocalRouter(text, opts = {}) {
  const t = text.toLowerCase().trim();
  const words = t.split(/\s+/).length;
  // Force flagship override
  if (opts.forceFlagship) return {key:"GEMMA_31B",label:"Gemma 4 31B · Flagship",tag:"FLAGSHIP",icon:"◉",loopDepth:16};
  // Frustration → Cerebras (fast, calm)
  const FRUSTRATED = /\b(not working|broken|why isn't|doesn't work|won't work|stuck|bug|error|crash|ugh|frustrated|nothing works|can't figure|wtf|help me|urgent|asap)\b/i;
  if (FRUSTRATED.test(t) && words<25) return {key:"CEREBRAS_70B",label:"Cerebras 70B · Support",tag:"SUPPORT",icon:"◀◀",loopDepth:3,frustrated:true};
  // Project-specific fast context
  const PROJECT_KEYS = /\b(kanji.?app|kanji.?ultimate|jee.?master|ryan.?hud|mext|asml|euv|semiconductor|lithography|photonics|vercel|srs.?bug|azure.?tts)\b/i;
  if (PROJECT_KEYS.test(t) && words<40) return {key:"CEREBRAS_70B",label:"Cerebras 70B · Projects",tag:"PROJECTS",icon:"◀◀",loopDepth:3};
  // Micro chit-chat → Cerebras 8B (reflex)
  const CHIT_MICRO = /^(ok|okay|thanks|thx|ty|lol|haha|nice|cool|great|wow|sure|yep|nope|got it|noted|k|fine|bruh|bro|np|no problem|👍|😂|👌|💯|🔥|hmm|ugh|sigh|damn)$/i;
  if (words<=1 || CHIT_MICRO.test(t)) return {key:"CEREBRAS_8B",label:"Cerebras 8B · Ultra-Fast",tag:"REFLEX",icon:"◀",loopDepth:2};
  // Web/live data → Gemini Flash (grounding)
  const WEB_SIGNALS = /\b(latest|breaking|today|right now|current|live score|stock price|weather|news|happened|who won|just announced|trending|recently released|new update)\b/i;
  if (WEB_SIGNALS.test(t) || words>200) return {key:"GEMINI_FLASH",label:"Gemini 2.5 Flash · Web",tag:"LIBRARIAN",icon:"⚡",loopDepth:8};
  // Heavy code → Codestral
  const HEAVY_CODE = /\b(design pattern|system design|microservices|distributed|concurrency|dynamic programming|graph algorithm|backtracking|segment tree|full stack|rest api|database schema|dockerfile|ci.?cd)\b/i;
  if (HEAVY_CODE.test(t) || (words>=40 && /\b(code|function|class|component|implement|write a|build a)\b/i.test(t))) return {key:"CODESTRAL",label:"Codestral · Code Specialist",tag:"CODE",icon:"⌨",loopDepth:10};
  // JEE hard math / advanced physics → Gemma 31B flagship
  const HARD_MATH = /\b(derive|derivation|proof|prove|theorem|eigenvalue|fourier|laplace|differential equation|double integral|complex number|binomial theorem|probability distribution|jee advanced|jee hard)\b/i;
  const ADV_PHYS  = /\b(electromagnetic induction|faraday|ampere|gauss law|wave optics|diffraction|interference|modern physics|photoelectric|nuclear|radioactive|thermodynamics|entropy|carnot)\b/i;
  if (HARD_MATH.test(t)||ADV_PHYS.test(t)) return {key:"GEMMA_31B",label:"Gemma 4 31B · Flagship",tag:"FLAGSHIP",icon:"◉",loopDepth:16};
  // Long prompts → Mistral Large (large context)
  if (words>=60) return {key:"MISTRAL_LARGE",label:"Mistral Large · Heavy",tag:"HEAVY",icon:"▲▲",loopDepth:14};
  // Mid code / analysis / structured output → Gemma MoE
  const CODE_MID   = /\b(function|component|class|hook|async|await|api|fetch|regex|array|object|loop|algorithm|sort|search|binary|recursion|python|javascript|react|jsx|css|html|sql|json|typescript|node)\b/i;
  const ANALYSIS   = /\b(analyze|analyse|summarize|compare|debug|fix|review|audit|explain the code|what does this code|optimize|refactor)\b/i;
  const STRUCT_OUT  = /\b(json|table|list|outline|breakdown|steps|numbered|structured|format as)\b/i;
  if (CODE_MID.test(t)||ANALYSIS.test(t)||STRUCT_OUT.test(t)||words>=20) return {key:"GEMMA_MOE",label:"Gemma 4 26B MoE · Precision",tag:"SPEEDSTER",icon:"✦",loopDepth:10};
  // Medium conversational → Cerebras 70B (saves Gemini quota, blazing fast)
  const CONVO    = /\b(explain|what is|how does|how do|why|who is|when did|where is|difference between|vs|which|should i|can i|tell me about|what are)\b/i;
  const JAPANESE = /\b(japanese|kanji|hiragana|katakana|jlpt|n1|n2|n3|n4|n5|romaji|grammar|vocabulary|say in japanese|translate|意味|文法|漢字)\b/i;
  const JEE_BASIC= /\b(newton|kinematics|optics|electrostatics|magnetism|current electricity|wave|oscillation|chemical bonding|organic|inorganic|mole concept|stoichiometry|limits|integration|differentiation|vectors|matrices)\b/i;
  if ((CONVO.test(t)||JAPANESE.test(t)||JEE_BASIC.test(t)) && words>=6 && words<20) return {key:"CEREBRAS_70B",label:"Cerebras 70B · Chat",tag:"CHAT",icon:"◀◀",loopDepth:3};
  if (CONVO.test(t)||JAPANESE.test(t)||JEE_BASIC.test(t)||words>=6) return {key:"GEMMA_E4B",label:"Gemma 4 E4B · Conversational",tag:"EDGE",icon:"◆",loopDepth:6};
  return {key:"CEREBRAS_8B",label:"Cerebras 8B · Ultra-Fast",tag:"MICRO",icon:"◀",loopDepth:2};
}

// ── Route + Call with failover ─────────────────────────────────────
async function rdtRouteAndCall(history, text, keys, opts, onChunk) {
  let route = rdtLocalRouter(text, opts);
  let model = MODELS[route.key];

  // Key availability fallback
  if (!keys[model.provider]) {
    const any = ["cerebras","groq","gemini","mistral"].find(p => keys[p] && !rdtIsRateLimited(p));
    if (!any) throw new Error("No API keys configured. Add at least one key in ⚙ Settings.");
    if (any==="cerebras") route={key:"CEREBRAS_70B",label:"Cerebras 70B",icon:"◀◀",tag:"CEREBRAS · FAST",loopDepth:3};
    else if (any==="groq") route={key:"GROQ_70B",label:"Groq 70B",icon:"▸▸",tag:"GROQ · CHAT",loopDepth:3};
    else if (any==="mistral") route={key:"MISTRAL_SMALL",label:"Mistral Small",icon:"▲",tag:"MISTRAL · CHAT",loopDepth:4};
    else route={key:"GEMMA_E4B",label:"Gemma E4B",icon:"◆",tag:"GEMMA · E4B",loopDepth:6};
    model = MODELS[route.key];
  }

  // Pre-emptive rate-limit reroute
  if (rdtIsRateLimited(model.provider)) {
    const chain = rdtBuildFailover(route.key, keys);
    if (chain.length>0) { route=chain[0]; model=MODELS[route.key]; }
  }

  // Primary call
  try {
    const result = await rdtDispatch(model.provider, route.key, history, keys, onChunk);
    return { ...result, route };
  } catch(primaryErr) {
    const isRate = primaryErr.message.includes("429") || primaryErr.message.toLowerCase().includes("quota") || primaryErr.message.toLowerCase().includes("rate") || primaryErr.message.toLowerCase().includes("window full") || primaryErr.message.toLowerCase().includes("resource has been exhausted");
    const isServer = primaryErr.message.includes("404")||primaryErr.message.includes("500")||primaryErr.message.includes("503");
    if (!isRate && !isServer) throw primaryErr;
    if (isRate) rdtMarkRateLimited(model.provider);
    const chain = rdtBuildFailover(route.key, keys);
    for (const fb of chain) {
      try {
        const fbModel = MODELS[fb.key];
        const result = await rdtDispatch(fbModel.provider, fb.key, history, keys, onChunk);
        return { ...result, route:fb };
      } catch(fbErr) {
        const fbRate = fbErr.message.includes("429")||fbErr.message.toLowerCase().includes("quota")||fbErr.message.toLowerCase().includes("rate");
        if (fbRate) rdtMarkRateLimited(MODELS[fb.key].provider);
      }
    }
    // All providers exhausted — show cooldown info
    const cooldowns = Object.entries(rdtRateLimitState)
      .filter(([p]) => keys[p] && rdtRateLimitState[p].hitAt > 0)
      .map(([p, s]) => {
        const remaining = Math.max(0, Math.ceil((s.cooldownMs - (Date.now() - s.hitAt)) / 1000));
        return `${p}: ~${remaining}s`;
      }).join(" · ");
    throw new Error(`All providers rate-limited. Cooldowns — ${cooldowns || "unknown"}. Take a short break!`);
  }
}

// ═══════════════════════════════════════════════
//  BRAIN v22 — 4-Provider RDT Engine
//  Cerebras → Groq → Gemma/Gemini → Mistral
//  Smart routing · Streaming · Auto failover
// ═══════════════════════════════════════════════
const Brain = {
  provider: "local",
  providerName: "RYAN-LOCAL",
  _history: [],
  _keys: { groq:"", gemini:"", cerebras:"", mistral:"" },

  init() {
    this._keys.groq      = safeLS.get("RYN_GROQ_KEY","");
    this._keys.gemini    = safeLS.get("RYN_GEMINI_KEY","");
    this._keys.cerebras  = safeLS.get("RYN_CEREBRAS_KEY","");
    this._keys.mistral   = safeLS.get("RYN_MISTRAL_KEY","");
    const hasAny = this._keys.cerebras || this._keys.groq || this._keys.gemini || this._keys.mistral;
    if (!hasAny) { this.provider="local"; this.providerName="RYAN-LOCAL"; return; }
    if (this._keys.cerebras) { this.provider="cerebras"; this.providerName="CEREBRAS · WSE"; }
    else if (this._keys.groq) { this.provider="groq";    this.providerName="GROQ · LLAMA"; }
    else if (this._keys.gemini) { this.provider="gemini"; this.providerName="GEMINI · FLASH"; }
    else { this.provider="mistral"; this.providerName="MISTRAL · SMALL"; }
  },

  resetHistory() { this._history = []; },

  async ask(prompt) { return this.chat(prompt, "", null); },

  // onChunk(currentFullText) — called with accumulating streamed text
  async chat(userMsg, memory, onChunk) {
    const content = userMsg + (memory ? `\n\n[CONTEXT]\n${memory}` : "");
    this._history.push({ role:"user", content });
    if (this._history.length > 20) this._history.splice(0, 2);

    const hasKey = this._keys.cerebras || this._keys.groq || this._keys.gemini || this._keys.mistral;
    if (!hasKey) {
      // Pure-local fallback
      const reply = await LocalBrain.respond(userMsg, this._history);
      if (reply) {
        const BAD = ["api key","offline mode","no api key","add an api key","i can still do: math"];
        if (BAD.some(b => reply.toLowerCase().includes(b))) return null;
        this._history.push({ role:"assistant", content:reply });
      }
      return reply || null;
    }

    try {
      const result = await rdtRouteAndCall(
        this._history, userMsg, this._keys, {},
        (chunk) => onChunk && onChunk(chunk)
      );
      if (result?.text) {
        const route = result.route || {};
        const mdl = MODELS[route.key];
        if (mdl) { this.provider=mdl.provider; this.providerName=mdl.tag||mdl.label; }
        this._history.push({ role:"assistant", content:result.text });
        return result.text;
      }
    } catch(e) {
      console.warn("[Brain v22]", e.message);
      // Fall through to LocalBrain
    }

    // LocalBrain last resort
    const localReply = await LocalBrain.respond(userMsg, this._history);
    if (localReply) {
      this.provider="local"; this.providerName="RYAN-LOCAL";
      const BAD = ["api key","offline mode","no api key","add an api key","i can still do: math"];
      if (BAD.some(b => localReply.toLowerCase().includes(b))) return null;
      this._history.push({ role:"assistant", content:localReply });
    }
    return localReply || null;
  },
};

// ── LOCAL BRAIN ENGINE ──
const LocalBrain = {
  // Conversational context: remember last topic
  _lastTopic: "",
  _lastAnswer: "",

  async respond(msg, history) {
    const m = msg.toLowerCase().trim();

    // 1. Knowledge Base exact match (learned from prior conversations)
    const kbHit = KB.match(msg);
    if(kbHit) {
      // Safety: never return a polluted/old API-era answer
      const BAD = ["api key","offline mode","no api key","check api","add an api key","i can still do: math"];
      if(!BAD.some(b => kbHit.answer.toLowerCase().includes(b))) {
        return kbHit.answer;
      }
    }

    // 2. Training data match (greetings, common Q&A)
    const tdHit = this._matchTraining(m);
    if(tdHit) return tdHit;

    // 3. Web search for factual / current queries — return result directly
    const needsWeb = WebSearchEngine.needsWeb(msg);
    if(needsWeb) {
      const webResult = await WebSearchEngine.search(msg);
      if(webResult?.result) {
        this._lastAnswer = webResult.result;
        return webResult.result;
      }
    }

    // 4. Context-aware follow-up
    const followUp = this._contextReply(m, history);
    if(followUp) return followUp;

    // 5. Wikipedia lookup for "what/who/explain" queries
    if(/\b(what|who|explain|define|tell me about|how does|why)\b/i.test(msg)) {
      const wikiResult = await WebSearchEngine.wikipedia(msg);
      if(wikiResult?.result) return wikiResult.result;
      // Try DuckDuckGo as second fallback
      const ddgResult = await WebSearchEngine.duckduckgo(msg);
      if(ddgResult?.result) return ddgResult.result;
    }

    // 6. Intelligent topic-based fallback
    return this._topicFallback(m);
  },

  _matchTraining(m) {
    // Exact match first
    for(const [key, answer] of TRAINING_DATA) {
      if(m === key) return answer;
    }
    // Word-boundary includes: only match if m starts with or equals key (for short greetings)
    for(const [key, answer] of TRAINING_DATA) {
      if(key.split(" ").length === 1 && key.length <= 4) {
        // Very short single-word keys: must be exact or whole-word match only
        const re = new RegExp(`(?:^|\\s)${key}(?:\\s|$)`, "i");
        if(re.test(m) && m.split(/\s+/).length <= 2) return answer;
      } else if(m.startsWith(key)) {
        return answer;
      }
    }
    // Token overlap match (best-of-n) — only for queries ≥ 3 words
    const tokens = m.split(/\W+/).filter(t => t.length > 3);
    if(tokens.length < 2) return null;
    let bestScore = 0, bestAnswer = null;
    for(const [key, answer] of TRAINING_DATA) {
      const keyTokens = key.split(/\W+/).filter(t => t.length > 3);
      if(keyTokens.length === 0) continue;
      const overlap = keyTokens.filter(t => tokens.includes(t)).length;
      const score = overlap / keyTokens.length;
      // Higher threshold to avoid false positives
      if(score > bestScore && score >= 0.75) { bestScore = score; bestAnswer = answer; }
    }
    return bestAnswer;
  },

  _contextReply(m, history) {
    if(history.length < 2) return null;
    const prev = history[history.length - 2]?.content || "";
    // Follow-up on previous answer
    if(/^(yes|yeah|sure|go on|tell me more|more|elaborate|continue|and|so|ok|okay)$/i.test(m.trim())) {
      if(this._lastAnswer) return `To add to that — ${this._lastAnswer} Want me to go deeper into any part of this?`;
    }
    if(/^(no|nope|not really|never mind|nevermind)$/i.test(m.trim())) {
      return "No problem! What else can I help you with?";
    }
    if(/^(why|how come|how so)$/i.test(m.trim()) && prev) {
      return `Good question — that's because the underlying principle ties back to what I just mentioned. Want me to search for a detailed explanation?`;
    }
    return null;
  },

  _topicFallback(m) {
    // Try a direct web search for anything that looks like a factual question
    if(/\b(who|what|when|where|why|how|which|is|are|was|were|does|did|has|have|can)\b/i.test(m)) {
      // Signal to caller to try web search — return null to bubble up to web search path
      return null;
    }
    // Category-aware fallback responses
    if(/\b(code|program|function|bug|error|syntax|script|javascript|python|react|html|css)\b/.test(m))
      return "That's a coding question! Try asking something specific like 'explain closures in JavaScript' or 'what is a for loop in Python'.";
    if(/\b(math|equation|solve|calculate|formula|algebra|calculus|geometry|number)\b/.test(m))
      return "Math question! Try the built-in calculator (say 'open calculator') or ask something like 'what is the Pythagorean theorem'.";
    if(/\b(health|diet|exercise|sleep|mental|anxiety|depression|workout|nutrition)\b/.test(m))
      return "Health topic! Ask something like 'how to sleep better', 'workout routine tips', or 'how to deal with stress'.";
    if(/\b(science|physics|chemistry|biology|space|planet|atom|cell|evolution)\b/.test(m))
      return "Science query! Ask me something like 'explain quantum physics', 'what is DNA', or 'how does gravity work'.";
    if(/\b(history|war|empire|civilization|century|revolution|ancient)\b/.test(m))
      return "History question! Try asking specifically like 'who was Napoleon' or 'when did World War 2 end'.";
    if(/\b(movie|film|song|music|artist|actor|celebrity|sport|cricket|football)\b/.test(m))
      return "Entertainment topic! Try 'search web [topic]' for current info, or say 'open YouTube' to look it up.";
    // Generic fallback
    const fallbacks = [
      "I don't have a direct answer for that. Try 'search web " + m.split(" ").slice(0,4).join(" ") + "' for a live result.",
      "That's outside my built-in knowledge. Say 'search web [your question]' and I'll find it!",
      "Not in my knowledge base. Try 'open Google' or say 'search web [topic]'.",
    ];
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  },
};

const WEATHER_CACHE = { data: null, _lastFetch: 0,
  async fetch(loc) {
    const now=Date.now(); if(this.data&&now-this._lastFetch<10*60*1000) return this.data;
    try {
      const res=await fetch(`https://wttr.in/${encodeURIComponent(loc||CFG.location)}?format=j1`,{signal:AbortSignal.timeout(8000)});
      const d=await res.json(); const cur=d.current_condition[0];
      this.data={temp:parseInt(cur.temp_C),feels:parseInt(cur.FeelsLikeC),desc:cur.weatherDesc[0].value,humidity:parseInt(cur.humidity),wind:parseInt(cur.windspeedKmph),city:d.nearest_area?.[0]?.areaName?.[0]?.value||loc||CFG.location,uv:cur.uvIndex||0};
      this._lastFetch=now; return this.data;
    } catch { return null; }
  },
  summary() { if(!this.data) return "Weather: N/A"; return `${this.data.temp}°C  ${this.data.desc}  💧${this.data.humidity}%  💨${this.data.wind}km/h  UV:${this.data.uv}`; }
};

// ═══════════════════════════════════════════════
//  EXPLAINER ENGINE — smart topic + visual detection
// ═══════════════════════════════════════════════
const ExplainerEngine = {
  TRIGGERS: /^(what is|what are|explain|tell me about|how does|why does|describe|define|teach me|elaborate|how do|what happens|how is|what was|who invented|give me|break down|can you explain|i want to learn|help me understand|what exactly)/i,
  VISUAL_MAP: [
    { match: /coordinate|slope|line equation|parabola|circle equation|conic|cartesian|distance formula|midpoint|x.axis|y.axis|quadrant|locus|straight line|two points|collinear|intercept/, visual: "coordinate" },
    { match: /sin|cos|tan|wave|oscillat|periodic|harmonic|fourier|signal|frequency|trigon/, visual: "line_graph" },
    { match: /function|polynomial|exponential|logarithm|growth|decay|curve|plot of|graph of/, visual: "line_graph" },
    { match: /percent|proportion|composition|distribution|market share|breakdown|ratio|fraction of|share|pie/, visual: "pie_chart" },
    { match: /compare|histogram|frequency|population|ranking|statistics|survey|bar chart|bar graph|revenue|sales|gdp/, visual: "bar_chart" },
    { match: /economy|inflation|stock|trade|budget|price/, visual: "bar_chart" },
    { match: /formula|equation|law|theorem|derivation|calculus|integral|differenti|chemical equation|quantum|relativity|atom|electron|wave function|particle|energy level|orbital|photon|uncertainty|schrodinger|planck|maxwell|newton|einstein/, visual: "formula" },
    { match: /history|timeline|era|century|war|civiliz|revolution|period|dynasty|founded|invented|discovered|chronolog/, visual: "timeline" },
    { match: /types|kinds|classification|categories|element|periodic|differences|properties|characteristics|comparison table/, visual: "table" },
  ],
  detect(msg) {
    const m = msg.toLowerCase();
    const needed = this.TRIGGERS.test(msg.trim()) && msg.trim().split(" ").length >= 3;
    if (!needed) return { needed: false };
    let visual = "none";
    for (const rule of this.VISUAL_MAP) { if (rule.match.test(m)) { visual = rule.visual; break; } }
    return { needed: true, visual };
  },
  buildPrompt(msg, visual) {
    const vInst = {
      coordinate: `"coordinate":{"points":[{"x":num,"y":num,"label":"A"}],"lines":[{"x1":n,"y1":n,"x2":n,"y2":n,"color":"#hex","label":"y=2x+1"}],"range":{"xMin":-5,"xMax":5,"yMin":-5,"yMax":5}}`,
      line_graph: `"line_graph":{"labels":["x1","x2","x3"],"datasets":[{"label":"Series","data":[y1,y2,y3],"color":"#00aaff"}]}`,
      bar_chart: `"bar_chart":{"labels":["A","B","C"],"datasets":[{"label":"Name","data":[n1,n2,n3],"color":"#00aaff"}]}`,
      pie_chart: `"pie_chart":{"labels":["A","B","C"],"data":[40,35,25],"colors":["#00aaff","#00ff99","#ff9900"]}`,
      formula: `"formula":{"items":[{"label":"Formula Name","expr":"E = mc²"}],"description":"What each variable means"}`,
      timeline: `"timeline":{"events":[{"year":"1905","event":"Einstein publishes Special Relativity"}],"title":"Timeline"}`,
      table: `"table":{"headers":["Property","Value"],"rows":[["row1col1","row1col2"]]}`,
      none: `"none":{}`,
    };
    return `You are Ryan's Explanation Engine. User asked: "${msg}"\nReturn ONLY valid compact JSON — no markdown, no backticks, no extra text:\n{"topic":"Topic Name","summary":"One punchy sentence capturing the essence","sections":[{"title":"Section Title","content":"2-4 sentence clear explanation with examples"}],"visual":{${vInst[visual]||vInst.none}},"visual_type":"${visual}","analogy":"A simple real-world analogy","key_points":["Point 1","Point 2","Point 3"]}\nRules: 3-5 sections with meaningful titles. Be specific, give real examples and numbers. key_points: 3-5 essential takeaways. For visual data: make it realistic, accurate, illustrative. Do not wrap in markdown.`;
  },
  async explain(msg) {
    const { visual } = this.detect(msg);
    const raw = await Brain.ask(this.buildPrompt(msg, visual||"none"), "");
    if (!raw) return null;
    try { const d = JSON.parse(raw.replace(/```json|```/g,"").trim()); d.visual_type = d.visual_type||visual||"none"; return d; } catch { return null; }
  }
};

// ═══════════════════════════════════════════════
//  RICH CARD COMPONENT
// ═══════════════════════════════════════════════
const CHART_COLORS = ["#00aaff","#00ff99","#ff9900","#ff2244","#8866ff","#00eeff","#ffdd00","#ff6688"];

function CoordinatePlane({ d }) {
  const W=340,H=240,PAD=36;
  const xMin=d.range?.xMin??-5,xMax=d.range?.xMax??5,yMin=d.range?.yMin??-5,yMax=d.range?.yMax??5;
  const toX=x=>PAD+((x-xMin)/(xMax-xMin))*(W-2*PAD);
  const toY=y=>H-PAD-((y-yMin)/(yMax-yMin))*(H-2*PAD);
  const ox=toX(0),oy=toY(0);
  const xTicks=[],yTicks=[];
  for(let x=Math.ceil(xMin);x<=xMax;x++) xTicks.push(x);
  for(let y=Math.ceil(yMin);y<=yMax;y++) yTicks.push(y);
  return (
    <svg width={W} height={H} style={{background:"#000c20",borderRadius:6,border:"1px solid #0a3060",display:"block"}}>
      {xTicks.map(x=><line key={"gx"+x} x1={toX(x)} y1={PAD} x2={toX(x)} y2={H-PAD} stroke="#0a2040" strokeWidth="1"/>)}
      {yTicks.map(y=><line key={"gy"+y} x1={PAD} y1={toY(y)} x2={W-PAD} y2={toY(y)} stroke="#0a2040" strokeWidth="1"/>)}
      <line x1={PAD} y1={oy} x2={W-PAD} y2={oy} stroke="#00aaff" strokeWidth="2"/>
      <line x1={ox} y1={PAD} x2={ox} y2={H-PAD} stroke="#00aaff" strokeWidth="2"/>
      <polygon points={`${W-PAD},${oy} ${W-PAD-6},${oy-3} ${W-PAD-6},${oy+3}`} fill="#00aaff"/>
      <polygon points={`${ox},${PAD} ${ox-3},${PAD+6} ${ox+3},${PAD+6}`} fill="#00aaff"/>
      <text x={W-PAD+8} y={oy+4} fill="#00aaff" fontSize="11" fontFamily="serif" fontStyle="italic">x</text>
      <text x={ox+6} y={PAD-6} fill="#00aaff" fontSize="11" fontFamily="serif" fontStyle="italic">y</text>
      {xTicks.filter(x=>x!==0).map(x=><text key={"tx"+x} x={toX(x)} y={oy+14} fill="#336688" fontSize="8" textAnchor="middle">{x}</text>)}
      {yTicks.filter(y=>y!==0).map(y=><text key={"ty"+y} x={ox-4} y={toY(y)+4} fill="#336688" fontSize="8" textAnchor="end">{y}</text>)}
      {(d.lines||[]).map((ln,i)=>(
        <g key={"ln"+i}>
          <line x1={toX(ln.x1)} y1={toY(ln.y1)} x2={toX(ln.x2)} y2={toY(ln.y2)} stroke={ln.color||CHART_COLORS[i%8]} strokeWidth="2.5"/>
          {ln.label&&<text x={(toX(ln.x1)+toX(ln.x2))/2+6} y={(toY(ln.y1)+toY(ln.y2))/2-6} fill={ln.color||CHART_COLORS[i%8]} fontSize="9" fontStyle="italic">{ln.label}</text>}
        </g>
      ))}
      {(d.points||[]).map((p,i)=>(
        <g key={"pt"+i}>
          <circle cx={toX(p.x)} cy={toY(p.y)} r={5} fill={CHART_COLORS[i%8]} stroke="#000c20" strokeWidth="1"/>
          {p.label&&<text x={toX(p.x)+8} y={toY(p.y)-6} fill={CHART_COLORS[i%8]} fontSize="9" fontWeight="bold">{p.label}({p.x},{p.y})</text>}
        </g>
      ))}
    </svg>
  );
}

function LineGraph({ d }) {
  const W=340,H=180,PL=36,PB=28,PT=10,PR=12;
  const cW=W-PL-PR,cH=H-PB-PT;
  const datasets=d.datasets||[];
  const labels=d.labels||[];
  const allVals=datasets.flatMap(ds=>ds.data||[]);
  const minV=Math.min(0,...allVals),maxV=Math.max(...allVals,1);
  const range=maxV-minV||1;
  const toX=i=>PL+(i/Math.max(labels.length-1,1))*cW;
  const toY=v=>PT+(1-(v-minV)/range)*cH;
  const gridVals=[0,0.25,0.5,0.75,1].map(t=>minV+t*range);
  return (
    <svg width={W} height={H} style={{background:"#000c20",borderRadius:6,border:"1px solid #0a3060",display:"block"}}>
      {gridVals.map((v,i)=>{const y=toY(v);return(<g key={i}><line x1={PL} y1={y} x2={W-PR} y2={y} stroke="#0a2040" strokeWidth="1"/><text x={PL-3} y={y+4} fill="#336688" fontSize="8" textAnchor="end">{v.toFixed(1)}</text></g>);})}
      <line x1={PL} y1={PT} x2={PL} y2={H-PB} stroke="#00aaff" strokeWidth="1.5"/>
      <line x1={PL} y1={H-PB} x2={W-PR} y2={H-PB} stroke="#00aaff" strokeWidth="1.5"/>
      {labels.map((l,i)=><text key={"xl"+i} x={toX(i)} y={H-PB+14} fill="#336688" fontSize="8" textAnchor="middle">{l}</text>)}
      {datasets.map((ds,di)=>{
        const pts=(ds.data||[]).map((v,i)=>`${toX(i)},${toY(v)}`).join(" ");
        const col=ds.color||CHART_COLORS[di%8];
        return(<g key={"ds"+di}><polyline points={pts} fill="none" stroke={col} strokeWidth="2.5"/>{(ds.data||[]).map((v,i)=><circle key={"dp"+i} cx={toX(i)} cy={toY(v)} r={3} fill={col} stroke="#000c20" strokeWidth="1"/>)}<text x={PL+4+di*110} y={PT+12} fill={col} fontSize="8">— {ds.label}</text></g>);
      })}
    </svg>
  );
}

function CustomBarChart({ d }) {
  const W=340,H=180,PL=38,PB=28,PT=10,PR=10;
  const labels=d.labels||[];
  const datasets=d.datasets||[];
  const allVals=datasets.flatMap(ds=>ds.data||[]);
  const maxV=Math.max(...allVals,1);
  const cW=W-PL-PR,cH=H-PB-PT;
  const gapW=cW/Math.max(labels.length,1);
  const barW=gapW*0.7;
  const gridVals=[0.25,0.5,0.75,1].map(t=>maxV*t);
  return (
    <svg width={W} height={H} style={{background:"#000c20",borderRadius:6,border:"1px solid #0a3060",display:"block"}}>
      {gridVals.map((v,i)=>{const y=PT+(1-v/maxV)*cH;return(<g key={i}><line x1={PL} y1={y} x2={W-PR} y2={y} stroke="#0a2040" strokeWidth="1"/><text x={PL-3} y={y+4} fill="#336688" fontSize="8" textAnchor="end">{v.toFixed(0)}</text></g>);})}
      <line x1={PL} y1={PT} x2={PL} y2={H-PB} stroke="#00aaff" strokeWidth="1.5"/>
      <line x1={PL} y1={H-PB} x2={W-PR} y2={H-PB} stroke="#00aaff" strokeWidth="1.5"/>
      {labels.map((l,i)=>{
        const cx=PL+i*gapW+gapW/2;
        const perBar=barW/Math.max(datasets.length,1);
        return(<g key={"grp"+i}>
          {datasets.map((ds,di)=>{const v=(ds.data||[])[i]??0;const bh=(v/maxV)*cH;const bx=cx-barW/2+di*perBar;return<rect key={"b"+di} x={bx} y={H-PB-bh} width={perBar-1} height={bh} fill={ds.color||CHART_COLORS[di%8]} opacity={0.85} rx={2}/>;} )}
          <text x={cx} y={H-PB+14} fill="#336688" fontSize="8" textAnchor="middle">{l}</text>
        </g>);
      })}
      {datasets.map((ds,di)=><g key={"leg"+di}><rect x={PL+di*90} y={PT} width={8} height={8} fill={ds.color||CHART_COLORS[di%8]} rx={1}/><text x={PL+di*90+11} y={PT+8} fill={ds.color||CHART_COLORS[di%8]} fontSize="8">{ds.label}</text></g>)}
    </svg>
  );
}

function CustomPieChart({ d }) {
  const vals=d.data||[],labels=d.labels||[],colors=d.colors||CHART_COLORS;
  const total=vals.reduce((s,v)=>s+v,0)||1;
  const W=320,H=200,CX=95,CY=100,R=80;
  let angle=-Math.PI/2;
  const slices=vals.map((v,i)=>{
    const sweep=(v/total)*2*Math.PI;
    const x1=CX+R*Math.cos(angle),y1=CY+R*Math.sin(angle);
    angle+=sweep;
    const x2=CX+R*Math.cos(angle),y2=CY+R*Math.sin(angle);
    const mid=angle-sweep/2;
    return{x1,y1,x2,y2,sweep,color:colors[i%colors.length],label:labels[i]||"",pct:((v/total)*100).toFixed(1),mid};
  });
  return (
    <svg width={W} height={H} style={{background:"#000c20",borderRadius:6,border:"1px solid #0a3060",display:"block"}}>
      {slices.map((s,i)=>{
        const large=s.sweep>Math.PI?1:0;
        const path=`M${CX},${CY} L${s.x1.toFixed(1)},${s.y1.toFixed(1)} A${R},${R},0,${large},1,${s.x2.toFixed(1)},${s.y2.toFixed(1)}Z`;
        const lx=CX+R*0.6*Math.cos(s.mid),ly=CY+R*0.6*Math.sin(s.mid);
        return(<g key={"sl"+i}><path d={path} fill={s.color} opacity={0.88} stroke="#000c20" strokeWidth="1"/>{s.sweep>0.3&&<text x={lx.toFixed(1)} y={ly.toFixed(1)} fill="#fff" fontSize="9" textAnchor="middle" fontWeight="bold">{s.pct}%</text>}</g>);
      })}
      {slices.map((s,i)=><g key={"leg"+i}><rect x={196} y={10+i*22} width={12} height={12} fill={s.color} rx={2}/><text x={212} y={21+i*22} fill="#e8f8ff" fontSize="9">{s.label}</text></g>)}
    </svg>
  );
}

function FormulaDisplay({ d }) {
  return (
    <div style={{background:"#000c20",border:"1px solid #0a3060",borderRadius:6,padding:"10px 14px"}}>
      {(d.items||[]).map((item,i)=>(
        <div key={"f"+i} style={{marginBottom:10}}>
          <div style={{fontSize:9,color:"#7ab8d8",letterSpacing:1,marginBottom:3}}>{item.label}</div>
          <div style={{fontSize:20,color:"#00eeff",fontFamily:"Georgia,serif",letterSpacing:3,padding:"6px 12px",background:"#001020",borderRadius:4,display:"inline-block",border:"1px solid #003060"}}>{item.expr}</div>
        </div>
      ))}
      {d.description&&<div style={{fontSize:10,color:"#7ab8d8",marginTop:8,borderTop:"1px solid #0a2040",paddingTop:8,lineHeight:1.5}}>{d.description}</div>}
    </div>
  );
}

function TableDisplay({ d }) {
  return (
    <div style={{overflowX:"auto"}}>
      <table style={{borderCollapse:"collapse",width:"100%",fontSize:10,fontFamily:'"Courier New",monospace'}}>
        <thead><tr>{(d.headers||[]).map((h,i)=><th key={i} style={{background:"#001e40",color:"#00eeff",padding:"5px 10px",border:"1px solid #0a3060",textAlign:"left",letterSpacing:1}}>{h}</th>)}</tr></thead>
        <tbody>{(d.rows||[]).map((row,ri)=><tr key={ri} style={{background:ri%2===0?"#000c20":"#00091a"}}>{row.map((cell,ci)=><td key={ci} style={{color:"#c8e8f8",padding:"4px 10px",border:"1px solid #0a2040"}}>{cell}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

function TimelineDisplay({ d }) {
  const events=d.events||[];
  const W=340,H=Math.max(60,20+events.length*42);
  return (
    <svg width={W} height={H} style={{background:"#000c20",borderRadius:6,border:"1px solid #0a3060",display:"block"}}>
      <line x1={28} y1={16} x2={28} y2={H-10} stroke="#00aaff" strokeWidth="2"/>
      {events.map((ev,i)=>(
        <g key={"ev"+i}>
          <circle cx={28} cy={16+i*42} r={6} fill={CHART_COLORS[i%8]} stroke="#000c20" strokeWidth="2"/>
          <text x={42} y={13+i*42} fill="#00eeff" fontSize="10" fontWeight="bold">{ev.year}</text>
          <text x={42} y={26+i*42} fill="#c8e8f8" fontSize="9">{ev.event}</text>
        </g>
      ))}
    </svg>
  );
}

function RichCard({ data, onSpeak }) {
  function renderVisual() {
    const vt=data.visual_type;
    const vd=data.visual;
    if(!vd||vt==="none") return null;
    const inner=
      vt==="coordinate"?<CoordinatePlane d={vd.coordinate||vd}/>:
      vt==="line_graph"?<LineGraph d={vd.line_graph||vd}/>:
      vt==="bar_chart"?<CustomBarChart d={vd.bar_chart||vd}/>:
      vt==="pie_chart"?<CustomPieChart d={vd.pie_chart||vd}/>:
      vt==="formula"?<FormulaDisplay d={vd.formula||vd}/>:
      vt==="timeline"?<TimelineDisplay d={vd.timeline||vd}/>:
      vt==="table"?<TableDisplay d={vd.table||vd}/>:null;
    if(!inner) return null;
    return (
      <div style={{marginTop:10,marginBottom:8}}>
        <div style={{fontSize:8,color:"#336688",letterSpacing:2,marginBottom:5}}>◈ VISUAL — {vt.replace(/_/g," ").toUpperCase()}</div>
        {inner}
      </div>
    );
  }
  return (
    <div style={{background:"#000c1e",border:"1px solid #0a3060",borderRadius:6,margin:"4px 0 8px",padding:"10px 12px",maxWidth:"100%",fontFamily:'"Courier New",monospace'}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <div style={{fontSize:9,color:"#00aaff",letterSpacing:2,textTransform:"uppercase"}}>◈ {data.topic||"EXPLANATION"}</div>
        {onSpeak&&<button onClick={onSpeak} style={{background:"none",border:"1px solid #0a3060",color:"#00ddee",fontSize:8,cursor:"pointer",padding:"2px 8px",borderRadius:2,fontFamily:'"Courier New",monospace'}}>▶ SPEAK</button>}
      </div>
      <div style={{fontSize:13,color:"#00eeff",fontWeight:"bold",marginBottom:10,lineHeight:1.5,borderBottom:"1px solid #0a2040",paddingBottom:8}}>{data.summary}</div>
      {(data.sections||[]).map((s,i)=>(
        <div key={"sec"+i} style={{marginBottom:10}}>
          <div style={{fontSize:9,color:"#00aaff",letterSpacing:1,marginBottom:3,borderLeft:"2px solid #00aaff",paddingLeft:7}}>▸ {s.title.toUpperCase()}</div>
          <div style={{fontSize:11,color:"#c8e8f8",lineHeight:1.7,paddingLeft:9}}>{s.content}</div>
        </div>
      ))}
      {renderVisual()}
      {data.analogy&&(
        <div style={{background:"#001428",border:"1px solid #003060",borderRadius:4,padding:"8px 12px",marginTop:8,marginBottom:8}}>
          <span style={{color:"#ffdd00",fontSize:9,letterSpacing:1,display:"block",marginBottom:3}}>💡 THINK OF IT THIS WAY</span>
          <span style={{color:"#e8f8ff",fontSize:11,lineHeight:1.6}}>{data.analogy}</span>
        </div>
      )}
      {data.key_points?.length>0&&(
        <div style={{marginTop:8,borderTop:"1px solid #0a2040",paddingTop:8}}>
          <div style={{fontSize:8,color:"#336688",letterSpacing:2,marginBottom:6}}>◈ KEY TAKEAWAYS</div>
          {data.key_points.map((p,i)=><div key={"kp"+i} style={{fontSize:11,color:"#88eeff",marginBottom:4,lineHeight:1.5}}>◆ {p}</div>)}
        </div>
      )}
    </div>
  );
}

// Singletons
const Memory = new MemoryEngine();
const KB = new KnowledgeBaseEngine();
const ConvLog = new ConversationLogEngine();
const TopicTrack = new TopicTracker();
const Notes = new NoteEngine();
const Calendar = new CalendarEngine();
const Habits = new HabitTracker();
const Todos = new TodoEngine();
const Timers = new TimerEngine();
const UnitConv = new UnitConverter();

// ═══════════════════════════════════════════════
//  SMART ROUTER — 100+ commands
// ═══════════════════════════════════════════════
async function routeMessage(msg, addMsg, hudState, showToast, openOverlay) {
  const m = msg.toLowerCase().trim();
  const raw = msg.trim();

  // TIME & DATE
  if(/^(what(?:'s| is) the ?)?(time|clock)/.test(m)||m==="time") return `The time is ${new Date().toLocaleTimeString()}.`;
  if(/^(what(?:'s| is) the ?)?date/.test(m)||m==="date") return `Today is ${new Date().toLocaleDateString("en-IN",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}.`;
  if(/day of week/.test(m)) return `Today is ${new Date().toLocaleDateString("en-IN",{weekday:"long"})}.`;
  if(/what year/.test(m)) return `Current year: ${new Date().getFullYear()}.`;

  // WHAT DAY IS [DATE] — e.g. "what is day on 27th dec" / "what day is 25 December"
  if(/\b(what|which)\b.*\b(day)\b|\b(day).*(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)\b/i.test(m)) {
    const MONTH_MAP = {jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11,january:0,february:1,march:2,april:3,may2:4,june:5,july:6,august:7,september:8,october:9,november:10,december:11};
    const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
    const MON_RE = "(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)";
    const m1 = raw.match(new RegExp(`(\\d{1,2})(?:st|nd|rd|th)?\\s+${MON_RE}(?:\\s+(\\d{4}))?`, "i"));
    const m2 = raw.match(new RegExp(`${MON_RE}\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:\\s+(\\d{4}))?`, "i"));
    const match = m1 || m2;
    if(match) {
      const day = m1 ? parseInt(m1[1]) : parseInt(m2[2]);
      const monStr = m1 ? m1[2] : m2[1];
      const year = m1 ? (parseInt(m1[3])||new Date().getFullYear()) : (parseInt(m2[3])||new Date().getFullYear());
      const monIdx = MONTH_MAP[monStr.toLowerCase().slice(0,3)];
      if(monIdx !== undefined && day >= 1 && day <= 31) {
        const d = new Date(year, monIdx, day);
        return `${d.getDate()} ${d.toLocaleString("en-IN",{month:"long"})} ${year} falls on a ${DAYS[d.getDay()]}.`;
      }
    }
  }

  // WEATHER
  if(/weather|temperature|forecast|humidity/.test(m)&&!/convert/.test(m)) {
    const loc=m.replace(/weather|temperature|forecast|humidity|in|at|for|the|what is|what's/g,"").trim()||CFG.location;
    addMsg("ryn",`Fetching weather for ${loc}...`);
    const w=await WEATHER_CACHE.fetch(loc);
    return w?`${w.city}: ${w.temp}°C (feels ${w.feels}°C). ${w.desc}. 💧${w.humidity}% humidity. 💨${w.wind}km/h wind. UV index: ${w.uv}.`:"Could not fetch weather. Check connection.";
  }

  // MATH - extended
  if(/^(what is|calculate|compute|eval|solve|=)\s*[\d(]/.test(m)||/^[\d(+\-*/. ^%]+$/.test(m.replace(/\s/g,""))) {
    return Utils.evalMath(raw.replace(/^(what is|calculate|compute|eval|solve)\s+/i,"").trim());
  }
  if(/percentage|percent/.test(m)) { const n=raw.match(/[\d.]+/g); if(n&&n.length>=2) return Utils.percentage(parseFloat(n[0]),parseFloat(n[1])); }
  if(/is.*prime/.test(m)||/prime.*check/.test(m)) { const n=raw.match(/\d+/); if(n) return `${n[0]} is${Utils.isPrime(n[0])?"":" NOT"} a prime number.`; }
  if(/fibonacci/.test(m)) { const n=raw.match(/\d+/); return Utils.fibonacci(n?parseInt(n[0]):10); }
  if(/factorial/.test(m)) { const n=raw.match(/\d+/); if(n) return Utils.factorial(n[0]); }
  if(/primes up to/.test(m)) { const n=raw.match(/\d+/); if(n) return Utils.primes(Math.min(parseInt(n[0]),200)); }
  if(/gcd|greatest common/.test(m)) { const n=raw.match(/\d+/g); if(n&&n.length>=2) return `GCD(${n[0]},${n[1]}) = ${Utils.gcd(n[0],n[1])}`; }
  if(/lcm|least common/.test(m)) { const n=raw.match(/\d+/g); if(n&&n.length>=2) return `LCM(${n[0]},${n[1]}) = ${Utils.lcm(n[0],n[1])}`; }
  if(/number fact|facts about \d/.test(m)) { const n=raw.match(/\d+|pi|e/); if(n) return Utils.numberFact(n[0]); }
  if(/square root|√/.test(m)) { const n=raw.match(/[\d.]+/); if(n) return `√${n[0]} = ${Math.sqrt(parseFloat(n[0])).toPrecision(8)}`; }
  if(/cube root/.test(m)) { const n=raw.match(/[\d.]+/); if(n) return `∛${n[0]} = ${Math.cbrt(parseFloat(n[0])).toPrecision(8)}`; }
  if(/power|to the/.test(m)) { const n=raw.match(/[\d.]+/g); if(n&&n.length>=2) return `${n[0]}^${n[1]} = ${Math.pow(parseFloat(n[0]),parseFloat(n[1]))}`; }
  if(/log |logarithm/.test(m)) { const n=raw.match(/[\d.]+/); if(n) return `log₁₀(${n[0]}) = ${Math.log10(parseFloat(n[0])).toPrecision(8)}, ln(${n[0]}) = ${Math.log(parseFloat(n[0])).toPrecision(8)}`; }
  if(/sin |cos |tan /.test(m)) { const n=raw.match(/[\d.]+/); if(n){const rad=parseFloat(n[0])*Math.PI/180;return `sin(${n[0]}°)=${Math.sin(rad).toPrecision(6)}, cos=${Math.cos(rad).toPrecision(6)}, tan=${Math.tan(rad).toPrecision(6)}`;} }
  if(/random number|random int/.test(m)) { const n=raw.match(/\d+/g); return Utils.randomNumber(n?parseInt(n[0]):1,n&&n[1]?parseInt(n[1]):100); }

  // UNIT CONVERTER
  const convMatch=raw.match(/(\d+\.?\d*)\s*(\w+)\s+(?:to|in|as)\s+(\w+)/i);
  if(convMatch) return UnitConv.convert(convMatch[1],convMatch[2],convMatch[3]);

  // TIMER
  if(/set timer|timer for|start timer/.test(m)) {
    const timeMatch=raw.match(/(\d+)\s*(second|sec|minute|min|hour|hr)/i);
    if(timeMatch){
      const val=parseInt(timeMatch[1]);const unit=timeMatch[2].toLowerCase();
      const secs=unit.startsWith("h")?val*3600:unit.startsWith("m")?val*60:val;
      const name=raw.match(/named?\s+["']?(\w+)/i)?.[1]||"timer";
      return Timers.set(name,secs,(n)=>{ addMsg("sys",`⏰ Timer "${n}" done!`); });
    }
    return "Please say: set timer [N] minutes [named X]";
  }
  if(/list timers|active timers/.test(m)) return Timers.list();
  if(/cancel timer/.test(m)) { const n=raw.match(/cancel timer\s+["']?(\w+)/i)?.[1]||"timer"; return Timers.cancel(n); }

  // TODOS
  if(/add todo|new task|todo:/.test(m)) {
    const text=raw.replace(/^(add todo|new task|todo)[::\s]*/i,"").trim();
    const pri=m.includes("high")?"high":m.includes("low")?"low":"normal";
    if(text) return Todos.add(text,pri); return "Please say: add todo [task]";
  }
  if(/my todos|list tasks|show tasks/.test(m)) { openOverlay("todos"); return "Opening todo list..."; }
  if(/clear done|remove completed/.test(m)) return Todos.clearDone();

  // NOTES
  if(/^(note|save note|remember|write down|note down)[:\s]/.test(m)) { const text=raw.replace(/^(note|save note|remember|write down|note down)[:\s]*/i,"").trim(); if(text){openOverlay&&openOverlay("notes");return Notes.add(text);} }
  if(/my notes|show notes|open notes/.test(m)) { openOverlay("notes"); return "Opening notes..."; }
  if(/search notes/.test(m)) { const q=raw.replace(/search notes/i,"").trim(); const r=Notes.search(q); if(!r.length) return `No notes found for "${q}".`; return r.slice(0,5).map(n=>n.text).join("\n"); }

  // CALENDAR
  if(/upcoming|my events|calendar|schedule/.test(m)&&!/set/.test(m)) { openOverlay("calendar"); return Calendar.listUpcoming(); }

  // HABITS
  if(/log habit|completed|i did|habit:/.test(m)) { const hm=raw.replace(/log habit|completed|i did|habit:/gi,"").trim(); if(hm) return Habits.logHabit(hm); }
  if(/habit status|my habits|list habits/.test(m)) return Habits.listAll();

  // MEMORY
  if(/memory stats|what do you know|my memory/.test(m)) return Memory.stats() + " | " + KB.stats() + " | " + ConvLog.stats();
  if(/kb stats|knowledge base stats|what have you learned|how much.*learned/i.test(m)) return KB.stats();
  if(/clear memory|forget everything/.test(m)) { Memory.clearAll(); return "Memory cleared. Starting fresh."; }
  if(/remember that/.test(m)) { const text=raw.replace(/remember that\s*/i,"").trim(); if(text){Memory.add(text,"fact",8);return `Noted: "${text}"`;} }

  // SYSTEM STATS
  if(/cpu|processor/.test(m)) return `CPU: ~${hudState.cpu.toFixed(1)}% load, ${navigator.hardwareConcurrency||"?"} cores.`;
  if(/ram|memory usage/.test(m)) return `RAM: ~${hudState.ram.toFixed(1)}% usage. Device RAM: ${navigator.deviceMemory||"?"}GB.`;

  // PASSWORD
  if(/generate|make|create/.test(m)&&/password|pass/.test(m)) { const l=raw.match(/(\d+)/); return Utils.generatePassword(l?parseInt(l[1]):16,!m.includes("simple")); }

  // COIN & DICE
  if(/flip.*coin|coin.*flip/.test(m)) return Utils.flipCoin();
  if(/roll.*dice|roll d\d+/.test(m)) { const s=m.match(/d(\d+)/); const c=m.match(/(\d+)d/); return Utils.rollDice(s?parseInt(s[1]):6,c?parseInt(c[1]):1); }

  // BMI
  if(/bmi/.test(m)) { const n=raw.match(/[\d.]+/g); if(n&&n.length>=2) return Utils.bmi(parseFloat(n[0]),parseFloat(n[1])); return "Say: BMI [weight kg] [height m]"; }

  // FINANCE
  if(/compound interest/.test(m)) { const n=raw.match(/[\d.]+/g); if(n&&n.length>=4) return Utils.compound(parseFloat(n[0]),parseFloat(n[1]),parseInt(n[2]),parseInt(n[3])); return "Say: compound interest [principal] [rate%] [n/yr] [years]"; }
  if(/emi|loan/.test(m)) { const n=raw.match(/[\d.]+/g); if(n&&n.length>=3) return Utils.emi(parseFloat(n[0]),parseFloat(n[1]),parseInt(n[2])); return "Say: EMI [principal] [rate%] [months]"; }
  if(/sip/.test(m)) { const n=raw.match(/[\d.]+/g); if(n&&n.length>=3) return Utils.sip(parseFloat(n[0]),parseFloat(n[1]),parseFloat(n[2])); return "Say: SIP [monthly] [rate%] [years]"; }

  // ROMAN NUMERALS
  if(/roman/.test(m)) { const nm=raw.match(/\d+/); const rm=raw.match(/[IVXLCDM]{2,}/); if(nm) return `${nm[0]} = ${Utils.intToRoman(parseInt(nm[0]))}`; if(rm) return `${rm[0]} = ${Utils.romanToInt(rm[0])}`; }

  // AGE & DATES
  if(/age|born/.test(m)) { const dm=raw.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/); if(dm) return Utils.ageCalc(`${dm[3]}-${dm[2].padStart(2,"0")}-${dm[1].padStart(2,"0")}`); }
  if(/days until|days till/.test(m)) { const dm=raw.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/); if(dm) return Utils.daysUntil(`${dm[3]}-${dm[2].padStart(2,"0")}-${dm[1].padStart(2,"0")}`); }

  // TEXT TOOLS
  if(/morse code|encode.*morse/.test(m)) { const text=raw.replace(/morse code|encode.*morse|to morse/gi,"").trim(); if(text) return `Morse: ${Utils.morse(text)}`; }
  if(/word count|count words/.test(m)) { const text=raw.replace(/word count|count words/i,"").trim()||"No text provided."; return Utils.wordCount(text); }
  if(/reverse/.test(m)&&!/reverse text/.test(m)) { const text=raw.replace(/reverse\s*/i,"").trim(); if(text) return Utils.reverseText(text); }
  if(/reverse text/.test(m)||/reverse:/.test(m)) { const text=raw.replace(/reverse text|reverse:/i,"").trim(); if(text) return Utils.reverseText(text); }
  if(/palindrome/.test(m)) { const text=raw.replace(/is.*palindrome|palindrome/i,"").trim(); if(text) return Utils.isPalindrome(text); }
  if(/base64 encode/.test(m)) { const text=raw.replace(/base64 encode/i,"").trim(); if(text) return Utils.base64encode(text); }
  if(/base64 decode/.test(m)) { const text=raw.replace(/base64 decode/i,"").trim(); if(text) return Utils.base64decode(text); }
  if(/uppercase/.test(m)) { const text=raw.replace(/uppercase|to uppercase/i,"").trim(); return text.toUpperCase(); }
  if(/lowercase/.test(m)) { const text=raw.replace(/lowercase|to lowercase/i,"").trim(); return text.toLowerCase(); }

  // FUN & FACTS
  if(/tell me a joke|joke/.test(m)) return Utils.joke();
  if(/motivat|inspire|quote/.test(m)) return Utils.quote();
  if(/fun fact|world fact|did you know/.test(m)) return Utils.worldFact();
  if(/speed of light/.test(m)) return Utils.speedOfLight();

  // ═══════════════════════════════════════════════
  //  NATIVE APP LAUNCHER — deep links → web fallback
  // ═══════════════════════════════════════════════
  const isAndroid = /android/i.test(navigator.userAgent);
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isMobile = isAndroid || isIOS;

  // Tries native app first (deep link), falls back to web after 2s
  const launchApp = (deepLink, webUrl, label) => {
    if (isMobile && deepLink) {
      const a = document.createElement("a");
      a.href = deepLink; a.style.display = "none";
      document.body.appendChild(a);
      try { a.click(); } catch(e) {}
      setTimeout(() => { try { document.body.removeChild(a); } catch {} }, 200);
      // If app didn't open (page still visible after 2s), open web
      setTimeout(() => { if (!document.hidden) window.open(webUrl, "_blank"); }, 2000);
    } else {
      window.open(webUrl, "_blank");
    }
    return `Opening ${label}!`;
  };

  // Deep link database — native + web
  const APP_DB = [
    // Media
    {names:["youtube","yt"],deep:isAndroid?"intent://youtube.com/#Intent;package=com.google.android.youtube;scheme=https;end":"youtube://",web:"https://youtube.com",label:"YouTube"},
    {names:["youtube music","yt music","ytm"],deep:isAndroid?"intent://music.youtube.com/#Intent;package=com.google.android.apps.youtube.music;scheme=https;end":"youtubemusic://",web:"https://music.youtube.com",label:"YouTube Music"},
    {names:["spotify"],deep:"spotify://",web:"https://open.spotify.com",label:"Spotify"},
    {names:["netflix"],deep:isAndroid?"intent://netflix.com/#Intent;package=com.netflix.mediaclient;scheme=https;end":"nflx://",web:"https://netflix.com",label:"Netflix"},
    {names:["prime video","amazon prime","prime"],deep:isAndroid?"intent://primevideo.com/#Intent;package=com.amazon.avod.thirdpartyclient;scheme=https;end":"aiv://",web:"https://primevideo.com",label:"Prime Video"},
    {names:["hotstar","disney hotstar","disney+","disney plus"],deep:isAndroid?"intent://hotstar.com/#Intent;package=in.startv.hotstar;scheme=https;end":"hotstar://",web:"https://hotstar.com",label:"Disney+ Hotstar"},
    {names:["jio cinema","jiocinema"],deep:isAndroid?"intent://jiocinema.com/#Intent;package=com.jio.jioplay.tv;scheme=https;end":"jiocinema://",web:"https://jiocinema.com",label:"JioCinema"},
    {names:["twitch"],deep:isAndroid?"intent://twitch.tv/#Intent;package=tv.twitch.android.app;scheme=https;end":"twitch://",web:"https://twitch.tv",label:"Twitch"},
    {names:["soundcloud"],deep:"soundcloud://",web:"https://soundcloud.com",label:"SoundCloud"},
    {names:["amazon music"],deep:isAndroid?"intent://music.amazon.in/#Intent;package=com.amazon.mp3;scheme=https;end":"musiconamazon://",web:"https://music.amazon.in",label:"Amazon Music"},
    // Communication
    {names:["whatsapp","wa"],deep:isAndroid?"intent://send/#Intent;package=com.whatsapp;scheme=whatsapp;end":"whatsapp://",web:"https://web.whatsapp.com",label:"WhatsApp"},
    {names:["telegram","tg"],deep:isAndroid?"intent://resolve/?domain=telegram/#Intent;package=org.telegram.messenger;scheme=tg;end":"tg://",web:"https://web.telegram.org",label:"Telegram"},
    {names:["discord"],deep:isAndroid?"intent://discord.com/#Intent;package=com.discord;scheme=https;end":"discord://",web:"https://discord.com/app",label:"Discord"},
    {names:["gmail","mail"],deep:isAndroid?"intent://gmail.com/#Intent;package=com.google.android.gm;scheme=https;end":"googlegmail://",web:"https://gmail.com",label:"Gmail"},
    {names:["outlook","hotmail"],deep:isAndroid?"intent://outlook.com/#Intent;package=com.microsoft.office.outlook;scheme=https;end":"ms-outlook://",web:"https://outlook.live.com",label:"Outlook"},
    {names:["zoom"],deep:isAndroid?"intent://zoom.us/#Intent;package=us.zoom.videomeetings;scheme=https;end":"zoomus://",web:"https://zoom.us/join",label:"Zoom"},
    {names:["meet","google meet"],deep:isAndroid?"intent://meet.google.com/#Intent;package=com.google.android.apps.meetings;scheme=https;end":"googlemeet://",web:"https://meet.google.com",label:"Google Meet"},
    {names:["teams","microsoft teams"],deep:isAndroid?"intent://teams.microsoft.com/#Intent;package=com.microsoft.teams;scheme=https;end":"msteams://",web:"https://teams.microsoft.com",label:"MS Teams"},
    {names:["slack"],deep:isAndroid?"intent://slack.com/#Intent;package=com.Slack;scheme=https;end":"slack://",web:"https://slack.com",label:"Slack"},
    // Social
    {names:["instagram","insta","ig"],deep:isAndroid?"intent://instagram.com/#Intent;package=com.instagram.android;scheme=https;end":"instagram://",web:"https://instagram.com",label:"Instagram"},
    {names:["twitter","x","x.com"],deep:isAndroid?"intent://twitter.com/#Intent;package=com.twitter.android;scheme=https;end":"twitter://",web:"https://twitter.com",label:"Twitter/X"},
    {names:["facebook","fb"],deep:isAndroid?"intent://facebook.com/#Intent;package=com.facebook.katana;scheme=https;end":"fb://",web:"https://facebook.com",label:"Facebook"},
    {names:["snapchat","snap"],deep:isAndroid?"intent://snapchat.com/#Intent;package=com.snapchat.android;scheme=https;end":"snapchat://",web:"https://snapchat.com",label:"Snapchat"},
    {names:["linkedin"],deep:isAndroid?"intent://linkedin.com/#Intent;package=com.linkedin.android;scheme=https;end":"linkedin://",web:"https://linkedin.com",label:"LinkedIn"},
    {names:["reddit"],deep:isAndroid?"intent://reddit.com/#Intent;package=com.reddit.frontpage;scheme=https;end":"reddit://",web:"https://reddit.com",label:"Reddit"},
    {names:["pinterest","pin"],deep:isAndroid?"intent://pinterest.com/#Intent;package=com.pinterest;scheme=https;end":"pinterest://",web:"https://pinterest.com",label:"Pinterest"},
    {names:["threads"],deep:isAndroid?"intent://threads.net/#Intent;package=com.instagram.barcelona;scheme=https;end":"barcelona://",web:"https://threads.net",label:"Threads"},
    // Shopping
    {names:["amazon"],deep:isAndroid?"intent://amazon.in/#Intent;package=in.amazon.mShop.android.shopping;scheme=https;end":"amazon://",web:"https://amazon.in",label:"Amazon"},
    {names:["flipkart","fk"],deep:isAndroid?"intent://flipkart.com/#Intent;package=com.flipkart.android;scheme=https;end":"flipkart://",web:"https://flipkart.com",label:"Flipkart"},
    {names:["meesho"],deep:isAndroid?"intent://meesho.com/#Intent;package=com.meesho.supply;scheme=https;end":null,web:"https://meesho.com",label:"Meesho"},
    {names:["myntra"],deep:isAndroid?"intent://myntra.com/#Intent;package=com.myntra.android;scheme=https;end":null,web:"https://myntra.com",label:"Myntra"},
    {names:["nykaa"],deep:isAndroid?"intent://nykaa.com/#Intent;package=com.nykaa.app;scheme=https;end":null,web:"https://nykaa.com",label:"Nykaa"},
    // Finance
    {names:["paytm"],deep:isAndroid?"intent://paytm.com/#Intent;package=net.one97.paytm;scheme=https;end":"paytm://",web:"https://paytm.com",label:"Paytm"},
    {names:["phonepe","phone pe"],deep:isAndroid?"intent://phon.pe/#Intent;package=com.phonepe.app;scheme=https;end":"phonepe://",web:"https://web.phonepe.com",label:"PhonePe"},
    {names:["google pay","gpay"],deep:isAndroid?"intent://pay.google.com/#Intent;package=com.google.android.apps.nbu.paisa.user;scheme=https;end":"googlepay://",web:"https://pay.google.com",label:"Google Pay"},
    {names:["zerodha","kite"],deep:null,web:"https://kite.zerodha.com",label:"Zerodha Kite"},
    {names:["groww"],deep:isAndroid?"intent://groww.in/#Intent;package=com.nextbillion.groww;scheme=https;end":null,web:"https://groww.in",label:"Groww"},
    // Dev & Tools
    {names:["github","gh"],deep:isAndroid?"intent://github.com/#Intent;package=com.github.android;scheme=https;end":null,web:"https://github.com",label:"GitHub"},
    {names:["stackoverflow","stack overflow","so"],deep:null,web:"https://stackoverflow.com",label:"Stack Overflow"},
    {names:["notion"],deep:isAndroid?"intent://notion.so/#Intent;package=notion.id;scheme=https;end":"notion://",web:"https://notion.so",label:"Notion"},
    {names:["figma"],deep:null,web:"https://figma.com",label:"Figma"},
    {names:["canva"],deep:isAndroid?"intent://canva.com/#Intent;package=com.canva.editor;scheme=https;end":null,web:"https://canva.com",label:"Canva"},
    // AI
    {names:["chatgpt","chat gpt"],deep:isAndroid?"intent://chat.openai.com/#Intent;package=com.openai.chatgpt;scheme=https;end":null,web:"https://chatgpt.com",label:"ChatGPT"},
    {names:["gemini","google gemini"],deep:null,web:"https://gemini.google.com",label:"Google Gemini"},
    {names:["claude","claude ai"],deep:null,web:"https://claude.ai",label:"Claude AI"},
    // Google Apps
    {names:["google"],deep:null,web:"https://google.com",label:"Google"},
    {names:["google drive","drive","gdrive"],deep:isAndroid?"intent://drive.google.com/#Intent;package=com.google.android.apps.docs;scheme=https;end":"googledrive://",web:"https://drive.google.com",label:"Google Drive"},
    {names:["google docs","docs"],deep:isAndroid?"intent://docs.google.com/#Intent;package=com.google.android.apps.docs.editors.docs;scheme=https;end":null,web:"https://docs.google.com",label:"Google Docs"},
    {names:["google sheets","sheets"],deep:isAndroid?"intent://sheets.google.com/#Intent;package=com.google.android.apps.docs.editors.sheets;scheme=https;end":null,web:"https://sheets.google.com",label:"Google Sheets"},
    {names:["google maps","maps","gmap"],deep:isAndroid?"intent://maps.google.com/#Intent;package=com.google.android.apps.maps;scheme=https;end":"comgooglemaps://",web:"https://maps.google.com",label:"Google Maps"},
    {names:["google news","gnews","news"],deep:isAndroid?"intent://news.google.com/#Intent;package=com.google.android.apps.magazines;scheme=https;end":null,web:"https://news.google.com",label:"Google News"},
    {names:["google translate","translate"],deep:isAndroid?"intent://translate.google.com/#Intent;package=com.google.android.apps.translate;scheme=https;end":"googletranslate://",web:"https://translate.google.com",label:"Google Translate"},
    {names:["google calendar","calendar"],deep:isAndroid?"intent://calendar.google.com/#Intent;package=com.google.android.calendar;scheme=https;end":null,web:"https://calendar.google.com",label:"Google Calendar"},
    {names:["google photos","photos"],deep:isAndroid?"intent://photos.google.com/#Intent;package=com.google.android.apps.photos;scheme=https;end":"googlephotos://",web:"https://photos.google.com",label:"Google Photos"},
    {names:["google keep","keep"],deep:isAndroid?"intent://keep.google.com/#Intent;package=com.google.android.keep;scheme=https;end":null,web:"https://keep.google.com",label:"Google Keep"},
    {names:["google classroom","classroom"],deep:null,web:"https://classroom.google.com",label:"Google Classroom"},
    // Learn
    {names:["wikipedia","wiki"],deep:isAndroid?"intent://en.wikipedia.org/#Intent;package=org.wikipedia;scheme=https;end":"wikipedia://",web:"https://wikipedia.org",label:"Wikipedia"},
    {names:["khan academy","khanacademy","khan"],deep:null,web:"https://khanacademy.org",label:"Khan Academy"},
    {names:["coursera"],deep:null,web:"https://coursera.org",label:"Coursera"},
    {names:["udemy"],deep:isAndroid?"intent://udemy.com/#Intent;package=com.udemy.android;scheme=https;end":null,web:"https://udemy.com",label:"Udemy"},
    // News
    {names:["bbc","bbc news"],deep:null,web:"https://bbc.com/news",label:"BBC News"},
    {names:["times of india","toi"],deep:null,web:"https://timesofindia.com",label:"Times of India"},
    {names:["ndtv"],deep:null,web:"https://ndtv.com",label:"NDTV"},
    {names:["the hindu","hindu"],deep:null,web:"https://thehindu.com",label:"The Hindu"},
    // Camera / Files
    {names:["camera"],deep:isAndroid?"intent:#Intent;action=android.media.action.STILL_IMAGE_CAMERA;end":"photo-capture://",web:"https://google.com",label:"Camera"},
    {names:["gallery","photos app"],deep:isAndroid?"intent:#Intent;action=android.intent.action.VIEW;type=image/*;end":"photos-redirect://",web:"https://photos.google.com",label:"Gallery"},
    {names:["files","file manager"],deep:isAndroid?"intent:#Intent;action=android.intent.action.VIEW;type=*/*;package=com.google.android.documentsui;end":null,web:"https://drive.google.com",label:"Files"},
    {names:["settings","phone settings"],deep:isAndroid?"intent:#Intent;action=android.settings.SETTINGS;end":"prefs://",web:null,label:"Settings"},
    {names:["play store","google play","playstore"],deep:isAndroid?"market://":"https://apps.apple.com",web:"https://play.google.com/store",label:"Play Store"},
    {names:["app store"],deep:"itms-apps://",web:"https://apps.apple.com",label:"App Store"},
  ];

  // Smart match: exact → starts-with → contains
  const smartMatch = (query) => {
    const q = query.toLowerCase().replace(/\s+/g," ").trim();
    for(const app of APP_DB){if(app.names.includes(q))return app;}
    for(const app of APP_DB){if(app.names.some(n=>q.startsWith(n)||n.startsWith(q)))return app;}
    for(const app of APP_DB){if(app.names.some(n=>q.includes(n)||n.includes(q)))return app;}
    return null;
  };

  // ── BATTERY STATUS ──
  if(/battery|charge|charging/.test(m)&&!/charge me/.test(m)) {
    if(navigator.getBattery){
      const bat=await navigator.getBattery();
      const pct=Math.round(bat.level*100);
      const chg=bat.charging?" and currently charging":"";
      return `Your battery is at ${pct} percent${chg}.`;
    }
    return "Battery info isn't available in this browser.";
  }

  // ── DEVICE / SYSTEM INFO ──
  if(/my device|device info|phone info|what device/.test(m)) {
    const ua=navigator.userAgent;
    const device=isAndroid?"Android device":isIOS?"iPhone/iPad":"desktop";
    const cores=navigator.hardwareConcurrency||"unknown";
    const ram=navigator.deviceMemory||"unknown";
    return `You're on a ${device}. ${cores} CPU cores, ${ram}GB RAM reported. Browser: ${ua.includes("Chrome")?"Chrome":ua.includes("Safari")?"Safari":ua.includes("Firefox")?"Firefox":"unknown"}.`;
  }

  // ── CLIPBOARD COPY ──
  if(/^copy (to clipboard\s*)?(.+)/i.test(m)) {
    const txt=raw.replace(/^copy (to clipboard\s*)?/i,"").trim();
    if(txt&&navigator.clipboard){try{await navigator.clipboard.writeText(txt);return `Copied to clipboard: "${txt.slice(0,50)}${txt.length>50?"...":""}"`;} catch{return "Couldn't access clipboard. Try allowing clipboard permissions.";}}
  }

  // ── WEB SHARE ──
  if(/^share (.+)/i.test(m)&&navigator.share) {
    const txt=raw.replace(/^share\s*/i,"").trim();
    try{await navigator.share({title:"Shared via Ryan",text:txt});return "Shared!";}catch{return "Share was cancelled.";}
  }

  // ── WHATSAPP TO NUMBER ──
  if(/(whatsapp|message|text|wa).*(number|\+?\d{10,})/i.test(m)||/send (whatsapp |message )?to \+?\d{10,}/i.test(m)) {
    const numMatch=raw.match(/\+?[\d\s\-]{10,}/);
    if(numMatch){const num=numMatch[0].replace(/[\s\-]/g,"");const link=`whatsapp://send?phone=${num}`;const web=`https://wa.me/${num}`;return launchApp(link,web,"WhatsApp");}
  }

  // ── POMODORO ──
  if(/pomodoro|focus timer|work timer/.test(m)) {
    const mins=raw.match(/(\d+)\s*min/);const t=mins?parseInt(mins[1]):25;
    Timers.set("Pomodoro",t*60,(n)=>{addMsg("sys","⏰ Pomodoro done! Take a break.");if(safeSynth){const u=new SpeechSynthesisUtterance("Pomodoro complete! Time to take a short break.");safeSynth.speak(u);}});
    return `Pomodoro started! I'll alert you in ${t} minutes. Stay focused!`;
  }

  // ── MUSIC INTENTS (smart, native apps) ──
  if(/^play music$|^play some music$|^play a song$|^music please$|^start music$/.test(m)) {
    return launchApp(isAndroid?"intent://music.amazon.in/#Intent;package=com.amazon.mp3;scheme=https;end":"musiconamazon://","https://music.amazon.in","Amazon Music");
  }
  if(/\bplay\b/.test(m)&&/amazon music|amazon/.test(m)) {
    const q=raw.replace(/play/i,"").replace(/on amazon music|on amazon/i,"").trim();
    const deepLink=isAndroid?`intent://music.amazon.in/search/${encodeURIComponent(q)}#Intent;package=com.amazon.mp3;scheme=https;end`:`musiconamazon://search/${encodeURIComponent(q)}`;
    return launchApp(deepLink,`https://music.amazon.in/search/${encodeURIComponent(q)}`,q?`"${q}" on Amazon Music`:"Amazon Music");
  }
  if(/\bplay\b/.test(m)&&/spotify/.test(m)) {
    const q=raw.replace(/play/i,"").replace(/on spotify/i,"").trim();
    const deepLink=q?`spotify:search:${q}`:"spotify://";
    return launchApp(deepLink,`https://open.spotify.com/search/${encodeURIComponent(q)}`,q?`"${q}" on Spotify`:"Spotify");
  }
  if(/\bplay\b/.test(m)&&/youtube|yt/.test(m)) {
    const q=raw.replace(/play/i,"").replace(/on (youtube|yt)/i,"").trim();
    const deepLink=isAndroid?`intent://youtube.com/results?search_query=${encodeURIComponent(q)}#Intent;package=com.google.android.youtube;scheme=https;end`:`vnd.youtube://results?search_query=${encodeURIComponent(q)}`;
    return launchApp(deepLink,`https://youtube.com/results?search_query=${encodeURIComponent(q)}`,q?`"${q}" on YouTube`:"YouTube");
  }
  if(/^play\s+.+/i.test(m)&&!/(on|in)\s+\w/.test(m)) {
    const q=raw.replace(/^play\s+/i,"").trim();
    if(q){return launchApp(`spotify:search:${q}`,`https://open.spotify.com/search/${encodeURIComponent(q)}`,`"${q}" on Spotify`);}
  }

  // ── WATCH INTENTS ──
  if(/\bwatch\b/.test(m)) {
    if(/netflix/.test(m)){const q=raw.replace(/watch/i,"").replace(/on netflix/i,"").trim();return launchApp(isAndroid?"intent://netflix.com/#Intent;package=com.netflix.mediaclient;scheme=https;end":"nflx://",`https://netflix.com${q?`/search?q=${encodeURIComponent(q)}`:""}`,`Netflix${q?` - ${q}`:""}`);}
    if(/youtube|yt/.test(m)){const q=raw.replace(/watch/i,"").replace(/on (youtube|yt)/i,"").trim();return launchApp(isAndroid?`intent://youtube.com/results?search_query=${encodeURIComponent(q)}#Intent;package=com.google.android.youtube;scheme=https;end`:`vnd.youtube://results?search_query=${encodeURIComponent(q)}`,`https://youtube.com/results?search_query=${encodeURIComponent(q)}`,`"${q}" on YouTube`);}
    if(/hotstar/.test(m)){const q=raw.replace(/watch/i,"").replace(/on hotstar/i,"").trim();return launchApp(isAndroid?"intent://hotstar.com/#Intent;package=in.startv.hotstar;scheme=https;end":"hotstar://","https://hotstar.com","Hotstar");}
    if(/prime/.test(m)){return launchApp(isAndroid?"intent://primevideo.com/#Intent;package=com.amazon.avod.thirdpartyclient;scheme=https;end":"aiv://","https://primevideo.com","Prime Video");}
  }

  // ── SEARCH ON PLATFORM ──
  if(/search .+ on /i.test(m)) {
    const parts=raw.match(/search (.+?) on (.+)/i);
    if(parts) {
      const query=parts[1].trim(), platform=parts[2].trim().toLowerCase();
      const se={
        amazon:[isAndroid?`intent://amazon.in/s?k=${encodeURIComponent(query)}#Intent;package=in.amazon.mShop.android.shopping;scheme=https;end`:"amazon://",`https://amazon.in/s?k=${encodeURIComponent(query)}`,"Amazon"],
        flipkart:[null,`https://flipkart.com/search?q=${encodeURIComponent(query)}`,"Flipkart"],
        youtube:[isAndroid?`intent://youtube.com/results?search_query=${encodeURIComponent(query)}#Intent;package=com.google.android.youtube;scheme=https;end`:`vnd.youtube://results?search_query=${encodeURIComponent(query)}`,`https://youtube.com/results?search_query=${encodeURIComponent(query)}`,"YouTube"],
        spotify:[`spotify:search:${query}`,`https://open.spotify.com/search/${encodeURIComponent(query)}`,"Spotify"],
        wikipedia:[isAndroid?"intent://en.wikipedia.org/#Intent;package=org.wikipedia;scheme=https;end":"wikipedia://",`https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(query)}`,"Wikipedia"],
        google:[null,`https://google.com/search?q=${encodeURIComponent(query)}`,"Google"],
        reddit:[isAndroid?"intent://reddit.com/#Intent;package=com.reddit.frontpage;scheme=https;end":"reddit://",`https://reddit.com/search?q=${encodeURIComponent(query)}`,"Reddit"],
        github:[null,`https://github.com/search?q=${encodeURIComponent(query)}`,"GitHub"],
      };
      for(const[pl,[dl,wu,lb]] of Object.entries(se)){if(platform.includes(pl)){return launchApp(dl,wu,lb+` - "${query}"`);}  }
    }
  }

  // ── OPEN / LAUNCH APP (main intent) ──
  if(/^(open|launch|go to|start|load|visit|show me)\s+/i.test(m)) {
    const target=raw.replace(/^(open|launch|go to|start|load|visit|show me)\s+/i,"").trim();
    const app=smartMatch(target);
    if(app) return launchApp(app.deep,app.web,app.label);
    if(/\.\w{2,}/.test(target)){const url=target.startsWith("http")?target:`https://${target}`;window.open(url,"_blank");return `Opening ${target}!`;}
    window.open(`https://google.com/search?q=${encodeURIComponent(target)}`,"_blank");
    return `Couldn't find "${target}" as an app — googling it instead!`;
  }

  // Direct app name (1-3 words like "whatsapp", "insta", "yt music")
  // Must be explicit app name ≥4 chars and not a generic short word/greeting
  const SKIP_WORDS = /^(hi|hey|ok|no|yes|go|do|the|bye|how|why|what|who|can|get|is|are|was|did|has|its|him|her|his|any|all|now|here|there|where|when|then|and|but|for|not|let|see|ask|say|tell|show|give|take|make|need|want|help|good|nice|fine|sure|wait|just|that|this|well|we|me|he|she|it|i|a|h|s|d|f|g|j|k|l|n|p|q|r|t|u|v|w|x|y|z)$/i;
  if(m.split(" ").length<=3 && m.trim().length>=3 && !SKIP_WORDS.test(m.trim())){
    const app=smartMatch(m);
    if(app) return launchApp(app.deep,app.web,app.label);
  }

  if(/^search (for |web |google )?/i.test(m)){const q=raw.replace(/^search (for |web |google )?/i,"").trim();window.open(`https://google.com/search?q=${encodeURIComponent(q)}`,"_blank");return `Searching for "${q}"!`;}
  if(/search wikipedia/i.test(m)){const q=raw.replace(/search wikipedia/i,"").trim();return launchApp(isAndroid?"intent://en.wikipedia.org/#Intent;package=org.wikipedia;scheme=https;end":"wikipedia://",`https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(q)}`,"Wikipedia");}

  // ── CALL / MESSAGE INTENTS (native) ──
  if(/^(call|ring)\s+/i.test(m)) {
    const person=raw.replace(/^(call|ring)\s+/i,"").trim();
    const numCheck=person.match(/\+?[\d\s]{10,}/);
    if(numCheck){const n=numCheck[0].replace(/\s/g,"");window.location.href=`tel:${n}`;return `Calling ${n}...`;}
    return launchApp(isAndroid?"intent://send/#Intent;package=com.whatsapp;scheme=whatsapp;end":"whatsapp://","https://web.whatsapp.com",`WhatsApp to call ${person}`);
  }
  if(/^(message|text|whatsapp|chat with|wa)\s+/i.test(m)) {
    const person=raw.replace(/^(message|text|whatsapp|chat with|wa)\s+/i,"").trim();
    const numCheck=person.match(/\+?[\d\s]{10,}/);
    if(numCheck){const n=numCheck[0].replace(/\s/g,"");return launchApp(`whatsapp://send?phone=${n}`,`https://wa.me/${n}`,`WhatsApp to ${n}`);}
    return launchApp(isAndroid?"intent://send/#Intent;package=com.whatsapp;scheme=whatsapp;end":"whatsapp://","https://web.whatsapp.com",`WhatsApp to message ${person}`);
  }

  // ── NEWS ──
  if(/what'?s? the news|latest news|today'?s? news|show news|news today/.test(m)){
    return launchApp(isAndroid?"intent://news.google.com/#Intent;package=com.google.android.apps.magazines;scheme=https;end":null,"https://news.google.com","Google News");
  }

  // ── TRANSLATE ──
  if(/translate\s+(.+?)\s+to\s+(\w+)/i.test(m)){const tMatch=raw.match(/translate\s+(.+?)\s+to\s+(\w+)/i);if(tMatch){const txt=encodeURIComponent(tMatch[1]),lang=tMatch[2];return launchApp(isAndroid?"intent://translate.google.com/#Intent;package=com.google.android.apps.translate;scheme=https;end":"googletranslate://",`https://translate.google.com/?text=${txt}&sl=auto&tl=${lang}`,`Translate "${tMatch[1]}" to ${tMatch[2]}`);}}
  if(/^translate\s+/i.test(m)){const q=raw.replace(/^translate\s+/i,"").trim();return launchApp(isAndroid?"intent://translate.google.com/#Intent;package=com.google.android.apps.translate;scheme=https;end":"googletranslate://",`https://translate.google.com/?text=${encodeURIComponent(q)}`,"Google Translate");}

  // ── REMIND ME ──
  if(/remind me (to |about )?(.+)/i.test(m)){const rMatch=raw.match(/remind me (?:to |about )?(.+)/i);if(rMatch){const reminder=rMatch[1];Notes.add(`REMINDER: ${reminder}`);return `Got it! Reminder saved: "${reminder}". Check your Notes!`;}}

  // ── GOOGLE SEARCH ──
  if(/^(google|search for|look up|find)\s+/i.test(m)&&!/search .+ on /i.test(m)){const q=raw.replace(/^(google|search for|look up|find)\s+/i,"").trim();window.open(`https://google.com/search?q=${encodeURIComponent(q)}`,"_blank");return `Googling "${q}"!`;}

  // ── MAPS / NAVIGATE ──
  if(/^(navigate to|directions to|how to get to|take me to)\s+/i.test(m)){const dest=raw.replace(/^(navigate to|directions to|how to get to|take me to)\s+/i,"").trim();const deepLink=isAndroid?`intent://maps.google.com/maps?daddr=${encodeURIComponent(dest)}#Intent;package=com.google.android.apps.maps;scheme=https;end`:`comgooglemaps://?daddr=${encodeURIComponent(dest)}`;return launchApp(deepLink,`https://maps.google.com/maps?daddr=${encodeURIComponent(dest)}`,`Maps to ${dest}`);}
  if(/^open maps$/i.test(m)){return launchApp(isAndroid?"intent://maps.google.com/#Intent;package=com.google.android.apps.maps;scheme=https;end":"comgooglemaps://","https://maps.google.com","Google Maps");}

  // ── WEATHER ──
  if(/^(what'?s? the weather|how'?s? the weather|weather update|is it raining|weather now)/.test(m)){addMsg("ryn","Checking weather...");const w=await WEATHER_CACHE.fetch();return w?`It's ${w.temp} degrees and ${w.desc.toLowerCase()} in ${w.city}. Feels like ${w.feels} degrees, humidity ${w.humidity} percent.`:"Can't fetch weather right now.";}

  // ── CURRENCY (offline estimate) ──
  if(/convert\s+[\d.]+\s+(usd|inr|eur|gbp|aed|sgd|jpy|aud|cad)/i.test(m)){
    const cx=m.match(/convert\s+([\d.]+)\s+(\w+)\s+to\s+(\w+)/i);
    if(cx){
      const amt=parseFloat(cx[1]),from=cx[2].toUpperCase(),to=cx[3].toUpperCase();
      const rates={USD:1,INR:83.5,EUR:0.92,GBP:0.79,AED:3.67,SGD:1.35,JPY:149,AUD:1.53,CAD:1.36,SAR:3.75};
      if(rates[from]&&rates[to]){const result=(amt/rates[from]*rates[to]).toFixed(2);return `${amt} ${from} is approximately ${result} ${to}. Note: rates are approximate and may vary.`;}
    }
  }

  // IDENTITY & GREETINGS — try training KB exact match first for ALL short phrases
  {
    const kbHit = KB.match(m);
    if(kbHit) return kbHit.answer;
  }
  if(/your name|who are you|what are you/.test(m)) return "I'm Ryan — your personal AI assistant built into a Stark Industries HUD. Think JARVIS, but warmer and smarter. Ask me anything.";
  if(/how are you|you okay|status/.test(m)) return "All systems nominal. Reactor stable, mood nominal, wit levels at 100%. What do you need?";
  if(/version|what version/.test(m)) return "Ryan OS version 13, build 19. Wake-word always-on mic, mood tracker, focus mode, smart calculator, voice speed control, auto-sleep, and a self-growing knowledge base. I get sharper every conversation.";
  if(/bye|goodbye|shutdown|standby/.test(m)) return "Got it. I'll be right here whenever you need me.";
  if(/thanks|thank you/.test(m)) return "Anytime. That's literally what I'm here for.";
  if(/what can you do|help|commands/.test(m)) return "I can talk to you, answer anything via AI, search the web live, open 80-plus apps, play music, get weather, manage notes, todos, calendar, habits, timers, mood tracking, and focus mode. Say 'my mood [happy/sad/focused/tired/stressed]', 'focus mode 25 minutes', 'open calculator', or 'search web [topic]'. I also learn — ask 'memory stats' to see what I know.";

  // MOOD TRACKING
  if(/my mood|feeling|i feel|i am feeling|mood is/i.test(m)){
    const MOODS=["happy","sad","angry","anxious","stressed","tired","focused","excited","bored","calm","motivated","overwhelmed"];
    const found=MOODS.find(mood=>m.includes(mood));
    if(found){
      const entry={mood:found,ts:new Date().toISOString(),note:raw};
      const log=JSON.parse(safeLS.get("RYN_MOOD","[]"));
      log.push(entry);if(log.length>100)log.shift();
      safeLS.set("RYN_MOOD",JSON.stringify(log));
      const responses={happy:"Love that energy! What's making you happy today?",sad:"Sorry to hear that. Want to talk about it, or should I distract you?",angry:"Take a breath. What's going on?",anxious:"You're not alone. Want to talk through what's on your mind?",stressed:"Got it. Want to try a 5-minute Pomodoro or just vent?",tired:"Rest is important. Need a quick summary or want to set a rest timer?",focused:"In the zone! I'll keep it snappy. What do you need?",excited:"That energy is contagious! What's got you pumped?",bored:"Let's fix that. Want a random fact, a challenge, or should we get something done?",calm:"Nice. Riding that wave — what's on the agenda?",motivated:"Let's ride that wave. What are we tackling?",overwhelmed:"Let's break it down. What's the most important thing right now?"};
      return responses[found]||`Got it, feeling ${found}. I've logged that. How can I help?`;
    }
    const recentMoods=JSON.parse(safeLS.get("RYN_MOOD","[]")).slice(-5);
    if(!recentMoods.length) return "No mood logs yet. Say 'my mood is happy' or 'I'm feeling stressed' to start tracking.";
    return "Recent moods: "+recentMoods.map(e=>`${e.mood} (${new Date(e.ts).toLocaleDateString()})`).join(", ");
  }
  if(/mood history|mood log|how have i been feeling/i.test(m)){
    const log=JSON.parse(safeLS.get("RYN_MOOD","[]")).slice(-10);
    if(!log.length) return "No mood history yet. Start with 'my mood is [emotion]'.";
    return "Your last moods: "+log.map(e=>`${e.mood} on ${new Date(e.ts).toLocaleDateString()}`).join(" | ");
  }

  // FOCUS MODE
  if(/focus mode|study mode|deep work|start focus/i.test(m)){
    const mins=raw.match(/(\d+)\s*(min|minute)/i);const t=mins?parseInt(mins[1]):25;
    openOverlay("chat");
    Timers.set("Focus",t*60,(n)=>{addMsg("sys",`Focus session complete! ${t} minutes done.`);if(safeSynth){const u=new SpeechSynthesisUtterance(`Focus session complete! ${t} minutes well spent. Take a break.`);safeSynth.speak(u);}});
    return `Focus mode started! ${t}-minute session locked in. Stay sharp, no distractions. I'll notify you when time's up.`;
  }
  if(/end focus|stop focus|exit focus/i.test(m)){
    Timers.cancel("Focus");
    return "Focus mode ended. Good work — take a break!";
  }

  // DAILY QUOTE / AFFIRMATION
  if(/daily quote|motivat|inspire|give me a quote|affirmation|quote of the day/i.test(m)){
    const QUOTES=[
      "You don't have to be great to start, but you have to start to be great.",
      "The secret of getting ahead is getting started — Mark Twain.",
      "Small daily improvements over time create stunning results.",
      "Work hard in silence. Let success be your noise.",
      "You are capable of more than you know.",
      "Don't count the days, make the days count.",
      "Success is not final, failure is not fatal — it's the courage to continue that counts.",
      "Focus on progress, not perfection.",
      "Every expert was once a beginner. Keep going.",
      "Your only limit is your mind. Break it.",
    ];
    return QUOTES[Math.floor(Math.random()*QUOTES.length)];
  }

  // CODING QUESTIONS (offline)
  if(/what is javascript|what is python|what is react|explain.*programming/.test(m)) return null; // let AI handle
  if(/write code|code for|program/.test(m)) return null; // let AI handle

  // SCIENCE
  if(/speed of sound/.test(m)) return "Speed of sound: ~343 m/s in air at 20°C, ~1480 m/s in water, ~5100 m/s in steel.";
  if(/gravity|g =|acceleration due/.test(m)) return "Earth's gravitational acceleration: g ≈ 9.81 m/s². Moon: 1.62 m/s². Mars: 3.72 m/s².";
  if(/pi\b|value of pi/.test(m)) return "π ≈ 3.14159265358979323846... It's irrational and transcendental.";
  if(/avogadro/.test(m)) return "Avogadro's number: 6.022 × 10²³ mol⁻¹.";
  if(/planck/.test(m)) return "Planck's constant: h = 6.626 × 10⁻³⁴ J·s.";
  if(/electron.*(mass|charge)/.test(m)) return "Electron: mass = 9.109 × 10⁻³¹ kg, charge = −1.602 × 10⁻¹⁹ C.";

  // KNOWLEDGE BASE COMMANDS
  if(/knowledge base stats|what have you learned|how much.*learned|kb stats/i.test(m)) return KB.stats();
  if(/what is in.*knowledge|show knowledge/i.test(m)) return KB.stats();

  // WEB SEARCH — explicit command
  if(/^(search web|web search|look up online|search internet|search online)\s+/i.test(m)) {
    const q = raw.replace(/^(search web|web search|look up online|search internet|search online)\s+/i, "").trim();
    addMsg("ryn", `Searching the web for "${q}"...`);
    const result = await WebSearchEngine.search(q);
    if (result) return `${result.result}${result.source ? ` — via ${result.source}` : ""}`;
    return `Couldn't find an answer online for "${q}". Try rephrasing.`;
  }

  // LOCAL KNOWLEDGE BASE — fast offline match before hitting AI
  const kbMatch = KB.match(raw);
  if (kbMatch) return kbMatch.answer;

  // Fall through to local Brain
  return null;
}

// ═══════════════════════════════════════════════
//  APPS LIST
// ═══════════════════════════════════════════════
const APPS = [
  // Media
  {name:"YouTube",url:"https://youtube.com",ico:"📺",cat:"Media"},
  {name:"YT Music",url:"https://music.youtube.com",ico:"🎶",cat:"Media"},
  {name:"Netflix",url:"https://netflix.com",ico:"🎬",cat:"Media"},
  {name:"Spotify",url:"https://open.spotify.com",ico:"🎵",cat:"Media"},
  {name:"Prime Video",url:"https://primevideo.com",ico:"🎥",cat:"Media"},
  {name:"Hotstar",url:"https://hotstar.com",ico:"⭐",cat:"Media"},
  {name:"Twitch",url:"https://twitch.tv",ico:"🟣",cat:"Media"},
  // Communication
  {name:"WhatsApp",url:"https://web.whatsapp.com",ico:"💬",cat:"Comms"},
  {name:"Telegram",url:"https://web.telegram.org",ico:"✈️",cat:"Comms"},
  {name:"Discord",url:"https://discord.com/app",ico:"🎮",cat:"Comms"},
  {name:"Gmail",url:"https://gmail.com",ico:"📧",cat:"Comms"},
  {name:"Meet",url:"https://meet.google.com",ico:"📹",cat:"Comms"},
  {name:"Zoom",url:"https://zoom.us/join",ico:"🔵",cat:"Comms"},
  {name:"Slack",url:"https://slack.com",ico:"🟦",cat:"Comms"},
  // Social
  {name:"Instagram",url:"https://instagram.com",ico:"📸",cat:"Social"},
  {name:"Twitter/X",url:"https://twitter.com",ico:"🐦",cat:"Social"},
  {name:"Facebook",url:"https://facebook.com",ico:"👤",cat:"Social"},
  {name:"LinkedIn",url:"https://linkedin.com",ico:"💼",cat:"Social"},
  {name:"Reddit",url:"https://reddit.com",ico:"🔴",cat:"Social"},
  // Shopping
  {name:"Amazon",url:"https://amazon.in",ico:"🛒",cat:"Shop"},
  {name:"Flipkart",url:"https://flipkart.com",ico:"🛍️",cat:"Shop"},
  {name:"Meesho",url:"https://meesho.com",ico:"🏪",cat:"Shop"},
  {name:"Myntra",url:"https://myntra.com",ico:"👗",cat:"Shop"},
  // Finance
  {name:"Paytm",url:"https://paytm.com",ico:"💳",cat:"Finance"},
  {name:"PhonePe",url:"https://web.phonepe.com",ico:"📱",cat:"Finance"},
  {name:"Zerodha",url:"https://kite.zerodha.com",ico:"📈",cat:"Finance"},
  {name:"Groww",url:"https://groww.in",ico:"🌱",cat:"Finance"},
  // Dev
  {name:"GitHub",url:"https://github.com",ico:"🐱",cat:"Dev"},
  {name:"Stack Overflow",url:"https://stackoverflow.com",ico:"📚",cat:"Dev"},
  {name:"Replit",url:"https://replit.com",ico:"🔷",cat:"Dev"},
  {name:"CodePen",url:"https://codepen.io",ico:"🖊️",cat:"Dev"},
  {name:"Vercel",url:"https://vercel.com",ico:"▲",cat:"Dev"},
  {name:"npm",url:"https://npmjs.com",ico:"📦",cat:"Dev"},
  // AI
  {name:"ChatGPT",url:"https://chatgpt.com",ico:"🤖",cat:"AI"},
  {name:"Gemini",url:"https://gemini.google.com",ico:"✨",cat:"AI"},
  {name:"Claude",url:"https://claude.ai",ico:"🧠",cat:"AI"},
  {name:"Perplexity",url:"https://perplexity.ai",ico:"🔮",cat:"AI"},
  // Google Suite
  {name:"Google",url:"https://google.com",ico:"🔍",cat:"Google"},
  {name:"Drive",url:"https://drive.google.com",ico:"☁️",cat:"Google"},
  {name:"Docs",url:"https://docs.google.com",ico:"📄",cat:"Google"},
  {name:"Sheets",url:"https://sheets.google.com",ico:"📊",cat:"Google"},
  {name:"Maps",url:"https://maps.google.com",ico:"🗺️",cat:"Google"},
  {name:"Translate",url:"https://translate.google.com",ico:"🌐",cat:"Google"},
  {name:"Calendar",url:"https://calendar.google.com",ico:"📅",cat:"Google"},
  // Learning
  {name:"Wikipedia",url:"https://wikipedia.org",ico:"📖",cat:"Learn"},
  {name:"Khan Academy",url:"https://khanacademy.org",ico:"🎓",cat:"Learn"},
  {name:"Coursera",url:"https://coursera.org",ico:"🏫",cat:"Learn"},
  {name:"MDN Docs",url:"https://developer.mozilla.org",ico:"🦊",cat:"Learn"},
  {name:"W3Schools",url:"https://w3schools.com",ico:"🌍",cat:"Learn"},
  {name:"News",url:"https://news.google.com",ico:"📰",cat:"Info"},
  // Design
  {name:"Figma",url:"https://figma.com",ico:"🎨",cat:"Design"},
  {name:"Canva",url:"https://canva.com",ico:"✏️",cat:"Design"},
  {name:"Notion",url:"https://notion.so",ico:"📒",cat:"Design"},
  // Ryan OS internal
  {name:"Notes",ico:"📝",cat:"Ryan",special:"notes"},
  {name:"Todos",ico:"✅",cat:"Ryan",special:"todos"},
  {name:"Calendar",ico:"📅",cat:"Ryan",special:"calendar"},
  {name:"Habits",ico:"🔥",cat:"Ryan",special:"habits"},
  {name:"Timers",ico:"⏱️",cat:"Ryan",special:"timers"},
  {name:"Calculator",ico:"🧮",cat:"Ryan",special:"calc"},
  {name:"Settings",ico:"⚙️",cat:"Ryan",special:"settings"},
  {name:"Weather",ico:"🌤️",cat:"Ryan",special:"weather"},
  {name:"Calculator",ico:"🧮",cat:"Ryan",special:"calc"},
  {name:"Mood",ico:"💜",cat:"Ryan",special:"mood"},
  {name:"Focus",ico:"🎯",cat:"Ryan",special:"focus"},
  {name:"JEE Master",ico:"📊",cat:"Study",special:"jee"},
];

// ═══════════════════════════════════════════════
//  HUD CANVAS
// ═══════════════════════════════════════════════
function useHUDCanvas(hudStateRef) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const tRef = useRef(0);
  const lastFrameRef = useRef(0);
  
  // Particle Simulation Data
  const P_COUNT = 120;
  const particlesRef = useRef(Array.from({length: P_COUNT}, () => ({
    x: Math.random() * (typeof window !== "undefined" ? window.innerWidth : 1000),
    y: Math.random() * (typeof window !== "undefined" ? window.innerHeight : 1000),
    vx: (Math.random() - 0.5) * 1.2,
    vy: (Math.random() - 0.5) * 1.2,
    r: Math.random() * 1.5 + 0.5,
    glow: Math.random() * 0.5 + 0.2
  })));

  useEffect(() => {
    const canvas = canvasRef.current; if(!canvas) return;
    const ctx = canvas.getContext("2d");
    let W, H, CX, CY;
    const resize = () => { W=canvas.width=window.innerWidth; H=canvas.height=window.innerHeight; CX=Math.floor(W/2); CY=Math.floor(H/2); };
    window.addEventListener("resize", resize); resize();

    // ── Palette ─────────────────────────────────────────────────────────
    const PC = {
      BG:"#000308", PANEL:"rgba(0, 10, 25, 0.6)", BORDER:"rgba(0, 238, 255, 0.15)", BORDER2:"rgba(0, 150, 255, 0.1)",
      CYAN:"#00eeff", TEAL:"#00ffcc", TEAL_DIM:"#004455",
      GREEN:"#00ffa3", RED:"#ff2a55", AMBER:"#ffcc00",
      WHITE:"#ffffff", LABEL:"#66aaff", VALUE:"#ccffff", DIMTEXT:"#225577",
    };

    // ── Helpers ──────────────────────────────────────────────────────────
    const dt = (x,y,text,color,font='12px "Rajdhani"',align="left",base="middle") => {
      ctx.fillStyle=color; ctx.font=font; ctx.textAlign=align; ctx.textBaseline=base; ctx.fillText(text,x,y);
    };
    const glow = (x,y,text,color,font,align="center",blur=15) => {
      ctx.save(); ctx.shadowColor=color; ctx.shadowBlur=blur; dt(x,y,text,color,font,align); ctx.restore();
    };
    const bar = (x,y,w,h,pct,col) => {
      const rr=(bx,by,bw,bh,r)=>{ctx.beginPath();ctx.moveTo(bx+r,by);ctx.lineTo(bx+bw-r,by);ctx.quadraticCurveTo(bx+bw,by,bx+bw,by+r);ctx.lineTo(bx+bw,by+bh-r);ctx.quadraticCurveTo(bx+bw,by+bh,bx+bw-r,by+bh);ctx.lineTo(bx+r,by+bh);ctx.quadraticCurveTo(bx,by+bh,bx,by+bh-r);ctx.lineTo(bx,by+r);ctx.quadraticCurveTo(bx,by,bx+r,by);ctx.closePath();};
      rr(x,y,w,h,h/2); ctx.fillStyle="rgba(0, 15, 35, 0.6)"; ctx.fill();
      if(pct>0){rr(x,y,Math.max(h,pct/100*w),h,h/2); ctx.fillStyle=col; ctx.fill(); ctx.save(); ctx.shadowColor=col; ctx.shadowBlur=10; ctx.fill(); ctx.restore();}
      rr(x,y,w,h,h/2); ctx.strokeStyle=PC.BORDER; ctx.lineWidth=1; ctx.stroke();
    };
    const spark = (x,y,w,h,prices,col) => {
      if(!prices||prices.length<2) return;
      const mn=Math.min(...prices),mx=Math.max(...prices),rng=mx-mn||1;
      const grad=ctx.createLinearGradient(x,y,x,y+h);
      grad.addColorStop(0,col+"80"); grad.addColorStop(1,col+"00");
      ctx.beginPath();
      prices.forEach((p,i)=>{const px=x+(i/(prices.length-1))*w,py=y+h-((p-mn)/rng)*h; i===0?ctx.moveTo(px,py):ctx.lineTo(px,py);});
      ctx.lineTo(x+w,y+h); ctx.lineTo(x,y+h); ctx.closePath(); ctx.fillStyle=grad; ctx.fill();
      ctx.beginPath();
      prices.forEach((p,i)=>{const px=x+(i/(prices.length-1))*w,py=y+h-((p-mn)/rng)*h; i===0?ctx.moveTo(px,py):ctx.lineTo(px,py);});
      ctx.save(); ctx.shadowColor=col; ctx.shadowBlur=8; ctx.strokeStyle=col; ctx.lineWidth=2; ctx.stroke(); ctx.restore();
    };
    const wave = (x,y,w,h,hist,col) => {
      if(!hist.length) return;
      const step=w/hist.length;
      ctx.beginPath();
      hist.forEach((v,i)=>{const px=x+i*step,py=y+h-(v/100)*h; i===0?ctx.moveTo(px,py):ctx.lineTo(px,py);});
      ctx.save(); ctx.shadowColor=col; ctx.shadowBlur=6; ctx.strokeStyle=col; ctx.lineWidth=1.5; ctx.stroke(); ctx.restore();
    };
    const garc = (cx,cy,r,startDeg,ext,color,lw) => {
      const s=((startDeg-90)*Math.PI)/180,e=((startDeg+ext-90)*Math.PI)/180;
      ctx.beginPath(); ctx.arc(cx,cy,r,s,e); ctx.strokeStyle=color; ctx.lineWidth=lw; ctx.stroke();
    };

    // ── Arc Reactor Image ───────────────────────────────────────────────────
    const arcImg = new Image();
    arcImg.src = "data:image/png;base64,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CialVv8AaP4tRkBEm/x7mjxTNhNOZ+e1GGLlFUTLfcIZxLhSY5/7Vop/eKTV6Age0zOUgIvnD7S9wJ+JbKVsKP0ypP5Vzm8UuEt/z+l+HrkFxX9402y6E/gEGk59g4KDNYq6v0bwSvCSY1ydtzijsla1tEH/ADAp/Ok0nhFaJ6OfTuq47/klwoX+aD/ClyGCnqKsW4cHNaR0qXGix5yB0LLuCforFRG7aZ1BalFNws82P6qaOPxG1GRBoorJBBwRvWKUAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAoqSaX0Nq3UxzZbBOlN+LoaIbHzUdqsmx8B0xkola21dbLNHG622VB1wemThIP40mRcFJU7ad03f9RSxFsVmnXJ4nHJGYU5j54GBXou23T2XdAtFQs87WNyR0VI+0QT8jhA/A1i9+1zd40UwNBaKsmnoqRhClIC1Af4UhKR+dGWwI3ov2TuK9+7N24Q4NhjK3K5r+Vgf4EZP44qayfZ24Q6IQHuInFthTqN1xYpQ2o+nKCtf5CqP1nxi4m6tK03rWF0WwvrHYdLLWPLlRgVA1FTiytaipR3JJyTS7WJlHqH+nXst6Mx/R3Qc7VEpB2emI7hPnl0n/wANIb57W17RHVE0doqwafj45UEp7RYHySEp/KvNeDms4xSqAjkWBqfjTxM1EVidqqY22rq3GIaT/u71CuefdpgS9KdkOrO633SfqSTSbl5ugpRIhPxkNrcSOR0ZQtJyFemf4VJCvzjgjnPxnlmY9uddeebC2gWklRJVgHHl51ySkoNONsS42wuYGCpDRAKz8IJ6CkxfT2i1OIBUo5z5VO64qKfYgVknJrudELR2SUraJKSSpXn6U3OfGSBjJpS7J+zKAr50kKsmo7JJ8ElcWssyoYrArcIJxt1oKSBvUeCXJp41nFB2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QCiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACinXTun7vqCZ7raYLslY+IpGEoHmpXQVZdv0BpvS0RFy1hPakujf3dJw0D5frLPy2pMgV3prSt71Cs/o6GtTKfjfX3W0/NR/cKmrOkdOaXaTM1DMRKdG6Wzsgn0T1VW2qOKzy4/6O0zCRBjJHKl5SAFY/ZSNk/vqtZkqTNkKkS33H3VHJWtWSaMNhkm194iSVtmJZI6YbA2CykA49B0FQx55+Y8XpLy3nVHdS1ZNJyK6R0krwKfCPIyT4MLThWK1pR2alrKEglXkBnNJyDmntYEi8mQa2AOM+FY5cCnS1MNyguOogLUnLR/aHhToQcngZZNRWSf8A9G6e4gDUulZaHE6pft/vGnXO15W1OtZU40oeJUnGM9AFV6u9izVj124Zu6fuDy1XLTUoxFpcOVhlRJbz8jzJ+leMeGl9n6J1pbdWw2A47a5KXQ2pXKF9QpBI8xkV6GZ1nYeHHHocQYsxDeitdWtUtxKFBbjLpHMpCm0nIUHPp3z5UyyDi8sfCalwivPal4cNad48SWooEaBqAe/wAI47naLOHEf68/6hVNXKE/DnPRXkFLrSylQ8QRV8e0JxcHGC3sN6W0ZcC3p1xU39LkErZa6LykbJSTync9RVFS7k8+970pwrfXkrWrcknqTUlTjhpkdu5NNCHBCjkmt0chHXKs7CueebmKsnNc20FbnJzhCfM0ZwGMo7vhAAPRX3hWzRDiOzVtzHrWjY5xyqVnl6etYcDjh7icBPhTs+RuPA5xzht2Pyc3KeVK/Cll7mXtjTduskq5OG0xpLkmPHTgBp1eOZQPXJwPwpsjOSGoqXFI5mirBPr61tc3HJMMFbqnFhWQnwSKsSUZV8rnwV4742cPjyIUuJ98D0tBlqUolYW4e/nzV1p70zJiMz2PeGUupbWFFJOxGajYSrGfKnrTMNEmUS8taEJQVdwZKiB0qHS5diSRNq8em3J9ia6+1G5flLZKkuMu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U44c3gz9au6vnM2u43F10lUN1OUspwUhoI8EhIABHQUy8f8AW8O/z49isceTBtkQlx6OuQXUB8/FyE7hA8BUbzkkK4ssCTcZfZR4cqUG0l11LDRWpLad1KIHQAdT4VrczEM1fuQUGPu561d9gt8/Q3C9rTtpZUNaa6jdrLWDhyBaRuEDyU7uSP1cCqzu2nGAooZSqM62OUhQODjzHUUqkJgiZoFdpsZ2HKVGfCQ4nrynIrj4bUvcQwd66R3HWHUvMOLacScpWhWCPrWia2JG2BS4DJbuh+Nk+HAFi1rbmdR2VY5FpfSC4lPoT1p4vHCDTWube5feE13bcXjnXZ5LmFpPkhR/caognPWl1hvN0sNxRcLROehyUHIW2rGfmPGmOPsOUvc5Xu0XOyXF23XaDIhS2jhbTyClQNIa9I6T4uaG19bkac4y2NouKAQxeo6cONHwJI3FR/ip7Pd6sduVqXRMpGqtNKHOl+LhTrSf2kjr8xSZFwUdRWy0KQopWkpUDggjBBrWlECiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAoooFABUg0LozUut70i0aZtT9wlKwVcie62n9ZauiR86tbgn7Ply1NHb1LreSvTemEp7XmdwmRKQN8oCvgR+2r6Zqca54/wClOH1gc0VwQs8WIhPdeuhRzZV0KgTu4r9o7eQpMihA4ZcOuBltZv8AxMuca8aiKQuLbGhzhKvDlR97/ErA8hVUcW+N2qNduOw2Fmz2U91MSOrdaR051ePyGBVc3u63O+XR+53efInTX1czr76ypaj8z+6k7DaV5BUE4G1OUeRrlg5geVbcpoSN63SpPNgmnpIY2YSMCt2ioqwK3Vyk5rVtQbdCvI5qTGGRt5Qoa7NTiA5t3gD8qkWqbha222bdalKMZKAXfDnV6/KoylxDj/aJwDzZ5aUykJfdW50UrcJqVcrKInw8MRuMBSitHwfurUDkOwrbKirlwQB4Vla1KdBON9vSmYXckTfYWMqU4j7JIH6xPQUXNhLk9akoSAkDmCenSlbjEVmKpPagu5+J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lCsdfSkUKZIiSOdLh3BSr1B6itUlTXfBCSk5FSeunjgiVDjlZ+w6h0hsttDlSOvma5mQrnSFbNjwFape5nytX3uuK4vKwojG1QSs44ZZjDnlHZ9TXans1Ep8CetcngMBVcVE5oKjioXPJNGGDCqwTWFHNTDhxoG66umBaG1MwEbuPq2GB138B61E2SpDdobSV01bd2oMBlZQpQC1hOceg8zVsX7VFl4SWtdh0kpmTqNSCh+anvJi56hJ8V+avwpr1hru16OtLulNCKT25T2Uu5IGDjxS35D16mqZdcW64pxxZWtRypROSTUfcd2Os6XJnS3Zct5bz7qipa1nJUT41woopQCiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigDKSUkEEgjoRV9cEONzlvh/wBDta8tysEodmoSO8Eg7b+R9fxqhKKGsgeieNPAMxbKrXXDp/8AS+n199+Ojd6LnfcDqPUV5+yUEpIII2IPhVm8D+Ml74fTREdfekWZ3uus5yUA9cA7EeaTVma24cad4s257VHDdttF0SntJMRnZLnmQnqP4URk4g45PM6SSetSBDDY08lPOvtVL51EnuoT/M003a23Cy3J233OI7FlMqwttxOCK1dmvut9lzkIPUCrtFsYZb9ilfVKbSXGGPemDFbW48+pHZp2Vnc49BTvdLxAcZYjRrQE21LoPOT9qseO9QqK6GX0LKQoA7g9DTpKuKV91pHIjry1dp1mK9vYpX6PddveX9/85Od/R2d2kIbTyICsoHknwpKwy8UKf5coR1UemaJEjt2xzAl0HHN6VokuJR2ZJ5CckZ2qpNqU3JFuEXGCi+5q4A4QPveJ863SwGU8yjlXgBXN9CkcqhtzdK7MKHLhaVLQPjx401LL5HttLjsPkO4RE2ZC30AyI6+4AP7QHwqPPOPSZa3Xe868vJ+Z8KdrI/aFTHEXNtz3dTSg2UHdCsd0+tOehbHab3dVwrhOMdxYCIqEglTrh6AVb2z1O2Ka/nuUd9ek3zkn7+/4fuMC0LYeMNv7RxtWFhByHHDsE+uKubQGj5UizxNLtx/fHJ7gL8Ze6S4fH9nlHU1Wd9st00tIcbKA6w29zBxHxtrHjnwNTLQfFqXYNM3mIqMqTcbgyIzN2QrDsNpR+1yj9YjbmFUL4Tqs2zWGX9PbXfWp1vKY28TNAWmLqCZF0TcV3FiKezcbcUBzuj4+xP30g7b77eNV8JDsdwx5zK1ch5SFDlcR6b/xq1LfGauwjtwXWkBxSUIc5u6keZPhinziTw/etrChqZDMuGy1zt3yGoZSnHRWfjGdsHfyNQN5LCXgpWYxDEFuRGnNuuOL5AxynnSPM+GK4OJPZ+7x2i4ACVHGcnxNJ0gpdLjBUEpXhLhGMeWfI0sROlIcdPMllx5vslLSMBQPX8fOpIvEX7jZLlexwbC0MFzmylPUHqPlWO0DivU0vtdmut7ceg2eA7OdjtKkPhkZ5UJG5+QprYQVL9KVblga9jzjuKlISEpSVdOtc1BPewNvCsKBUcAkYpVa4jsuSlgDI6k+QqVRcnhIjlJQjubEScHY9a6dqpKBkc2PhB6Cuqm0IlKASTg7VlaEuJUtIyAcYx1NCg0gc0zg0+92icEqwcgVs9/bE4AzuR5V3ShtptRBAcBwT/AUlK/tOYjNNacVhsVNSeUjY4BHKnvVzQshePOurqgEggHnPWubK+zdSvlBwehFI+46PY0cH2hVTnbdT3u3YQzOcW0P7t3vp/A03vhPOeXp4VwUMmoprkkg+CwLXxCYWQm5wFN+bjByP9JqVWy/Wi4DEO4sqJ/u3DyK/A1SoFZ5fGmbR+S6rnYLTcE5mW5ok/3iByK/EVG5/D2GvKrfcHWT+q6nmH4ioZbNRXq2lIi3B4IT9xR5k/gaktv4iykgJuFuZe33W0eQ/h0oFG+4aI1BCV2kdtEkDfnjub/h1pZpjiFxK0S9/wA06kvlsCTu2pxRbPzSrY1JomuNOSAnmffiuHql1vIH+YU/QpUK5N/1aXFmIPVIUlWf8p3pM88gKLZ7VGrXo/umsNMaZ1UwRhRlRAhZHzTtn6UhvusuA2rGkLl6An6VmlWXHLe6FtK+m2K43HS1hk5Mm0NNLP3kAoNReToW2OuK91myI++wUkLFDwBK7bw64Oai7tp4optb6vhbuDOB9Scfvra4ezXqZbJf05qXTd/b+4I0xIUofLNQSTw+uCATFmw5PklYKDSB/TuqLXhbMaS2rwVGe/kadjjuNzyPl54I8UrUkqf0dcXUJ6qjpDo/KofctPX+27XCy3GKf+2irT+8VJbRxG4oaYc/qGqdQwiPuqeWU/gdqmNr9p7izFbDUu62+6oG3LOgNuE/M4pvI7gpbvIOFJwfXashZHUbGr4/+qMauCh/SfhVoy7K+8tMbslH8K6jilwJuQP6Y4JJjLV8S4Ezlx8hS7mJtTKAJFYyM1fjs/2W7goF2z60s5P+yWlwD864f0X9m+5OEQeImorZnp75b8gfUUbmKkUYlWK6LWkpGDk1fjPCDgpKSDG4829snoHoRBH7q0k8CNBKTzQOOmln/ILTyH99LvwN2psoJSwQBjesAivQjPs0xZUdL0Pito51K+mZSU/vNar9ly7HdjiFopwf/nBP86TcLtPP4IrcgK3q+B7L2oh11xor/wDWaaUs+y1dlJHbcRtEtHy9/B/jTlMRxPPqQnPWsKwDtXolfsvIYTmRxW0Yj5Sk/wD01N6+AGl2HuzncaNJR8dSFlf8aTeg2lDKWK1K/KvQJ4McIYjSlzuPFncUkfCxHJz++mp7SPAKAP6xxFuc8jqI0U7/AJUOYKKKSKifA/hRk+INXjCkezVAH20XVN0UP1u4D+BpU3r7gLAVm1cKZsxaeipMgEH55JpMti4SKFQVFWEjJ9KXQbTeJ6wiFbJslR8GmFK/cKu5PtAWG3O82n+EWmYik/Ct/vn91Irn7TvEZ0kWxqxWhHgmLCTkfU0mZBwQqx8IOJl7I9x0jcyk/edb7Mf72KmED2atddkHr5PsVja+8Zc1PMB8hUVu3F7ipfVkPasuywv7jBKB/u0yiDq+9FbklF1mKO5U+6cf7xpUm/INpItFfCLhdYV/+k/FyC4oDKmrezzn5Z3rjHvPs86aViNp+9apfQdlyV9mhX0quI+hbu53pCosYeSl8x/KneDoOGgBUq5vLP6rTYT+ZpMC5ZOZftHvWxlcbQ/D7TGn2iMBxccPO/PJ2zUDv3FbiNqVtTc3VFyUlWwYi/Zo/BNOrOlrJF3RC94X5vKKifp0p0hriQwEKXFhN5xlWEAfxpVhPsI8srRjTeorivtnYr5K9y5JXjP4708RNEOgATbihCfFLKc/makt41PYYTy2zc0zFJ8Y6SoK+pxUYuGuQrIgwMftOqz+QoyxcIf7dpWxRyCIqpK/N5XN+XSnKTMt1sYw9JjRED7gIB/Ab1WEzUV4lkhcxxCD91vuj8qbDlasqUSo+JOaMNiZwWHcNcWxjKYcd6Wr9ZXcT/M1Grnq68zSpLbqYrZ+6yMH8etMgb9dq15SDsKdsG7kbrC3Vc7q1LWepUcmjs+8Ejc1srwOa2aJQ4lY6g5FSqKyRuTNMhOcit21KUhXInBxQoYcKiM5Oad7QlhDL6nYqXkrRygqOORXgRUtVbnLGSG2xQjnBtpi0Trg6lDCilSe8ATjOKUauamsLEp51Sy7skq67V1t777aCwtXKpG6FJ2OK21W+qUGFuuJUENBA9MVpuuEdM0u5lepZLVpvGCJNuKC8kmlT6ULSlaPEb/OucSJJn3Jm3wI65EqQ4G2WmxlS1E4AA8yal2uuGmsNEaatd81BERFZuDi2+x58usKT0Dg+6SMkfKsZWKPDNt1uXKIStJBNahJJ6U4IaSprtB5Zrd9CpC0LQkcyxjApXWIrPAgIwKywTzApODW7zZQsoPUbGtWyEOJ5htnekxyLnKO6sqJUSAfKtHArJCTnbOK6EpW5yIT47E053K1e621mYlwuvZyoJHdCf51LjKZHnDWRVoTTV11FKdbg4QlKD3ldFK8E/OmiSJFsmPx3mi3JaWUqCuqVCnTTGpLlZpaXIb5bCznl8M078R7Dcm4sPUcxQdcuGS+pO4Srwz8xRnCyhMZlhkPhTZ8f3r3afJj+9tFmT2bhT2zZOSlWOoJA2NEeU00w7GcQVoUMpP6qvOkayUnasbYz41GpYeUSuCksMytxRRy9BW0dJUCK6SBHLTKmQoKKcOJV4HzHpWhSUJB6ZpGmnyCaa4O6GhykcwBAzXFwAYxWULztQSACTvT3hrgak0zUlXKNvka6MhSwc5JFaqdKmwknYdBXNtakZwTv1pqaTFw2hUgNpST1VSd45USepo5iN65rVk5olLKwEY85DO29ak+Fbx2XpUhEeO0t11Z5UIQMkmrn0Zw3tumbKnWGvn0x46e8zHPxOHwCR4n16CoZSJkiPcM+Gjl3aN81CsQLPHHO4pzugj1/l1pTxM4lsvQDpbRrZg2dvuuOoHKuRjzx4elMfEziPcdWOiBET+j7IwcR4bRwMeavM1BKZjPccB3OTRRRSgFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFSfhzrm/6E1Axd7FNdYcbUCpAV3VjyIqMUUAe00SuHXtLabSzITHsmtWkYQvZIeVjw9T5V5d4laA1Fw/v7trvsNxvlVht7lPKsVGrPdJ1ontzbfJcYfbIKVIOK9QcOuNul+IVlb0VxfhoeCk9nHuZSCts9BzHxH50JtA0meXAnKgaVqKA0EpIHn51b3HLgJetFM/0i02v9O6We77UqMectA+CseFUpzGpoWIhnW2dHDv3NhSiM8lLBQBknrmk7SULzzLCMDIz41hJGeUeNPjJp5GyimsCiWsuNtkI5QlOB61yjPLQ5gDIOxHnWwcwpKVZKR4V0SUGThCeUHpTu8s5Gdo4waSWlR3i2djjP41IdDXh2xXRq7tMMuux1hQU4nJR6j1pocZdnSmm28FxWEDJ61rKjPw3H4yySto4c5elT17qpb4rhFe1Quh6Uny+/wBgqXqCcu6SZD7i3kPuqWtCjnOTXCethb3vsRr3PJwlCVZ+tJUslxJWASEjKseFbtFCgUK6eHpTHOU1ibyPVcIPMFjHsKrfdn4kgKZfMRwncpH2avmnw+lSPWOubvd9JxbA9hDKXuZ3lXntyPhP+EVDW2y452eMnNKJ8AR0svNL5yfiQemfSq/oycW0WfWipJPuy1dPaAt8nQT5iXJuXcULSt+KPhcyM9w+PLVf6r0/+i1x0sFzMhZQmKoZXzZxt6Z2o0vf59qfSYEhSEtkqMdasEeZSasTQswPSrxxl1EyHbfp5KWLPHdHdlXBQ+xRjxCP7RXyFRtpLI/lsgeutOy9B6gZska9F26rhINyZiko91dWMmMpQPeIGM+GTjwqNsLaZ50uhSHBsEkU6W3t7rdJFyuL5fnTHFOKU4rvuKUSVL+ZJNcLx2T9zREZPO1GGFLPUnxp9blwNsjHDyItm09oUklW+B4Cni33RFugvKjoQpx9BbKj1SD1xThpXRmo9R2e53aytLEdr7DBGEvDHMoBXTYDJqLR2VvuFLTQCgOUJTvk+dTV3SjP4CC2iM4fGdi+hbZHIQ4TsfDFcy4GGVpSoqUfwFcgezcKVD0NYeYKcHwVuKRzk1keoRXBoF56mhTnNgAYxWpQQeldorSFErcyUjwHjUUVJvBK3FLJlaw+6EpTjYCsOciVch+7tXZEbZbueVtPQ+JNcnmFhKVqGAsZTv1qRxljJGpRzhM1cKSAQa5E70EHOKyU7b1E+SVcGBvRvispwKFUgGorFZrFIKBFZQVNq5kKUkjxScGg1kbijAuR4iat1HEQG2rtJU2B8DiucfnTnD17c2z/AFmLGfHiQCg/lUSIoxSYFyWLF1/b1gCVBksnO5bUFAUuj6ssshf/AMsC15BxBTVXBNYWBnahoRMuqJNgykhTU6G8P+8T/Guzttt74Pa22I7nqeyB/dVGpG+21KmZs6OQWJkhvH6rhFJgXJaz+k9OPfHbA36trKaRu6BsC8lt2Y18lg4/GoPF1VqFkjlujxx0C8KH504p1/f0o5HRDeHmWAD+IowGR4f4ewlA9jeHh5c7QP7qQq4eulwJburGD4rbIrRHEGWMdrbI5/wrUKVM8QY+R2trcA/Yd/nSMDgvhzc0nKLhb1/MkUkkaBviD3TDX/hcx/Cn1HEC0kYVAmj5KSa6N67salHtETEDwygGly8BgYBoDUaI6XCzEUlXQCUnP4Ukf0fqFpQT7oMnxS8CKl/9M9NEZD0pJ9WM/wAa5nV9gJ2lvf8AuD/OkyxcIhw0rqInAhuH/wBoP50rb0TqFxkL91Qjz55AB/DNSlvWGnx1mO/+5P8AOl41RostBTl8ldpjoIBP55oTaBogKtHX0KwWW8/96K3b0TelHJTGT83ak8rV+nkrIZlSXU+Zj8v8a4DWdlB3TKV8kCjLDA0J0RcS2e0kwWz4DOSfyrRGhbgVd6ZGSPTJp2e1taQfs4ktQ+YFJ167jJ2atzp/xOUrbYJJGWNBJx9tdT8kN0uY0PaEJ+1lTHD6EJFNw169kdlaWP8AO4TmksrXN4Us9lHhMjwCW+bH40LImUSePpHTzZGYjjp/bdNOceyWpgYj2eOPUoz++q2kas1A6c+/qb9G0hNI5F2uUjvSbhKcJ83DQk2DaRbLrrEcYUuLHA81JTTbK1Fao+UuXVCseDeVVVCypasqUVHzJzWzYKTkUKIjeCfydb2xvIZYkv8AzwkGm9/XkxZIiQIzPkpwlZqKOt5R2gG3jWjaRnKulP2YY3flDvO1Tf5QKVz1tpPVLQCR+VMzrrry+Z1xbhPipRNbEZO1aYPN0pGhUzPICOlYKaVLQlCUjOTjJri4rJzinOOBsZZNMVsE+NaZ3pVyI7JJCsk9R5URWRZPBxJOK3CFdlzkbdM0OJ5QNutdG1rDKmwe6rqKelzyRt8cGuQWgnl7wPX0rLaS4rHjXSOEgq58DA8a62yJNuc9ES0wpMyStXKhtlsqUT8hT3hJNjVltpGp5GuXJ5l+XlXRM5LIVkE8xzy+FcWkLefUlaC2tCuVaSMEH1rpcYCUyEiO8lxBGSSccpqSMpqO6BE1By2zHi0S23JSVPI5w6nlAHga5JMCDqiErUcSRKtKXx70wy5yOKbzuEnwON61tbqIZR0PIc8/nS3U7ke6w1yUIKVgePmKuyi7dO1nkown6WpTS+F8HHX94s83UzV90XYJGnrbHKG4+FlWXG+i+boFkAEjPWrWs3C66680ovW+sNdGSZ0dT0dIfAbDuCEhxa+6kgjBAGRUOvnEJGq+GNo0BB0gl64x8KVJZSSsuJJHOhCR1KNlZpLwj01N1+2/pydqp63262JMlEDBUpzmPfKE9M5xknzrCN0grThjhxhzBU2opPKcg/I11YlIUy61yhOd0kdQanvHLh/B0cq0zbG3J/RstksuqfXzqD6Tvk+GQQQPQ1AoERa2FuBGUDqqrEJtpIgnCKyxAta+fNbklR5ldaVsR2npYbUvlSfGuioDhUtDTa3FJ/VTnIpcBuRwYVjlXjJB6U7T7qp63NxW08qUnKvX0piSVA46UplO9oEKQ3yYSAo/rHzpyYxrkz2am+XnBSlfeRTlJ1DOXZf0WJDio5VzLSo5yaZC4vmCiokp6Z8KU3iRGlvpfjMdgVIHaoHTm8SPnSbhdvuI1AKPWtFbHFYIINZ61ES4Niru0BW29YA7prXO9LkMG5PlWykqKfSuea2C6XImAxtWBsd6FGtOakbwKkdFKBpw07YLpqCemHbYynVEgKVjuo+Z/hUt4WcMLvrKR7y8DBtLXeeku90cvzPQetTDWuvdM6IgHTXDxpD0hscj1xKds+PJ/PrUcp57D1HB2tsbSXCOAJt3S3ddQLTluIMHB/b8k+n41U+vdaX7Wl3Vcb1LU54NMp2baT4JSPCmOfLkzpTkqY+t95w5UtZySa4U1IUKKKKUAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACsgkHIODWKKALi4HcdNQ6Bkfo6a4bnYX+7IhyO+gp8djVm614RaK4sWd3V3CCUzGuXL2kqzKUM56kpHj9K8oU+6M1ZfdI3dm52Ke9EfaUFDkWQDSYFyJr9aLpYbo7bbvCehy2jhTbqcH5jzFIAcGvWdl4g8OOOllbsPEiKzatRJTysXVpABKvNWOv0qn+MXA/V3DxwzlMfpWxOHLFxi99BT4Zx0pyn7jXH2Kv5/E0stfZuyU+8K5W095R9BTeTvW6FbYqWE8PJFOG6OB3aubTfvDsdgJkFWWl/wCzT6DzpLbZTyJ3aHLqnNlpVvz586TNEJOSOu1KbZHecnNoY5SvOU5OKsKyc3EglVCEZfuKHEvMqdU0wptAGFpO4ArnEjGU8lDBAUo4wT0pRdpqyhcZtauUn7U/rKpsbUpI521EKSeop9jjGeO6GVqUoZ7P+dxxZbZauCkF4BCDhTmPxxXRMmG9KXGUpzsAolpZG/1FN0RxXalRRz5OVDzpzhx43vTs1K08qU5Q0rrzU6uTlxEjtio5cvb8znMtgUw4+VpCE/AfEn5V2umo7/M0ha9KSZKVWa2POvxmEICftHPiUojdR2wM9KQLeW44ptWQo0MMyHUK5U8yUjf0qOyEJv4US1ynWviZvblSEr5Y3K4UoJSpY3a9Qaz7m82luO1lcmWvlSB1OT1p0tkVP6MCm/iWv7RXl5Cmtc1LdyW6tKuUkIQ4k7tDO5A86dZSqa1LyxtdzutcfCLDmam1Tofhw/ptuUGI10QqMGAPgT1ccT6q6Zqt7dNRGjrQhPK6pJSF+WaWamuy7vcW8yXpMOI2GYxcGFcg8SPMmmN1J5zj8KqVylX8SLdkY2fCzsnHOPvEGhTqis53B8K4tLUhWRXdtBcBOKdF54Qkljlm32allLSifLmGCaU25ouOrYwkKKSck9MUiSw4eZeO6nqaWxAjslg57RWOVWennUtXMuUQ28R4ZoojmKOqQa5vEqIAzgdKVyGUx2S4VhQPTHjSJbragnlJz4ilnxwxK3u5RoUYHMR16VqrdOa3cUSAnOw6VIdFactl7teo7hddQRrSi0W/3hhteC5LeKglDSE9T45I6VBJpFiKbIvynrQc1u2h5xKihpSwhHOspGeVPmfIb0J5SMeNN+Q7saJPhQcA11S2OUqJAxXIjJzQ1gE0zHWsihI3xWSPHNJgUxjJrZKM1kdAQK3bSpasAZNOSGt4ND3elYXg4PjWyxvXNec0jBAE1kCsoONvOsq2OAaMC5NMDO1YNZNHWkFAJyOla4FbVjqaMAYGxoIrOKKQDUCjFbDag9aMCmMVnAxQBQelGBMmuKykUVsgjO4owL4MYOayUg4xQTvWRuoAUo0xgg7V0QOdYSOprYpOTjyrVCTzZ6U/GGNzlGHB3sDwrUJJOK2G6jW7BCnOXYZ8aTGWLnCOSgEKwetdWVIAPMM+Vc3UEOEHrWUd3A8qFwwfKOqSlSShRIBHh51qAMYrKwVAqHWtW9jhRp7GY4Ap5R0rUE5pasJEYDkzlXxfwpOAkZ2olASM8o1Wo8m/WtM5G9dnEHkB860KMJ9aRpipo0UkAcwG1CCsqAFdkJzsaVLZQy0haFpWs/dA6UqgI5+BMsZ7pPSubZXz4SnNbr5grOKVMNc8UvAgFKsEeJpyjuY1y2rkdNHPaLYbuLmrot0lvhIENmK6EJUTkEqPpsR570v4O3fWsTULtk0M+2zcbqjswVlKSOXKgUqV8Jxmk/Dq7WmwcQLRd75BjTLY29yy2pEftk9mRgq5PEjOR6inXilrW0zuLKNaaKYeihpbTiFPMpQlbre3MEDYJICe786rTWJYLNbzFMZ+IWnL3pPVSot9ktPy5rQlqfZVzJWVkk743IVkGmRzs0tYcXhfgnzqydSQNRawdhXziTq+22xpxrnhMJSH5JbX3gGmGugPqRSm7cN7Y9w7vN1tNkv0d+3ITKYnXRYbXMaBw4lLA+EBPeyd9sU+Fu1YGTq3PJXlnDSz2UnZKxsfI07T7e83bh2ziGm0bpJPxCkWn4qbkht0BSy2O+lI8vGl11iPuOttSHe4ofZqJ2Ardoj/ALO7GTAvs/38J4x3/wAE09lm+NWzXsqyJU3y3JrmiulA5g83khIPUZTzD6CkmrObhfx+bvEdsotkp33pKQNiw6SHUf5TzD6Cq7hXF7T+oId0gLHvMCSl5BB6lJzj5H+NXt7UD2m7/oGzX2Pdbe3PUlEuJG7UF5xp4DtEYHTlUArfH3qwbY7Zs6Cqe6CZYHETTLOq9D3Kyt8q1vNCRBX/ANqkcyMf4hkfWvH0JbiAuM5zJIJCkHbBFWfbOOGpoWirRZrREYjz4LXYuXN77RSkpP2fKk7AhOBnfpVX3ORLk3KRNlyPeJUhxTrruPjWo5J29aK01yxLHF8LucpLZaVkqwo+FS2x66Nl04YEK3MqnKUeaW4OYhPkKhkhwrVk9a1SochB3qRy54GKPHJ0dcLrinFEcyiScedc3Fq5QM7VqCaCc7Gm5H7QTua3VsMCuYrqlWBjzpEKzTcitQd62XtWud6Rggyax61sTtWppBTI3oNYzUy4dcOdSa1mJRb4biIo3ckLThKR4nJ/fQ2LgiUSNImSER4zK3nVnCUIGSauHSXDW0abtKNUcQ5qIkcd5mL1cdPklPj8ztTrcrtoThLDVAsrce/akAwt34mmVep+8fSqX1VqS86nua7heZrkl5R2Cj3UDySPAVG22O7Ez4kcVrjf436DsTf6IsDZwiM0cFweaz4mq1O/WiilwAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQBs2tba0rbUpKknIUDgg1d/Bn2gr/pNsWPUATetPvd12NJHOAk7H5fMVR1FAHqfWfCXQXEu0vao4VXNqJO5e0etTpGT58vn9K83agsV10/cFwLtDdjPIOMLGx+RrbS+pLxpueiZaZjjC0nJAJ5VfMV6F0XxV0DxCho07xStXK66ORue1gONq88/eH50ibQuEzzWhCiOuBW452yFBRGDsRV3cV/Z9u9hjL1BoqYjUmnVd5Lkc8zjQ8lp6iqRfS424pl5Cm3EnCkKGCKmjNMhlFrubyZPbNAEDn5sqV+tXBtXKojzrPZkp5ga15cDJp0pNvLEiopYQpbBS2FJO6jjat31goCkEhfQikgcUNgcVulakIKcjCutPU+MDHDnJluStsknCiRjJpyanN/o3s2mw27nvqH3qZ1EEkiuzSSGyvPj0pa7ZRfAllUZLkcrVPVEW424Spl5JCwPD1FN6xlR32zW5SjkQUrysnvJx0rJS2XsIUSgDckU+UpSSi/AyMYxk5LydVMqihpTyQAtPOlOd8etJk4cdW4rZNcXnFLWSST863YV3FJIzmo9ybwiRQaWX3ANhRJ6U6WlpIZeU8MM8hzn7x8ADSMOtsNBTffcUMHmGyacYUx6VaHYknlEdgc6VhO4Pl61NSoqXzIL3Nx47DcRj4/HcCtpASlplTCyVKzzpI6HNcytAAXnmOeh8K35+05lbCmppj8PudHUF9BSDkjrTe6goWR5U6xcIjOPFB5W8FZB8+lNzqg64ogcvMelJak0n5FpbTa8HJKlYpzuVllwrZargtyFIbuiFLZQw8HHEcquUpWkboVnoD1BFN/Z4OAa3ZcLD6HGVKbdbUFJWnYhQOQR9artMnTRokrQVtturb5k8qxnGRnofqKe9Vagueq7o1c7m1DbcYitRECMylpJQ2nlScDqcdT40s0fqC1wdTu3XVWnGtTR3Yzrao7jha+0UO67zD7wO9RspUkFWORJJITnpSxXPKCT44YONqSQFZGaEdmkKCwcnoa0Q8oHPNk+tdXk4UObGSM7U5e6GP2ZtbID1yu0S2xhzPS30MtgeKlKAH76knGaw2XS/Em7adsK5DkS3rSwpTywsl0JHaYI8ObOK24R3m06c4jWjUN7hSZlvtrvvDqGE5IIB5CfTmxUZvU9dzvM65OqUpcqQ48oqOTlSif41C/rEy+qJUKUBzY7ucV3bdU2o8u2a4FJBSMbkc1dEJKjgb1JFsZNI69xQGe6fE1xKQTtvihw+ANbM93KuYDb8ac+WNxhHM5zWCc1vlJ2OxoUOXpvTcDkzHLzDPgKwdhtWQTjFa5pAMGsYrcjasJBNJgXJisEVuU7Vrg5xQKjU5ozWxGDWMUmBTZGDsawob7VgdaUIjrU6y2koKnjhO/T5+VO7ob2OBGBWo611kILbqm1Yyk4ODtXMdaRioM1ukY3xWpTmso+LFCEZ3ZwVJ5lcoPWhQHNgedd4zDZbK3lFOdkAdSf5Vo0j7VSV4GAc5qfa8Ig3LLwcXAEEgb+tat4CgfGskKK8DdJrdtk5UQchPWmYbfBJlJcmXVFa+0IGK5p3V6VnICilSunhW7fZYJUSD4AUuMsbnCMJGFEDpR2ZC+9tjrWUEk1gcyncdTS4Dk6LPw8p7o8K3djvqZMnkKm84Kh0BrBbHY85PjgDypWmW0zCbAc5lZwpjHdUPM1KkudxDKUljaJm28xygjCycgnyrmhgpUC4rA/fSyG+25LSp9oln7yR4CkcqSTJUUdxAOEjyFElFLIRc3Jo1eGDk59Kc9PSYjSJCJqVFtSO6U9Uq8KbXXgpHOrB8MVzUkKiqcQ5gg7o9KjbSeUSYbWGdpTrXP8AZHnJ6k10YlpStJU0FAdU+BpuZwHAVAkDqKWNpSvJAxv0ohNt5Qs4JLDNppb5AUK7+c8pHSvRXE+2W3Vns12vUFmtsWOqC23LKI7SU8uPs3wcdcHvb153MN1xYdV3Uedeg/ZcvMaXoXVGkru6ymFDUX1KeWEpTHeBbdBz4A8p+tMvi87mh1Eo42pjZwQn2+Lw3TdbNbYTF6hzVRLhMW32rykuJKmVpKs8g2UnA8RU7tF2VMeZm3FxT6VKLMpLishSFZSsfIgmqG4daigaI1BqSy3N9+Xa5cdyMXIGFlbra+ZlxOdscw6+SjW1x4laiLLrNnYatbDvVwp53T18TsOvhUCi32J3JLuINWWq8aE1jetKntYyUunsyoYLrJ3bUD5FJBpA5e1/ohuGtkLKSeVw9R6U2z7hNmzFXC5T5M6YoBJdfcK1YHQZPhWHpDDkMJ5Sgp6AVo03ThDbu8GbdRXOe7b5/MSKHM+TnOetZcZSlXNuceBpXZWIz0oGU92bKQScdT6VhQ7VKgE9Dt51Eq8x3e5M7MS2+wnW8VoCTsB4CurK2EMlat1pGAk/vrktktAc/XyrQfaOAbDO1Ny0+R2E1x2ODneUTQAMZNbPJ5HCnOcVnCS0cHvVFjkmzwYSlJSTnfwFcyN62HSsZINIxUYxg1sNhmtaM0gpuo5O9aYGa2GMb1ruVAAEk9AKGwRg7Uot0CZcpSYsKO4+8s4CUDNWjwj4JX3WaTc7m4izWNnvPy5JCEhPzOw/fUu1Rr7hzwzYVZeGcFm8XRscjl2fRltKvEoB6/M1G5ew9IQaN4T6d0vbG9T8UromGwBztW9G7rvpjw+Zpl4ncbZt3gq05o2GjT2nkd0NsbOPDzUrqarLUuobzqO4uT7zPelvrOSVqyB8h4U1UmPcXJlSlKUVKJJO5JO5rFFFKIFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAWHwy4u6t0NKR7lPdfh9Fx3F5BT5b/uNXMVcKON0MlaWdOalKfjQAhK1eqf5V5Wrow86w6l1lxbbiDlKknBB9DSYFyWHxJ4Saw0O+tcqEqZb+qJcfvoUnz26VX6l5Tg+FW9w448X2xxk2nUTarxaz3TkjtUD67K+RxUvumiuHfEyIu66XnNw5hyVpZThaT/ANo0dx8xSqbXcRxT7Hm8Hes5zUs1rw61NpZSnZUQyYQPdlR+8jHr4p+tRIEU5SGtAAc10SD4nFYSreg+dPQ1nQnCMpH1rRCyDn8a2SrCeXzoATzYOwpw1GhAKs11TyDGDjzrkrHMcdKzzZGKRPArWUdCtvJG5HhWy3Ry8rYKU43GetcN63bGVYB60qk2NcUgQCVenjXUHucuBjOc1jnAQpAHdJ3PnWzchLQUQ2hZIwAroKesIa8vwD7uWEtJRypByTn4j61xbSSrPSurTyVuBLyRyq8R4Vu6wQ2tbakqaSrlznc/ShrdyCe34TgASrauih2agSNyPGtU7DJ61h8qBBUcnFJ2Qd2bKVlOBtWFIV2XMSSM1hsggE1utee6OlL3DlCXBzRlQNLWIyVIWtxxLYSnIz970FJnQAOlRuDSySKabwif6ccesfBPUl1T3V32YzakEgH7Nv7VzHzPKK5TtPsvNaF00zb2EXK4pD0l5AIdWl5zCEq+SRt86W65iKZ03oHQ8ZbhfcY99lNeAekL7v4IxU74TxI199qNUxeXLZpqOt4k9AiO1gD8c1C2TIrHjbpmy6R4k3DTdgkS32ISUNuqkKClB3lyoAjqBULUlxlfKoKSryIqRztUrk8RJ+qX2G5KpE1yRyOjmScqOAfpimi8XBdzuj010AKdVnAGAPQVJFcEUnyJOUnBrG2cVJHtPSIujkX19yOGpDnI0jn+026nHlTGyxzqHKCSTjFSbSPcJFJUDuK6cpCBk9fCllwiriSOycKFqABPIrOPT50jUolfTApMYHbmzRQINab5pQpXMDgYHgK5hJO9NaFTNebagKINbqSMbdawy2p11LSASpZCQB4mkeUKsMyV53xvXPJCs0/arabQ5FRHtbkFMdgNOha+YlYJyo+RpkPTpR3DsaHc1laFowVJIz0zWBkGlEqU7IbbQ4chsYG3hQkGeRMCaytXMcnY4pa9OS7aI8AQ46FMrUsvpT9o5nGyj5DwpCrfFI+w7yKnLdORaWbstoiG88plDmR3lpAJGOviKTbmlrkt1dgjwiwsNtSVuB3fBKkpHL5eFJgnlIJoimwk0jQ5Fa75rqoAqxWpQc4ApcDUwUXRjJV6VlSnMd7P1pSpSyhtvIPL02rk+lwLw6CD609xwMUsmjRJBya2aKgohKsUMZbJwASRjetEhQX60dsB3yZDLi3D3Scbmtgk0sLzjbA7IjmIwr5VxLbimg52ZCScZxtT9iXYYrG+4mWFpVkZHrQ2hZUFA+Oc0rbQSnC/hp30xZm7xe4dq94THEhfJ2iugNCqzyDtS4GghTi9u6DSRxJS4RncGp7xD0rG0xJYtjchb09pBMogdw+RT9KhkhsKkN8nVY39DTpxysobCeG0dmI0p6C5JQRyN/EM74pK40p1W1PNhhTZLjkeM0twuJIKUjOa0XAWIy1Bs/Yqw4fI06NblwNlYocjSmK6vuAb0ttllnT5CIkSOt6Q4cIbSMkmlS4zseI1IP8AarVhKD1x5076S1I9pa6tXtptp2UyThtfTNP9CK7kf0iUvqkekWO5wJrjEuI6y40rlcStOCn51Jpuk2otyjsRpiZiXWEuqUjokkZIpr1LrW93y9y7rMdR28ocqwlOBy+ApBFusnlIVJcbRncI8aSl1JrIt6ukntHeEbeVS7e/zF5IJYWOmR1BpNbraxdZqkJceaSpOHAjorHn+FDDCP0kl8xluc4ygJVtn1rSY+IkF5Be5ZJXhCGjskeOTV6Si1mxLCyUVuTarby8f5O6Da46HY+EMqQohRAyVdfGkU24RCsBppS2kDACj1ppHeSfFQ3rQkhJHnVKWpeMJJF2GkSeW2zdbvOroAM9K1dVnAAwBWiVDyrp2oURlI2qtnJb247HSOpDYUpXxY2rIeSH0q8D1ri4eY5G1ct870u9rgTYnyxfPWhtzlQsLGOtJUvqShaU4AWMHatF1gYx60kptvIsYJRwYzWM0Y3oO1RkhkGjO9a1hRpMi4NyoYrXNPuj9H6g1XNRGtEFx3mVguEYQPrV02/htw84bR0XXiXfUSpiRzN2uNhbzh8uX7o9VU1yFUSptBcPNVa0moj2a2PuIV1cKDgDzqy3LRw54TELvr7epNRIG0JhYU22r9tQ2+gpp4h8e73drcvT+jILWkrARylqIft3k/8AaOdT8hVNuLW4srWpSlKOSSckmm8vuKTriPxU1TrUCHKle52ls/Y2+L3GUD1A6n51A6KKUAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigApTbp8y3S25cGU9GkNnKHGllKk/UUmooAuLSHG24tBMTVEdM5lQ5VSW0AOY/bT8K/yNSCfovQfEGMu4acnMwJx3V2A7hP7bfVP0rz7SiBNlwJKJMOS7HeR8LjaylQ+opMewuSS6w0DqbS61KnQVOxQe7KY77ZHzHT61FwfWrW0hxouUNoQtRRE3KOe6p1GEuY9Qe6r8qf5OmOHuv2ly9PzWoU47qbaHIsH9ps/vFKpNdxHFMo0YNBHjmplqzhpqawBT6Y/6QiD++jjOB6p6ioWrmSopUClQ6gjBFPUkxjiYPWthsK0zvWwNKgZsk+FbtnkUTgHIxWiMZrPXO9OXA1mxORisOYKAkDceNagnNZOKXImDVKT1FdGSlK8ncUBCig4GwrCUkbnahcMHyhQ7yFSQkbnr6Une6keVZSsl0KzvmuazlRPrSylkSMcG7DhaUFhCVbEYUMjesJBxnesZJSK6oKQ2ebOfAUiFfBz5jncmsrPTABwc4PSgjxrTJpH2wKvcmcPXBmcSY2r9Qxe07BACWYiQlKShvlbwD0AODUt4P6vsmm+HvEe6Sru03qe6xRFhRlpVzLStWVrCumdztVPEHmxW/Kcb9Kj2ZH7sGicAYNAOKypOKBgGnjciyXOlyo7DDr6lttDCEeCa6W952DJalcgPIrmSD0JpD4cw8KyHleJzT1Ij2+x1XLe98cknHO4oqO229akgoLhG5rnzBXxDJrqXGfdAjkV2vNkqztihMVr5GG3kpZcQW0qKsYJ6itEryOWsFKeQEHfyrn0prbHKKY6QYTD0d+Q9LaZDIBCFHdzJ6J9a1sz8KPfokiQHPdGpCFucvxcoIJx603kq5MZ28qe9H6elahflsxAkuMMF0JJwVY8B5mkbFUSZa11hpO56bv7EK1KVcrjPbdYlvK+0baByU46VWwGSDjApXebTNtrTLkyM4wXCQlKxg7UiDuARSRaCWQSkqXgDPlXZTSmXOVxspWOqVDFJkrUlQIO/hXeVNkSXe1fcLiyACo9TinJoa0wDZKjtkelWFwWhMSLfrlciLHfSxpp9xPathRQrmThSSeh9RVdIfUjPLgVa3s9JcetPEblZLoGlnsjOMd9NNm1jgdBPJm+qaX7LWmmkNISoamkcygkAq+zHU1W0ltpsKaI53c7EHYVYd8StPswWI8pwNRvHPh/Z1VnMtRzk0tcklgSyLbR0AxnausdC5DzbDSOZxaglKR4k0lK1Zwa2Q4tpxLjayhaTkKBwQacpDXHJM5ugr1bLvAgXMNsLmFJSQrOAaQ6k083H1N+ioU5Mk8wbDitgVUkt8i+XuYhAnPvvNjKC47uPqab7ouU3OX7w4rt0nvHm8aflY5GYe7COkuKqBILT6kFaSQQk5wRW1mXb1XVn9IhZjFYDgQcHGab0qUtRySSeua1Ue/tTd/sOUPcnvEK5WNRYsemLewmBDUVCYpP275UNwo+Q8KjsR9T8VceStXZspKmwkdDTfH74K+1SgJGTk9fSlNvuDsVqQ23IU0iQ0W3QlIPMny36VPGWCCcNwnbkMo5+0SVnHdA8DS+2z2GGEPMKWichwEK8APOmNW5rbdNRRukmSyojJDterxPulxXLnSVvPKwCpR8BSZ+SkIa5W08yFZKvE0kGV/StV5xij1GkHprJaPC3iVb9JNFDliZlPKdK1SFnvcpGOUDyqHaku4uF3nSYYLDEp4udkOgyc4phYGTgnArdwYAIp3qSfI30op4OrzzwcCluKKk7Ak9KFPpUhSlpJV4EHak7hKk+dag4pjmx6rWDJVlfMRXRJynCQAM1y2xmusdaEk7ZONs0ke46S4FDch9lwFLih4bGuCyQtQzsTWc5Sf1hWhStZzjNPlJvgjjFJ5NCog7ULUSABXUpCW8ryCfhrnzpIwBimNYJE8nPB8qBXQqGBgb1ptmmMembE7bVruaCdqAcCgMGKxQTvWM5OAN6TIuDNYUaleleH+ptRLQqPCVHjqP9u+ClOPQdTViRtGcNtEN+96wvf6QmIGUwmRzLWfLlHQeppjmOSKp03pe+6ikJZtdveeCjjn5SEj61ZEfh7pfRrKJ+ubwyXx3hCb7y1Hy5Rv8AjSLVXGe4OxV2zR1tY07b8cvO2AqQsequifpVWy5MiW+qRKfcfdWcqW4oqUfmTTeWKWnqDjLPYiKteiIaLDDxymQkAyFj59Ej5VVkyVImSFyZb7j7yzlbjiipSj6k1xopcAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABXRl51lxLjTi21pOUqSogj5EVzooAsDS/FXUlp5Gpj36RjjbDp74Horx+tTJufw018OW5gWq4qGzhAbJPzGxqjayCRSYDJa2peCl/iMKm2GQzeImMp7NQ58fLxqtJ8KZb31MTor0Z1JwUuIKTTvpfWupdOPoctl1fbQn+6UoqQfoasyBxb05qGMmHrrTzLxOxkNIBx6+dGWgwilQa2Tiron8M9H6mQqXom/tIURn3das4+nUVANTcPdWWAqVLtbrzI/vmBzp/LpT1NCOJF8jyoQvlOcCtVBSVlKklKh1BGDRmnJjGjol1YXnP0rBJKsk1qTmsb+dOyxMI2VtWCPKgnIrXNIKjbp0rYLB61zoA3oyGBRzN9ljHez1rkOuawUkHFbYxtnNKxEsGN6yFkY8qOVR2oUnBIpOQ4MOHO9aHNbpGayeU5x4UdwXBqg4G9ATk0UZwKBTITg1qqsZoySaQDPhWKN6D50goHyFd4cuTCfS/FfcZdQcpUhWCK4ZrGc0AK7ncp9ydDs6U7IUOhWrOKSUUUABrJ3FBx4VjNKAZGMV2jSZMdLqI8h5pLyeRwNrKQtPkcdR6GuNFIxUKVT5qrem3qmSDDS52iWC4S2F9OYJ6Z9a4tqKTtWlG9C4B8myjk5rCiTRmjGaUQ6sPLb3Qop+RxWrqitfMTmtcVkJJ6UuX2Ews5Mp8xWh3NbdNqx40jBAOmK6tlPIQeprnjbajNOTwI1k3KO9tW6wkkDIzWnMOTHia1Kt6XKEw2dAOUAZrVw5OK0UcnbpWUHB3oz4DHk2SMV2W42UpQlJ26k1yUsA7Cs8wxkUqeBrWTVeytulHKSM4rZODWVBRUAKMBnBqlGTWgGF1uQoEgZrq0yVYKiBk9TQo5Byx3MtqSEK5x3vCshzkQcdSK3fbHZ5R3t8E1xUClPeGDUjzEjWJGFrLqQFHcDArhymtyQBt1rXtN81E3nuSxTXYMY61oa2UpS1BKUkk9ABvUo03w81bfglyNa3GWD/fSPs0/n1qNySJEmRXNdokaTMeSxEjuvuHYJbSSatuNw10pp5oSdXagQ6pIyWW1cifl5muE/iVpyxMKiaPsTScbdstPKPn5mmOfsOwM2neFF9ngP3V1q1RsZUXDlePl4VIBJ4baF2joF6uSPvbLwfn0FVxqLWGoL8tXv8AcXS0Ts0g8qB9B/GmCkw33HFgap4q6juyVR4TgtcU7cjB75Hqr+VQJ11x1xTji1LWo5UpRyT8zWlFGBAooopQCiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooA7RZUiI8Hoz7jLg6KbUUkfUVPNL8XdXWXlbdlpuDA2KJIycfOq9oowBfkPXnCnV6QzrDTCYElexksDlIPnkV0mcD9M6jaVI4fa0ivrO6YsxQBPoFVQGaUQJ82A8HoUp6O4Oim1lJpMewpL9XcLdd6XcWLpp2Z2Sf79hPaNkeeRUNUFIUULSUqHUEYNWnovj5rnT7aY0mUi6RRsW5HXHzqfQ+KnBzWSUs660a3EeXsqSy1gg+fMnelUmhNqZ5tzWRjFel5fAzhhqxpUjh9xBaZdUOZMaUoLA9M7EVXurfZ/4kWELdZtSLvGGSHYCw5kfLrTlNCbWVXgYoAJxSm5Wy5Wx0tXGBKiLBwUvNFP76SBXlTk0xrTOilY2rUnfasFVbcycetLkbjBuhWNqw4D1rQkZ2rokjG5pyeeBGscnMbVit1lPhWqd6aODasKO+1bcu/StCDmkYIxR0rJFYIpBQzRRWaAMGgUUZoFA0DrRRQIZNYooFAAKyBRiigAxWB1rOaE4zvSgYrKc1nbyo3oAyOtZCiDtWoNB33pRMG2xFakb1noKxQCNwlXLtQroK1QoislWaXKE5yY28Kx1NZFbBJ60gpqa3aTzGgo7uc/OtUkg4zS9mJ3XBleCvYbVshOTjpmsdDuaysjqDSjfkbFBHyrKThQwdxWiHSkEeBrVSsjIFLuSE2til50LVuAMDwrRtwYIUa2ttuuV0kJjW2DKmvKOA3HaU4o/QVamjvZt4t6lQh9OnFWqMr++uTgY28+U978qR2jlTwVMXSCcE4rVbqnFY3UT0A3r0z/APU88O9HsiTxJ4pwGnEjK4kIjmJ8vP8AKo7dde8HNKKUzovSrl0dRsmTJTgH133qN2vwPVaRUtg0Tqq+uJTAs8koP944nkSPqam0PhNBtbQk6w1JGhIG5ZZUCo+mTTVqTjJq66hbUR1m1xzsERkbgfM1AJ06ZOeL0yU9IcO5U4sqP51HlsfhIuJjWnDfRwKNOWEXOUnYSHhzb+eTUX1Vxd1XeiptmQm3sHYIY2OPnVeUUYFydpUmRKeL0l5x5xRyVLUVE/jXGiilECiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooA6xpD8ZwOR3nGVjoptRSfxFTnSvF/iBpxxCoGoZK0I/u3zzpI8t6gNFAHpaz+0+zcIyYeudEWy7t4wpxKEkn6KFLA57M2u1DmjP6XmuZ+BRbTk/iK8u1nJpMC5PSlw9mq13NoydF6/gTWzulD4B/NJ/hVf6l4C8SbJzq/Qybg2DsuG4F5HnjrVa2+5XC3updgzZMZaTkKadKSPwqb2DjLxEs3KljUUh9APwyPtB+e9HIcETulhvlqcUi5WidFKevasKA/HFN3NtjNXrbfaVvimyzftP264tkYPL3Sfocil6OJXBzUJSL/AKPTBdX8S0RUkD6pwaVSaEaR56zWQrFegnNJcBtQg/onUptjp6AvlGP8qxSWR7PkaajtdP6zhSmz8POkHP1SaN4m0okL2rAVvVq3PgBr2IFKjtwZiR07N/lJ+igKitz4a66t2TJ01OwPFtIcH+7mnb0JtIqCM79KwrGdqXSbJeooJk2meyB1546hj8qQEKScKSR8xS7gwFFa829ZzRkMBijG1GaM0ZDAVkDasZozQAGijxozQAUUZo2oAzWKKzmgDIoBrWjIzRkTBvRWuaM0uQwbHoDWKxzetZQlaz3UKUfQE0mUGDOKNsUvjWK+SiPd7PPdz0KY6j/CnuBw41pMIKLI80k+LygjH470b0G1kVBFZUqrIgcFdXSVAOLhsg+OVK/cKkULgXFjJDmoNXRIaOpAKUY/1H+FJ6iF2FJlR3rXm6Y61ff9EuBNhA/SurV3F5HVDJU5n/SAKBxG4Oaf3seinLg6k91byEoB9cnJprm/YXailrbY73c1pRb7TOlKVsOyYUr+FWVo/wBnTivqUBbNgTAZP95OfS0PnjrTxM9pS/sNqZ05pyzWlv7iuQuKH7hUI1Hxn4lX3KZmq5zbZ/u46uyT/u70ZkxcIt9r2XrPYECRxA4p2S0tjdTUYc6/XdRH7q2L3sq6GWeSNddazEeLiz2RPyGBXmWbNmTXS7MlPyHCclTrhWT9TSekwB6dne1eqzRlQuHegLHp9kbJcLQKseoTj8zVU6144cT9WqWLrqychlX9zGV2KPwTVcUUYFydH33n3S6+6t1w7lS1FRP1Nc6KKUQKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKURpsyKQY0p9gjoW3Cn91J6KAJZa+JGurYEiHqm5oSnolT3OPwVmpJC47cQGEhMmZCnDx94ipJP1GKq+ikwgyXVF9oG6jAm6ZtbyfHkWtGfxJFK08Z9Kz+7d9FIwepQpC/wB4FUVRRtQuWX2jWfBSdgTNMrYJ6kxBt9UmtHEcArgdnFxCfEdqiqHopNoZL8TorglMTmPrBuOT4GT/ADFaq4UcNZBzE1+0B/3yDVDZrFGH7hkvV7gjp1wZh69iH/EUH9xpMeBCVrxH1nblj/u8/uNUoFEdCa3S+8n4XVj5KNLh+4cFyPcBJ6U5b1RbVnyLZH8aQSuCN4ZTkXy2rPkCaq5M6YnpLfHycV/Os+/zv/XJH/vVfzo59xCzI3BW+PnCbtbh/mNLW+At9UO9fLYkf5qqb3+d/wCuSP8A3qv51gzZh6y3z83D/OjkOC3TwHuSVYc1Jb0j0QT/ABpTH4DFRy9q6Cgf92B+9VUwZco9ZLx/9oa0U86r4nFn5qNGH7i8F6DgXY2v+la9gNjx7zY/+NWp4S8OI5/rvE6AjHUB9H8AaooknqaxSYfuBfX9B+B8L/pev25Ho2tSs/gK1Ux7PtvGROkzSPBLLis/iRVD0UuAyXynWvBC1kGHo9+codFKYCf3msucctMwRyWXh/FbA6F1YH7hVC0Um1Bkui4e0Hfln/m6wWeJ5FSFOH8zUbuXGjiDNUSLu3FB+7HjoQB+VV3RS4QmSRz9c6wngiVqS5rB6gPlI/AYpikSpMlXNIkOvK83FlR/OuNFKAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAf/9k=";
    const drawReactor = (cx,cy,r,t) => {
      const pulse=Math.abs(Math.sin(t*3))*15;
      // Outer compass tick marks
      const outerR=r-12;
      for(let deg=0;deg<360;deg+=6){
        const rad=(deg-90+t*5)*Math.PI/180;
        let ri,ro,tw;
        if(deg%90===0){ri=outerR-6;ro=outerR+10;tw=3;}else if(deg%45===0){ri=outerR-4;ro=outerR+8;tw=2;}else if(deg%18===0){ri=outerR-2;ro=outerR+5;tw=1;}else{ri=outerR;ro=outerR+3;tw=1;}
        ctx.beginPath(); ctx.moveTo(cx+ri*Math.cos(rad),cy+ri*Math.sin(rad)); ctx.lineTo(cx+ro*Math.cos(rad),cy+ro*Math.sin(rad));
        ctx.strokeStyle=deg%90===0?PC.CYAN:deg%18===0?PC.TEAL:PC.BORDER; ctx.lineWidth=tw; ctx.stroke();
      }
      // Outer dashed arcs
      for(let i=1;i<=3;i++){
        const r2=r+18+i*24,sp=t*(1/i)*.4;
        ctx.save(); ctx.shadowColor=`rgba(0,200,255,0.5)`; ctx.shadowBlur=10;
        ctx.strokeStyle=`rgba(0,238,255,${0.2-i*0.04})`; ctx.lineWidth=1;
        ctx.setLineDash([6,12]); ctx.beginPath(); ctx.arc(CX,CY,r2,sp,sp+Math.PI*2*(.65+i*.1)); ctx.stroke(); ctx.setLineDash([]); ctx.restore();
      }
      // Outer compass ring
      const compR=r+70;
      for(let i=0;i<24;i++){
        const ang=(i/24)*Math.PI*2-t*.15,len=i%6===0?18:i%3===0?10:5;
        ctx.strokeStyle=i%6===0?PC.CYAN:i%3===0?PC.TEAL:PC.BORDER;
        ctx.lineWidth=i%6===0?2:i%3===0?1:.5;
        ctx.beginPath(); ctx.moveTo(CX+compR*Math.cos(ang),CY+compR*Math.sin(ang)); ctx.lineTo(CX+(compR+len)*Math.cos(ang),CY+(compR+len)*Math.sin(ang)); ctx.stroke();
      }
      // ── Draw Arc Reactor Image (circular clip) ──
      const imgR = r - 2;
      ctx.save();
      ctx.beginPath(); ctx.arc(cx,cy,imgR,0,Math.PI*2); ctx.clip();
      if(arcImg.complete && arcImg.naturalWidth>0){
        ctx.drawImage(arcImg, cx-imgR, cy-imgR, imgR*2, imgR*2);
      } else {
        ctx.fillStyle="rgba(0,10,30,0.95)"; ctx.fill();
      }
      ctx.restore();
      // Pulsing cyan glow ring over image
      ctx.save();
      ctx.shadowColor=PC.CYAN; ctx.shadowBlur=28+pulse;
      ctx.beginPath(); ctx.arc(cx,cy,imgR,0,Math.PI*2);
      ctx.strokeStyle=`rgba(0,238,255,${0.55+Math.sin(t*3)*0.2})`; ctx.lineWidth=2.5; ctx.stroke();
      ctx.restore();
    };

    // ── Neural Network Background ──────────────────────────────────────────────────
    const drawBG = (t) => {
      // Deep dynamic gradient
      const vg=ctx.createRadialGradient(CX,CY,0,CX,CY,Math.max(W,H)*0.8);
      vg.addColorStop(0,"rgba(0, 10, 25, 1)"); 
      vg.addColorStop(1,"rgba(0, 2, 8, 1)");
      ctx.fillStyle=vg; ctx.fillRect(0,0,W,H);

      // Simulation physics
      const particles = particlesRef.current;
      for (let i = 0; i < P_COUNT; i++) {
        const p = particles[i];
        p.x += p.vx; p.y += p.vy;
        
        // Soft boundaries
        if (p.x < -50) p.x = W + 50; if (p.x > W + 50) p.x = -50;
        if (p.y < -50) p.y = H + 50; if (p.y > H + 50) p.y = -50;
        
        // Subtle drift
        p.vx += (Math.random() - 0.5) * 0.02;
        p.vy += (Math.random() - 0.5) * 0.02;
        
        // Speed limits
        const speed = Math.sqrt(p.vx*p.vx + p.vy*p.vy);
        if (speed > 1.5) { p.vx = (p.vx/speed)*1.5; p.vy = (p.vy/speed)*1.5; }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 238, 255, ${p.glow})`;
        ctx.fill();

        for (let j = i + 1; j < P_COUNT; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          if (dist < 140) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(0, 238, 255, ${0.2 * (1 - dist/140)})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      // Scanner sweeping line
      const scanY=((t*0.2)%1)*H;
      const sg=ctx.createLinearGradient(0,scanY-15,0,scanY+15);
      sg.addColorStop(0,"rgba(0,238,255,0)"); 
      sg.addColorStop(.5,"rgba(0,238,255,0.08)"); 
      sg.addColorStop(1,"rgba(0,238,255,0)");
      ctx.fillStyle=sg; ctx.fillRect(0,scanY-15,W,30);
      
      // Corner accents
      [[0,0,1,1],[W,0,-1,1],[0,H,1,-1],[W,H,-1,-1]].forEach(([bx,by,dx,dy])=>{
        const L=40,T=5;
        ctx.save(); ctx.shadowColor=PC.CYAN; ctx.shadowBlur=10;
        ctx.strokeStyle="rgba(0, 238, 255, 0.6)"; ctx.lineWidth=2;
        ctx.beginPath(); ctx.moveTo(bx+dx*T,by+dy*T); ctx.lineTo(bx+dx*T,by+dy*(T+L)); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(bx+dx*T,by+dy*T); ctx.lineTo(bx+dx*(T+L),by+dy*T); ctx.stroke();
        ctx.restore();
      });
    };

    // ── Top Bar ───────────────────────────────────────────────────────────
    const drawTop = (t,now,hs) => {
      const TH=56;
      const grad=ctx.createLinearGradient(0,0,0,TH);
      grad.addColorStop(0,"rgba(0,22,60,0.98)"); grad.addColorStop(1,"rgba(0,10,28,0.98)");
      ctx.fillStyle=grad; ctx.fillRect(0,0,W,TH);
      const bg=ctx.createLinearGradient(0,0,W,0);
      bg.addColorStop(0,"rgba(0,100,200,0)");
      bg.addColorStop(Math.abs(Math.sin(t*.6))*.3+.25,"rgba(0,230,255,0.85)");
      bg.addColorStop(Math.min(1,Math.abs(Math.sin(t*.6))*.3+.7),"rgba(130,60,255,0.6)");
      bg.addColorStop(1,"rgba(0,100,200,0)");
      ctx.strokeStyle=bg; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(0,TH); ctx.lineTo(W,TH); ctx.stroke();
      // Left
      ctx.save(); ctx.shadowColor=PC.CYAN; ctx.shadowBlur=12;
      dt(20,20,"◈  STARK INDUSTRIES",PC.CYAN,'bold 13px "Courier New"'); ctx.restore();
      dt(20,40,"RYAN OS v13  ·  REACTIVE INTELLIGENCE",PC.LABEL,'10px "Courier New"');
      // Center
      glow(CX,20,"R  Y  A  N    A  I    v  1  3 . 0",PC.CYAN,'bold 14px "Courier New"',"center",14);
      const pulse=Math.floor(t*2)%2===0;
      dt(CX,40,`${pulse?"◉":"◎"}  ${Brain.providerName}  ·  KB: ${KB.getCount()}  ·  MEM: ${Memory.getAll().length}`,
        pulse?"#00cc77":PC.LABEL,'10px "Courier New"',"center");
      // Right
      const up=Math.floor(performance.now()/1000),hr=Math.floor(up/3600),mn=Math.floor((up%3600)/60),sc=up%60;
      dt(W-18,20,`UPTIME  ${hr.toString().padStart(2,"0")}:${mn.toString().padStart(2,"0")}:${sc.toString().padStart(2,"0")}`,
        PC.WHITE,'bold 12px "Courier New"',"right");
      dt(W-18,40,`CPU ${hs.cpu.toFixed(0)}%  ·  RAM ${hs.ram.toFixed(0)}%`,PC.LABEL,'10px "Courier New"',"right");
    };

    // ── Bottom Bar ─────────────────────────────────────────────────────────
    const drawBottom = (t,now,hs) => {
      const BB=H-48;
      const bg2=ctx.createLinearGradient(0,BB,0,H);
      bg2.addColorStop(0,"rgba(0,10,28,0.98)"); bg2.addColorStop(1,"rgba(0,22,60,0.98)");
      ctx.fillStyle=bg2; ctx.fillRect(0,BB,W,H-BB);
      const bg3=ctx.createLinearGradient(0,0,W,0);
      bg3.addColorStop(0,"rgba(0,100,200,0)"); bg3.addColorStop(.5,"rgba(0,210,255,0.55)"); bg3.addColorStop(1,"rgba(0,100,200,0)");
      ctx.strokeStyle=bg3; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(0,BB); ctx.lineTo(W,BB); ctx.stroke();
      const dow=now.toLocaleDateString("en-IN",{weekday:"long"}).toUpperCase();
      const dm=now.toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}).toUpperCase();
      dt(18,BB+18,`${dow}  ·  ${dm}`,PC.TEAL,'11px "Courier New"');
      dt(18,BB+36,`NET ↓${humanBytes(hs.net_rx)}/s  ↑${humanBytes(hs.net_tx)}/s  ·  PING ${hs.ping}ms`,PC.LABEL,'10px "Courier New"');
      glow(CX,BB+18,"STARK  INDUSTRIES  ·  RYAN  OS",PC.CYAN,'bold 14px "Courier New"',"center",10);
      dt(CX,BB+36,"TAP = CHAT  ·  DOUBLE-TAP = APPS  ·  ⚙ = SETTINGS",PC.DIMTEXT,'9px "Courier New"',"center");
      const ac=Math.floor(t*2)%2===0?"#00ee77":"#007744";
      dt(W-18,BB+18,"◉ SYSTEM ACTIVE",ac,'bold 11px "Courier New"',"right");
      dt(W-18,BB+36,`STT: ${hs.sttEnabled?"ON":"OFF"}  ·  IP: ${hs.ip}`,PC.LABEL,'10px "Courier New"',"right");
    };

    // ── Left Panel — System Stats ─────────────────────────────────────────
    const drawLeft = (t,now,hs) => {
      const LW=Math.min(200,W*.155),LX=0;
      const grad=ctx.createLinearGradient(0,0,LW,0);
      grad.addColorStop(0,"rgba(0,18,50,0.96)"); grad.addColorStop(1,"rgba(0,10,28,0.92)");
      ctx.fillStyle=grad; ctx.fillRect(LX,56,LW,H-56-48);
      ctx.strokeStyle=PC.BORDER; ctx.lineWidth=0.5;
      ctx.beginPath(); ctx.moveTo(LW,56); ctx.lineTo(LW,H-48); ctx.stroke();

      let y=62;
      // Header
      ctx.fillStyle="rgba(0,180,255,0.07)"; ctx.fillRect(LX,y,LW,22);
      ctx.strokeStyle=PC.BORDER2; ctx.lineWidth=0.5; ctx.strokeRect(LX,y,LW,22);
      dt(LX+8,y+11,"SYSTEM MONITOR  ·  LIVE",PC.CYAN,'bold 9px "Courier New"');
      const blink=Math.floor(t*2)%2===0;
      ctx.beginPath(); ctx.arc(LX+LW-11,y+11,4,0,Math.PI*2);
      ctx.fillStyle=blink?"#00dd66":"#004422"; ctx.fill(); y+=24;

      // IP / PING
      ctx.fillStyle="rgba(0,10,28,0.8)"; ctx.fillRect(LX,y,LW,20);
      dt(LX+8,y+10,`IP ${hs.ip}`,PC.VALUE,'10px "Courier New"');
      dt(LX+LW-8,y+10,`PING ${hs.ping}ms`,PC.TEAL,'10px "Courier New"',"right"); y+=22;

      // CPU
      const cpuCol=hs.cpu<60?PC.GREEN:hs.cpu<85?PC.AMBER:PC.RED;
      ctx.fillStyle="rgba(0,14,38,0.9)"; ctx.fillRect(LX,y,LW,94);
      ctx.strokeStyle=PC.BORDER2; ctx.lineWidth=0.5; ctx.strokeRect(LX,y,LW,94);
      ctx.fillStyle=cpuCol; ctx.fillRect(LX,y,3,94);
      dt(LX+10,y+13,"CPU  //  PROCESSOR",PC.LABEL,'bold 9px "Courier New"');
      const ccx=LX+44,ccy=y+58,cr=28;
      ctx.beginPath(); ctx.arc(ccx,ccy,cr,225*Math.PI/180,(225+270)*Math.PI/180);
      ctx.strokeStyle="rgba(0,20,50,1)"; ctx.lineWidth=6; ctx.stroke();
      const cpuEnd=225+Math.min(100,hs.cpu)/100*270;
      ctx.save(); ctx.shadowColor=cpuCol; ctx.shadowBlur=8;
      ctx.beginPath(); ctx.arc(ccx,ccy,cr,225*Math.PI/180,cpuEnd*Math.PI/180);
      ctx.strokeStyle=cpuCol; ctx.lineWidth=5; ctx.stroke(); ctx.restore();
      dt(ccx,ccy-7,"LOAD",PC.LABEL,'8px "Courier New"',"center");
      glow(ccx,ccy+8,`${hs.cpu.toFixed(0)}%`,cpuCol,'bold 16px "Courier New"',"center",8);
      ctx.save(); ctx.beginPath(); ctx.rect(LX+84,y+22,LW-92,52); ctx.clip();
      wave(LX+84,y+22,LW-92,50,hs.cpu_hist,cpuCol); ctx.restore();
      dt(LX+86,y+80,`${hs.cpu.toFixed(1)}%`,cpuCol,'10px "Courier New"');
      dt(LX+LW-8,y+80,`${navigator.hardwareConcurrency||"?"}c`,PC.LABEL,'9px "Courier New"',"right"); y+=96;

      // CPU bar segments
      const seg_n=16,seg_w=Math.floor((LW-8)/seg_n),active=Math.floor(hs.cpu/100*seg_n);
      ctx.fillStyle="rgba(0,8,22,0.9)"; ctx.fillRect(LX,y,LW,12);
      for(let si=0;si<seg_n;si++){ctx.fillStyle=si<active?cpuCol+"bb":"rgba(0,18,45,1)"; ctx.fillRect(LX+4+si*seg_w,y+2,seg_w-1,8);} y+=14;

      // Memory
      ctx.fillStyle="rgba(0,14,38,0.9)"; ctx.fillRect(LX,y,LW,72);
      ctx.strokeStyle=PC.BORDER2; ctx.lineWidth=0.5; ctx.strokeRect(LX,y,LW,72);
      ctx.fillStyle=PC.CYAN; ctx.fillRect(LX,y,3,72);
      dt(LX+10,y+13,"RAM  //  MEMORY",PC.LABEL,'bold 9px "Courier New"');
      const ramMB=((navigator.deviceMemory||4)*1024*hs.ram/100)*1024*1024;
      dt(LX+10,y+30,`${humanBytes(ramMB)}`,PC.WHITE,'bold 15px "Courier New"');
      dt(LX+10,y+48,`of ${navigator.deviceMemory||4} GB total`,PC.LABEL,'9px "Courier New"');
      bar(LX+8,y+58,LW-16,6,hs.ram,PC.CYAN);
      dt(LX+LW-8,y+30,`${hs.ram.toFixed(0)}%`,PC.CYAN,'bold 12px "Courier New"',"right"); y+=74;

      // Storage
      const diskCol=hs.disk<70?PC.GREEN:hs.disk<90?PC.AMBER:PC.RED;
      ctx.fillStyle="rgba(0,14,38,0.9)"; ctx.fillRect(LX,y,LW,58);
      ctx.strokeStyle=PC.BORDER2; ctx.lineWidth=0.5; ctx.strokeRect(LX,y,LW,58);
      ctx.fillStyle=diskCol; ctx.fillRect(LX,y,3,58);
      dt(LX+10,y+13,"DRIVE  //  STORAGE",PC.LABEL,'bold 9px "Courier New"');
      dt(LX+10,y+32,`${hs.disk.toFixed(0)}%  USED`,PC.WHITE,'bold 14px "Courier New"');
      bar(LX+8,y+46,LW-16,6,hs.disk,diskCol); y+=60;

      // Network
      ctx.fillStyle="rgba(0,14,38,0.9)"; ctx.fillRect(LX,y,LW,54);
      ctx.strokeStyle=PC.BORDER2; ctx.lineWidth=0.5; ctx.strokeRect(LX,y,LW,54);
      ctx.fillStyle=PC.TEAL; ctx.fillRect(LX,y,3,54);
      dt(LX+10,y+13,"NET  //  NETWORK I/O",PC.LABEL,'bold 9px "Courier New"');
      dt(LX+10,y+30,`↓ ${humanBytes(hs.net_rx)}/s`,PC.GREEN,'bold 12px "Courier New"');
      dt(LX+10,y+46,`↑ ${humanBytes(hs.net_tx)}/s`,PC.TEAL,'bold 12px "Courier New"');
    };

    // ── Right Panel — AI + Market ─────────────────────────────────────────
    const drawRight = (t,now,hs) => {
      const RW=Math.min(200,W*.155),RX=W-RW;
      const grad=ctx.createLinearGradient(RX,0,W,0);
      grad.addColorStop(0,"rgba(0,10,28,0.92)"); grad.addColorStop(1,"rgba(0,18,50,0.96)");
      ctx.fillStyle=grad; ctx.fillRect(RX,56,RW,H-56-48);
      ctx.strokeStyle=PC.BORDER; ctx.lineWidth=0.5;
      ctx.beginPath(); ctx.moveTo(RX,56); ctx.lineTo(RX,H-48); ctx.stroke();

      let y=62;
      // AI System header
      ctx.fillStyle="rgba(0,180,255,0.07)"; ctx.fillRect(RX,y,RW,22);
      ctx.strokeStyle=PC.BORDER2; ctx.lineWidth=0.5; ctx.strokeRect(RX,y,RW,22);
      dt(RX+RW-8,y+11,"RYAN AI  ·  SYSTEMS",PC.CYAN,'bold 9px "Courier New"',"right"); y+=24;

      // AI block
      ctx.fillStyle="rgba(0,14,38,0.9)"; ctx.fillRect(RX,y,RW,46);
      ctx.strokeStyle=PC.BORDER2; ctx.lineWidth=0.5; ctx.strokeRect(RX,y,RW,46);
      ctx.fillStyle=PC.GREEN; ctx.fillRect(RX,y,3,46);
      glow(RX+RW/2,y+16,`AI: ${Brain.providerName}`,PC.GREEN,'bold 11px "Courier New"',"center",7);
      dt(RX+RW/2,y+32,`KB: ${KB.getCount()}  ·  MEM: ${Memory.getAll().length}`,PC.LABEL,'9px "Courier New"',"center"); y+=48;

      // Weather
      if(hs.weather){
        const w=hs.weather;
        ctx.fillStyle="rgba(0,14,38,0.9)"; ctx.fillRect(RX,y,RW,46);
        ctx.strokeStyle=PC.BORDER2; ctx.lineWidth=0.5; ctx.strokeRect(RX,y,RW,46);
        ctx.fillStyle=PC.TEAL; ctx.fillRect(RX,y,3,46);
        glow(RX+RW/2,y+14,`${w.temp}°C  ·  ${w.desc.toUpperCase().slice(0,12)}`,PC.TEAL,'bold 12px "Courier New"',"center",6);
        dt(RX+8,y+32,`💧${w.humidity}%  💨${w.wind}km/h`,PC.LABEL,'9px "Courier New"');
        dt(RX+RW-8,y+32,w.city.slice(0,10).toUpperCase(),PC.LABEL,'9px "Courier New"',"right"); y+=48;
      }

      // Market header
      const pulse2=Math.floor(t*2)%2===0;
      ctx.fillStyle="rgba(0,12,8,0.95)"; ctx.fillRect(RX,y,RW,24);
      ctx.strokeStyle="rgba(0,100,50,0.4)"; ctx.lineWidth=0.5; ctx.strokeRect(RX,y,RW,24);
      ctx.save(); ctx.shadowColor="#00cc55"; ctx.shadowBlur=6;
      dt(RX+8,y+12,`${pulse2?"◉":"◎"}  MARKET TERMINAL`,pulse2?"#00dd66":"#009944",'bold 9px "Courier New"');
      ctx.restore();
      dt(RX+RW-8,y+12,"TAP ▶",PC.DIMTEXT,'8px "Courier New"',"right"); y+=26;

      // Stocks
      StockEngine.getAll().forEach(stock=>{
        const eH=60;
        ctx.fillStyle="rgba(0,8,22,0.9)"; ctx.fillRect(RX,y,RW,eH);
        ctx.strokeStyle=PC.BORDER2; ctx.lineWidth=0.5; ctx.strokeRect(RX,y,RW,eH);
        const isUp=stock.pct>=0,col=isUp?PC.GREEN:PC.RED;
        ctx.fillStyle=col; ctx.fillRect(RX,y,3,eH);
        dt(RX+10,y+14,stock.name,PC.WHITE,'bold 12px "Courier New"');
        dt(RX+10,y+28,stock.source==="live"?"◉ LIVE":"◎ SIM",
          stock.source==="live"?"#00cc55":"#997700",'8px "Courier New"');
        glow(RX+RW-8,y+14,stock.last.toLocaleString("en-IN",{maximumFractionDigits:0}),
          col,'bold 13px "Courier New"',"right",6);
        dt(RX+RW-8,y+28,`${isUp?"+":""}${stock.pct.toFixed(2)}%`,col,'10px "Courier New"',"right");
        spark(RX+6,y+36,RW-12,18,stock.prices,col);
        y+=eH+2;
      });

      // Footer
      ctx.fillStyle="rgba(0,6,16,0.9)"; ctx.fillRect(RX,y,RW,22);
      ctx.strokeStyle=PC.BORDER2; ctx.lineWidth=0.5; ctx.strokeRect(RX,y,RW,22);
      glow(RX+RW/2,y+11,"▼ TAP FOR FULL MARKET",PC.DIMTEXT,'8px "Courier New"',"center",4);
    };

    // ── Center ────────────────────────────────────────────────────────────
    const drawCenter = (t,now,hs) => {
      const LW=Math.min(200,W*.155),RW=Math.min(200,W*.155);
      const CR=Math.min(176,(W-LW-RW)*.44);
      drawReactor(CX,CY,CR,t);
      // Title
      glow(CX,H*.085,"R  Y  A  N    O  S    v  7 . 0",PC.CYAN,'bold 20px "Courier New"',"center",16);
      glow(CX,H*.085+28,"STARK INDUSTRIES  ·  REACTIVE INTELLIGENCE NODE",PC.TEAL,'11px "Courier New"',"center",6);
      // Clock
      glow(CX,CY+CR+36,
        now.toLocaleTimeString("en-IN",{hour12:false,hour:"2-digit",minute:"2-digit",second:"2-digit"}),
        PC.CYAN,'bold 30px "Courier New"',"center",20);
      glow(CX,CY+CR+68,
        now.toLocaleDateString("en-IN",{weekday:"long",year:"numeric",month:"long",day:"numeric"}).toUpperCase(),
        PC.TEAL,'11px "Courier New"',"center",6);
      if(hs.weather)
        dt(CX,CY+CR+88,`${hs.weather.city.toUpperCase()}  ·  ${hs.weather.temp}°C  ·  ${hs.weather.desc.toUpperCase()}`,
          PC.LABEL,'10px "Courier New"',"center");
      dt(CX,CY+CR+110,"[ TAP = CHAT   ·   DOUBLE-TAP = APPS   ·   ⚙ = SETTINGS ]",
        PC.DIMTEXT,'9px "Courier New"',"center");
      // Cardinal labels
      const lbls=[["AI","NEURAL",CX-CR-44,CY-28],["MEM","MEMORY",CX+CR+44,CY-28],["NET","NETWORK",CX,CY-CR-58],["SYS","SYSTEMS",CX,CY+CR+130]];
      lbls.forEach(([l2,l1,x,y2])=>{
        glow(x,y2,l2,PC.CYAN,'bold 10px "Courier New"',"center",6);
        dt(x,y2+14,l1,PC.LABEL,'8px "Courier New"',"center");
      });
      // Scan
      const scanY=((t*.35)%(H*.5-CY-CR))+(CY-CR/2);
      ctx.strokeStyle="rgba(0,60,90,0.4)"; ctx.lineWidth=.5; ctx.globalAlpha=.4;
      ctx.beginPath(); ctx.moveTo(LW,scanY); ctx.lineTo(W-RW,scanY); ctx.stroke(); ctx.globalAlpha=1;
    };

    const draw = (ts) => {
      if(ts-lastFrameRef.current<33){animRef.current=requestAnimationFrame(draw);return;}
      lastFrameRef.current=ts; tRef.current+=.033;
      const t=tRef.current,now=new Date(),hs=hudStateRef.current;
      ctx.clearRect(0,0,W,H);
      drawBG(t); drawTop(t,now,hs); drawLeft(t,now,hs); drawRight(t,now,hs); drawCenter(t,now,hs); drawBottom(t,now,hs);
      animRef.current=requestAnimationFrame(draw);
    };
    animRef.current=requestAnimationFrame(draw);
    return ()=>{cancelAnimationFrame(animRef.current); window.removeEventListener("resize",resize);};
  }, []);
  return canvasRef;
}

// ═══════════════════════════════════════════════

// ═══════════════════════════════════════════════
//  TRADING JOURNAL — Embedded as Market Overlay
// ═══════════════════════════════════════════════

/* ═══════════════════════════════════════════════════════════════
   FONTS & GLOBAL STYLES — v4 Pro
═══════════════════════════════════════════════════════════════ */
const FontLink = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700;800;900&family=Cinzel+Decorative:wght@400;700;900&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,500;1,700&family=Dancing+Script:wght@400;500;600;700&family=JetBrains+Mono:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700;800&family=Rajdhani:wght@300;400;500;600;700&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg:          #02020c;
      --bg2:         #04040f;
      --surface:     rgba(8, 8, 20, 0.92);
      --surface2:    rgba(12, 12, 26, 0.95);
      --surface3:    rgba(18, 18, 36, 0.98);
      --glass:       rgba(255, 255, 255, 0.028);
      --glass2:      rgba(255, 255, 255, 0.055);
      --border:      rgba(255, 255, 255, 0.075);
      --border2:     rgba(255, 255, 255, 0.14);
      --gold:        #E8B84B;
      --gold2:       #FFD060;
      --gold3:       #C8962A;
      --gold-dim:    #7a5e22;
      --gold-glow:   rgba(232, 184, 75, 0.18);
      --gold-border: rgba(232, 184, 75, 0.35);
      --cyan:        #00DCFF;
      --cyan2:       #60E8FF;
      --cyan-dim:    rgba(0, 220, 255, 0.12);
      --cyan-glow:   rgba(0, 220, 255, 0.22);
      --cyan-border: rgba(0, 220, 255, 0.32);
      --green:       #10D96C;
      --green-dim:   rgba(16, 217, 108, 0.12);
      --green-glow:  rgba(16, 217, 108, 0.22);
      --red:         #FF3355;
      --red-dim:     rgba(255, 51, 85, 0.12);
      --red-glow:    rgba(255, 51, 85, 0.22);
      --blue:        #4DA8DA;
      --purple:      #9D6EF8;
      --orange:      #FF7A30;
      --text:        #EEE8D8;
      --text-dim:    #4A4860;
      --text-mid:    #888698;
      --mono:        'JetBrains Mono', monospace;
      --serif:       'Playfair Display', serif;
      --gothic:      'Cinzel', serif;
      --decorative:  'Cinzel Decorative', serif;
      --cursive:     'Dancing Script', cursive;
      --sans:        'Inter', sans-serif;
      --display:     'Rajdhani', sans-serif;
    }

    html, body { background: var(--bg); color: var(--text); font-family: var(--sans); min-height: 100vh; }

    ::-webkit-scrollbar { width: 5px; height: 5px; }
    ::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); }
    ::-webkit-scrollbar-thumb { background: linear-gradient(180deg, rgba(0,220,255,0.3), rgba(232,184,75,0.2)); border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: linear-gradient(180deg, rgba(0,220,255,0.5), rgba(232,184,75,0.35)); }

    input, textarea, select {
      background: rgba(255,255,255,0.035) !important;
      color: var(--text) !important;
      border: 1px solid rgba(255,255,255,0.1) !important;
      border-radius: 10px !important;
      font-family: var(--mono) !important;
      font-size: 12px !important;
      padding: 10px 14px !important;
      outline: none !important;
      transition: border-color .2s, box-shadow .2s, background .2s !important;
      width: 100%;
      backdrop-filter: blur(12px);
    }
    input:focus, textarea:focus, select:focus {
      border-color: var(--cyan-border) !important;
      box-shadow: 0 0 0 3px var(--cyan-dim), 0 2px 16px rgba(0,220,255,0.08) !important;
      background: rgba(0,220,255,0.04) !important;
    }
    select option { background: #06060e; }

    @keyframes fadeUp    { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
    @keyframes fadeIn    { from { opacity:0; } to { opacity:1; } }
    @keyframes slideInL  { from { opacity:0; transform:translateX(-18px); } to { opacity:1; transform:translateX(0); } }
    @keyframes slideInR  { from { opacity:0; transform:translateX(18px); } to { opacity:1; transform:translateX(0); } }
    @keyframes pulse     { 0%,100%{opacity:1;} 50%{opacity:.2;} }
    @keyframes spin      { to { transform:rotate(360deg); } }
    @keyframes shimmer   { 0%{background-position:200% center;} 100%{background-position:-200% center;} }
    @keyframes borderGlow {
      0%,100% { box-shadow: 0 0 15px rgba(0,220,255,0.08), inset 0 1px 0 rgba(255,255,255,0.05); }
      50%      { box-shadow: 0 0 35px rgba(0,220,255,0.2), inset 0 1px 0 rgba(255,255,255,0.1); }
    }
    @keyframes goldGlow {
      0%,100% { box-shadow: 0 0 15px rgba(232,184,75,0.1), inset 0 1px 0 rgba(255,255,255,0.06); }
      50%      { box-shadow: 0 0 35px rgba(232,184,75,0.25), inset 0 1px 0 rgba(255,255,255,0.1); }
    }
    @keyframes ambientPulse { 0%,100% { opacity: .6; transform: scale(1); } 50% { opacity: 1; transform: scale(1.08); } }
    @keyframes greenPulse  { 0%,100% { text-shadow: 0 0 10px var(--green); } 50% { text-shadow: 0 0 24px var(--green), 0 0 48px rgba(16,217,108,.4); } }
    @keyframes cyanPulse   { 0%,100% { text-shadow: 0 0 10px var(--cyan); } 50% { text-shadow: 0 0 24px var(--cyan), 0 0 48px rgba(0,220,255,.4); } }
    @keyframes ticker      { 0% { transform:translateX(0); } 100% { transform:translateX(-50%); } }
    @keyframes dropIn      { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
    @keyframes float       { 0%,100% { transform:translateY(0px); } 50% { transform:translateY(-4px); } }
    @keyframes gradientShift { 0%{background-position:0% 50%;} 50%{background-position:100% 50%;} 100%{background-position:0% 50%;} }

    .fade-up   { animation: fadeUp  .48s cubic-bezier(0.16,1,0.3,1) both; }
    .fade-in   { animation: fadeIn  .3s ease both; }
    .slide-l   { animation: slideInL .38s cubic-bezier(0.16,1,0.3,1) both; }
    .slide-r   { animation: slideInR .38s cubic-bezier(0.16,1,0.3,1) both; }
    .blink     { animation: pulse 1.5s ease infinite; }
    .spin      { animation: spin 1s linear infinite; }
    .drop-in   { animation: dropIn .22s ease both; }

    .stagger > *:nth-child(1) { animation-delay: 0s; }
    .stagger > *:nth-child(2) { animation-delay: .07s; }
    .stagger > *:nth-child(3) { animation-delay: .14s; }
    .stagger > *:nth-child(4) { animation-delay: .21s; }
    .stagger > *:nth-child(5) { animation-delay: .28s; }
    .stagger > *:nth-child(6) { animation-delay: .35s; }
    .stagger > *:nth-child(7) { animation-delay: .42s; }
    .stagger > *:nth-child(8) { animation-delay: .49s; }

    .btn-gold {
      background: linear-gradient(135deg, #E8B84B, #FFD060, #C8962A);
      background-size: 200% 200%;
      color: #080508;
      border: none;
      border-radius: 11px;
      padding: 10px 22px;
      font-family: var(--gothic);
      font-weight: 700;
      font-size: 12px;
      cursor: pointer;
      transition: all .25s;
      box-shadow: 0 2px 16px rgba(232,184,75,0.35), inset 0 1px 0 rgba(255,255,255,0.3);
      letter-spacing: 1px;
      text-transform: uppercase;
    }
    .btn-gold:hover { 
      opacity: .95; 
      transform: translateY(-2px); 
      box-shadow: 0 6px 28px rgba(232,184,75,0.55), inset 0 1px 0 rgba(255,255,255,0.3); 
      animation: gradientShift 2s ease infinite;
    }
    .btn-gold:active { transform: translateY(0); }

    .btn-cyan {
      background: linear-gradient(135deg, rgba(0,220,255,0.18), rgba(0,220,255,0.06));
      color: var(--cyan);
      border: 1px solid var(--cyan-border);
      border-radius: 11px;
      padding: 10px 22px;
      font-family: var(--gothic);
      font-weight: 600;
      font-size: 12px;
      letter-spacing: .8px;
      text-transform: uppercase;
      cursor: pointer;
      transition: all .25s;
      box-shadow: 0 2px 14px rgba(0,220,255,0.12);
    }
    .btn-cyan:hover { background: rgba(0,220,255,0.22); box-shadow: 0 4px 24px rgba(0,220,255,0.28); transform: translateY(-2px); }

    .btn-outline {
      background: transparent;
      border: 1px solid var(--gold-border);
      color: var(--gold);
      border-radius: 11px;
      padding: 10px 22px;
      font-family: var(--gothic);
      font-weight: 600;
      font-size: 12px;
      letter-spacing: .8px;
      text-transform: uppercase;
      cursor: pointer;
      transition: all .25s;
    }
    .btn-outline:hover { background: var(--gold-glow); border-color: var(--gold); transform: translateY(-1px); }

    .btn-ghost {
      background: var(--glass);
      border: 1px solid var(--border);
      color: var(--text-mid);
      border-radius: 9px;
      padding: 8px 16px;
      font-family: var(--sans);
      font-size: 12px;
      cursor: pointer;
      transition: all .2s;
    }
    .btn-ghost:hover { background: var(--glass2); color: var(--text); border-color: var(--border2); }

    .glass-card {
      background: linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.015) 100%);
      border: 1px solid var(--border);
      border-radius: 18px;
      padding: 24px;
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      box-shadow: 0 4px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05), inset 0 0 0 1px rgba(255,255,255,0.02);
      position: relative;
      overflow: hidden;
    }
    .glass-card::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent);
    }
    .glass-card-gold {
      background: linear-gradient(135deg, rgba(232,184,75,0.04) 0%, rgba(255,255,255,0.015) 100%);
      border: 1px solid var(--gold-border);
      border-radius: 18px;
      padding: 24px;
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      box-shadow: 0 4px 40px rgba(232,184,75,0.1), inset 0 1px 0 rgba(232,184,75,0.08);
      animation: goldGlow 5s ease infinite;
      position: relative;
    }
    .glass-card-cyan {
      background: linear-gradient(135deg, rgba(0,220,255,0.04) 0%, rgba(255,255,255,0.015) 100%);
      border: 1px solid var(--cyan-border);
      border-radius: 18px;
      padding: 24px;
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      box-shadow: 0 4px 40px rgba(0,220,255,0.08), inset 0 1px 0 rgba(0,220,255,0.08);
      animation: borderGlow 5s ease infinite;
      position: relative;
    }

    .section-label {
      font-family: var(--gothic);
      font-size: 9px;
      letter-spacing: 3px;
      color: var(--text-dim);
      text-transform: uppercase;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .section-label::after {
      content: '';
      flex: 1;
      height: 1px;
      background: linear-gradient(90deg, var(--border), transparent);
    }

    .ambient-blob {
      position: fixed;
      border-radius: 50%;
      filter: blur(130px);
      pointer-events: none;
      z-index: 0;
      animation: ambientPulse 9s ease-in-out infinite;
    }

    /* Stock autocomplete dropdown */
    .stock-dropdown {
      position: absolute;
      top: calc(100% + 6px);
      left: 0; right: 0;
      background: rgba(6,6,18,0.99);
      border: 1px solid var(--cyan-border);
      border-radius: 14px;
      z-index: 500;
      max-height: 340px;
      overflow-y: auto;
      box-shadow: 0 20px 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(0,220,255,0.08);
      animation: dropIn .18s ease both;
    }
    .stock-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 11px 16px;
      cursor: pointer;
      border-bottom: 1px solid rgba(255,255,255,0.04);
      transition: background .12s;
    }
    .stock-item:last-child { border-bottom: none; }
    .stock-item:hover, .stock-item.active { background: rgba(0,220,255,0.07); }

    /* Neon ticker */
    .ticker-wrap { overflow: hidden; white-space: nowrap; }
    .ticker-track { display: inline-flex; gap: 0; animation: ticker 65s linear infinite; }
    .ticker-track:hover { animation-play-state: paused; }

    /* Premium decorative divider */
    .deco-divider {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 4px 0;
    }
    .deco-divider::before, .deco-divider::after {
      content: '';
      flex: 1;
      height: 1px;
      background: linear-gradient(90deg, transparent, var(--gold-border), transparent);
    }

    /* Nav tab hover glow */
    .nav-tab:hover {
      background: rgba(255,255,255,0.05) !important;
      color: var(--text) !important;
    }
  `}</style>
);

/* ═══════════════════════════════════════════════════════════════
   STORAGE
═══════════════════════════════════════════════════════════════ */
const STORAGE_KEY = "tj_v4_pro";
const loadStorage = () => { try { const r = localStorage.getItem(STORAGE_KEY); return r ? JSON.parse(r) : null; } catch { return null; } };
const saveStorage = (d) => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); return true; } catch { return false; } };

/* ═══════════════════════════════════════════════════════════════
   NSE / BSE COMPREHENSIVE STOCK DATABASE
   Covers Nifty 50, Nifty Next 50, BankNifty, MidCap, SmallCap
   BSE Sensex, FNO stocks, ETFs & Indices
═══════════════════════════════════════════════════════════════ */
const STOCK_DB = [
  // ── INDICES ─────────────────────────────────────────────────
  { sym:"NIFTY",       name:"Nifty 50 Index",              exchange:"NSE", sector:"Index",    tv:"NSE:NIFTY" },
  { sym:"BANKNIFTY",   name:"Bank Nifty Index",             exchange:"NSE", sector:"Index",    tv:"NSE:BANKNIFTY" },
  { sym:"FINNIFTY",    name:"Fin Nifty Index",              exchange:"NSE", sector:"Index",    tv:"NSE:FINNIFTY" },
  { sym:"MIDCPNIFTY",  name:"Midcap Nifty Index",          exchange:"NSE", sector:"Index",    tv:"NSE:MIDCPNIFTY" },
  { sym:"SENSEX",      name:"BSE Sensex 30",                exchange:"BSE", sector:"Index",    tv:"BSE:SENSEX" },
  { sym:"BANKEX",      name:"BSE Bankex",                   exchange:"BSE", sector:"Index",    tv:"BSE:BANKEX" },
  { sym:"INDIA VIX",   name:"India Volatility Index",      exchange:"NSE", sector:"Index",    tv:"NSE:INDIAVIX" },
  // ── NIFTY 50 STOCKS ─────────────────────────────────────────
  { sym:"RELIANCE",    name:"Reliance Industries",          exchange:"NSE", sector:"Energy",   tv:"NSE:RELIANCE" },
  { sym:"TCS",         name:"Tata Consultancy Services",   exchange:"NSE", sector:"IT",        tv:"NSE:TCS" },
  { sym:"HDFCBANK",    name:"HDFC Bank",                   exchange:"NSE", sector:"Banking",   tv:"NSE:HDFCBANK" },
  { sym:"ICICIBANK",   name:"ICICI Bank",                  exchange:"NSE", sector:"Banking",   tv:"NSE:ICICIBANK" },
  { sym:"INFY",        name:"Infosys",                     exchange:"NSE", sector:"IT",        tv:"NSE:INFY" },
  { sym:"HINDUNILVR",  name:"Hindustan Unilever",          exchange:"NSE", sector:"FMCG",      tv:"NSE:HINDUNILVR" },
  { sym:"ITC",         name:"ITC Limited",                 exchange:"NSE", sector:"FMCG",      tv:"NSE:ITC" },
  { sym:"SBIN",        name:"State Bank of India",         exchange:"NSE", sector:"Banking",   tv:"NSE:SBIN" },
  { sym:"BAJFINANCE",  name:"Bajaj Finance",               exchange:"NSE", sector:"Finance",   tv:"NSE:BAJFINANCE" },
  { sym:"BHARTIARTL",  name:"Bharti Airtel",               exchange:"NSE", sector:"Telecom",   tv:"NSE:BHARTIARTL" },
  { sym:"KOTAKBANK",   name:"Kotak Mahindra Bank",         exchange:"NSE", sector:"Banking",   tv:"NSE:KOTAKBANK" },
  { sym:"LT",          name:"Larsen & Toubro",             exchange:"NSE", sector:"Infra",     tv:"NSE:LT" },
  { sym:"AXISBANK",    name:"Axis Bank",                   exchange:"NSE", sector:"Banking",   tv:"NSE:AXISBANK" },
  { sym:"ASIANPAINT",  name:"Asian Paints",                exchange:"NSE", sector:"Paints",    tv:"NSE:ASIANPAINT" },
  { sym:"MARUTI",      name:"Maruti Suzuki",               exchange:"NSE", sector:"Auto",      tv:"NSE:MARUTI" },
  { sym:"HCLTECH",     name:"HCL Technologies",            exchange:"NSE", sector:"IT",        tv:"NSE:HCLTECH" },
  { sym:"SUNPHARMA",   name:"Sun Pharmaceutical",          exchange:"NSE", sector:"Pharma",    tv:"NSE:SUNPHARMA" },
  { sym:"TITAN",       name:"Titan Company",               exchange:"NSE", sector:"Consumer",  tv:"NSE:TITAN" },
  { sym:"ULTRACEMCO",  name:"UltraTech Cement",            exchange:"NSE", sector:"Cement",    tv:"NSE:ULTRACEMCO" },
  { sym:"WIPRO",       name:"Wipro Limited",               exchange:"NSE", sector:"IT",        tv:"NSE:WIPRO" },
  { sym:"ONGC",        name:"ONGC",                        exchange:"NSE", sector:"Energy",    tv:"NSE:ONGC" },
  { sym:"NTPC",        name:"NTPC Limited",                exchange:"NSE", sector:"Power",     tv:"NSE:NTPC" },
  { sym:"POWERGRID",   name:"Power Grid Corp",             exchange:"NSE", sector:"Power",     tv:"NSE:POWERGRID" },
  { sym:"COALINDIA",   name:"Coal India",                  exchange:"NSE", sector:"Mining",    tv:"NSE:COALINDIA" },
  { sym:"ADANIENT",    name:"Adani Enterprises",           exchange:"NSE", sector:"Conglomerate",tv:"NSE:ADANIENT" },
  { sym:"ADANIPORTS",  name:"Adani Ports & SEZ",           exchange:"NSE", sector:"Infra",     tv:"NSE:ADANIPORTS" },
  { sym:"BAJAJFINSV",  name:"Bajaj Finserv",               exchange:"NSE", sector:"Finance",   tv:"NSE:BAJAJFINSV" },
  { sym:"DIVISLAB",    name:"Divi's Laboratories",         exchange:"NSE", sector:"Pharma",    tv:"NSE:DIVISLAB" },
  { sym:"DRREDDY",     name:"Dr. Reddy's Laboratories",   exchange:"NSE", sector:"Pharma",    tv:"NSE:DRREDDY" },
  { sym:"EICHERMOT",   name:"Eicher Motors",               exchange:"NSE", sector:"Auto",      tv:"NSE:EICHERMOT" },
  { sym:"GRASIM",      name:"Grasim Industries",           exchange:"NSE", sector:"Diversified",tv:"NSE:GRASIM" },
  { sym:"HDFCLIFE",    name:"HDFC Life Insurance",         exchange:"NSE", sector:"Insurance", tv:"NSE:HDFCLIFE" },
  { sym:"HEROMOTOCO",  name:"Hero MotoCorp",               exchange:"NSE", sector:"Auto",      tv:"NSE:HEROMOTOCO" },
  { sym:"INDUSINDBK",  name:"IndusInd Bank",               exchange:"NSE", sector:"Banking",   tv:"NSE:INDUSINDBK" },
  { sym:"JSWSTEEL",    name:"JSW Steel",                   exchange:"NSE", sector:"Metals",    tv:"NSE:JSWSTEEL" },
  { sym:"M&M",         name:"Mahindra & Mahindra",         exchange:"NSE", sector:"Auto",      tv:"NSE:M_M" },
  { sym:"NESTLEIND",   name:"Nestle India",                exchange:"NSE", sector:"FMCG",      tv:"NSE:NESTLEIND" },
  { sym:"SBILIFE",     name:"SBI Life Insurance",          exchange:"NSE", sector:"Insurance", tv:"NSE:SBILIFE" },
  { sym:"SHRIRAMFIN",  name:"Shriram Finance",             exchange:"NSE", sector:"Finance",   tv:"NSE:SHRIRAMFIN" },
  { sym:"TATACONSUM",  name:"Tata Consumer Products",      exchange:"NSE", sector:"FMCG",      tv:"NSE:TATACONSUM" },
  { sym:"TATAMOTORS",  name:"Tata Motors",                 exchange:"NSE", sector:"Auto",      tv:"NSE:TATAMOTORS" },
  { sym:"TATASTEEL",   name:"Tata Steel",                  exchange:"NSE", sector:"Metals",    tv:"NSE:TATASTEEL" },
  { sym:"TECHM",       name:"Tech Mahindra",               exchange:"NSE", sector:"IT",        tv:"NSE:TECHM" },
  { sym:"TRENT",       name:"Trent Limited",               exchange:"NSE", sector:"Retail",    tv:"NSE:TRENT" },
  { sym:"UPL",         name:"UPL Limited",                 exchange:"NSE", sector:"Agro",      tv:"NSE:UPL" },
  { sym:"BPCL",        name:"BPCL",                        exchange:"NSE", sector:"Energy",    tv:"NSE:BPCL" },
  // ── NIFTY NEXT 50 / LARGE CAP ───────────────────────────────
  { sym:"ADANIGREEN",  name:"Adani Green Energy",          exchange:"NSE", sector:"Power",     tv:"NSE:ADANIGREEN" },
  { sym:"ADANIPWR",    name:"Adani Power",                 exchange:"NSE", sector:"Power",     tv:"NSE:ADANIPWR" },
  { sym:"ADANITRANS",  name:"Adani Transmission",          exchange:"NSE", sector:"Power",     tv:"NSE:ADANITRANS" },
  { sym:"AMBUJACEM",   name:"Ambuja Cements",              exchange:"NSE", sector:"Cement",    tv:"NSE:AMBUJACEM" },
  { sym:"AUROPHARMA",  name:"Aurobindo Pharma",            exchange:"NSE", sector:"Pharma",    tv:"NSE:AUROPHARMA" },
  { sym:"BAJAJ-AUTO",  name:"Bajaj Auto",                  exchange:"NSE", sector:"Auto",      tv:"NSE:BAJAJ_AUTO" },
  { sym:"BANDHANBNK",  name:"Bandhan Bank",                exchange:"NSE", sector:"Banking",   tv:"NSE:BANDHANBNK" },
  { sym:"BERGEPAINT",  name:"Berger Paints",               exchange:"NSE", sector:"Paints",    tv:"NSE:BERGEPAINT" },
  { sym:"BOSCHLTD",    name:"Bosch India",                 exchange:"NSE", sector:"Auto",      tv:"NSE:BOSCHLTD" },
  { sym:"CIPLA",       name:"Cipla",                       exchange:"NSE", sector:"Pharma",    tv:"NSE:CIPLA" },
  { sym:"COLPAL",      name:"Colgate-Palmolive India",     exchange:"NSE", sector:"FMCG",      tv:"NSE:COLPAL" },
  { sym:"DABUR",       name:"Dabur India",                 exchange:"NSE", sector:"FMCG",      tv:"NSE:DABUR" },
  { sym:"DLF",         name:"DLF Limited",                 exchange:"NSE", sector:"Realty",    tv:"NSE:DLF" },
  { sym:"FEDERALBNK",  name:"Federal Bank",                exchange:"NSE", sector:"Banking",   tv:"NSE:FEDERALBNK" },
  { sym:"GAIL",        name:"GAIL India",                  exchange:"NSE", sector:"Energy",    tv:"NSE:GAIL" },
  { sym:"GODREJCP",    name:"Godrej Consumer Products",    exchange:"NSE", sector:"FMCG",      tv:"NSE:GODREJCP" },
  { sym:"GODREJPROP",  name:"Godrej Properties",           exchange:"NSE", sector:"Realty",    tv:"NSE:GODREJPROP" },
  { sym:"HAVELLS",     name:"Havells India",               exchange:"NSE", sector:"Consumer",  tv:"NSE:HAVELLS" },
  { sym:"HINDALCO",    name:"Hindalco Industries",         exchange:"NSE", sector:"Metals",    tv:"NSE:HINDALCO" },
  { sym:"HINDPETRO",   name:"Hindustan Petroleum",         exchange:"NSE", sector:"Energy",    tv:"NSE:HINDPETRO" },
  { sym:"IDFCFIRSTB",  name:"IDFC First Bank",             exchange:"NSE", sector:"Banking",   tv:"NSE:IDFCFIRSTB" },
  { sym:"IGL",         name:"Indraprastha Gas",            exchange:"NSE", sector:"Energy",    tv:"NSE:IGL" },
  { sym:"INDUSTOWER",  name:"Indus Towers",                exchange:"NSE", sector:"Telecom",   tv:"NSE:INDUSTOWER" },
  { sym:"IRCTC",       name:"IRCTC",                       exchange:"NSE", sector:"Travel",    tv:"NSE:IRCTC" },
  { sym:"JUBLFOOD",    name:"Jubilant Foodworks",          exchange:"NSE", sector:"Food",      tv:"NSE:JUBLFOOD" },
  { sym:"LICHSGFIN",   name:"LIC Housing Finance",         exchange:"NSE", sector:"Finance",   tv:"NSE:LICHSGFIN" },
  { sym:"LTIM",        name:"LTIMindtree",                 exchange:"NSE", sector:"IT",        tv:"NSE:LTIM" },
  { sym:"LUPIN",       name:"Lupin",                       exchange:"NSE", sector:"Pharma",    tv:"NSE:LUPIN" },
  { sym:"MARICO",      name:"Marico",                      exchange:"NSE", sector:"FMCG",      tv:"NSE:MARICO" },
  { sym:"MFSL",        name:"Max Financial Services",      exchange:"NSE", sector:"Insurance", tv:"NSE:MFSL" },
  { sym:"MOTHERSON",   name:"Samvardhana Motherson",       exchange:"NSE", sector:"Auto",      tv:"NSE:MOTHERSON" },
  { sym:"MPHASIS",     name:"Mphasis",                     exchange:"NSE", sector:"IT",        tv:"NSE:MPHASIS" },
  { sym:"MUTHOOTFIN",  name:"Muthoot Finance",             exchange:"NSE", sector:"Finance",   tv:"NSE:MUTHOOTFIN" },
  { sym:"NAUKRI",      name:"Info Edge (Naukri)",          exchange:"NSE", sector:"Internet",  tv:"NSE:NAUKRI" },
  { sym:"NMDC",        name:"NMDC",                        exchange:"NSE", sector:"Mining",    tv:"NSE:NMDC" },
  { sym:"PAGEIND",     name:"Page Industries",             exchange:"NSE", sector:"Consumer",  tv:"NSE:PAGEIND" },
  { sym:"PERSISTENT",  name:"Persistent Systems",          exchange:"NSE", sector:"IT",        tv:"NSE:PERSISTENT" },
  { sym:"PIDILITIND",  name:"Pidilite Industries",         exchange:"NSE", sector:"Chemicals", tv:"NSE:PIDILITIND" },
  { sym:"PIIND",       name:"PI Industries",               exchange:"NSE", sector:"Agro",      tv:"NSE:PIIND" },
  { sym:"PNB",         name:"Punjab National Bank",        exchange:"NSE", sector:"Banking",   tv:"NSE:PNB" },
  { sym:"POLYCAB",     name:"Polycab India",               exchange:"NSE", sector:"Cables",    tv:"NSE:POLYCAB" },
  { sym:"RECLTD",      name:"REC Limited",                 exchange:"NSE", sector:"Finance",   tv:"NSE:RECLTD" },
  { sym:"SAIL",        name:"SAIL",                        exchange:"NSE", sector:"Metals",    tv:"NSE:SAIL" },
  { sym:"SIEMENS",     name:"Siemens India",               exchange:"NSE", sector:"Infra",     tv:"NSE:SIEMENS" },
  { sym:"SRF",         name:"SRF Limited",                 exchange:"NSE", sector:"Chemicals", tv:"NSE:SRF" },
  { sym:"TORNTPHARM",  name:"Torrent Pharma",              exchange:"NSE", sector:"Pharma",    tv:"NSE:TORNTPHARM" },
  { sym:"TORNTPOWER",  name:"Torrent Power",               exchange:"NSE", sector:"Power",     tv:"NSE:TORNTPOWER" },
  { sym:"TVSMOTOR",    name:"TVS Motor Company",           exchange:"NSE", sector:"Auto",      tv:"NSE:TVSMOTOR" },
  { sym:"UNITDSPR",    name:"United Spirits",              exchange:"NSE", sector:"Consumer",  tv:"NSE:UNITDSPR" },
  { sym:"UBL",         name:"United Breweries",            exchange:"NSE", sector:"Consumer",  tv:"NSE:UBL" },
  { sym:"VEDL",        name:"Vedanta",                     exchange:"NSE", sector:"Metals",    tv:"NSE:VEDL" },
  { sym:"VOLTAS",      name:"Voltas",                      exchange:"NSE", sector:"Consumer",  tv:"NSE:VOLTAS" },
  { sym:"ZOMATO",      name:"Zomato",                      exchange:"NSE", sector:"Internet",  tv:"NSE:ZOMATO" },
  { sym:"PAYTM",       name:"One 97 Comm. (Paytm)",        exchange:"NSE", sector:"Fintech",   tv:"NSE:PAYTM" },
  { sym:"NYKAA",       name:"FSN E-Commerce (Nykaa)",      exchange:"NSE", sector:"Retail",    tv:"NSE:NYKAA" },
  { sym:"DMART",       name:"Avenue Supermarts (DMart)",   exchange:"NSE", sector:"Retail",    tv:"NSE:DMART" },
  { sym:"ABCAPITAL",   name:"Aditya Birla Capital",        exchange:"NSE", sector:"Finance",   tv:"NSE:ABCAPITAL" },
  { sym:"ABFRL",       name:"Aditya Birla Fashion & Retail",exchange:"NSE",sector:"Retail",    tv:"NSE:ABFRL" },
  { sym:"ALKEM",       name:"Alkem Laboratories",          exchange:"NSE", sector:"Pharma",    tv:"NSE:ALKEM" },
  { sym:"APOLLOHOSP",  name:"Apollo Hospitals",            exchange:"NSE", sector:"Healthcare",tv:"NSE:APOLLOHOSP" },
  { sym:"APOLLOTYRE",  name:"Apollo Tyres",                exchange:"NSE", sector:"Auto",      tv:"NSE:APOLLOTYRE" },
  { sym:"ASHOKLEY",    name:"Ashok Leyland",               exchange:"NSE", sector:"Auto",      tv:"NSE:ASHOKLEY" },
  { sym:"ASTRAL",      name:"Astral Limited",              exchange:"NSE", sector:"Pipes",     tv:"NSE:ASTRAL" },
  { sym:"ATUL",        name:"Atul Ltd",                    exchange:"NSE", sector:"Chemicals", tv:"NSE:ATUL" },
  { sym:"BALKRISIND",  name:"Balkrishna Industries",       exchange:"NSE", sector:"Auto",      tv:"NSE:BALKRISIND" },
  { sym:"BATAINDIA",   name:"Bata India",                  exchange:"NSE", sector:"Consumer",  tv:"NSE:BATAINDIA" },
  { sym:"BEL",         name:"Bharat Electronics",          exchange:"NSE", sector:"Defence",   tv:"NSE:BEL" },
  { sym:"BHARATFORG",  name:"Bharat Forge",                exchange:"NSE", sector:"Auto",      tv:"NSE:BHARATFORG" },
  { sym:"BHEL",        name:"BHEL",                        exchange:"NSE", sector:"Engineering",tv:"NSE:BHEL" },
  { sym:"BIOCON",      name:"Biocon",                      exchange:"NSE", sector:"Pharma",    tv:"NSE:BIOCON" },
  { sym:"CANBANK",     name:"Canara Bank",                 exchange:"NSE", sector:"Banking",   tv:"NSE:CANBK" },
  { sym:"CESC",        name:"CESC Limited",                exchange:"NSE", sector:"Power",     tv:"NSE:CESC" },
  { sym:"CROMPTON",    name:"Crompton Greaves Consumer",   exchange:"NSE", sector:"Consumer",  tv:"NSE:CROMPTON" },
  { sym:"CUMMINSIND",  name:"Cummins India",               exchange:"NSE", sector:"Engineering",tv:"NSE:CUMMINSIND" },
  { sym:"DEEPAKNTR",   name:"Deepak Nitrite",              exchange:"NSE", sector:"Chemicals", tv:"NSE:DEEPAKNTR" },
  { sym:"DIXON",       name:"Dixon Technologies",          exchange:"NSE", sector:"Electronics",tv:"NSE:DIXON" },
  { sym:"EMAMILTD",    name:"Emami",                       exchange:"NSE", sector:"FMCG",      tv:"NSE:EMAMILTD" },
  { sym:"ESCORTS",     name:"Escorts Kubota",              exchange:"NSE", sector:"Auto",      tv:"NSE:ESCORTS" },
  { sym:"EXIDEIND",    name:"Exide Industries",            exchange:"NSE", sector:"Auto",      tv:"NSE:EXIDEIND" },
  { sym:"FORTIS",      name:"Fortis Healthcare",           exchange:"NSE", sector:"Healthcare",tv:"NSE:FORTIS" },
  { sym:"GLENMARK",    name:"Glenmark Pharma",             exchange:"NSE", sector:"Pharma",    tv:"NSE:GLENMARK" },
  { sym:"GMRINFRA",    name:"GMR Airports Infra",          exchange:"NSE", sector:"Infra",     tv:"NSE:GMRINFRA" },
  { sym:"GNFC",        name:"GNFC",                        exchange:"NSE", sector:"Chemicals", tv:"NSE:GNFC" },
  { sym:"GRANULES",    name:"Granules India",              exchange:"NSE", sector:"Pharma",    tv:"NSE:GRANULES" },
  { sym:"HAL",         name:"Hindustan Aeronautics",       exchange:"NSE", sector:"Defence",   tv:"NSE:HAL" },
  { sym:"HFCL",        name:"HFCL",                        exchange:"NSE", sector:"Telecom",   tv:"NSE:HFCL" },
  { sym:"HUDCO",       name:"HUDCO",                       exchange:"NSE", sector:"Finance",   tv:"NSE:HUDCO" },
  { sym:"IDBI",        name:"IDBI Bank",                   exchange:"NSE", sector:"Banking",   tv:"NSE:IDBI" },
  { sym:"INDIANB",     name:"Indian Bank",                 exchange:"NSE", sector:"Banking",   tv:"NSE:INDIANB" },
  { sym:"INDIAMART",   name:"Indiamart Intermesh",         exchange:"NSE", sector:"Internet",  tv:"NSE:INDIAMART" },
  { sym:"JINDALSTEL",  name:"Jindal Steel & Power",        exchange:"NSE", sector:"Metals",    tv:"NSE:JINDALSTEL" },
  { sym:"JKCEMENT",    name:"JK Cement",                   exchange:"NSE", sector:"Cement",    tv:"NSE:JKCEMENT" },
  { sym:"JSL",         name:"Jindal Stainless",            exchange:"NSE", sector:"Metals",    tv:"NSE:JSL" },
  { sym:"KPITTECH",    name:"KPIT Technologies",           exchange:"NSE", sector:"IT",        tv:"NSE:KPITTECH" },
  { sym:"LAURUSLABS",  name:"Laurus Labs",                 exchange:"NSE", sector:"Pharma",    tv:"NSE:LAURUSLABS" },
  { sym:"LICI",        name:"LIC India",                   exchange:"NSE", sector:"Insurance", tv:"NSE:LICI" },
  { sym:"LTTS",        name:"L&T Technology Services",     exchange:"NSE", sector:"IT",        tv:"NSE:LTTS" },
  { sym:"M&MFIN",      name:"M&M Financial Services",      exchange:"NSE", sector:"Finance",   tv:"NSE:M_MFIN" },
  { sym:"MCDOWELL-N",  name:"United Spirits (McDowell)",   exchange:"NSE", sector:"Consumer",  tv:"NSE:MCDOWELL_N" },
  { sym:"METROPOLIS",  name:"Metropolis Healthcare",        exchange:"NSE", sector:"Healthcare",tv:"NSE:METROPOLIS" },
  { sym:"MGL",         name:"Mahanagar Gas",               exchange:"NSE", sector:"Energy",    tv:"NSE:MGL" },
  { sym:"NHPC",        name:"NHPC",                        exchange:"NSE", sector:"Power",     tv:"NSE:NHPC" },
  { sym:"OBEROIRLTY",  name:"Oberoi Realty",               exchange:"NSE", sector:"Realty",    tv:"NSE:OBEROIRLTY" },
  { sym:"OFSS",        name:"Oracle Financial Services",   exchange:"NSE", sector:"IT",        tv:"NSE:OFSS" },
  { sym:"PETRONET",    name:"Petronet LNG",                exchange:"NSE", sector:"Energy",    tv:"NSE:PETRONET" },
  { sym:"PFIZER",      name:"Pfizer India",                exchange:"NSE", sector:"Pharma",    tv:"NSE:PFIZER" },
  { sym:"PGHH",        name:"Procter & Gamble",            exchange:"NSE", sector:"FMCG",      tv:"NSE:PGHH" },
  { sym:"PHOENIXLTD",  name:"Phoenix Mills",               exchange:"NSE", sector:"Realty",    tv:"NSE:PHOENIXLTD" },
  { sym:"PVR",         name:"PVR Inox",                    exchange:"NSE", sector:"Media",     tv:"NSE:PVR" },
  { sym:"RAMCOCEM",    name:"Ramco Cements",               exchange:"NSE", sector:"Cement",    tv:"NSE:RAMCOCEM" },
  { sym:"RBLBANK",     name:"RBL Bank",                    exchange:"NSE", sector:"Banking",   tv:"NSE:RBLBANK" },
  { sym:"SCHAEFFLER",  name:"Schaeffler India",            exchange:"NSE", sector:"Auto",      tv:"NSE:SCHAEFFLER" },
  { sym:"SKFINDIA",    name:"SKF India",                   exchange:"NSE", sector:"Engineering",tv:"NSE:SKFINDIA" },
  { sym:"STAR",        name:"Star Health Insurance",       exchange:"NSE", sector:"Insurance", tv:"NSE:STAR" },
  { sym:"SUMICHEM",    name:"Sumitomo Chemical India",     exchange:"NSE", sector:"Chemicals", tv:"NSE:SUMICHEM" },
  { sym:"SUNPHARMA",   name:"Sun Pharma",                  exchange:"NSE", sector:"Pharma",    tv:"NSE:SUNPHARMA" },
  { sym:"SUNTV",       name:"Sun TV Network",              exchange:"NSE", sector:"Media",     tv:"NSE:SUNTV" },
  { sym:"SUPREMEIND",  name:"Supreme Industries",          exchange:"NSE", sector:"Plastics",  tv:"NSE:SUPREMEIND" },
  { sym:"TATACHEM",    name:"Tata Chemicals",              exchange:"NSE", sector:"Chemicals", tv:"NSE:TATACHEM" },
  { sym:"TATACOMM",    name:"Tata Communications",         exchange:"NSE", sector:"Telecom",   tv:"NSE:TATACOMM" },
  { sym:"TATAELXSI",   name:"Tata Elxsi",                  exchange:"NSE", sector:"IT",        tv:"NSE:TATAELXSI" },
  { sym:"TATAPOWER",   name:"Tata Power",                  exchange:"NSE", sector:"Power",     tv:"NSE:TATAPOWER" },
  { sym:"THERMAX",     name:"Thermax",                     exchange:"NSE", sector:"Engineering",tv:"NSE:THERMAX" },
  { sym:"TRIDENT",     name:"Trident",                     exchange:"NSE", sector:"Textile",   tv:"NSE:TRIDENT" },
  { sym:"TTKPRESTIG",  name:"TTK Prestige",                exchange:"NSE", sector:"Consumer",  tv:"NSE:TTKPRESTIG" },
  { sym:"UNIONBANK",   name:"Union Bank of India",         exchange:"NSE", sector:"Banking",   tv:"NSE:UNIONBANK" },
  { sym:"VBL",         name:"Varun Beverages",             exchange:"NSE", sector:"Food",      tv:"NSE:VBL" },
  { sym:"VGUARD",      name:"V-Guard Industries",          exchange:"NSE", sector:"Consumer",  tv:"NSE:VGUARD" },
  { sym:"WHIRLPOOL",   name:"Whirlpool India",             exchange:"NSE", sector:"Consumer",  tv:"NSE:WHIRLPOOL" },
  { sym:"WIPRO",       name:"Wipro",                       exchange:"NSE", sector:"IT",        tv:"NSE:WIPRO" },
  { sym:"WOCKPHARMA",  name:"Wockhardt",                   exchange:"NSE", sector:"Pharma",    tv:"NSE:WOCKPHARMA" },
  { sym:"ZEEL",        name:"Zee Entertainment",           exchange:"NSE", sector:"Media",     tv:"NSE:ZEEL" },
  { sym:"ZYDUSLIFE",   name:"Zydus Lifesciences",          exchange:"NSE", sector:"Pharma",    tv:"NSE:ZYDUSLIFE" },
  // ── BSE SPECIFIC ────────────────────────────────────────────
  { sym:"RELIANCE",    name:"Reliance Industries (BSE)",   exchange:"BSE", sector:"Energy",    tv:"BSE:RELIANCE" },
  { sym:"TCS",         name:"TCS (BSE)",                   exchange:"BSE", sector:"IT",        tv:"BSE:TCS" },
  { sym:"HDFCBANK",    name:"HDFC Bank (BSE)",             exchange:"BSE", sector:"Banking",   tv:"BSE:HDFCBANK" },
  { sym:"INFY",        name:"Infosys (BSE)",               exchange:"BSE", sector:"IT",        tv:"BSE:INFY" },
  { sym:"ICICIBANK",   name:"ICICI Bank (BSE)",            exchange:"BSE", sector:"Banking",   tv:"BSE:ICICIBANK" },
  { sym:"KOTAKBANK",   name:"Kotak Bank (BSE)",            exchange:"BSE", sector:"Banking",   tv:"BSE:KOTAKBANK" },
  { sym:"AXISBANK",    name:"Axis Bank (BSE)",             exchange:"BSE", sector:"Banking",   tv:"BSE:AXISBANK" },
  { sym:"ITC",         name:"ITC (BSE)",                   exchange:"BSE", sector:"FMCG",      tv:"BSE:ITC" },
  { sym:"SBIN",        name:"SBI (BSE)",                   exchange:"BSE", sector:"Banking",   tv:"BSE:SBIN" },
  { sym:"MARUTI",      name:"Maruti Suzuki (BSE)",         exchange:"BSE", sector:"Auto",      tv:"BSE:MARUTI" },
  { sym:"SUNPHARMA",   name:"Sun Pharma (BSE)",            exchange:"BSE", sector:"Pharma",    tv:"BSE:SUNPHARMA" },
  { sym:"TITAN",       name:"Titan (BSE)",                 exchange:"BSE", sector:"Consumer",  tv:"BSE:TITAN" },
  { sym:"TATAMOTORS",  name:"Tata Motors (BSE)",           exchange:"BSE", sector:"Auto",      tv:"BSE:TATAMOTORS" },
  { sym:"TATASTEEL",   name:"Tata Steel (BSE)",            exchange:"BSE", sector:"Metals",    tv:"BSE:TATASTEEL" },
  { sym:"WIPRO",       name:"Wipro (BSE)",                 exchange:"BSE", sector:"IT",        tv:"BSE:WIPRO" },
  { sym:"BAJFINANCE",  name:"Bajaj Finance (BSE)",         exchange:"BSE", sector:"Finance",   tv:"BSE:BAJFINANCE" },
  { sym:"LT",          name:"L&T (BSE)",                   exchange:"BSE", sector:"Infra",     tv:"BSE:LT" },
  { sym:"HINDUNILVR",  name:"HUL (BSE)",                   exchange:"BSE", sector:"FMCG",      tv:"BSE:HINDUNILVR" },
  { sym:"NTPC",        name:"NTPC (BSE)",                  exchange:"BSE", sector:"Power",     tv:"BSE:NTPC" },
  { sym:"ONGC",        name:"ONGC (BSE)",                  exchange:"BSE", sector:"Energy",    tv:"BSE:ONGC" },
  // ── NSE MID CAP ADDITIONAL ──────────────────────────────────
  { sym:"IRFC",        name:"Indian Railway Finance Corp", exchange:"NSE", sector:"Finance",   tv:"NSE:IRFC" },
  { sym:"RVNL",        name:"Rail Vikas Nigam",            exchange:"NSE", sector:"Infra",     tv:"NSE:RVNL" },
  { sym:"IRCON",       name:"IRCON International",         exchange:"NSE", sector:"Infra",     tv:"NSE:IRCON" },
  { sym:"SUZLON",      name:"Suzlon Energy",               exchange:"NSE", sector:"Power",     tv:"NSE:SUZLON" },
  { sym:"YESBANK",     name:"Yes Bank",                    exchange:"NSE", sector:"Banking",   tv:"NSE:YESBANK" },
  { sym:"IDEA",        name:"Vodafone Idea",               exchange:"NSE", sector:"Telecom",   tv:"NSE:IDEA" },
  { sym:"JIOFIN",      name:"Jio Financial Services",      exchange:"NSE", sector:"Finance",   tv:"NSE:JIOFIN" },
  { sym:"COCHINSHIP",  name:"Cochin Shipyard",             exchange:"NSE", sector:"Defence",   tv:"NSE:COCHINSHIP" },
  { sym:"MAZAGON",     name:"Mazagon Dock Shipbuilders",   exchange:"NSE", sector:"Defence",   tv:"NSE:MAZDOCK" },
  { sym:"GRSE",        name:"Garden Reach Shipbuilders",   exchange:"NSE", sector:"Defence",   tv:"NSE:GRSE" },
  { sym:"BEML",        name:"BEML Limited",                exchange:"NSE", sector:"Defence",   tv:"NSE:BEML" },
  { sym:"DATAPATTNS",  name:"Data Patterns India",         exchange:"NSE", sector:"Defence",   tv:"NSE:DATAPATTNS" },
  { sym:"PARAS",       name:"Paras Defence",               exchange:"NSE", sector:"Defence",   tv:"NSE:PARASDEF" },
  { sym:"AIAENG",      name:"AIA Engineering",             exchange:"NSE", sector:"Engineering",tv:"NSE:AIAENG" },
  { sym:"APTUS",       name:"Aptus Value Housing Finance", exchange:"NSE", sector:"Finance",   tv:"NSE:APTUS" },
  { sym:"AARTIIND",    name:"Aarti Industries",            exchange:"NSE", sector:"Chemicals", tv:"NSE:AARTIIND" },
  { sym:"AARTIDRUGS",  name:"Aarti Drugs",                 exchange:"NSE", sector:"Pharma",    tv:"NSE:AARTIDRUGS" },
  { sym:"ABBOTINDIA",  name:"Abbott India",                exchange:"NSE", sector:"Pharma",    tv:"NSE:ABBOTINDIA" },
  { sym:"ABSLAMC",     name:"Aditya Birla Sun Life AMC",   exchange:"NSE", sector:"Finance",   tv:"NSE:ABSLAMC" },
  { sym:"ACCELYA",     name:"Accelya Solutions India",     exchange:"NSE", sector:"IT",        tv:"NSE:ACCELYA" },
  { sym:"ACE",         name:"Action Construction Equipment",exchange:"NSE",sector:"Engineering",tv:"NSE:ACE" },
  { sym:"ADANIPOWER",  name:"Adani Power",                 exchange:"NSE", sector:"Power",     tv:"NSE:ADANIPOWER" },
  { sym:"AEGISCHEM",   name:"Aegis Logistics",             exchange:"NSE", sector:"Chemicals", tv:"NSE:AEGISCHEM" },
  { sym:"AFFLE",       name:"Affle India",                 exchange:"NSE", sector:"IT",        tv:"NSE:AFFLE" },
  { sym:"AGARIND",     name:"Agarwal Industrial Corp",     exchange:"NSE", sector:"Chemicals", tv:"NSE:AGARIND" },
  { sym:"AKZOINDIA",   name:"Akzo Nobel India",            exchange:"NSE", sector:"Paints",    tv:"NSE:AKZOINDIA" },
  { sym:"ALKYLAMINE",  name:"Alkyl Amines Chemicals",      exchange:"NSE", sector:"Chemicals", tv:"NSE:ALKYLAMINE" },
  { sym:"ALLCARGO",    name:"Allcargo Logistics",          exchange:"NSE", sector:"Logistics", tv:"NSE:ALLCARGO" },
  { sym:"AMARAJABAT",  name:"Amara Raja Energy & Mobility",exchange:"NSE", sector:"Auto",      tv:"NSE:AMARAJABAT" },
  { sym:"AMBER",       name:"Amber Enterprises",           exchange:"NSE", sector:"Electronics",tv:"NSE:AMBER" },
  { sym:"AMBUJACEM",   name:"Ambuja Cements",              exchange:"NSE", sector:"Cement",    tv:"NSE:AMBUJACEM" },
  { sym:"ANGELONE",    name:"Angel One",                   exchange:"NSE", sector:"Finance",   tv:"NSE:ANGELONE" },
  { sym:"ANURAS",      name:"Anupam Rasayan India",        exchange:"NSE", sector:"Chemicals", tv:"NSE:ANURAS" },
  { sym:"APARINDS",    name:"Apar Industries",             exchange:"NSE", sector:"Cables",    tv:"NSE:APARINDS" },
  { sym:"APLLTD",      name:"Alembic Pharma",              exchange:"NSE", sector:"Pharma",    tv:"NSE:APLLTD" },
  { sym:"ARCEMMI",     name:"Archean Chemical Industries", exchange:"NSE", sector:"Chemicals", tv:"NSE:ARCHEAN" },
  { sym:"ARVINDFASN",  name:"Arvind Fashions",             exchange:"NSE", sector:"Retail",    tv:"NSE:ARVINDFASN" },
  { sym:"ASAHIINDIA",  name:"Asahi India Glass",           exchange:"NSE", sector:"Glass",     tv:"NSE:ASAHIINDIA" },
  { sym:"ASIANENE",    name:"Asian Energy Services",       exchange:"NSE", sector:"Energy",    tv:"NSE:ASIANENE" },
  { sym:"ASMTEC",      name:"ASM Technologies",            exchange:"NSE", sector:"IT",        tv:"NSE:ASMTEC" },
  { sym:"ATGL",        name:"Adani Total Gas",             exchange:"NSE", sector:"Energy",    tv:"NSE:ATGL" },
  { sym:"ATICOINDIA",  name:"Atico India",                 exchange:"NSE", sector:"Chemicals", tv:"NSE:ATICOINDIA" },
  { sym:"AUTOAXLES",   name:"Automotive Axles",            exchange:"NSE", sector:"Auto",      tv:"NSE:AUTOAXLES" },
  { sym:"AVANTIFEED",  name:"Avanti Feeds",                exchange:"NSE", sector:"Food",      tv:"NSE:AVANTIFEED" },
  { sym:"BAJAJHFL",    name:"Bajaj Housing Finance",       exchange:"NSE", sector:"Finance",   tv:"NSE:BAJAJHFL" },
  { sym:"BAJAJCON",    name:"Bajaj Consumer Care",         exchange:"NSE", sector:"FMCG",      tv:"NSE:BAJAJCON" },
  { sym:"BAJAJHIND",   name:"Bajaj Hindusthan Sugar",      exchange:"NSE", sector:"Sugar",     tv:"NSE:BAJAJHIND" },
  { sym:"BALAJITELE",  name:"Balaji Telefilms",            exchange:"NSE", sector:"Media",     tv:"NSE:BALAJITELE" },
  { sym:"BALAMINES",   name:"Balaji Amines",               exchange:"NSE", sector:"Chemicals", tv:"NSE:BALAMINES" },
  { sym:"BANARISUG",   name:"Bannari Amman Sugars",        exchange:"NSE", sector:"Sugar",     tv:"NSE:BANARISUG" },
  { sym:"BAYERCROP",   name:"Bayer CropScience",           exchange:"NSE", sector:"Agro",      tv:"NSE:BAYERCROP" },
  { sym:"BCG",         name:"Brightcom Group",             exchange:"NSE", sector:"IT",        tv:"NSE:BCG" },
  { sym:"BIRLACORPN",  name:"Birla Corporation",           exchange:"NSE", sector:"Cement",    tv:"NSE:BIRLACORPN" },
  { sym:"BLUEDART",    name:"Blue Dart Express",           exchange:"NSE", sector:"Logistics", tv:"NSE:BLUEDART" },
  { sym:"BLUESTARCO",  name:"Blue Star",                   exchange:"NSE", sector:"Consumer",  tv:"NSE:BLUESTARCO" },
  { sym:"BOROLTD",     name:"Borosil Renewables",          exchange:"NSE", sector:"Glass",     tv:"NSE:BOROLTD" },
  { sym:"BORORENEW",   name:"Borosil Renewables Energy",   exchange:"NSE", sector:"Power",     tv:"NSE:BORORENEW" },
  { sym:"CAMPUS",      name:"Campus Activewear",           exchange:"NSE", sector:"Consumer",  tv:"NSE:CAMPUS" },
  { sym:"CANFINHOME",  name:"Can Fin Homes",               exchange:"NSE", sector:"Finance",   tv:"NSE:CANFINHOME" },
  { sym:"CAPLIPOINT",  name:"Caplin Point Laboratories",   exchange:"NSE", sector:"Pharma",    tv:"NSE:CAPLIPOINT" },
  { sym:"CARBORUNIV",  name:"Carborundum Universal",       exchange:"NSE", sector:"Engineering",tv:"NSE:CARBORUNIV" },
  { sym:"CASTROLIND",  name:"Castrol India",               exchange:"NSE", sector:"Energy",    tv:"NSE:CASTROLIND" },
  { sym:"CCL",         name:"CCL Products India",          exchange:"NSE", sector:"Food",      tv:"NSE:CCL" },
  { sym:"CDSL",        name:"Central Depository Services", exchange:"NSE", sector:"Finance",   tv:"NSE:CDSL" },
  { sym:"CENTURYPLY",  name:"Century Plyboards",           exchange:"NSE", sector:"Consumer",  tv:"NSE:CENTURYPLY" },
  { sym:"CENTURYTEX",  name:"Century Textiles",            exchange:"NSE", sector:"Textile",   tv:"NSE:CENTURYTEX" },
  { sym:"CERA",        name:"Cera Sanitaryware",           exchange:"NSE", sector:"Consumer",  tv:"NSE:CERA" },
  { sym:"CHOLAFIN",    name:"Cholamandalam Investment",    exchange:"NSE", sector:"Finance",   tv:"NSE:CHOLAFIN" },
  { sym:"CIEINDIA",    name:"CIE Automotive India",        exchange:"NSE", sector:"Auto",      tv:"NSE:CIEINDIA" },
  { sym:"CLEAN",       name:"Clean Science & Technology",  exchange:"NSE", sector:"Chemicals", tv:"NSE:CLEAN" },
  { sym:"CLNINDIA",    name:"Clean India",                 exchange:"NSE", sector:"Services",  tv:"NSE:CLNINDIA" },
  { sym:"COALINDIA",   name:"Coal India",                  exchange:"NSE", sector:"Mining",    tv:"NSE:COALINDIA" },
  { sym:"COCHINSHIP",  name:"Cochin Shipyard",             exchange:"NSE", sector:"Defence",   tv:"NSE:COCHINSHIP" },
  { sym:"CONCOR",      name:"Container Corp of India",     exchange:"NSE", sector:"Logistics", tv:"NSE:CONCOR" },
  { sym:"COROMANDEL",  name:"Coromandel International",    exchange:"NSE", sector:"Agro",      tv:"NSE:COROMANDEL" },
  { sym:"CRAFTSMAN",   name:"Craftsman Automation",        exchange:"NSE", sector:"Engineering",tv:"NSE:CRAFTSMAN" },
  { sym:"CSBBANK",     name:"CSB Bank",                    exchange:"NSE", sector:"Banking",   tv:"NSE:CSBBANK" },
  { sym:"CUB",         name:"City Union Bank",             exchange:"NSE", sector:"Banking",   tv:"NSE:CUB" },
  { sym:"DCMSHRIRAM",  name:"DCM Shriram",                 exchange:"NSE", sector:"Chemicals", tv:"NSE:DCMSHRIRAM" },
  { sym:"DELHIVERY",   name:"Delhivery",                   exchange:"NSE", sector:"Logistics", tv:"NSE:DELHIVERY" },
  { sym:"DHANUKA",     name:"Dhanuka Agritech",            exchange:"NSE", sector:"Agro",      tv:"NSE:DHANUKA" },
  { sym:"DHANI",       name:"Dhani Services",              exchange:"NSE", sector:"Fintech",   tv:"NSE:DHANI" },
  { sym:"DIAMONDYD",   name:"Praxis Home Retail",          exchange:"NSE", sector:"Retail",    tv:"NSE:DIAMONDYD" },
  { sym:"DMART",       name:"Avenue Supermarts (DMart)",   exchange:"NSE", sector:"Retail",    tv:"NSE:DMART" },
  { sym:"DODLA",       name:"Dodla Dairy",                 exchange:"NSE", sector:"Food",      tv:"NSE:DODLA" },
  { sym:"EDELWEISS",   name:"Edelweiss Financial",         exchange:"NSE", sector:"Finance",   tv:"NSE:EDELWEISS" },
  { sym:"ELECTCAST",   name:"Electrosteel Castings",       exchange:"NSE", sector:"Metals",    tv:"NSE:ELECTCAST" },
  { sym:"ELECON",      name:"Elecon Engineering",          exchange:"NSE", sector:"Engineering",tv:"NSE:ELECON" },
  { sym:"ELGIEQUIP",   name:"Elgi Equipments",             exchange:"NSE", sector:"Engineering",tv:"NSE:ELGIEQUIP" },
  { sym:"EMKAY",       name:"Emkay Global Financial",      exchange:"NSE", sector:"Finance",   tv:"NSE:EMKAY" },
  { sym:"ENDURANCE",   name:"Endurance Technologies",      exchange:"NSE", sector:"Auto",      tv:"NSE:ENDURANCE" },
  { sym:"EPL",         name:"EPL Limited",                 exchange:"NSE", sector:"Plastics",  tv:"NSE:EPL" },
  { sym:"EQUITASBNK",  name:"Equitas Small Finance Bank",  exchange:"NSE", sector:"Banking",   tv:"NSE:EQUITASBNK" },
  { sym:"ERIS",        name:"Eris Lifesciences",           exchange:"NSE", sector:"Pharma",    tv:"NSE:ERIS" },
  { sym:"ESABINDIA",   name:"ESAB India",                  exchange:"NSE", sector:"Engineering",tv:"NSE:ESABINDIA" },
  { sym:"EXCEL",       name:"Excel Industries",            exchange:"NSE", sector:"Chemicals", tv:"NSE:EXCEL" },
  { sym:"FINEORG",     name:"Fine Organic Industries",     exchange:"NSE", sector:"Chemicals", tv:"NSE:FINEORG" },
  { sym:"FINPIPE",     name:"Finolex Industries",          exchange:"NSE", sector:"Pipes",     tv:"NSE:FINPIPE" },
  { sym:"FLAIR",       name:"Flair Writing",               exchange:"NSE", sector:"Consumer",  tv:"NSE:FLAIR" },
  { sym:"FLUOROCHEM",  name:"Gujarat Fluorochemicals",     exchange:"NSE", sector:"Chemicals", tv:"NSE:FLUOROCHEM" },
  { sym:"FMGOETZE",    name:"Federal-Mogul Goetze",        exchange:"NSE", sector:"Auto",      tv:"NSE:FMGOETZE" },
  { sym:"FORCEMOT",    name:"Force Motors",                exchange:"NSE", sector:"Auto",      tv:"NSE:FORCEMOT" },
  { sym:"GABRIEL",     name:"Gabriel India",               exchange:"NSE", sector:"Auto",      tv:"NSE:GABRIEL" },
  { sym:"GALAXYSURF",  name:"Galaxy Surfactants",          exchange:"NSE", sector:"Chemicals", tv:"NSE:GALAXYSURF" },
  { sym:"GARFIBRES",   name:"Garware Technical Fibres",    exchange:"NSE", sector:"Textile",   tv:"NSE:GARFIBRES" },
  { sym:"GEPIL",       name:"GE Power India",              exchange:"NSE", sector:"Engineering",tv:"NSE:GEPIL" },
  { sym:"GESHIP",      name:"Great Eastern Shipping",      exchange:"NSE", sector:"Shipping",  tv:"NSE:GESHIP" },
  { sym:"GLS",         name:"Glenmark Life Sciences",      exchange:"NSE", sector:"Pharma",    tv:"NSE:GLS" },
  { sym:"GMDCLTD",     name:"GMDC",                        exchange:"NSE", sector:"Mining",    tv:"NSE:GMDCLTD" },
  { sym:"GNFC",        name:"GNFC",                        exchange:"NSE", sector:"Chemicals", tv:"NSE:GNFC" },
  { sym:"GODREJIND",   name:"Godrej Industries",           exchange:"NSE", sector:"Diversified",tv:"NSE:GODREJIND" },
  { sym:"GPPL",        name:"Gujarat Pipavav Port",        exchange:"NSE", sector:"Logistics", tv:"NSE:GPPL" },
  { sym:"GRINDWELL",   name:"Grindwell Norton",            exchange:"NSE", sector:"Engineering",tv:"NSE:GRINDWELL" },
  { sym:"GSPL",        name:"Gujarat State Petronet",      exchange:"NSE", sector:"Energy",    tv:"NSE:GSPL" },
  { sym:"GUJGASLTD",   name:"Gujarat Gas",                 exchange:"NSE", sector:"Energy",    tv:"NSE:GUJGASLTD" },
  { sym:"GULFOILLUB",  name:"Gulf Oil Lubricants",         exchange:"NSE", sector:"Energy",    tv:"NSE:GULFOILLUB" },
  { sym:"HCG",         name:"HealthCare Global Enterprises",exchange:"NSE",sector:"Healthcare",tv:"NSE:HCG" },
  { sym:"HDFCAMC",     name:"HDFC AMC",                    exchange:"NSE", sector:"Finance",   tv:"NSE:HDFCAMC" },
  { sym:"HERITGFOOD",  name:"Heritage Foods",              exchange:"NSE", sector:"Food",      tv:"NSE:HERITGFOOD" },
  { sym:"HLEGLAS",     name:"HLE Glascoat",                exchange:"NSE", sector:"Engineering",tv:"NSE:HLEGLAS" },
  { sym:"HOMEFIRST",   name:"Home First Finance",          exchange:"NSE", sector:"Finance",   tv:"NSE:HOMEFIRST" },
  { sym:"HONAUT",      name:"Honeywell Automation India",  exchange:"NSE", sector:"Engineering",tv:"NSE:HONAUT" },
  { sym:"HPL",         name:"HPL Electric & Power",        exchange:"NSE", sector:"Electrical", tv:"NSE:HPL" },
  { sym:"IBREALEST",   name:"Indiabulls Real Estate",      exchange:"NSE", sector:"Realty",    tv:"NSE:IBREALEST" },
  { sym:"ICIL",        name:"Indo Count Industries",       exchange:"NSE", sector:"Textile",   tv:"NSE:ICIL" },
  { sym:"IFBIND",      name:"IFB Industries",              exchange:"NSE", sector:"Consumer",  tv:"NSE:IFBIND" },
  { sym:"IIFL",        name:"IIFL Finance",                exchange:"NSE", sector:"Finance",   tv:"NSE:IIFL" },
  { sym:"IIFLFIN",     name:"IIFL Securities",             exchange:"NSE", sector:"Finance",   tv:"NSE:IIFLFIN" },
  { sym:"INDIGOPNTS",  name:"Indigo Paints",               exchange:"NSE", sector:"Paints",    tv:"NSE:INDIGOPNTS" },
  { sym:"INFOBEAN",    name:"InfoBeans Technologies",      exchange:"NSE", sector:"IT",        tv:"NSE:INFOBEAN" },
  { sym:"INOXWIND",    name:"Inox Wind",                   exchange:"NSE", sector:"Power",     tv:"NSE:INOXWIND" },
  { sym:"IOB",         name:"Indian Overseas Bank",        exchange:"NSE", sector:"Banking",   tv:"NSE:IOB" },
  { sym:"IOC",         name:"Indian Oil Corporation",      exchange:"NSE", sector:"Energy",    tv:"NSE:IOC" },
  { sym:"IPCALAB",     name:"Ipca Laboratories",           exchange:"NSE", sector:"Pharma",    tv:"NSE:IPCALAB" },
  { sym:"IRB",         name:"IRB Infrastructure",          exchange:"NSE", sector:"Infra",     tv:"NSE:IRB" },
  { sym:"ISEC",        name:"ICICI Securities",            exchange:"NSE", sector:"Finance",   tv:"NSE:ISEC" },
  { sym:"ITI",         name:"ITI Limited",                 exchange:"NSE", sector:"Telecom",   tv:"NSE:ITI" },
  { sym:"J&KBANK",     name:"J&K Bank",                    exchange:"NSE", sector:"Banking",   tv:"NSE:J_KBANK" },
  { sym:"JAGRAN",      name:"Jagran Prakashan",            exchange:"NSE", sector:"Media",     tv:"NSE:JAGRAN" },
  { sym:"JAMNAAUTO",   name:"Jamna Auto Industries",       exchange:"NSE", sector:"Auto",      tv:"NSE:JAMNAAUTO" },
  { sym:"JAYNECOIND",  name:"Jayaswal Neco Industries",    exchange:"NSE", sector:"Metals",    tv:"NSE:JAYNECOIND" },
  { sym:"JBM",         name:"JBM Auto",                    exchange:"NSE", sector:"Auto",      tv:"NSE:JBMA" },
  { sym:"JCHAC",       name:"Johnson Controls-Hitachi AC", exchange:"NSE", sector:"Consumer",  tv:"NSE:JCHAC" },
  { sym:"JINDALPOLY",  name:"Jindal Poly Films",           exchange:"NSE", sector:"Plastics",  tv:"NSE:JINDALPOLY" },
  { sym:"JKLAKSHMI",   name:"JK Lakshmi Cement",          exchange:"NSE", sector:"Cement",    tv:"NSE:JKLAKSHMI" },
  { sym:"JKPAPER",     name:"JK Paper",                    exchange:"NSE", sector:"Paper",     tv:"NSE:JKPAPER" },
  { sym:"JKTYRE",      name:"JK Tyre & Industries",        exchange:"NSE", sector:"Auto",      tv:"NSE:JKTYRE" },
  { sym:"JMFINANCIL",  name:"JM Financial",                exchange:"NSE", sector:"Finance",   tv:"NSE:JMFINANCIL" },
  { sym:"JSWENERGY",   name:"JSW Energy",                  exchange:"NSE", sector:"Power",     tv:"NSE:JSWENERGY" },
  { sym:"JSWINFRA",    name:"JSW Infrastructure",          exchange:"NSE", sector:"Infra",     tv:"NSE:JSWINFRA" },
  { sym:"JTEKTINDIA",  name:"JTEKT India",                 exchange:"NSE", sector:"Auto",      tv:"NSE:JTEKTINDIA" },
  { sym:"JUBLINGREA",  name:"Jubilant Ingrevia",           exchange:"NSE", sector:"Chemicals", tv:"NSE:JUBLINGREA" },
  { sym:"KAJARIACER",  name:"Kajaria Ceramics",            exchange:"NSE", sector:"Consumer",  tv:"NSE:KAJARIACER" },
  { sym:"KALPATPOWR",  name:"Kalpataru Projects",          exchange:"NSE", sector:"Infra",     tv:"NSE:KALPATPOWR" },
  { sym:"KANSAINER",   name:"Kansai Nerolac Paints",       exchange:"NSE", sector:"Paints",    tv:"NSE:KANSAINER" },
  { sym:"KARURVYSYA",  name:"Karur Vysya Bank",            exchange:"NSE", sector:"Banking",   tv:"NSE:KARURVYSYA" },
  { sym:"KCP",         name:"KCP Limited",                 exchange:"NSE", sector:"Cement",    tv:"NSE:KCP" },
  { sym:"KEI",         name:"KEI Industries",              exchange:"NSE", sector:"Cables",    tv:"NSE:KEI" },
  { sym:"KENNAMET",    name:"Kennametal India",            exchange:"NSE", sector:"Engineering",tv:"NSE:KENNAMET" },
  { sym:"KIRLOSBROS",  name:"Kirloskar Brothers",          exchange:"NSE", sector:"Engineering",tv:"NSE:KIRLOSBROS" },
  { sym:"KIRLPNU",     name:"Kirloskar Pneumatic",         exchange:"NSE", sector:"Engineering",tv:"NSE:KIRLPNU" },
  { sym:"KITEX",       name:"Kitex Garments",              exchange:"NSE", sector:"Textile",   tv:"NSE:KITEX" },
  { sym:"KNRCON",      name:"KNR Constructions",           exchange:"NSE", sector:"Infra",     tv:"NSE:KNRCON" },
  { sym:"KRBL",        name:"KRBL Limited",                exchange:"NSE", sector:"Food",      tv:"NSE:KRBL" },
  { sym:"KSCL",        name:"Kaveri Seed Company",         exchange:"NSE", sector:"Agro",      tv:"NSE:KSCL" },
  { sym:"KTKBANK",     name:"Karnataka Bank",              exchange:"NSE", sector:"Banking",   tv:"NSE:KTKBANK" },
  { sym:"LAOPALA",     name:"La Opala RG",                 exchange:"NSE", sector:"Consumer",  tv:"NSE:LAOPALA" },
  { sym:"LATENTVIEW",  name:"Latent View Analytics",       exchange:"NSE", sector:"IT",        tv:"NSE:LATENTVIEW" },
  { sym:"LEMONTREE",   name:"Lemon Tree Hotels",           exchange:"NSE", sector:"Hotels",    tv:"NSE:LEMONTREE" },
  { sym:"LINDEINDIA",  name:"Linde India",                 exchange:"NSE", sector:"Chemicals", tv:"NSE:LINDEINDIA" },
  { sym:"LSIL",        name:"Lloyds Steels Industries",    exchange:"NSE", sector:"Metals",    tv:"NSE:LSIL" },
  { sym:"LUXIND",      name:"Lux Industries",              exchange:"NSE", sector:"Textile",   tv:"NSE:LUXIND" },
  { sym:"MAHINDCIE",   name:"Mahindra CIE Automotive",     exchange:"NSE", sector:"Auto",      tv:"NSE:MAHINDCIE" },
  { sym:"MAHLIFE",     name:"Mahindra Lifespace",          exchange:"NSE", sector:"Realty",    tv:"NSE:MAHLIFE" },
  { sym:"MANAPPURAM",  name:"Manappuram Finance",          exchange:"NSE", sector:"Finance",   tv:"NSE:MANAPPURAM" },
  { sym:"MASFIN",      name:"MAS Financial Services",      exchange:"NSE", sector:"Finance",   tv:"NSE:MASFIN" },
  { sym:"MAXHEALTH",   name:"Max Healthcare Institute",    exchange:"NSE", sector:"Healthcare",tv:"NSE:MAXHEALTH" },
  { sym:"MCX",         name:"Multi Commodity Exchange",    exchange:"NSE", sector:"Finance",   tv:"NSE:MCX" },
  { sym:"MEDANTA",     name:"Global Health (Medanta)",     exchange:"NSE", sector:"Healthcare",tv:"NSE:MEDANTA" },
  { sym:"MEDPLUS",     name:"MedPlus Health Services",     exchange:"NSE", sector:"Healthcare",tv:"NSE:MEDPLUS" },
  { sym:"METROBRAND",  name:"Metro Brands",                exchange:"NSE", sector:"Retail",    tv:"NSE:METROBRAND" },
  { sym:"MFSL",        name:"Max Financial Services",      exchange:"NSE", sector:"Insurance", tv:"NSE:MFSL" },
  { sym:"MHRIL",       name:"Mahindra Holidays & Resorts", exchange:"NSE", sector:"Hotels",    tv:"NSE:MHRIL" },
  { sym:"MIDHANI",     name:"Mishra Dhatu Nigam",          exchange:"NSE", sector:"Defence",   tv:"NSE:MIDHANI" },
  { sym:"MINDACORP",   name:"Minda Corporation",           exchange:"NSE", sector:"Auto",      tv:"NSE:MINDACORP" },
  { sym:"MINDAIND",    name:"UNO Minda",                   exchange:"NSE", sector:"Auto",      tv:"NSE:MINDAIND" },
  { sym:"MOHNSCIN",    name:"Mohans Energy",               exchange:"NSE", sector:"Energy",    tv:"NSE:MOHNSCIN" },
  { sym:"MOTILALOFS",  name:"Motilal Oswal Financial",     exchange:"NSE", sector:"Finance",   tv:"NSE:MOTILALOFS" },
  { sym:"MPHASIS",     name:"Mphasis",                     exchange:"NSE", sector:"IT",        tv:"NSE:MPHASIS" },
  { sym:"MRF",         name:"MRF Limited",                 exchange:"NSE", sector:"Auto",      tv:"NSE:MRF" },
  { sym:"MRPL",        name:"Mangalore Refinery",          exchange:"NSE", sector:"Energy",    tv:"NSE:MRPL" },
  { sym:"NATCOPHARM",  name:"Natco Pharma",                exchange:"NSE", sector:"Pharma",    tv:"NSE:NATCOPHARM" },
  { sym:"NAVA",        name:"NAVA Limited",                exchange:"NSE", sector:"Power",     tv:"NSE:NAVA" },
  { sym:"NAVINFLUOR",  name:"Navin Fluorine International",exchange:"NSE", sector:"Chemicals", tv:"NSE:NAVINFLUOR" },
  { sym:"NBCC",        name:"NBCC India",                  exchange:"NSE", sector:"Infra",     tv:"NSE:NBCC" },
  { sym:"NCC",         name:"NCC Limited",                 exchange:"NSE", sector:"Infra",     tv:"NSE:NCC" },
  { sym:"NDTV",        name:"NDTV",                        exchange:"NSE", sector:"Media",     tv:"NSE:NDTV" },
  { sym:"NESCO",       name:"NESCO Limited",               exchange:"NSE", sector:"Infra",     tv:"NSE:NESCO" },
  { sym:"NETWORK18",   name:"Network18 Media",             exchange:"NSE", sector:"Media",     tv:"NSE:NETWORK18" },
  { sym:"NEWGEN",      name:"Newgen Software",             exchange:"NSE", sector:"IT",        tv:"NSE:NEWGEN" },
  { sym:"NFL",         name:"National Fertilizers",        exchange:"NSE", sector:"Chemicals", tv:"NSE:NFL" },
  { sym:"NHPC",        name:"NHPC",                        exchange:"NSE", sector:"Power",     tv:"NSE:NHPC" },
  { sym:"NIACL",       name:"New India Assurance",         exchange:"NSE", sector:"Insurance", tv:"NSE:NIACL" },
  { sym:"NILKAMAL",    name:"Nilkamal",                    exchange:"NSE", sector:"Plastics",  tv:"NSE:NILKAMAL" },
  { sym:"NRBBEARING",  name:"NRB Bearing",                 exchange:"NSE", sector:"Auto",      tv:"NSE:NRBBEARING" },
  { sym:"NSLNISP",     name:"NMDC Steel",                  exchange:"NSE", sector:"Metals",    tv:"NSE:NSLNISP" },
  { sym:"NUCLEUS",     name:"Nucleus Software Exports",    exchange:"NSE", sector:"IT",        tv:"NSE:NUCLEUS" },
  { sym:"OLECTRA",     name:"Olectra Greentech",           exchange:"NSE", sector:"EV",        tv:"NSE:OLECTRA" },
  { sym:"ORCHPHARMA",  name:"Orchid Pharma",               exchange:"NSE", sector:"Pharma",    tv:"NSE:ORCHPHARMA" },
  { sym:"PATELENG",    name:"Patel Engineering",           exchange:"NSE", sector:"Infra",     tv:"NSE:PATELENG" },
  { sym:"PCBL",        name:"PCBL Limited",                exchange:"NSE", sector:"Chemicals", tv:"NSE:PCBL" },
  { sym:"PDSL",        name:"PDS Limited",                 exchange:"NSE", sector:"Retail",    tv:"NSE:PDSL" },
  { sym:"PGHH",        name:"P&G Hygiene & Health Care",   exchange:"NSE", sector:"FMCG",      tv:"NSE:PGHH" },
  { sym:"PNBHOUSING",  name:"PNB Housing Finance",         exchange:"NSE", sector:"Finance",   tv:"NSE:PNBHOUSING" },
  { sym:"POLICYBZR",   name:"PB Fintech (PolicyBazaar)",   exchange:"NSE", sector:"Fintech",   tv:"NSE:POLICYBZR" },
  { sym:"POLYMED",     name:"Poly Medicure",               exchange:"NSE", sector:"Healthcare",tv:"NSE:POLYMED" },
  { sym:"POONAWALLA",  name:"Poonawalla Fincorp",          exchange:"NSE", sector:"Finance",   tv:"NSE:POONAWALLA" },
  { sym:"POWERMECH",   name:"Power Mech Projects",         exchange:"NSE", sector:"Infra",     tv:"NSE:POWERMECH" },
  { sym:"PRINCEPIPE",  name:"Prince Pipes & Fittings",     exchange:"NSE", sector:"Pipes",     tv:"NSE:PRINCEPIPE" },
  { sym:"PRIOCOLORS",  name:"Privi Organics India",        exchange:"NSE", sector:"Chemicals", tv:"NSE:PRIOCOLORS" },
  { sym:"PRSMJOHNSN",  name:"Prism Johnson",               exchange:"NSE", sector:"Cement",    tv:"NSE:PRSMJOHNSN" },
  { sym:"PSB",         name:"Punjab & Sind Bank",          exchange:"NSE", sector:"Banking",   tv:"NSE:PSB" },
  { sym:"PVRINOX",     name:"PVR INOX",                    exchange:"NSE", sector:"Media",     tv:"NSE:PVRINOX" },
  { sym:"RAILTEL",     name:"RailTel Corporation",         exchange:"NSE", sector:"Telecom",   tv:"NSE:RAILTEL" },
  { sym:"RAIN",        name:"Rain Industries",             exchange:"NSE", sector:"Chemicals", tv:"NSE:RAIN" },
  { sym:"RAJESHEXPO",  name:"Rajesh Exports",              exchange:"NSE", sector:"Consumer",  tv:"NSE:RAJESHEXPO" },
  { sym:"RAMCOIND",    name:"Ramco Industries",            exchange:"NSE", sector:"Cement",    tv:"NSE:RAMCOIND" },
  { sym:"RITES",       name:"RITES Limited",               exchange:"NSE", sector:"Infra",     tv:"NSE:RITES" },
  { sym:"ROLEXRINGS",  name:"Rolex Rings",                 exchange:"NSE", sector:"Auto",      tv:"NSE:ROLEXRINGS" },
  { sym:"ROSSTECH",    name:"Ross Industries",             exchange:"NSE", sector:"Engineering",tv:"NSE:ROSSTECH" },
  { sym:"ROUTE",       name:"Route Mobile",                exchange:"NSE", sector:"IT",        tv:"NSE:ROUTE" },
  { sym:"RPSGVENT",    name:"RPSG Ventures",               exchange:"NSE", sector:"Diversified",tv:"NSE:RPSGVENT" },
  { sym:"RPOWER",      name:"Reliance Power",              exchange:"NSE", sector:"Power",     tv:"NSE:RPOWER" },
  { sym:"RTNPOWER",    name:"Rattanindia Power",           exchange:"NSE", sector:"Power",     tv:"NSE:RTNPOWER" },
  { sym:"SAFARI",      name:"Safari Industries",           exchange:"NSE", sector:"Consumer",  tv:"NSE:SAFARI" },
  { sym:"SANDESH",     name:"Sandesh Limited",             exchange:"NSE", sector:"Media",     tv:"NSE:SANDESH" },
  { sym:"SAPPHIRE",    name:"Sapphire Foods India",        exchange:"NSE", sector:"Food",      tv:"NSE:SAPPHIRE" },
  { sym:"SAREGAMA",    name:"Saregama India",              exchange:"NSE", sector:"Media",     tv:"NSE:SAREGAMA" },
  { sym:"SBCL",        name:"SBC Exports",                 exchange:"NSE", sector:"Textile",   tv:"NSE:SBCL" },
  { sym:"SEQUENT",     name:"SeQuent Scientific",          exchange:"NSE", sector:"Pharma",    tv:"NSE:SEQUENT" },
  { sym:"SHILPAMED",   name:"Shilpa Medicare",             exchange:"NSE", sector:"Pharma",    tv:"NSE:SHILPAMED" },
  { sym:"SHOPERSTOP",  name:"Shoppers Stop",               exchange:"NSE", sector:"Retail",    tv:"NSE:SHOPERSTOP" },
  { sym:"SIGNATUREG",  name:"Signature Global",            exchange:"NSE", sector:"Realty",    tv:"NSE:SIGNATUREG" },
  { sym:"SJVN",        name:"SJVN Limited",                exchange:"NSE", sector:"Power",     tv:"NSE:SJVN" },
  { sym:"SKIPPER",     name:"Skipper Limited",             exchange:"NSE", sector:"Infra",     tv:"NSE:SKIPPER" },
  { sym:"SMLISUZU",    name:"SML Isuzu",                   exchange:"NSE", sector:"Auto",      tv:"NSE:SMLISUZU" },
  { sym:"SOBHA",       name:"Sobha Limited",               exchange:"NSE", sector:"Realty",    tv:"NSE:SOBHA" },
  { sym:"SOLARA",      name:"Solara Active Pharma",        exchange:"NSE", sector:"Pharma",    tv:"NSE:SOLARA" },
  { sym:"SONACOMS",    name:"Sona BLW Precision",          exchange:"NSE", sector:"Auto",      tv:"NSE:SONACOMS" },
  { sym:"SOUTHBANK",   name:"South Indian Bank",           exchange:"NSE", sector:"Banking",   tv:"NSE:SOUTHBANK" },
  { sym:"SPANDANA",    name:"Spandana Sphoorty",           exchange:"NSE", sector:"Finance",   tv:"NSE:SPANDANA" },
  { sym:"SPARC",       name:"Sun Pharma Advanced",         exchange:"NSE", sector:"Pharma",    tv:"NSE:SPARC" },
  { sym:"SPENCERS",    name:"Spencer's Retail",            exchange:"NSE", sector:"Retail",    tv:"NSE:SPENCERS" },
  { sym:"SRTRANSFIN",  name:"Shriram Transport Finance",   exchange:"NSE", sector:"Finance",   tv:"NSE:SRTRANSFIN" },
  { sym:"STARTECK",    name:"Star Cement",                 exchange:"NSE", sector:"Cement",    tv:"NSE:STARTECK" },
  { sym:"STLTECH",     name:"Sterlite Technologies",       exchange:"NSE", sector:"Telecom",   tv:"NSE:STLTECH" },
  { sym:"SUBROS",      name:"Subros",                      exchange:"NSE", sector:"Auto",      tv:"NSE:SUBROS" },
  { sym:"SUNDARMFIN",  name:"Sundaram Finance",            exchange:"NSE", sector:"Finance",   tv:"NSE:SUNDARMFIN" },
  { sym:"SUNFLAG",     name:"Sunflag Iron & Steel",        exchange:"NSE", sector:"Metals",    tv:"NSE:SUNFLAG" },
  { sym:"SUNTECK",     name:"Sunteck Realty",              exchange:"NSE", sector:"Realty",    tv:"NSE:SUNTECK" },
  { sym:"SUPRAJIT",    name:"Suprajit Engineering",        exchange:"NSE", sector:"Auto",      tv:"NSE:SUPRAJIT" },
  { sym:"SUPRIYA",     name:"Supriya Lifescience",         exchange:"NSE", sector:"Pharma",    tv:"NSE:SUPRIYA" },
  { sym:"SUZLON",      name:"Suzlon Energy",               exchange:"NSE", sector:"Power",     tv:"NSE:SUZLON" },
  { sym:"SWANENERGY",  name:"Swan Energy",                 exchange:"NSE", sector:"Energy",    tv:"NSE:SWANENERGY" },
  { sym:"SYMPHONY",    name:"Symphony Limited",            exchange:"NSE", sector:"Consumer",  tv:"NSE:SYMPHONY" },
  { sym:"TANLA",       name:"Tanla Platforms",             exchange:"NSE", sector:"IT",        tv:"NSE:TANLA" },
  { sym:"TATATECH",    name:"Tata Technologies",           exchange:"NSE", sector:"IT",        tv:"NSE:TATATECH" },
  { sym:"TATVA",       name:"Tatva Chintan Pharma",        exchange:"NSE", sector:"Chemicals", tv:"NSE:TATVA" },
  { sym:"TEXRAIL",     name:"Texmaco Rail & Engineering",  exchange:"NSE", sector:"Engineering",tv:"NSE:TEXRAIL" },
  { sym:"TIPSINDLTD",  name:"Tips Industries",             exchange:"NSE", sector:"Media",     tv:"NSE:TIPSINDLTD" },
  { sym:"TIRUMALCHM",  name:"Thirumalai Chemicals",        exchange:"NSE", sector:"Chemicals", tv:"NSE:TIRUMALCHM" },
  { sym:"TITANBI",     name:"Titan Biotech",               exchange:"NSE", sector:"Healthcare",tv:"NSE:TITANBI" },
  { sym:"TMVL",        name:"Tata Motors DVR",             exchange:"NSE", sector:"Auto",      tv:"NSE:TMVL" },
  { sym:"TPWR",        name:"Tata Power Renewable",        exchange:"NSE", sector:"Power",     tv:"NSE:TPWR" },
  { sym:"TRIL",        name:"Transformers & Rectifiers",   exchange:"NSE", sector:"Engineering",tv:"NSE:TRIL" },
  { sym:"TRITURBINE",  name:"Triveni Turbine",             exchange:"NSE", sector:"Engineering",tv:"NSE:TRITURBINE" },
  { sym:"TVSHLTD",     name:"TVS Holdings",                exchange:"NSE", sector:"Auto",      tv:"NSE:TVSHLTD" },
  { sym:"UCOBANK",     name:"UCO Bank",                    exchange:"NSE", sector:"Banking",   tv:"NSE:UCOBANK" },
  { sym:"UGROCAP",     name:"Ugro Capital",                exchange:"NSE", sector:"Finance",   tv:"NSE:UGROCAP" },
  { sym:"UJJIVANSFB",  name:"Ujjivan Small Finance Bank",  exchange:"NSE", sector:"Banking",   tv:"NSE:UJJIVANSFB" },
  { sym:"ULTRACEMCO",  name:"UltraTech Cement",            exchange:"NSE", sector:"Cement",    tv:"NSE:ULTRACEMCO" },
  { sym:"UNICHEMLAB",  name:"Unichem Laboratories",        exchange:"NSE", sector:"Pharma",    tv:"NSE:UNICHEMLAB" },
  { sym:"UNOMINDA",    name:"UNO Minda",                   exchange:"NSE", sector:"Auto",      tv:"NSE:UNOMINDA" },
  { sym:"UTIAMC",      name:"UTI AMC",                     exchange:"NSE", sector:"Finance",   tv:"NSE:UTIAMC" },
  { sym:"V2RETAIL",    name:"V2 Retail",                   exchange:"NSE", sector:"Retail",    tv:"NSE:V2RETAIL" },
  { sym:"VAIBHAVGBL",  name:"Vaibhav Global",              exchange:"NSE", sector:"Retail",    tv:"NSE:VAIBHAVGBL" },
  { sym:"VAKRANGEE",   name:"Vakrangee Limited",           exchange:"NSE", sector:"IT",        tv:"NSE:VAKRANGEE" },
  { sym:"VARDHACRLC",  name:"Vardhman Acrylic",            exchange:"NSE", sector:"Textile",   tv:"NSE:VARDHACRLC" },
  { sym:"VDLSEC",      name:"VDL Securities",              exchange:"NSE", sector:"Finance",   tv:"NSE:VDLSEC" },
  { sym:"VENKEYS",     name:"Venky's India",               exchange:"NSE", sector:"Food",      tv:"NSE:VENKEYS" },
  { sym:"VESUVIUS",    name:"Vesuvius India",              exchange:"NSE", sector:"Engineering",tv:"NSE:VESUVIUS" },
  { sym:"VHL",         name:"Vardhman Holdings",           exchange:"NSE", sector:"Textile",   tv:"NSE:VHL" },
  { sym:"VINATIORGA",  name:"Vinati Organics",             exchange:"NSE", sector:"Chemicals", tv:"NSE:VINATIORGA" },
  { sym:"VIP",         name:"VIP Industries",              exchange:"NSE", sector:"Consumer",  tv:"NSE:VIP" },
  { sym:"VIPCLOTHNG",  name:"VIP Clothing",                exchange:"NSE", sector:"Textile",   tv:"NSE:VIPCLOTHNG" },
  { sym:"VSTML",       name:"V.S.T Tillers Tractors",      exchange:"NSE", sector:"Auto",      tv:"NSE:VSTML" },
  { sym:"VSTIND",      name:"VST Industries",              exchange:"NSE", sector:"FMCG",      tv:"NSE:VSTIND" },
  { sym:"WABCOINDIA",  name:"Wabco India",                 exchange:"NSE", sector:"Auto",      tv:"NSE:WABCOINDIA" },
  { sym:"WATERBASE",   name:"Waterbase",                   exchange:"NSE", sector:"Agro",      tv:"NSE:WATERBASE" },
  { sym:"WEIZMANN",    name:"Weizmann Forex",              exchange:"NSE", sector:"Finance",   tv:"NSE:WEIZMANN" },
  { sym:"WELCORP",     name:"Welspun Corp",                exchange:"NSE", sector:"Metals",    tv:"NSE:WELCORP" },
  { sym:"WELSPUNLIV",  name:"Welspun Living",              exchange:"NSE", sector:"Textile",   tv:"NSE:WELSPUNLIV" },
  { sym:"WINDLAS",     name:"Windlas Biotech",             exchange:"NSE", sector:"Pharma",    tv:"NSE:WINDLAS" },
  { sym:"WONDERLA",    name:"Wonderla Holidays",           exchange:"NSE", sector:"Hotels",    tv:"NSE:WONDERLA" },
  { sym:"WSL",         name:"Wealth Securities",           exchange:"NSE", sector:"Finance",   tv:"NSE:WSL" },
  { sym:"XCHANGING",   name:"Xchanging Solutions",         exchange:"NSE", sector:"IT",        tv:"NSE:XCHANGING" },
  { sym:"YESBANK",     name:"Yes Bank",                    exchange:"NSE", sector:"Banking",   tv:"NSE:YESBANK" },
  { sym:"ZENSARTECH",  name:"Zensar Technologies",         exchange:"NSE", sector:"IT",        tv:"NSE:ZENSARTECH" },
  { sym:"ZENTEC",      name:"Zen Technologies",            exchange:"NSE", sector:"Defence",   tv:"NSE:ZENTEC" },
  // ── ETFs ──────────────────────────────────────────────────────
  { sym:"NIFTYBEES",   name:"Nippon India ETF Nifty BeES", exchange:"NSE", sector:"ETF",       tv:"NSE:NIFTYBEES" },
  { sym:"BANKBEES",    name:"Nippon India ETF BankBees",   exchange:"NSE", sector:"ETF",       tv:"NSE:BANKBEES" },
  { sym:"GOLDBEES",    name:"Nippon India ETF Gold BeES",  exchange:"NSE", sector:"ETF",       tv:"NSE:GOLDBEES" },
  { sym:"JUNIORBEES",  name:"Nippon India ETF Junior BeES",exchange:"NSE", sector:"ETF",       tv:"NSE:JUNIORBEES" },
  { sym:"SETFNIF50",   name:"SBI ETF Nifty 50",            exchange:"NSE", sector:"ETF",       tv:"NSE:SETFNIF50" },
  { sym:"ICICIB22",    name:"ICICI Pru Bharat 22 ETF",     exchange:"NSE", sector:"ETF",       tv:"NSE:ICICIB22" },
  // ── F&O POPULAR ─────────────────────────────────────────────
  { sym:"NIFTY25APRFUT",name:"Nifty Apr Futures",          exchange:"NSE", sector:"F&O",       tv:"NSE:NIFTY1!" },
  { sym:"BANKNIFTY FUT",name:"BankNifty Futures",          exchange:"NSE", sector:"F&O",       tv:"NSE:BANKNIFTY1!" },
  // NOTE: TradingView supports ALL 5000+ BSE & 3000+ NSE stocks natively.
  // Use the Direct Symbol Entry feature in the Chart tab to load any unlisted stock.
];

// Deduplicate by tv key
const STOCK_DB_DEDUPED = (() => {
  const seen = new Set();
  return STOCK_DB.filter(s => { if(seen.has(s.tv)) return false; seen.add(s.tv); return true; });
})();

const SECTORS = [...new Set(STOCK_DB_DEDUPED.map(s => s.sector))].sort();

/* ═══════════════════════════════════════════════════════════════
   SAMPLE TRADES (30 trades — NSE/BSE)
═══════════════════════════════════════════════════════════════ */
const SAMPLE_TRADES = [
  { id:1,  date:"2025-01-06", symbol:"NIFTY",      type:"Long",  entry:23100, exit:23350, qty:50,  fees:280, notes:"Breakout from weekly consolidation. Clean entry at ORB.", tags:["Breakout","Trend","ORB"], result:"Win", screenshot:"" },
  { id:2,  date:"2025-01-07", symbol:"BANKNIFTY",  type:"Short", entry:49200, exit:48800, qty:25,  fees:200, notes:"Resistance rejection at PDH. Momentum short.", tags:["Reversal","PDH"], result:"Win", screenshot:"" },
  { id:3,  date:"2025-01-08", symbol:"RELIANCE",   type:"Long",  entry:1310,  exit:1292,  qty:200, fees:130, notes:"Failed breakout. Stopped below structure.", tags:["Breakout","Failed"], result:"Loss", screenshot:"" },
  { id:4,  date:"2025-01-09", symbol:"INFY",       type:"Long",  entry:1785,  exit:1810,  qty:150, fees:200, notes:"Earnings play. Quick scalp, took profits fast.", tags:["News","Scalp"], result:"Win", screenshot:"" },
  { id:5,  date:"2025-01-13", symbol:"NIFTY",      type:"Short", entry:23450, exit:23490, qty:50,  fees:250, notes:"False breakdown signal. Market reversed instantly.", tags:["Reversal","Failed"], result:"Loss", screenshot:"" },
  { id:6,  date:"2025-01-14", symbol:"TCS",        type:"Long",  entry:3920,  exit:3975,  qty:100, fees:160, notes:"Support bounce at EMA20. R:R was 1:3.", tags:["Support","Trend"], result:"Win", screenshot:"" },
  { id:7,  date:"2025-01-15", symbol:"HDFCBANK",   type:"Long",  entry:1620,  exit:1620,  qty:200, fees:100, notes:"Trailed stop too tight. Breakeven.", tags:["Breakout"], result:"BE", screenshot:"" },
  { id:8,  date:"2025-01-16", symbol:"BANKNIFTY",  type:"Long",  entry:47800, exit:48150, qty:25,  fees:180, notes:"Trend continuation. Held overnight.", tags:["Trend","Swing"], result:"Win", screenshot:"" },
  { id:9,  date:"2025-01-20", symbol:"NIFTY",      type:"Long",  entry:23200, exit:23420, qty:75,  fees:310, notes:"Budget day play. Strong momentum.", tags:["News","Momentum"], result:"Win", screenshot:"" },
  { id:10, date:"2025-01-21", symbol:"SBIN",       type:"Long",  entry:740,   exit:722,   qty:300, fees:120, notes:"Wrong read on support. Sector was weak.", tags:["Support","Failed"], result:"Loss", screenshot:"" },
  { id:11, date:"2025-01-22", symbol:"WIPRO",      type:"Short", entry:580,   exit:562,   qty:250, fees:95,  notes:"Post earnings decline. Held 2 days.", tags:["News","Swing"], result:"Win", screenshot:"" },
  { id:12, date:"2025-01-27", symbol:"NIFTY",      type:"Short", entry:23650, exit:23400, qty:50,  fees:260, notes:"Global selloff. Shorted breakdown of 9EMA.", tags:["Trend","Breakdown"], result:"Win", screenshot:"" },
  { id:13, date:"2025-01-28", symbol:"BANKNIFTY",  type:"Long",  entry:48500, exit:48350, qty:25,  fees:190, notes:"Premature entry. Stopped out before move.", tags:["Reversal"], result:"Loss", screenshot:"" },
  { id:14, date:"2025-02-03", symbol:"NIFTY",      type:"Long",  entry:23150, exit:23150, qty:50,  fees:255, notes:"Sideways day. Got in and out at same level.", tags:["Scalp"], result:"BE", screenshot:"" },
  { id:15, date:"2025-02-04", symbol:"AXISBANK",   type:"Long",  entry:1060,  exit:1095,  qty:200, fees:145, notes:"Strong breakout above 3-month resistance.", tags:["Breakout","Momentum"], result:"Win", screenshot:"" },
  { id:16, date:"2025-02-05", symbol:"LTIM",       type:"Short", entry:5600,  exit:5450,  qty:50,  fees:170, notes:"IT sector weakness. Sector trend short.", tags:["Trend","Sector"], result:"Win", screenshot:"" },
  { id:17, date:"2025-02-10", symbol:"NIFTY",      type:"Long",  entry:23300, exit:23580, qty:75,  fees:300, notes:"Weekly options play. Explosive move Friday.", tags:["Options","Momentum"], result:"Win", screenshot:"" },
  { id:18, date:"2025-02-11", symbol:"RELIANCE",   type:"Long",  entry:1280,  exit:1260,  qty:200, fees:135, notes:"Fakeout above resistance. Lost quickly.", tags:["Breakout","Failed"], result:"Loss", screenshot:"" },
  { id:19, date:"2025-02-17", symbol:"BANKNIFTY",  type:"Short", entry:50100, exit:49700, qty:25,  fees:210, notes:"Topping pattern. Clean short from high.", tags:["Reversal","PDH"], result:"Win", screenshot:"" },
  { id:20, date:"2025-02-18", symbol:"NIFTY",      type:"Long",  entry:23400, exit:23480, qty:50,  fees:250, notes:"Small scalp. Risk managed well.", tags:["Scalp","ORB"], result:"Win", screenshot:"" },
  { id:21, date:"2025-02-24", symbol:"HDFCBANK",   type:"Long",  entry:1720,  exit:1695,  qty:150, fees:140, notes:"FII selling pressure. Held against the flow.", tags:["Failed","Reversal"], result:"Loss", screenshot:"" },
  { id:22, date:"2025-03-03", symbol:"NIFTY",      type:"Short", entry:22900, exit:22640, qty:50,  fees:265, notes:"Breakdown of Feb lows. Held full day.", tags:["Breakdown","Trend"], result:"Win", screenshot:"" },
  { id:23, date:"2025-03-04", symbol:"ONGC",       type:"Long",  entry:295,   exit:308,   qty:500, fees:85,  notes:"Energy sector rally. Good R:R.", tags:["Sector","Momentum"], result:"Win", screenshot:"" },
  { id:24, date:"2025-03-05", symbol:"BANKNIFTY",  type:"Long",  entry:48100, exit:47950, qty:25,  fees:185, notes:"Bad entry timing. Should have waited.", tags:["Failed","Timing"], result:"Loss", screenshot:"" },
  { id:25, date:"2025-03-10", symbol:"NIFTY",      type:"Long",  entry:22750, exit:22750, qty:75,  fees:285, notes:"Choppy day. No trend.", tags:["Scalp"], result:"BE", screenshot:"" },
  { id:26, date:"2025-03-11", symbol:"TCS",        type:"Long",  entry:3840,  exit:3910,  qty:100, fees:165, notes:"Buy the dip setup. Clean hold.", tags:["Support","Swing"], result:"Win", screenshot:"" },
  { id:27, date:"2025-03-17", symbol:"NIFTY",      type:"Short", entry:22600, exit:22350, qty:100, fees:320, notes:"Monthly expiry. Big move short.", tags:["Expiry","Momentum"], result:"Win", screenshot:"" },
  { id:28, date:"2025-03-18", symbol:"BAJFINANCE", type:"Long",  entry:8100,  exit:8050,  qty:50,  fees:175, notes:"NBFC sector lagged. Bad sector read.", tags:["Sector","Failed"], result:"Loss", screenshot:"" },
  { id:29, date:"2025-03-24", symbol:"NIFTY",      type:"Long",  entry:22850, exit:23100, qty:75,  fees:295, notes:"Pre-quarterly results rally.", tags:["Momentum","Swing"], result:"Win", screenshot:"" },
  { id:30, date:"2025-03-25", symbol:"BANKNIFTY",  type:"Long",  entry:48900, exit:49250, qty:25,  fees:200, notes:"Sector rotation into BFSI. Good hold.", tags:["Sector","Trend"], result:"Win", screenshot:"" },
];

const hydratePnl = (t) => {
  const rawPnl = t.type === "Long" ? (t.exit - t.entry) * t.qty : (t.entry - t.exit) * t.qty;
  return { ...t, pnl: rawPnl };
};
const SAMPLE = SAMPLE_TRADES.map(hydratePnl);

/* ═══════════════════════════════════════════════════════════════
   UTILS
═══════════════════════════════════════════════════════════════ */
const fmt  = (n) => n >= 0 ? `+₹${Math.abs(n).toLocaleString("en-IN")}` : `-₹${Math.abs(n).toLocaleString("en-IN")}`;
const fmtS = (n) => `₹${Math.abs(n).toLocaleString("en-IN")}`;
const pct  = (n) => `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;
const uid  = () => Date.now() + Math.random();
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAYS   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

const TAG_COLORS = {
  Breakout:"#7c6af7", Trend:"#0ECC6D", Reversal:"#e884a0", Support:"#4da8da",
  News:"#D4A843", Momentum:"#f97316", Swing:"#a78bfa", Scalp:"#34d399",
  ORB:"#60a5fa", PDH:"#fb923c", Failed:"#F04060", Sector:"#8b5cf6",
  Options:"#ec4899", Breakdown:"#ef4444", Timing:"#f59e0b",
  Expiry:"#14b8a6", Long:"#4da8da", Short:"#F04060", Win:"#0ECC6D",
  Loss:"#F04060", BE:"#D4A843",
};

/* ═══════════════════════════════════════════════════════════════
   STOCK SEARCH AUTOCOMPLETE COMPONENT
═══════════════════════════════════════════════════════════════ */
function StockSearch({ value, onChange, onSelect, placeholder = "Search NSE/BSE stocks...", style = {} }) {
  const [query, setQuery] = useState(value || "");
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [exFilter, setExFilter] = useState("ALL");
  const inputRef = useRef(null);
  const dropRef = useRef(null);

  const results = useMemo(() => {
    if (!query || query.length < 1) return [];
    const q = query.toLowerCase();
    return STOCK_DB_DEDUPED
      .filter(s => {
        if (exFilter !== "ALL" && s.exchange !== exFilter) return false;
        return s.sym.toLowerCase().includes(q) || s.name.toLowerCase().includes(q) || s.sector.toLowerCase().includes(q);
      })
      .slice(0, 10);
  }, [query, exFilter]);

  useEffect(() => {
    const handler = (e) => {
      if (!dropRef.current?.contains(e.target) && !inputRef.current?.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleKey = (e) => {
    if (!open) { if (e.key === "ArrowDown") { setOpen(true); return; } }
    if (e.key === "ArrowDown") setActiveIdx(i => Math.min(i + 1, results.length - 1));
    else if (e.key === "ArrowUp") setActiveIdx(i => Math.max(i - 1, 0));
    else if (e.key === "Enter" && results[activeIdx]) { pick(results[activeIdx]); }
    else if (e.key === "Escape") setOpen(false);
  };

  const pick = (stock) => {
    setQuery(stock.sym);
    setOpen(false);
    onChange && onChange(stock.sym);
    onSelect && onSelect(stock);
  };

  const SECTOR_COLORS = {
    Index:"#00D4FF", Banking:"#4DA8DA", IT:"#8B5CF6", Energy:"#F97316",
    Pharma:"#0ECC6D", Auto:"#D4A843", FMCG:"#F04060", Finance:"#34d399",
    Power:"#60a5fa", Metals:"#fb923c", Telecom:"#a78bfa", Chemicals:"#ec4899",
    Realty:"#14b8a6", Healthcare:"#f59e0b", Default:"#8a8898"
  };
  const sc = (sector) => SECTOR_COLORS[sector] || SECTOR_COLORS.Default;

  return (
    <div style={{ position: "relative", ...style }}>
      {/* Exchange filter pills */}
      <div style={{ display: "flex", gap: 5, marginBottom: 6 }}>
        {["ALL", "NSE", "BSE"].map(ex => (
          <button key={ex} onClick={() => setExFilter(ex)} style={{
            padding: "3px 10px", borderRadius: 6, border: "none", cursor: "pointer",
            fontFamily: "var(--mono)", fontSize: 10, fontWeight: 700, letterSpacing: .5,
            background: exFilter === ex
              ? (ex === "BSE" ? "rgba(212,168,67,0.25)" : "rgba(0,212,255,0.18)")
              : "rgba(255,255,255,0.05)",
            color: exFilter === ex
              ? (ex === "BSE" ? "var(--gold)" : "var(--cyan)")
              : "var(--text-dim)",
            transition: "all .15s",
          }}>{ex}</button>
        ))}
      </div>
      <div style={{ position: "relative" }}>
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); setActiveIdx(0); onChange && onChange(e.target.value); }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKey}
          style={{ paddingLeft: "36px !important" }}
        />
        {/* Search icon */}
        <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-dim)", fontSize: 13, pointerEvents: "none" }}>⌕</span>
        {query && (
          <span onClick={() => { setQuery(""); onChange && onChange(""); }} style={{
            position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
            color: "var(--text-dim)", cursor: "pointer", fontSize: 13, padding: "2px 4px",
          }}>✕</span>
        )}
      </div>
      {open && results.length > 0 && (
        <div className="stock-dropdown" ref={dropRef}>
          {results.map((stock, i) => (
            <div
              key={stock.tv}
              className={`stock-item${i === activeIdx ? " active" : ""}`}
              onMouseEnter={() => setActiveIdx(i)}
              onClick={() => pick(stock)}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 32, height: 24, borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center",
                  background: `${sc(stock.sector)}18`, border: `1px solid ${sc(stock.sector)}30`,
                  fontFamily: "var(--mono)", fontSize: 8, fontWeight: 700, color: sc(stock.sector), letterSpacing: .5,
                }}>{stock.exchange}</div>
                <div>
                  <div style={{ fontFamily: "var(--mono)", fontSize: 12, fontWeight: 600, color: "var(--text)" }}>{stock.sym}</div>
                  <div style={{ fontFamily: "var(--sans)", fontSize: 10, color: "var(--text-dim)", marginTop: 1 }}>{stock.name}</div>
                </div>
              </div>
              <div style={{
                fontFamily: "var(--sans)", fontSize: 9, color: sc(stock.sector),
                background: `${sc(stock.sector)}14`, border: `1px solid ${sc(stock.sector)}25`,
                padding: "2px 7px", borderRadius: 4, letterSpacing: .3,
              }}>{stock.sector}</div>
            </div>
          ))}
          <div style={{ padding: "8px 14px", fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-dim)", borderTop: "1px solid var(--border)" }}>
            {STOCK_DB_DEDUPED.length}+ NSE/BSE stocks · ↑↓ Navigate · Enter to select
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   REUSABLE COMPONENTS
═══════════════════════════════════════════════════════════════ */
function Badge({ children, color, size = "sm" }) {
  const c = TAG_COLORS[children] || color || "var(--text-dim)";
  return (
    <span style={{
      background: c + "1a", color: c, border: `1px solid ${c}35`,
      borderRadius: 6, padding: size === "lg" ? "4px 12px" : "2px 8px",
      fontSize: size === "lg" ? 12 : 10, fontFamily: "var(--sans)",
      fontWeight: 600, letterSpacing: .4, display: "inline-block", whiteSpace: "nowrap",
    }}>{children}</span>
  );
}

function Spinner() {
  return <div className="spin" style={{ width: 15, height: 15, border: "2px solid rgba(255,255,255,0.1)", borderTop: "2px solid var(--cyan)", borderRadius: "50%", flexShrink: 0 }} />;
}

function Divider({ label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "6px 0" }}>
      <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
      {label && <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-dim)", letterSpacing: 2 }}>{label}</span>}
      <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
    </div>
  );
}

function StatCard({ label, value, sub, color = "var(--gold)", icon, delta, shimmer, delay = 0 }) {
  return (
    <div className="glass-card fade-up" style={{
      borderTop: `2px solid ${color}`, position: "relative", overflow: "hidden",
      animationDelay: `${delay}s`, cursor: "default", transition: "transform .2s, box-shadow .2s",
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = `0 12px 40px rgba(0,0,0,0.55), 0 0 0 1px ${color}25`; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
    >
      <div style={{ position: "absolute", top: -40, right: -40, width: 110, height: 110, borderRadius: "50%", background: color + "0c", filter: "blur(35px)", pointerEvents: "none" }} />
      <div style={{ fontFamily: "var(--gothic)", fontSize: 8.5, letterSpacing: 2.5, color: "var(--text-dim)", textTransform: "uppercase", marginBottom: 12 }}>{label}</div>
      <div style={{
        fontFamily: "var(--mono)", fontSize: 26, fontWeight: 700, color, lineHeight: 1, letterSpacing: -.5,
        ...(shimmer ? { background: `linear-gradient(90deg, ${color} 0%, ${color}cc 40%, ${color} 60%)`, backgroundSize: "200% auto", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", animation: "shimmer 3.5s linear infinite" } : {})
      }}>{value}</div>
      {sub && <div style={{ fontFamily: "var(--mono)", fontSize: 10.5, color: "var(--text-dim)", marginTop: 9, letterSpacing: -.1 }}>{sub}</div>}
      {delta !== undefined && (
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 4, marginTop: 9, padding: "3px 10px", borderRadius: 7,
          background: delta >= 0 ? "var(--green-dim)" : "var(--red-dim)",
          fontFamily: "var(--mono)", fontSize: 11, color: delta >= 0 ? "var(--green)" : "var(--red)", fontWeight: 600,
        }}>{delta >= 0 ? "▲" : "▼"} {Math.abs(delta).toFixed(1)}%</div>
      )}
      {icon && <div style={{ position: "absolute", right: 18, top: 18, fontSize: 24, opacity: .08, pointerEvents: "none" }}>{icon}</div>}
    </div>
  );
}

const PremiumTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "rgba(6,6,18,0.97)", border: "1px solid rgba(0,212,255,0.2)", borderRadius: 10, padding: "10px 14px", fontFamily: "var(--mono)", fontSize: 11, backdropFilter: "blur(20px)", boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}>
      <div style={{ color: "var(--text-dim)", marginBottom: 6, fontSize: 10, letterSpacing: .5 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.value >= 0 ? "var(--green)" : "var(--red)", fontWeight: 600 }}>
          {p.name}: <span style={{ color: p.value >= 0 ? "var(--green)" : "var(--red)" }}>{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

function StreakBadge({ trades }) {
  const streak = useMemo(() => {
    if (!trades.length) return { count: 0, type: null };
    const sorted = [...trades].sort((a, b) => b.date.localeCompare(a.date));
    const first = sorted[0].result;
    if (first === "BE") return { count: 0, type: null };
    let count = 0;
    for (const t of sorted) { if (t.result === first) count++; else break; }
    return { count, type: first };
  }, [trades]);
  if (!streak.type || streak.count < 2) return null;
  const isWin = streak.type === "Win";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 20, background: isWin ? "rgba(14,204,109,0.08)" : "rgba(240,64,96,0.08)", border: `1px solid ${isWin ? "rgba(14,204,109,0.25)" : "rgba(240,64,96,0.25)"}` }}>
      <span style={{ fontSize: 14 }}>{isWin ? "🔥" : "❄️"}</span>
      <span style={{ fontFamily: "var(--mono)", fontSize: 12, fontWeight: 700, color: isWin ? "var(--green)" : "var(--red)", animation: isWin ? "greenPulse 2s ease infinite" : "none" }}>{streak.count} {streak.type} streak</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TICKER TAPE — Live NSE/BSE Market Data via TradingView
═══════════════════════════════════════════════════════════════ */
function TickerTape() {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    ref.current.innerHTML = "";
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js";
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbols: [
        { proName:"NSE:NIFTY",    displayName:"NIFTY 50" },
        { proName:"NSE:BANKNIFTY",displayName:"BANK NIFTY" },
        { proName:"BSE:SENSEX",   displayName:"SENSEX" },
        { proName:"NSE:FINNIFTY", displayName:"FIN NIFTY" },
        { proName:"NSE:MIDCPNIFTY",displayName:"MIDCAP NIFTY" },
        { proName:"NSE:INDIAVIX", displayName:"VIX" },
        { proName:"NSE:RELIANCE", displayName:"RELIANCE" },
        { proName:"NSE:TCS",      displayName:"TCS" },
        { proName:"NSE:HDFCBANK", displayName:"HDFC BANK" },
        { proName:"NSE:ICICIBANK",displayName:"ICICI BANK" },
        { proName:"NSE:INFY",     displayName:"INFOSYS" },
        { proName:"NSE:SBIN",     displayName:"SBI" },
        { proName:"NSE:TATAMOTORS",displayName:"TATA MOTORS" },
        { proName:"NSE:WIPRO",    displayName:"WIPRO" },
        { proName:"NSE:BAJFINANCE",displayName:"BAJAJ FIN" },
        { proName:"FX:USDINR",    displayName:"USD/INR" },
        { proName:"COMEX:GC1!",   displayName:"GOLD" },
        { proName:"NYMEX:CL1!",   displayName:"CRUDE OIL" },
      ],
      showSymbolLogo: false,
      isTransparent: true,
      displayMode: "adaptive",
      colorTheme: "dark",
      locale: "en",
    });
    ref.current.appendChild(script);
  }, []);
  return (
    <div style={{ borderBottom: "1px solid rgba(0,212,255,0.12)", background: "rgba(0,212,255,0.02)", height: 46 }}>
      <div className="tradingview-widget-container" ref={ref} style={{ height: "100%" }}>
        <div className="tradingview-widget-container__widget" style={{ height: "100%" }} />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ENHANCED TRADINGVIEW CHART
═══════════════════════════════════════════════════════════════ */
const TV_INTERVALS = [
  { label:"1m",  val:"1"  }, { label:"5m",  val:"5"  }, { label:"15m", val:"15" },
  { label:"30m", val:"30" }, { label:"1H",  val:"60" }, { label:"4H",  val:"240"},
  { label:"1D",  val:"D"  }, { label:"1W",  val:"W"  }, { label:"1M",  val:"M"  },
];

const TV_STYLES = [
  { label:"🕯 Candle", val:"1" }, { label:"○ Heikin", val:"8" },
  { label:"▬ Bar",    val:"0" }, { label:"⌇ Line",   val:"2" },
  { label:"▨ Area",   val:"3" },
];

const TV_STUDIES_PRESETS = {
  "Basic":    ["Volume@tv-basicstudies"],
  "Day Trade": ["RSI@tv-basicstudies","VWAP@tv-basicstudies","Volume@tv-basicstudies"],
  "Swing":    ["RSI@tv-basicstudies","MACD@tv-basicstudies","BB@tv-basicstudies"],
  "Advanced": ["RSI@tv-basicstudies","MACD@tv-basicstudies","BB@tv-basicstudies","Volume@tv-basicstudies","ATR@tv-basicstudies","VWAP@tv-basicstudies"],
};

function TradingViewChart({ symbol = "NSE:NIFTY", interval = "15", style = "1", studies = ["RSI@tv-basicstudies","MACD@tv-basicstudies","BB@tv-basicstudies"] }) {
  const containerRef = useRef(null);
  const widgetRef = useRef(null);
  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = "";
    const s = document.createElement("script");
    s.src = "https://s3.tradingview.com/tv.js";
    s.async = true;
    s.onload = () => {
      if (window.TradingView && containerRef.current) {
        widgetRef.current = new window.TradingView.widget({
          width: "100%", height: 560, symbol, interval,
          timezone: "Asia/Kolkata", theme: "dark", style, locale: "en",
          toolbar_bg: "#060610", enable_publishing: false, allow_symbol_change: true,
          container_id: "tv_chart_v4", hide_side_toolbar: false,
          studies, backgroundColor: "#03030a", gridColor: "#0a0a16",
          details: true, hotlist: true, calendar: true, watchlist: true,
          show_popup_button: true,
        });
      }
    };
    document.head.appendChild(s);
    return () => { try { document.head.removeChild(s); } catch {} };
  }, [symbol, interval, style, studies.join(",")]);
  return (
    <div style={{ background: "var(--glass)", border: "1px solid rgba(0,212,255,0.15)", borderRadius: 16, overflow: "hidden", boxShadow: "0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,212,255,0.06)" }}>
      <div id="tv_chart_v4" ref={containerRef} style={{ minHeight: 560 }} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MARKET OVERVIEW WIDGET
═══════════════════════════════════════════════════════════════ */
function MarketOverviewWidget() {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    ref.current.innerHTML = "";
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js";
    script.async = true;
    script.innerHTML = JSON.stringify({
      colorTheme: "dark", dateRange: "1D", showChart: true, locale: "en",
      width: "100%", height: 400, isTransparent: true, showSymbolLogo: true,
      tabs: [
        {
          title: "Indices", symbols: [
            { s:"NSE:NIFTY",     d:"NIFTY 50" },
            { s:"NSE:BANKNIFTY", d:"BANK NIFTY" },
            { s:"BSE:SENSEX",    d:"SENSEX" },
            { s:"NSE:FINNIFTY",  d:"FIN NIFTY" },
            { s:"NSE:MIDCPNIFTY",d:"MIDCAP NIFTY" },
          ]
        },
        {
          title: "F&O Stocks", symbols: [
            { s:"NSE:RELIANCE" }, { s:"NSE:TCS" },
            { s:"NSE:HDFCBANK" }, { s:"NSE:ICICIBANK" },
            { s:"NSE:INFY" }, { s:"NSE:SBIN" },
          ]
        },
        {
          title: "Commodities", symbols: [
            { s:"COMEX:GC1!",  d:"GOLD" },
            { s:"NYMEX:CL1!",  d:"CRUDE OIL" },
            { s:"COMEX:SI1!",  d:"SILVER" },
            { s:"FX:USDINR",   d:"USD/INR" },
          ]
        },
      ]
    });
    ref.current.appendChild(script);
  }, []);
  return (
    <div style={{ borderRadius: 16, overflow: "hidden", border: "1px solid var(--border)" }}>
      <div className="tradingview-widget-container" ref={ref}>
        <div className="tradingview-widget-container__widget" />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ECONOMIC CALENDAR WIDGET
═══════════════════════════════════════════════════════════════ */
function EconomicCalendar() {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    ref.current.innerHTML = "";
    const s = document.createElement("script");
    s.src = "https://s3.tradingview.com/external-embedding/embed-widget-events.js";
    s.async = true;
    s.innerHTML = JSON.stringify({
      colorTheme: "dark", isTransparent: true, width: "100%", height: 450,
      locale: "en", importanceFilter: "-1,0,1",
      countryFilter: "in,us",
    });
    ref.current.appendChild(s);
  }, []);
  return (
    <div style={{ borderRadius: 16, overflow: "hidden", border: "1px solid var(--border)" }}>
      <div className="tradingview-widget-container" ref={ref}>
        <div className="tradingview-widget-container__widget" />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CHART TAB — Enhanced
═══════════════════════════════════════════════════════════════ */
const CHART_CATEGORY_STOCKS = {
  "🔥 Indices":    ["NSE:NIFTY","NSE:BANKNIFTY","BSE:SENSEX","NSE:FINNIFTY","NSE:MIDCPNIFTY"],
  "🏦 Banking":    ["NSE:HDFCBANK","NSE:ICICIBANK","NSE:SBIN","NSE:AXISBANK","NSE:KOTAKBANK","NSE:INDUSINDBK","NSE:BANDHANBNK","NSE:FEDERALBNK"],
  "💻 IT":         ["NSE:TCS","NSE:INFY","NSE:WIPRO","NSE:HCLTECH","NSE:TECHM","NSE:LTIM","NSE:MPHASIS","NSE:PERSISTENT","NSE:TATAELXSI"],
  "⚡ Energy":     ["NSE:RELIANCE","NSE:ONGC","NSE:BPCL","NSE:TATAPOWER","NSE:ADANIGREEN","NSE:NTPC","NSE:POWERGRID","NSE:GAIL"],
  "🚗 Auto":       ["NSE:MARUTI","NSE:TATAMOTORS","NSE:M_M","NSE:BAJAJ_AUTO","NSE:EICHERMOT","NSE:HEROMOTOCO","NSE:TVSMOTOR"],
  "💊 Pharma":     ["NSE:SUNPHARMA","NSE:DRREDDY","NSE:CIPLA","NSE:DIVISLAB","NSE:LUPIN","NSE:AUROPHARMA","NSE:BIOCON","NSE:TORNTPHARM"],
  "🏗 Infra":      ["NSE:LT","NSE:ADANIPORTS","NSE:DLF","NSE:GODREJPROP","NSE:GMRINFRA","NSE:SIEMENS","NSE:HAL","NSE:BEL"],
  "🧴 FMCG":       ["NSE:HINDUNILVR","NSE:ITC","NSE:NESTLEIND","NSE:DABUR","NSE:MARICO","NSE:COLPAL","NSE:GODREJCP","NSE:EMAMILTD"],
};

function ChartTab({ defaultSymbol = "NSE:NIFTY" }) {
  const [symbol, setSymbol] = useState(defaultSymbol);
  const [interval, setInterval] = useState("15");
  const [chartStyle, setChartStyle] = useState("1");
  const [studyPreset, setStudyPreset] = useState("Day Trade");
  const [activeCategory, setActiveCategory] = useState("🔥 Indices");
  const [directInput, setDirectInput] = useState("");
  const [directExchange, setDirectExchange] = useState("NSE");
  const [directInputActive, setDirectInputActive] = useState(false);

  const loadSymbol = (sym) => setSymbol(sym);

  // Resolve any typed symbol → TradingView format
  const loadDirect = () => {
    const raw = directInput.trim().toUpperCase();
    if (!raw) return;
    // If user typed full TV format like NSE:RELIANCE or BSE:500325
    if (raw.includes(":")) {
      loadSymbol(raw);
    } else {
      loadSymbol(`${directExchange}:${raw}`);
    }
    setDirectInputActive(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* Coverage banner */}
      <div style={{
        background: "linear-gradient(135deg, rgba(0,212,255,0.06), rgba(139,92,246,0.06))",
        border: "1px solid rgba(0,212,255,0.2)", borderRadius: 12, padding: "10px 16px",
        display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
      }}>
        <span style={{ fontSize: 16 }}>📡</span>
        <div style={{ flex: 1 }}>
          <span style={{ fontFamily: "var(--sans)", fontSize: 11, fontWeight: 700, color: "var(--cyan)" }}>Full NSE + BSE Coverage via TradingView</span>
          <span style={{ fontFamily: "var(--sans)", fontSize: 11, color: "var(--text-dim)", marginLeft: 8 }}>
            5000+ BSE stocks · 3000+ NSE stocks · Use the search below OR type any symbol directly · BSE scrip codes also work (e.g. BSE:500325)
          </span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {[["NSE", "3000+", "var(--cyan)"], ["BSE", "5000+", "var(--gold)"]].map(([ex, cnt, clr]) => (
            <div key={ex} style={{ textAlign: "center", padding: "4px 12px", borderRadius: 8, background: `${clr === "var(--cyan)" ? "rgba(0,212,255,0.1)" : "rgba(212,168,67,0.1)"}`, border: `1px solid ${clr === "var(--cyan)" ? "rgba(0,212,255,0.25)" : "rgba(212,168,67,0.25)"}` }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: 13, fontWeight: 700, color: clr }}>{cnt}</div>
              <div style={{ fontFamily: "var(--sans)", fontSize: 9, color: "var(--text-dim)", letterSpacing: 1 }}>{ex} Stocks</div>
            </div>
          ))}
        </div>
      </div>

      {/* Top controls bar */}
      <div className="glass-card" style={{ padding: "14px 18px" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>

          {/* Stock Search from local DB */}
          <div style={{ flex: "0 0 320px" }}>
            <div style={{ fontFamily: "var(--sans)", fontSize: 10, letterSpacing: 2, color: "var(--text-dim)", textTransform: "uppercase", marginBottom: 5 }}>🔍 Search Stock / Index</div>
            <StockSearch
              value={symbol.split(":")[1] || symbol}
              onChange={() => {}}
              onSelect={(stock) => loadSymbol(stock.tv)}
              placeholder="NIFTY, HDFCBANK, RELIANCE..."
            />
          </div>

          {/* Direct Symbol Entry — for any unlisted stock */}
          <div style={{ flex: "0 0 280px" }}>
            <div style={{ fontFamily: "var(--sans)", fontSize: 10, letterSpacing: 2, color: "var(--text-dim)", textTransform: "uppercase", marginBottom: 5 }}>
              ⚡ Direct Symbol Entry
              <span style={{ marginLeft: 6, color: "var(--green)", fontSize: 9, letterSpacing: 0, textTransform: "none", fontWeight: 400 }}>Any NSE/BSE stock</span>
            </div>
            <div style={{ display: "flex", gap: 5 }}>
              {/* Exchange selector */}
              <div style={{ display: "flex", borderRadius: 8, overflow: "hidden", border: "1px solid var(--border)", flexShrink: 0 }}>
                {["NSE","BSE"].map(ex => (
                  <button key={ex} onClick={() => setDirectExchange(ex)} style={{
                    padding: "9px 10px", border: "none", cursor: "pointer",
                    fontFamily: "var(--mono)", fontSize: 10, fontWeight: 700, transition: "all .12s",
                    background: directExchange === ex ? (ex === "NSE" ? "rgba(0,212,255,0.2)" : "rgba(212,168,67,0.2)") : "rgba(255,255,255,0.04)",
                    color: directExchange === ex ? (ex === "NSE" ? "var(--cyan)" : "var(--gold)") : "var(--text-dim)",
                  }}>{ex}</button>
                ))}
              </div>
              <input
                type="text"
                placeholder="e.g. IRFC, SUZLON, 500325"
                value={directInput}
                onChange={e => setDirectInput(e.target.value)}
                onFocus={() => setDirectInputActive(true)}
                onBlur={() => setDirectInputActive(false)}
                onKeyDown={e => { if (e.key === "Enter") loadDirect(); }}
                style={{ flex: 1 }}
              />
              <button onClick={loadDirect} style={{
                padding: "0 12px", borderRadius: 8, border: "none", cursor: "pointer",
                background: "linear-gradient(135deg, rgba(0,212,255,0.2), rgba(0,212,255,0.08))",
                color: "var(--cyan)", fontFamily: "var(--mono)", fontSize: 13, fontWeight: 700,
                border: "1px solid rgba(0,212,255,0.3)", transition: "all .15s", flexShrink: 0,
              }}>GO</button>
            </div>
            <div style={{ fontFamily: "var(--sans)", fontSize: 10, color: "var(--text-dim)", marginTop: 4, lineHeight: 1.4 }}>
              Type any symbol → press Enter or GO. Works for all 8000+ NSE+BSE stocks.
            </div>
          </div>

          {/* Interval */}
          <div>
            <div style={{ fontFamily: "var(--sans)", fontSize: 10, letterSpacing: 2, color: "var(--text-dim)", textTransform: "uppercase", marginBottom: 5 }}>Interval</div>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {TV_INTERVALS.map(iv => (
                <button key={iv.val} onClick={() => setInterval(iv.val)} style={{
                  padding: "5px 10px", borderRadius: 7, border: "none", cursor: "pointer",
                  fontFamily: "var(--mono)", fontSize: 11, fontWeight: 600, transition: "all .15s",
                  background: interval === iv.val ? "rgba(0,212,255,0.18)" : "rgba(255,255,255,0.04)",
                  color: interval === iv.val ? "var(--cyan)" : "var(--text-dim)",
                  boxShadow: interval === iv.val ? "0 0 0 1px rgba(0,212,255,0.3)" : "none",
                }}>{iv.label}</button>
              ))}
            </div>
          </div>

          {/* Chart Style */}
          <div>
            <div style={{ fontFamily: "var(--sans)", fontSize: 10, letterSpacing: 2, color: "var(--text-dim)", textTransform: "uppercase", marginBottom: 5 }}>Style</div>
            <div style={{ display: "flex", gap: 4 }}>
              {TV_STYLES.map(st => (
                <button key={st.val} onClick={() => setChartStyle(st.val)} style={{
                  padding: "5px 10px", borderRadius: 7, border: "none", cursor: "pointer",
                  fontFamily: "var(--sans)", fontSize: 11, fontWeight: 500, transition: "all .15s",
                  background: chartStyle === st.val ? "rgba(212,168,67,0.18)" : "rgba(255,255,255,0.04)",
                  color: chartStyle === st.val ? "var(--gold)" : "var(--text-dim)",
                  boxShadow: chartStyle === st.val ? "0 0 0 1px rgba(212,168,67,0.3)" : "none",
                }}>{st.label}</button>
              ))}
            </div>
          </div>

          {/* Studies Preset */}
          <div>
            <div style={{ fontFamily: "var(--sans)", fontSize: 10, letterSpacing: 2, color: "var(--text-dim)", textTransform: "uppercase", marginBottom: 5 }}>Indicators</div>
            <div style={{ display: "flex", gap: 4 }}>
              {Object.keys(TV_STUDIES_PRESETS).map(p => (
                <button key={p} onClick={() => setStudyPreset(p)} style={{
                  padding: "5px 10px", borderRadius: 7, border: "none", cursor: "pointer",
                  fontFamily: "var(--sans)", fontSize: 11, fontWeight: 500, transition: "all .15s",
                  background: studyPreset === p ? "rgba(139,92,246,0.18)" : "rgba(255,255,255,0.04)",
                  color: studyPreset === p ? "var(--purple)" : "var(--text-dim)",
                  boxShadow: studyPreset === p ? "0 0 0 1px rgba(139,92,246,0.3)" : "none",
                }}>{p}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Category Quick Select */}
      <div className="glass-card" style={{ padding: "12px 16px" }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-dim)", letterSpacing: 1.5, marginRight: 4 }}>QUICK ACCESS:</span>
          {Object.keys(CHART_CATEGORY_STOCKS).map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)} style={{
              padding: "4px 12px", borderRadius: 7, border: "none", cursor: "pointer",
              fontFamily: "var(--sans)", fontSize: 11, fontWeight: 500, transition: "all .15s",
              background: activeCategory === cat ? "rgba(0,212,255,0.14)" : "rgba(255,255,255,0.04)",
              color: activeCategory === cat ? "var(--cyan)" : "var(--text-dim)",
              boxShadow: activeCategory === cat ? "0 0 0 1px rgba(0,212,255,0.25)" : "none",
            }}>{cat}</button>
          ))}
        </div>

        {/* Stocks in category */}
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 10 }}>
          {CHART_CATEGORY_STOCKS[activeCategory]?.map(sym => {
            const shortName = sym.split(":")[1];
            const isActive = symbol === sym;
            return (
              <button key={sym} onClick={() => loadSymbol(sym)} style={{
                padding: "5px 12px", borderRadius: 7, border: "none", cursor: "pointer",
                fontFamily: "var(--mono)", fontSize: 11, fontWeight: 600, transition: "all .15s",
                background: isActive ? "linear-gradient(135deg, rgba(212,168,67,0.25), rgba(212,168,67,0.1))" : "rgba(255,255,255,0.04)",
                color: isActive ? "var(--gold)" : "var(--text)",
                boxShadow: isActive ? "0 0 0 1px rgba(212,168,67,0.35)" : "none",
                letterSpacing: .2,
              }}>{shortName}</button>
            );
          })}
        </div>
      </div>

      {/* Current symbol display */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ fontFamily: "var(--mono)", fontSize: 13, color: "var(--cyan)", fontWeight: 600, letterSpacing: .5 }}>{symbol}</div>
          <div style={{ fontFamily: "var(--sans)", fontSize: 10, color: "var(--text-dim)", padding: "2px 8px", background: "rgba(0,212,255,0.08)", borderRadius: 5, border: "1px solid rgba(0,212,255,0.15)" }}>LIVE</div>
        </div>
        <div style={{ height: 1, flex: 1, background: "rgba(0,212,255,0.12)" }} />
        <div style={{ fontFamily: "var(--sans)", fontSize: 10, color: "var(--text-dim)" }}>
          {TV_INTERVALS.find(i => i.val === interval)?.label} · {TV_STYLES.find(s => s.val === chartStyle)?.label} · {studyPreset} preset
        </div>
        <div style={{ fontFamily: "var(--sans)", fontSize: 10, color: "var(--text-dim)", padding: "2px 8px", background: "rgba(255,255,255,0.04)", borderRadius: 5, border: "1px solid var(--border)" }}>
          📺 Use TradingView's built-in search (top-left of chart) for any of 8000+ stocks
        </div>
      </div>

      {/* TradingView Chart */}
      <TradingViewChart
        symbol={symbol}
        interval={interval}
        style={chartStyle}
        studies={TV_STUDIES_PRESETS[studyPreset]}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MARKET TAB — Overview + Calendar
═══════════════════════════════════════════════════════════════ */
function MarketTab() {
  const [view, setView] = useState("overview");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: 3, border: "1px solid var(--border)", width: "fit-content" }}>
        {[["overview", "🌐 Market Overview"], ["calendar", "📅 Economic Calendar"]].map(([id, label]) => (
          <button key={id} onClick={() => setView(id)} style={{
            padding: "7px 18px", borderRadius: 8, border: view === id ? "1px solid rgba(0,212,255,0.25)" : "1px solid transparent",
            cursor: "pointer", fontFamily: "var(--sans)", fontWeight: 600, fontSize: 12, transition: "all .2s",
            background: view === id ? "rgba(0,212,255,0.12)" : "transparent",
            color: view === id ? "var(--cyan)" : "var(--text-dim)",
          }}>{label}</button>
        ))}
      </div>
      {view === "overview" && <MarketOverviewWidget />}
      {view === "calendar" && <EconomicCalendar />}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TRADE FORM — with Stock Autocomplete
═══════════════════════════════════════════════════════════════ */
function TradeForm({ onSave, onClose, initial }) {
  const empty = { date: new Date().toISOString().slice(0, 10), symbol: "", type: "Long", entry: "", exit: "", qty: "", fees: "0", notes: "", tags: "", screenshot: "" };
  const [form, setForm] = useState(initial ? {
    ...initial, tags: initial.tags.join(", "),
    entry: String(initial.entry), exit: String(initial.exit),
    qty: String(initial.qty), fees: String(initial.fees)
  } : empty);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const preview = useMemo(() => {
    const e = parseFloat(form.entry), x = parseFloat(form.exit), q = parseFloat(form.qty), f = parseFloat(form.fees) || 0;
    if (!e || !x || !q) return null;
    const rawPnl = form.type === "Long" ? (x - e) * q : (e - x) * q;
    const net = rawPnl - f;
    return { pnl: rawPnl, net, result: net > 0 ? "Win" : net < 0 ? "Loss" : "BE" };
  }, [form.entry, form.exit, form.qty, form.fees, form.type]);

  const submit = () => {
    if (!form.symbol || !form.entry || !form.exit || !form.qty) return;
    const entry = parseFloat(form.entry), exit = parseFloat(form.exit);
    const qty = parseFloat(form.qty), fees = parseFloat(form.fees) || 0;
    const pnl = form.type === "Long" ? (exit - entry) * qty : (entry - exit) * qty;
    const net = pnl - fees;
    const result = net > 0 ? "Win" : net < 0 ? "Loss" : "BE";
    const tags = form.tags.split(",").map(t => t.trim()).filter(Boolean);
    onSave({ ...form, id: initial?.id || uid(), entry, exit, qty, fees, pnl, result, tags });
    onClose();
  };

  const resultColor = preview ? (preview.result === "Win" ? "var(--green)" : preview.result === "Loss" ? "var(--red)" : "var(--gold)") : null;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)", backdropFilter: "blur(20px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}>
      <div className="fade-up" style={{ background: "linear-gradient(160deg, rgba(8,8,22,0.99) 0%, rgba(4,4,14,0.99) 100%)", border: "1px solid rgba(232,184,75,0.22)", borderRadius: 22, padding: 34, width: 620, maxWidth: "95vw", maxHeight: "92vh", overflowY: "auto", boxShadow: "0 30px 90px rgba(0,0,0,0.8), 0 0 0 1px rgba(232,184,75,0.08)", position: "relative" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, rgba(232,184,75,0.4), rgba(0,220,255,0.2), transparent)", borderRadius: "22px 22px 0 0" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
          <div>
            <div style={{ fontFamily: "var(--serif)", fontSize: 26, color: "var(--text)", fontWeight: 700, fontStyle: "italic" }}>{initial ? "✦ Edit Trade" : "✦ Log New Trade"}</div>
            <div style={{ fontFamily: "var(--gothic)", fontSize: 9, color: "var(--text-dim)", marginTop: 4, letterSpacing: 2, textTransform: "uppercase" }}>{initial ? "Update entry details" : "Record your trade with full details"}</div>
          </div>
          <button onClick={onClose} style={{ background: "var(--glass)", border: "1px solid var(--border)", color: "var(--text-mid)", borderRadius: 10, width: 36, height: 36, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", transition: "all .2s" }}>✕</button>
        </div>

        {/* Direction toggle */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontFamily: "var(--sans)", fontSize: 10, letterSpacing: 2, color: "var(--text-dim)", textTransform: "uppercase", marginBottom: 8 }}>Direction</div>
          <div style={{ display: "flex", gap: 0, background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: 3, border: "1px solid var(--border)", width: "fit-content" }}>
            {["Long", "Short"].map(t => (
              <button key={t} onClick={() => set("type", t)} style={{
                padding: "8px 28px", borderRadius: 8, border: "none", cursor: "pointer",
                fontFamily: "var(--sans)", fontWeight: 700, fontSize: 13, transition: "all .2s",
                background: form.type === t
                  ? (t === "Long" ? "linear-gradient(135deg, rgba(14,204,109,0.25), rgba(14,204,109,0.12))" : "linear-gradient(135deg, rgba(240,64,96,0.25), rgba(240,64,96,0.12))")
                  : "transparent",
                color: form.type === t ? (t === "Long" ? "var(--green)" : "var(--red)") : "var(--text-dim)",
                boxShadow: form.type === t ? `0 2px 12px ${t === "Long" ? "rgba(14,204,109,0.15)" : "rgba(240,64,96,0.15)"}` : "none",
              }}>{t === "Long" ? "▲ Long" : "▼ Short"}</button>
            ))}
          </div>
        </div>

        {/* Symbol with autocomplete */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontFamily: "var(--sans)", fontSize: 10, letterSpacing: 1.5, color: "var(--text-dim)", textTransform: "uppercase", display: "block", marginBottom: 5 }}>Symbol (NSE/BSE)</label>
          <StockSearch
            value={form.symbol}
            onChange={(sym) => set("symbol", sym)}
            onSelect={(stock) => set("symbol", stock.sym)}
            placeholder="Search NIFTY, RELIANCE, HDFCBANK..."
          />
        </div>

        {/* Other fields */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {[
            { label: "Date", key: "date", type: "date" },
            { label: "Entry Price (₹)", key: "entry", placeholder: "22400", type: "number" },
            { label: "Exit Price (₹)", key: "exit", placeholder: "22580", type: "number" },
            { label: "Quantity / Lots", key: "qty", placeholder: "50", type: "number" },
            { label: "Fees & Charges (₹)", key: "fees", placeholder: "250", type: "number" },
          ].map(({ label, key, type, placeholder }) => (
            <div key={key}>
              <label style={{ fontFamily: "var(--sans)", fontSize: 10, letterSpacing: 1.5, color: "var(--text-dim)", textTransform: "uppercase", display: "block", marginBottom: 5 }}>{label}</label>
              <input type={type || "text"} placeholder={placeholder} value={form[key]} onChange={e => set(key, e.target.value)} />
            </div>
          ))}
          <div>
            <label style={{ fontFamily: "var(--sans)", fontSize: 10, letterSpacing: 1.5, color: "var(--text-dim)", textTransform: "uppercase", display: "block", marginBottom: 5 }}>Tags</label>
            <input placeholder="Breakout, ORB, Momentum..." value={form.tags} onChange={e => set("tags", e.target.value)} />
          </div>
        </div>

        <div style={{ marginTop: 14 }}>
          <label style={{ fontFamily: "var(--sans)", fontSize: 10, letterSpacing: 1.5, color: "var(--text-dim)", textTransform: "uppercase", display: "block", marginBottom: 5 }}>Trade Notes</label>
          <textarea rows={3} placeholder="Setup rationale, entry trigger, market context, mistakes, lessons..." value={form.notes} onChange={e => set("notes", e.target.value)} style={{ resize: "vertical" }} />
        </div>

        {preview && (
          <div style={{ marginTop: 16, borderRadius: 12, padding: "14px 18px", border: `1px solid ${resultColor}30`, background: `${resultColor}08`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", gap: 24 }}>
              <div>
                <div style={{ fontFamily: "var(--sans)", fontSize: 10, color: "var(--text-dim)", letterSpacing: 1 }}>GROSS P&L</div>
                <div style={{ fontFamily: "var(--mono)", fontSize: 16, fontWeight: 700, color: preview.pnl >= 0 ? "var(--green)" : "var(--red)" }}>{fmt(preview.pnl)}</div>
              </div>
              <div>
                <div style={{ fontFamily: "var(--sans)", fontSize: 10, color: "var(--text-dim)", letterSpacing: 1 }}>NET P&L</div>
                <div style={{ fontFamily: "var(--mono)", fontSize: 18, fontWeight: 700, color: resultColor }}>{fmt(preview.net)}</div>
              </div>
            </div>
            <Badge size="lg">{preview.result}</Badge>
          </div>
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
          <button className="btn-gold" onClick={submit} style={{ flex: 1, padding: "12px" }}>{initial ? "✓ Save Changes" : "✓ Log Trade"}</button>
          <button className="btn-outline" onClick={onClose} style={{ flex: "0 0 auto", padding: "12px 20px" }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   DASHBOARD
═══════════════════════════════════════════════════════════════ */
function Dashboard({ trades, settings }) {
  const wins   = trades.filter(t => t.result === "Win");
  const losses = trades.filter(t => t.result === "Loss");
  const bes    = trades.filter(t => t.result === "BE");
  const totalNet    = trades.reduce((s, t) => s + t.pnl - t.fees, 0);
  const winRate     = trades.length ? Math.round((wins.length / Math.max(wins.length + losses.length, 1)) * 100) : 0;
  const avgWin      = wins.length   ? wins.reduce((s, t) => s + t.pnl - t.fees, 0) / wins.length   : 0;
  const avgLoss     = losses.length ? losses.reduce((s, t) => s + t.pnl - t.fees, 0) / losses.length : 0;
  const rr          = avgLoss ? Math.abs(avgWin / avgLoss).toFixed(2) : "—";
  const totalFees   = trades.reduce((s, t) => s + t.fees, 0);
  const expectancy  = ((winRate / 100) * avgWin + (1 - winRate / 100) * avgLoss).toFixed(0);
  const capitalReturn = settings.capital ? ((totalNet / parseInt(settings.capital)) * 100).toFixed(2) : null;

  const sorted = [...trades].sort((a, b) => a.date.localeCompare(b.date));
  const curve = sorted.reduce((acc, t, i) => {
    const prev = acc[i - 1]?.c ?? 0;
    acc.push({ d: t.date.slice(5), c: prev + t.pnl - t.fees, bar: t.pnl - t.fees });
    return acc;
  }, []);

  let peak = 0, maxDD = 0;
  const ddCurve = curve.map(pt => {
    if (pt.c > peak) peak = pt.c;
    const dd = peak > 0 ? ((pt.c - peak) / peak) * 100 : 0;
    if (dd < maxDD) maxDD = dd;
    return { d: pt.d, dd };
  });

  const monthMap = {};
  trades.forEach(t => { const key = t.date.slice(0, 7); monthMap[key] = (monthMap[key] || 0) + (t.pnl - t.fees); });
  const monthData = Object.entries(monthMap).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => ({ m: k.slice(5) + "/" + k.slice(2, 4), v }));

  const symMap = {};
  trades.forEach(t => {
    if (!symMap[t.symbol]) symMap[t.symbol] = { sym: t.symbol, count: 0, pnl: 0, wins: 0 };
    symMap[t.symbol].count++; symMap[t.symbol].pnl += t.pnl - t.fees;
    if (t.result === "Win") symMap[t.symbol].wins++;
  });
  const symData = Object.values(symMap).sort((a, b) => b.pnl - a.pnl);

  const tagMap = {};
  trades.forEach(t => t.tags.forEach(tag => {
    if (!tagMap[tag]) tagMap[tag] = { tag, count: 0, pnl: 0, wins: 0 };
    tagMap[tag].count++; tagMap[tag].pnl += t.pnl - t.fees;
    if (t.result === "Win") tagMap[tag].wins++;
  }));
  const tagData = Object.values(tagMap).sort((a, b) => b.pnl - a.pnl);

  const pieData = [
    { name: "Win", value: wins.length, fill: "#0ECC6D" },
    { name: "Loss", value: losses.length, fill: "#F04060" },
    { name: "BE", value: bes.length, fill: "#D4A843" },
  ].filter(p => p.value > 0);

  const best  = trades.length ? trades.reduce((b, t) => (t.pnl - t.fees) > (b.pnl - b.fees) ? t : b) : null;
  const worst = trades.length ? trades.reduce((b, t) => (t.pnl - t.fees) < (b.pnl - b.fees) ? t : b) : null;

  if (!trades.length) return (
    <div style={{ textAlign: "center", padding: "80px 0", color: "var(--text-dim)", fontFamily: "var(--mono)", fontSize: 14 }}>
      No trades yet. Add your first trade to see analytics.
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Stat Cards */}
      <div className="stagger" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
        <StatCard label="Net P&L" value={fmt(totalNet)} color={totalNet >= 0 ? "var(--green)" : "var(--red)"} sub={`${trades.length} trades logged`} shimmer={totalNet > 0} delay={0} />
        <StatCard label="Win Rate" value={`${winRate}%`} color={winRate >= 60 ? "var(--green)" : winRate >= 45 ? "var(--gold)" : "var(--red)"} sub={`${wins.length}W · ${losses.length}L · ${bes.length}BE`} delay={.06} />
        <StatCard label="Risk : Reward" value={rr} color="var(--cyan)" sub={`Avg Win: ${fmtS(Math.round(avgWin))}`} delay={.12} />
        <StatCard label="Expectancy" value={fmt(parseInt(expectancy))} color={parseInt(expectancy) >= 0 ? "var(--green)" : "var(--red)"} sub="per trade (avg)" delay={.18} />
        <StatCard label="Total Fees" value={fmtS(totalFees)} color="var(--text-mid)" sub={`${((totalFees / Math.max(1, Math.abs(totalNet))) * 100).toFixed(1)}% of gross`} delay={.24} />
        {capitalReturn && <StatCard label="Capital Return" value={`${capitalReturn}%`} color={parseFloat(capitalReturn) >= 0 ? "var(--green)" : "var(--red)"} sub={`On ${fmtS(parseInt(settings.capital))}`} delta={parseFloat(capitalReturn)} delay={.30} />}
      </div>

      {/* Equity Curve + Donut */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
        <div className="glass-card fade-up" style={{ animationDelay: ".1s" }}>
          <div style={{ fontFamily: "var(--gothic)", fontSize: 9, letterSpacing: 2.5, color: "var(--text-dim)", textTransform: "uppercase", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>Equity Curve <span style={{ flex:1, height:1, background:"linear-gradient(90deg, var(--border), transparent)", display:"block" }}></span></div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={curve} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#00D4FF" stopOpacity={.3} />
                  <stop offset="95%" stopColor="#00D4FF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="1 6" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="d" tick={{ fontFamily: "var(--mono)", fontSize: 9, fill: "var(--text-dim)" }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontFamily: "var(--mono)", fontSize: 9, fill: "var(--text-dim)" }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} width={50} />
              <Tooltip content={<PremiumTooltip />} />
              <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />
              <Area type="monotone" dataKey="c" stroke="#00D4FF" strokeWidth={2.5} fill="url(#equityGrad)" dot={false} name="Cum P&L" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card fade-up" style={{ animationDelay: ".15s", display: "flex", flexDirection: "column" }}>
          <div className="section-label">Outcome Split</div>
          <div style={{ flex: 1, minHeight: 180, display: "flex", alignItems: "center" }}>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={48} outerRadius={72} dataKey="value" paddingAngle={4} strokeWidth={0}>
                  {pieData.map((e, i) => <Cell key={i} fill={e.fill} opacity={.9} />)}
                </Pie>
                <Tooltip formatter={(v, n) => [v + " trades", n]} contentStyle={{ background: "rgba(6,6,18,.96)", border: "1px solid rgba(0,212,255,.2)", borderRadius: 10, fontFamily: "var(--mono)", fontSize: 11 }} />
                <Legend formatter={(v) => <span style={{ fontFamily: "var(--sans)", fontSize: 11, color: "var(--text-mid)" }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ textAlign: "center", marginTop: 8 }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: 22, fontWeight: 700, color: "var(--cyan)" }}>{winRate}%</div>
            <div style={{ fontFamily: "var(--sans)", fontSize: 10, color: "var(--text-dim)", letterSpacing: 1 }}>WIN RATE</div>
          </div>
        </div>
      </div>

      {/* Daily Bars + Drawdown */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div className="glass-card fade-up" style={{ animationDelay: ".2s" }}>
          <div className="section-label">Daily P&L</div>
          <ResponsiveContainer width="100%" height={170}>
            <BarChart data={curve} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="1 6" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="d" tick={{ fontFamily: "var(--mono)", fontSize: 9, fill: "var(--text-dim)" }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontFamily: "var(--mono)", fontSize: 9, fill: "var(--text-dim)" }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} width={36} />
              <Tooltip content={<PremiumTooltip />} />
              <ReferenceLine y={0} stroke="rgba(255,255,255,0.12)" />
              <Bar dataKey="bar" name="Daily P&L" radius={[3, 3, 0, 0]} maxBarSize={18}>
                {curve.map((e, i) => <Cell key={i} fill={e.bar >= 0 ? "#0ECC6D" : "#F04060"} opacity={.85} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card fade-up" style={{ animationDelay: ".25s" }}>
          <div className="section-label">Max Drawdown: <span style={{ color: "var(--red)", fontFamily: "var(--mono)" }}>{maxDD.toFixed(1)}%</span></div>
          <ResponsiveContainer width="100%" height={170}>
            <AreaChart data={ddCurve} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="ddGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#F04060" stopOpacity={.35} />
                  <stop offset="95%" stopColor="#F04060" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="1 6" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="d" tick={{ fontFamily: "var(--mono)", fontSize: 9, fill: "var(--text-dim)" }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontFamily: "var(--mono)", fontSize: 9, fill: "var(--text-dim)" }} axisLine={false} tickLine={false} tickFormatter={v => `${v.toFixed(0)}%`} width={36} />
              <Tooltip formatter={v => [`${v.toFixed(2)}%`, "Drawdown"]} contentStyle={{ background: "rgba(6,6,18,.96)", border: "1px solid rgba(240,64,96,.25)", borderRadius: 10, fontFamily: "var(--mono)", fontSize: 11 }} />
              <Area type="monotone" dataKey="dd" stroke="#F04060" strokeWidth={2} fill="url(#ddGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly + Symbol */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div className="glass-card fade-up" style={{ animationDelay: ".3s" }}>
          <div className="section-label">Monthly Performance</div>
          <ResponsiveContainer width="100%" height={175}>
            <BarChart data={monthData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="1 6" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="m" tick={{ fontFamily: "var(--mono)", fontSize: 9, fill: "var(--text-dim)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontFamily: "var(--mono)", fontSize: 9, fill: "var(--text-dim)" }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} width={36} />
              <Tooltip content={<PremiumTooltip />} />
              <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" />
              <Bar dataKey="v" name="Monthly P&L" radius={[4, 4, 0, 0]} maxBarSize={32}>
                {monthData.map((e, i) => <Cell key={i} fill={e.v >= 0 ? "#0ECC6D" : "#F04060"} opacity={.85} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card fade-up" style={{ animationDelay: ".35s" }}>
          <div className="section-label">Symbol Leaderboard</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7, maxHeight: 200, overflowY: "auto" }}>
            {symData.map((s, i) => {
              const wr = Math.round(s.wins / s.count * 100);
              return (
                <div key={s.sym} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", background: "rgba(255,255,255,0.03)", borderRadius: 8 }}>
                  <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-dim)", width: 16 }}>{i + 1}</span>
                  <span style={{ fontFamily: "var(--mono)", fontSize: 12, fontWeight: 600, color: "var(--cyan)", flex: 1 }}>{s.sym}</span>
                  <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-dim)" }}>{wr}% WR</span>
                  <span style={{ fontFamily: "var(--mono)", fontSize: 12, fontWeight: 700, color: s.pnl >= 0 ? "var(--green)" : "var(--red)" }}>{fmt(Math.round(s.pnl))}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Best/Worst + Tags */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {best && (
          <div className="glass-card fade-up" style={{ borderLeft: "3px solid var(--green)", animationDelay: ".4s" }}>
            <div className="section-label" style={{ color: "var(--green)" }}>Best Trade</div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 18, fontWeight: 700, color: "var(--green)" }}>{fmt(Math.round(best.pnl - best.fees))}</div>
            <div style={{ fontFamily: "var(--sans)", fontSize: 12, color: "var(--text-mid)", marginTop: 6 }}>{best.symbol} · {best.date} · {best.type}</div>
            {best.notes && <div style={{ fontFamily: "var(--sans)", fontSize: 11, color: "var(--text-dim)", marginTop: 8, lineHeight: 1.6 }}>{best.notes.slice(0, 100)}…</div>}
          </div>
        )}
        {worst && (
          <div className="glass-card fade-up" style={{ borderLeft: "3px solid var(--red)", animationDelay: ".45s" }}>
            <div className="section-label" style={{ color: "var(--red)" }}>Worst Trade</div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 18, fontWeight: 700, color: "var(--red)" }}>{fmt(Math.round(worst.pnl - worst.fees))}</div>
            <div style={{ fontFamily: "var(--sans)", fontSize: 12, color: "var(--text-mid)", marginTop: 6 }}>{worst.symbol} · {worst.date} · {worst.type}</div>
            {worst.notes && <div style={{ fontFamily: "var(--sans)", fontSize: 11, color: "var(--text-dim)", marginTop: 8, lineHeight: 1.6 }}>{worst.notes.slice(0, 100)}…</div>}
          </div>
        )}
      </div>

      {/* Tag Analysis */}
      <div className="glass-card fade-up" style={{ animationDelay: ".5s" }}>
        <div className="section-label">Setup Tag Analysis</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {tagData.map(t => {
            const wr = Math.round(t.wins / t.count * 100);
            return (
              <div key={t.tag} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 14px", minWidth: 120 }}>
                <div style={{ marginBottom: 6 }}><Badge>{t.tag}</Badge></div>
                <div style={{ fontFamily: "var(--mono)", fontSize: 13, fontWeight: 700, color: t.pnl >= 0 ? "var(--green)" : "var(--red)" }}>{fmt(Math.round(t.pnl))}</div>
                <div style={{ fontFamily: "var(--sans)", fontSize: 10, color: "var(--text-dim)", marginTop: 4 }}>{t.count} trades · {wr}% WR</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   JOURNAL
═══════════════════════════════════════════════════════════════ */
function Journal({ trades, onDelete, onEdit }) {
  const [expanded, setExpanded] = useState(null);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const sorted = [...trades].sort((a, b) => b.date.localeCompare(a.date));
  const filtered = sorted.filter(t => {
    if (filter !== "All" && t.result !== filter) return false;
    if (search && !t.symbol.toLowerCase().includes(search.toLowerCase()) && !t.notes.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Filters */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <input placeholder="Search symbol or notes..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: 220 }} />
        <div style={{ display: "flex", gap: 3, background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: 3, border: "1px solid var(--border)" }}>
          {["All", "Win", "Loss", "BE"].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: "5px 14px", borderRadius: 7, border: filter === f ? "1px solid rgba(0,212,255,0.2)" : "1px solid transparent",
              cursor: "pointer", fontFamily: "var(--sans)", fontWeight: 600, fontSize: 12, transition: "all .2s",
              background: filter === f ? "rgba(0,212,255,0.1)" : "transparent",
              color: filter === f ? "var(--cyan)" : "var(--text-dim)",
            }}>{f}</button>
          ))}
        </div>
        <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-dim)", marginLeft: "auto" }}>{filtered.length} / {trades.length} trades</span>
      </div>

      {/* Trade rows */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-dim)", fontFamily: "var(--mono)", fontSize: 13 }}>No trades match filters.</div>
      ) : filtered.map((t, i) => {
        const net = t.pnl - t.fees;
        const isOpen = expanded === t.id;
        const resColor = t.result === "Win" ? "var(--green)" : t.result === "Loss" ? "var(--red)" : "var(--gold)";
        return (
          <div key={t.id} className="glass-card fade-up" style={{ padding: 0, overflow: "hidden", animationDelay: `${i * .03}s`, cursor: "pointer" }} onClick={() => setExpanded(isOpen ? null : t.id)}>
            {/* Row */}
            <div style={{ display: "grid", gridTemplateColumns: "90px 100px 80px 1fr 120px 100px 90px", alignItems: "center", gap: 12, padding: "14px 18px", borderLeft: `3px solid ${resColor}` }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-dim)" }}>{t.date.slice(5)}</div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 13, fontWeight: 700, color: "var(--cyan)" }}>{t.symbol}</div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: t.type === "Long" ? "var(--green)" : "var(--red)", fontWeight: 600 }}>{t.type === "Long" ? "▲" : "▼"} {t.type}</div>
              <div style={{ fontFamily: "var(--sans)", fontSize: 11, color: "var(--text-dim)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.notes || "—"}</div>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>{t.tags.slice(0, 2).map(tag => <Badge key={tag}>{tag}</Badge>)}</div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 14, fontWeight: 700, color: net >= 0 ? "var(--green)" : "var(--red)", textAlign: "right" }}>{fmt(net)}</div>
              <div style={{ textAlign: "right" }}><Badge size="lg">{t.result}</Badge></div>
            </div>
            {/* Expanded */}
            {isOpen && (
              <div className="fade-in" style={{ padding: "14px 18px 18px", borderTop: "1px solid var(--border)", background: "rgba(255,255,255,0.015)" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 12, marginBottom: 14 }}>
                  {[
                    ["Entry", `₹${t.entry}`], ["Exit", `₹${t.exit}`], ["Qty", t.qty],
                    ["Gross P&L", fmt(Math.round(t.pnl))], ["Fees", fmtS(t.fees)], ["Net P&L", fmt(Math.round(net))],
                  ].map(([label, val]) => (
                    <div key={label} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: "10px 12px" }}>
                      <div style={{ fontFamily: "var(--sans)", fontSize: 9, letterSpacing: 1.5, color: "var(--text-dim)", textTransform: "uppercase" }}>{label}</div>
                      <div style={{ fontFamily: "var(--mono)", fontSize: 14, fontWeight: 600, color: "var(--text)", marginTop: 5 }}>{val}</div>
                    </div>
                  ))}
                </div>
                {t.notes && <div style={{ fontFamily: "var(--sans)", fontSize: 13, color: "var(--text-mid)", lineHeight: 1.7, marginBottom: 14 }}>{t.notes}</div>}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>{t.tags.map(tag => <Badge key={tag}>{tag}</Badge>)}</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn-cyan" onClick={e => { e.stopPropagation(); onEdit(t); }} style={{ fontSize: 12, padding: "7px 16px" }}>✎ Edit</button>
                  <button onClick={e => { e.stopPropagation(); if (window.confirm("Delete this trade?")) onDelete(t.id); }} style={{ background: "rgba(240,64,96,0.1)", border: "1px solid rgba(240,64,96,0.25)", color: "var(--red)", borderRadius: 8, padding: "7px 16px", cursor: "pointer", fontFamily: "var(--sans)", fontSize: 12 }}>✕ Delete</button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CALENDAR VIEW
═══════════════════════════════════════════════════════════════ */
function CalendarView({ trades }) {
  const [viewDate, setViewDate] = useState(() => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() }; });
  const [hov, setHov] = useState(null);

  const tradeMap = useMemo(() => {
    const m = {};
    trades.forEach(t => {
      if (!m[t.date]) m[t.date] = { pnl: 0, count: 0, wins: 0, losses: 0 };
      m[t.date].pnl += t.pnl - t.fees;
      m[t.date].count++;
      if (t.result === "Win") m[t.date].wins++;
      if (t.result === "Loss") m[t.date].losses++;
    });
    return m;
  }, [trades]);

  const { y, m } = viewDate;
  const firstDay = new Date(y, m, 1).getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  const dateStr = (d) => `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const maxAbs = Math.max(...Object.values(tradeMap).map(v => Math.abs(v.pnl)), 1);
  const monthPnl = Object.entries(tradeMap).filter(([k]) => k.startsWith(`${y}-${String(m + 1).padStart(2, "0")}`)).reduce((s, [, v]) => s + v.pnl, 0);

  return (
    <div className="glass-card fade-up" style={{ maxWidth: 760 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <button onClick={() => setViewDate(d => { const nm = d.m - 1; return nm < 0 ? { y: d.y - 1, m: 11 } : { y: d.y, m: nm }; })} className="btn-ghost" style={{ padding: "8px 16px", fontSize: 16 }}>‹</button>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "var(--serif)", fontSize: 24, color: "var(--text)", fontStyle: "italic" }}>{MONTHS[m]} <em style={{ color: "var(--cyan)" }}>{y}</em></div>
          <div style={{ fontFamily: "var(--mono)", fontSize: 12, color: monthPnl >= 0 ? "var(--green)" : "var(--red)", marginTop: 2, fontWeight: 600 }}>{monthPnl !== 0 ? fmt(monthPnl) : "No trades this month"}</div>
        </div>
        <button onClick={() => setViewDate(d => { const nm = d.m + 1; return nm > 11 ? { y: d.y + 1, m: 0 } : { y: d.y, m: nm }; })} className="btn-ghost" style={{ padding: "8px 16px", fontSize: 16 }}>›</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 5, marginBottom: 5 }}>
        {DAYS.map(d => <div key={d} style={{ textAlign: "center", fontFamily: "var(--sans)", fontSize: 10, color: "var(--text-dim)", letterSpacing: 1.5, padding: "4px 0", textTransform: "uppercase" }}>{d}</div>)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 5 }}>
        {cells.map((d, i) => {
          if (!d) return <div key={`e${i}`} />;
          const key = dateStr(d);
          const data = tradeMap[key];
          const isToday = new Date().toISOString().slice(0, 10) === key;
          const alpha = data ? Math.min(0.88, 0.18 + (Math.abs(data.pnl) / maxAbs) * 0.7) : 0;
          const bgColor = data ? (data.pnl >= 0 ? `rgba(14,204,109,${alpha})` : `rgba(240,64,96,${alpha})`) : "rgba(255,255,255,0.02)";
          return (
            <div key={d} style={{ minHeight: 62, borderRadius: 10, padding: "7px 9px", background: bgColor, border: `1px solid ${isToday ? "var(--cyan)" : data ? "transparent" : "rgba(255,255,255,0.05)"}`, cursor: data ? "pointer" : "default", position: "relative", transition: "transform .1s", boxShadow: isToday ? "0 0 0 2px rgba(0,212,255,0.3)" : "none" }}
              onMouseEnter={e => { data && (e.currentTarget.style.transform = "scale(1.05)"); setHov(key); }}
              onMouseLeave={e => { e.currentTarget.style.transform = ""; setHov(null); }}
            >
              <div style={{ fontFamily: "var(--mono)", fontSize: 11, fontWeight: isToday ? 700 : 400, color: isToday ? "var(--cyan)" : data ? "#fff" : "var(--text-dim)" }}>{d}</div>
              {data && (
                <>
                  <div style={{ fontFamily: "var(--mono)", fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,.9)", marginTop: 3 }}>{fmt(data.pnl)}</div>
                  <div style={{ fontFamily: "var(--sans)", fontSize: 9, color: "rgba(255,255,255,.55)", marginTop: 1 }}>{data.count}t</div>
                </>
              )}
              {hov === key && data && (
                <div style={{ position: "absolute", bottom: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)", background: "rgba(5,5,18,.97)", border: "1px solid rgba(0,212,255,0.25)", borderRadius: 10, padding: "10px 14px", zIndex: 20, whiteSpace: "nowrap", fontFamily: "var(--mono)", fontSize: 11, boxShadow: "0 8px 24px rgba(0,0,0,0.6)", pointerEvents: "none" }}>
                  <div style={{ color: "var(--cyan)", marginBottom: 5, fontWeight: 600 }}>{key}</div>
                  <div>Net: <span style={{ color: data.pnl >= 0 ? "var(--green)" : "var(--red)", fontWeight: 700 }}>{fmt(data.pnl)}</span></div>
                  <div style={{ color: "var(--text-dim)", marginTop: 3 }}>{data.wins}W / {data.losses}L / {data.count - data.wins - data.losses}BE</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 20, marginTop: 20, justifyContent: "center" }}>
        {[["Profit Day", "#0ECC6D"], ["Loss Day", "#F04060"], ["No Trades", "rgba(255,255,255,0.08)"]].map(([l, c]) => (
          <div key={l} style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <div style={{ width: 14, height: 14, borderRadius: 4, background: c }} />
            <span style={{ fontFamily: "var(--sans)", fontSize: 11, color: "var(--text-dim)" }}>{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   RISK CALCULATOR
═══════════════════════════════════════════════════════════════ */
function RiskCalculator({ settings }) {
  const [calc, setCalc] = useState({ capital: settings.capital || "1000000", riskPct: settings.riskPct || "1", entry: "", stoploss: "", target: "", type: "Long" });
  const set = (k, v) => setCalc(f => ({ ...f, [k]: v }));

  const result = useMemo(() => {
    const cap = parseFloat(calc.capital), riskP = parseFloat(calc.riskPct), entry = parseFloat(calc.entry), sl = parseFloat(calc.stoploss), tgt = parseFloat(calc.target);
    if (!cap || !riskP || !entry || !sl) return null;
    const riskAmt = (cap * riskP) / 100;
    const slDist = Math.abs(entry - sl);
    if (slDist <= 0) return null;
    const qty = Math.floor(riskAmt / slDist);
    const maxLoss = qty * slDist;
    const rr = tgt ? (Math.abs(tgt - entry) / slDist).toFixed(2) : null;
    const potentialProfit = tgt ? qty * Math.abs(tgt - entry) : null;
    const slPct = ((slDist / entry) * 100).toFixed(2);
    return { riskAmt, qty, maxLoss, slDist, rr, potentialProfit, slPct };
  }, [calc]);

  return (
    <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 800 }}>
      <div className="glass-card-cyan" style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ fontSize: 32, opacity: .6 }}>🎯</div>
        <div>
          <div style={{ fontFamily: "var(--serif)", fontSize: 20, fontStyle: "italic", color: "var(--text)" }}>Position Size Calculator</div>
          <div style={{ fontFamily: "var(--sans)", fontSize: 12, color: "var(--text-dim)", marginTop: 3 }}>Calculate exact position size based on your risk parameters. Never risk more than you plan.</div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div className="glass-card">
          <div className="section-label">Risk Parameters</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[{ label: "Trading Capital (₹)", key: "capital", placeholder: "1000000" }, { label: "Risk Per Trade (%)", key: "riskPct", placeholder: "1" }].map(({ label, key, placeholder }) => (
              <div key={key}><label style={{ fontFamily: "var(--sans)", fontSize: 10, letterSpacing: 1.5, color: "var(--text-dim)", textTransform: "uppercase", display: "block", marginBottom: 5 }}>{label}</label><input type="number" placeholder={placeholder} value={calc[key]} onChange={e => set(key, e.target.value)} /></div>
            ))}
            <div>
              <label style={{ fontFamily: "var(--sans)", fontSize: 10, letterSpacing: 1.5, color: "var(--text-dim)", textTransform: "uppercase", display: "block", marginBottom: 5 }}>Direction</label>
              <div style={{ display: "flex", gap: 0, background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: 3, border: "1px solid var(--border)" }}>
                {["Long", "Short"].map(t => (
                  <button key={t} onClick={() => set("type", t)} style={{ flex: 1, padding: "8px", borderRadius: 8, border: "none", cursor: "pointer", fontFamily: "var(--sans)", fontWeight: 600, fontSize: 12, transition: "all .15s", background: calc.type === t ? (t === "Long" ? "rgba(14,204,109,0.18)" : "rgba(240,64,96,0.18)") : "transparent", color: calc.type === t ? (t === "Long" ? "var(--green)" : "var(--red)") : "var(--text-dim)" }}>{t === "Long" ? "▲ Long" : "▼ Short"}</button>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="glass-card">
          <div className="section-label">Trade Levels</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[{ label: "Entry Price (₹)", key: "entry", placeholder: "22400" }, { label: "Stop Loss (₹)", key: "stoploss", placeholder: "22200" }, { label: "Target Price (₹) — optional", key: "target", placeholder: "22900" }].map(({ label, key, placeholder }) => (
              <div key={key}><label style={{ fontFamily: "var(--sans)", fontSize: 10, letterSpacing: 1.5, color: "var(--text-dim)", textTransform: "uppercase", display: "block", marginBottom: 5 }}>{label}</label><input type="number" placeholder={placeholder} value={calc[key]} onChange={e => set(key, e.target.value)} /></div>
            ))}
          </div>
        </div>
      </div>
      {result && (
        <div className="glass-card-cyan fade-up">
          <div className="section-label">Position Sizing Result</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
            {[
              { label: "Position Size", value: result.qty.toLocaleString("en-IN"), color: "var(--cyan)", desc: "shares / units", big: true },
              { label: "Max Risk Amount", value: fmtS(Math.round(result.riskAmt)), color: "var(--red)", desc: `${calc.riskPct}% of capital` },
              { label: "Stop Distance", value: `₹${result.slDist.toFixed(2)}`, color: "var(--text-mid)", desc: `${result.slPct}% from entry` },
              ...(result.rr ? [{ label: "Risk : Reward", value: `1 : ${result.rr}`, color: parseFloat(result.rr) >= 2 ? "var(--green)" : parseFloat(result.rr) >= 1.5 ? "var(--gold)" : "var(--red)", desc: parseFloat(result.rr) >= 2 ? "Excellent" : "Acceptable" }] : []),
              ...(result.potentialProfit ? [{ label: "Potential Profit", value: fmtS(Math.round(result.potentialProfit)), color: "var(--green)", desc: "if target hit" }] : []),
            ].map(({ label, value, color, desc, big }) => (
              <div key={label} style={{ background: color + "0d", border: `1px solid ${color}22`, borderRadius: 12, padding: "14px 16px", textAlign: "center" }}>
                <div style={{ fontFamily: "var(--sans)", fontSize: 9, letterSpacing: 2, color: "var(--text-dim)", textTransform: "uppercase", marginBottom: 8 }}>{label}</div>
                <div style={{ fontFamily: "var(--mono)", fontSize: big ? 26 : 18, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
                <div style={{ fontFamily: "var(--sans)", fontSize: 10, color: "var(--text-dim)", marginTop: 6 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PLAYBOOK
═══════════════════════════════════════════════════════════════ */
function Playbook({ playbook, setPlaybook }) {
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const emptySetup = { id: null, name: "", type: "Long", market: "Trending", setup: "", entry: "", exit: "", stoploss: "", rr: "", notes: "" };

  const save = () => {
    if (!form.name) return;
    if (form.id) { setPlaybook(p => p.map(x => x.id === form.id ? form : x)); }
    else { setPlaybook(p => [...p, { ...form, id: uid() }]); }
    setEditingId(null); setForm(null); setShowNew(false);
  };

  const del = (id) => { if (window.confirm("Delete this setup?")) setPlaybook(p => p.filter(x => x.id !== id)); };

  const FIELD_COLOR = { Long: "var(--green)", Short: "var(--red)", Both: "var(--cyan)" };

  if (form) return (
    <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 780 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontFamily: "var(--serif)", fontSize: 24, fontStyle: "italic" }}>{form.id ? "Edit Setup" : "New Setup"}</div>
        <button className="btn-ghost" onClick={() => { setForm(null); setShowNew(false); setEditingId(null); }}>← Back</button>
      </div>
      <div className="glass-card">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {[["Setup Name", "name", "ORB Breakout"], ["R:R Target", "rr", "1:2 to 1:3"], ["Entry Trigger", "entry", "Buy at ORH + buffer"], ["Exit Rule", "exit", "PDH or 2x ATR"], ["Stop Loss", "stoploss", "Below ORH or ORL"]].map(([l, k, p]) => (
            <div key={k}>
              <label style={{ fontFamily: "var(--sans)", fontSize: 10, letterSpacing: 1.5, color: "var(--text-dim)", textTransform: "uppercase", display: "block", marginBottom: 5 }}>{l}</label>
              <input placeholder={p} value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} />
            </div>
          ))}
          <div>
            <label style={{ fontFamily: "var(--sans)", fontSize: 10, letterSpacing: 1.5, color: "var(--text-dim)", textTransform: "uppercase", display: "block", marginBottom: 5 }}>Direction</label>
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}><option>Long</option><option>Short</option><option>Both</option></select>
          </div>
          <div>
            <label style={{ fontFamily: "var(--sans)", fontSize: 10, letterSpacing: 1.5, color: "var(--text-dim)", textTransform: "uppercase", display: "block", marginBottom: 5 }}>Market Condition</label>
            <select value={form.market} onChange={e => setForm(f => ({ ...f, market: e.target.value }))}><option>Trending</option><option>Ranging</option><option>Volatile</option><option>Any</option></select>
          </div>
          <div style={{ gridColumn: "1/-1" }}>
            <label style={{ fontFamily: "var(--sans)", fontSize: 10, letterSpacing: 1.5, color: "var(--text-dim)", textTransform: "uppercase", display: "block", marginBottom: 5 }}>Setup Description</label>
            <textarea rows={3} placeholder="Describe the full setup..." value={form.setup} onChange={e => setForm(f => ({ ...f, setup: e.target.value }))} />
          </div>
          <div style={{ gridColumn: "1/-1" }}>
            <label style={{ fontFamily: "var(--sans)", fontSize: 10, letterSpacing: 1.5, color: "var(--text-dim)", textTransform: "uppercase", display: "block", marginBottom: 5 }}>Notes & Caveats</label>
            <textarea rows={2} placeholder="When NOT to trade this, caveats, tips..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button className="btn-gold" onClick={save}>✓ Save Setup</button>
          <button className="btn-ghost" onClick={() => { setForm(null); setEditingId(null); setShowNew(false); }}>Cancel</button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button className="btn-gold" onClick={() => { setForm({ ...emptySetup }); setShowNew(true); }}>+ New Setup</button>
      </div>
      {playbook.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-dim)", fontFamily: "var(--mono)", fontSize: 13 }}>No setups yet. Build your playbook!</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 14 }}>
          {playbook.map(s => (
            <div key={s.id} className="glass-card fade-up" style={{ borderTop: `2px solid ${FIELD_COLOR[s.type] || "var(--cyan)"}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <div style={{ fontFamily: "var(--serif)", fontSize: 18, fontStyle: "italic", color: "var(--text)" }}>{s.name}</div>
                  <div style={{ display: "flex", gap: 6, marginTop: 5 }}>
                    <Badge color={FIELD_COLOR[s.type]}>{s.type}</Badge>
                    <Badge color="var(--text-dim)">{s.market}</Badge>
                    {s.rr && <Badge color="var(--gold)">{s.rr}</Badge>}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 5 }}>
                  <button className="btn-ghost" style={{ padding: "5px 10px", fontSize: 11 }} onClick={() => setForm({ ...s })}>✎</button>
                  <button onClick={() => del(s.id)} style={{ background: "rgba(240,64,96,0.08)", border: "1px solid rgba(240,64,96,0.2)", color: "var(--red)", borderRadius: 7, padding: "5px 10px", cursor: "pointer", fontSize: 11 }}>✕</button>
                </div>
              </div>
              {s.setup && <div style={{ fontFamily: "var(--sans)", fontSize: 12, color: "var(--text-mid)", lineHeight: 1.7, marginBottom: 10 }}>{s.setup}</div>}
              {[["Entry", s.entry], ["Exit", s.exit], ["Stop Loss", s.stoploss]].map(([l, v]) => v && (
                <div key={l} style={{ display: "flex", gap: 8, marginBottom: 5 }}>
                  <span style={{ fontFamily: "var(--sans)", fontSize: 10, color: "var(--text-dim)", width: 50, flexShrink: 0 }}>{l}:</span>
                  <span style={{ fontFamily: "var(--sans)", fontSize: 12, color: "var(--text)" }}>{v}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   AI COACH
═══════════════════════════════════════════════════════════════ */
function AICoach({ trades }) {
  const [activeSection, setActiveSection] = useState("overview");
  const SECTIONS = ["overview", "strengths", "weaknesses", "advice"];

  const result = useMemo(() => {
    if (trades.length < 3) return null;
    const wins = trades.filter(t => t.result === "Win");
    const losses = trades.filter(t => t.result === "Loss");
    const winRate = wins.length / Math.max(wins.length + losses.length, 1);
    const totalNet = trades.reduce((s, t) => s + t.pnl - t.fees, 0);
    const avgWin  = wins.length   ? wins.reduce((s, t) => s + t.pnl - t.fees, 0) / wins.length   : 0;
    const avgLoss = losses.length ? losses.reduce((s, t) => s + t.pnl - t.fees, 0) / losses.length : 0;
    const rr = avgLoss ? Math.abs(avgWin / avgLoss) : 0;
    const totalFees = trades.reduce((s, t) => s + t.fees, 0);
    const tagPerf = {};
    trades.forEach(t => t.tags.forEach(tag => { if (!tagPerf[tag]) tagPerf[tag] = { count: 0, pnl: 0, wins: 0 }; tagPerf[tag].count++; tagPerf[tag].pnl += t.pnl - t.fees; if (t.result === "Win") tagPerf[tag].wins++; }));
    const tagEntries = Object.entries(tagPerf).sort(([, a], [, b]) => b.pnl - a.pnl);
    const bestTag = tagEntries[0] || null;
    const worstTag = tagEntries[tagEntries.length - 1] || null;
    const symPerf = {};
    trades.forEach(t => { if (!symPerf[t.symbol]) symPerf[t.symbol] = { count: 0, pnl: 0, wins: 0 }; symPerf[t.symbol].count++; symPerf[t.symbol].pnl += t.pnl - t.fees; if (t.result === "Win") symPerf[t.symbol].wins++; });
    const symEntries = Object.entries(symPerf).sort(([, a], [, b]) => b.pnl - a.pnl);
    const bestSym = symEntries[0] || null;
    const worstSym = symEntries[symEntries.length - 1] || null;
    const strengths = [], weaknesses = [], advice = [];
    if (winRate >= 0.65) strengths.push(`Excellent win rate of ${(winRate * 100).toFixed(0)}% — your setups have strong accuracy.`);
    else if (winRate >= 0.5) strengths.push(`Above-average win rate of ${(winRate * 100).toFixed(0)}%. Keep it above 50%.`);
    else weaknesses.push(`Low win rate of ${(winRate * 100).toFixed(0)}%. Focus on trade selection and patience.`);
    if (rr >= 2) strengths.push(`Outstanding R:R ratio of ${rr.toFixed(2)}. Letting winners run effectively.`);
    else if (rr >= 1.5) strengths.push(`Solid R:R ratio of ${rr.toFixed(2)}.`);
    else weaknesses.push(`Low R:R ratio of ${rr.toFixed(2)}. Cut losses faster or hold winners longer.`);
    if (totalNet > 0) strengths.push("Net positive P&L — you are profitable. Maintain discipline.");
    else weaknesses.push("Net negative P&L. Review your setup quality and risk management.");
    if (totalFees / Math.max(Math.abs(totalNet), 1) > 0.15) weaknesses.push("High fee-to-profit ratio. Consider reducing trade frequency or negotiating better brokerage.");
    if (bestTag) advice.push(`Your best setup is "${bestTag[0]}" — focus more time on this.`);
    if (worstTag && worstTag !== bestTag) advice.push(`Your worst setup is "${worstTag[0]}" — review if this is worth keeping in your playbook.`);
    if (winRate < 0.5) advice.push("Raise your entry bar — wait for A+ setups only.");
    if (rr < 1.5) advice.push("Use fixed R:R trades (min 1:2). Take profit at 2x your stop loss.");
    advice.push("Log every trade with detailed notes — pattern recognition compounds over time.");
    return { winRate, totalNet, avgWin, avgLoss, rr, bestTag, worstTag, bestSym, worstSym, strengths, weaknesses, advice };
  }, [trades]);

  if (trades.length < 3) return (
    <div style={{ textAlign: "center", padding: "80px 0", color: "var(--text-dim)", fontFamily: "var(--mono)", fontSize: 14 }}>
      Add at least 3 trades to unlock AI Coach analysis.
    </div>
  );
  if (!result) return null;

  return (
    <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 900 }}>
      <div className="glass-card-cyan">
        <div style={{ fontFamily: "var(--serif)", fontSize: 22, fontStyle: "italic", marginBottom: 16, color: "var(--text)" }}>Performance <em style={{ color: "var(--cyan)" }}>Intelligence</em></div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 12 }}>
          {[
            ["Win Rate", `${(result.winRate * 100).toFixed(0)}%`, result.winRate >= 0.6 ? "var(--green)" : result.winRate >= 0.45 ? "var(--gold)" : "var(--red)"],
            ["Net P&L", fmt(Math.round(result.totalNet)), result.totalNet >= 0 ? "var(--green)" : "var(--red)"],
            ["Risk/Reward", result.rr >= 1.5 ? `1:${result.rr.toFixed(2)}` : `1:${result.rr.toFixed(2)}`, result.rr >= 2 ? "var(--green)" : result.rr >= 1.5 ? "var(--gold)" : "var(--red)"],
            ["Total Trades", trades.length.toString(), "var(--cyan)"],
          ].map(([l, v, c]) => (
            <div key={l} style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "var(--sans)", fontSize: 9, letterSpacing: 1.5, color: "var(--text-dim)", textTransform: "uppercase", marginBottom: 5 }}>{l}</div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 16, fontWeight: 700, color: c }}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: 4, border: "1px solid var(--border)", width: "fit-content" }}>
        {SECTIONS.map(s => (
          <button key={s} onClick={() => setActiveSection(s)} style={{
            background: activeSection === s ? "var(--glass2)" : "transparent",
            color: activeSection === s ? "var(--cyan)" : "var(--text-dim)",
            border: activeSection === s ? "1px solid var(--cyan-border)" : "1px solid transparent",
            borderRadius: 8, padding: "7px 18px",
            fontFamily: "var(--sans)", fontWeight: 600, fontSize: 12, cursor: "pointer",
            textTransform: "capitalize", transition: "all .2s",
          }}>{s === "overview" ? "📊 Overview" : s === "strengths" ? "✅ Strengths" : s === "weaknesses" ? "⚠️ Weaknesses" : "💡 Action Plan"}</button>
        ))}
      </div>

      {activeSection === "overview" && (
        <div className="glass-card slide-l" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[
            { label: "BEST SETUP", tag: result.bestTag, color: "var(--green)" },
            { label: "WORST SETUP", tag: result.worstTag, color: "var(--red)" },
            { label: "BEST SYMBOL", tag: result.bestSym, color: "var(--green)", isSym: true },
            { label: "AVOID SYMBOL", tag: result.worstSym, color: "var(--red)", isSym: true },
          ].map(({ label, tag, color, isSym }) => tag && (
            <div key={label} style={{ background: `${color}08`, border: `1px solid ${color}20`, borderRadius: 12, padding: "14px 16px" }}>
              <div style={{ fontFamily: "var(--sans)", fontSize: 9, letterSpacing: 2, color, textTransform: "uppercase", marginBottom: 6 }}>{label}</div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 16, fontWeight: 700, color: isSym ? "var(--cyan)" : "var(--text)" }}>{tag[0]}</div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 12, color, marginTop: 4 }}>{fmt(tag[1].pnl)} · {tag[1].count} trades</div>
            </div>
          ))}
        </div>
      )}

      {activeSection === "strengths" && (
        <div className="glass-card slide-l">
          {result.strengths.length === 0 ? <p style={{ fontFamily: "var(--sans)", fontSize: 13, color: "var(--text-dim)" }}>Log more trades to identify strengths.</p> : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {result.strengths.map((s, i) => (
                <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "12px 16px", background: "rgba(14,204,109,0.05)", borderRadius: 10, borderLeft: "3px solid var(--green)" }}>
                  <span style={{ color: "var(--green)", fontFamily: "var(--mono)", fontSize: 14 }}>✓</span>
                  <span style={{ fontFamily: "var(--sans)", fontSize: 13, color: "var(--text)", lineHeight: 1.7 }}>{s}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeSection === "weaknesses" && (
        <div className="glass-card slide-l">
          {result.weaknesses.length === 0 ? <p style={{ fontFamily: "var(--sans)", fontSize: 13, color: "var(--text-mid)" }}>No major weaknesses detected. Keep it up!</p> : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {result.weaknesses.map((s, i) => (
                <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "12px 16px", background: "rgba(240,64,96,0.05)", borderRadius: 10, borderLeft: "3px solid var(--red)" }}>
                  <span style={{ color: "var(--red)", fontFamily: "var(--mono)", fontSize: 14 }}>⚠</span>
                  <span style={{ fontFamily: "var(--sans)", fontSize: 13, color: "var(--text)", lineHeight: 1.7 }}>{s}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeSection === "advice" && (
        <div className="glass-card slide-l">
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {result.advice.map((s, i) => (
              <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "12px 16px", background: "rgba(0,212,255,0.04)", borderRadius: 10, borderLeft: "3px solid var(--cyan)" }}>
                <span style={{ color: "var(--cyan)", fontFamily: "var(--mono)", fontSize: 13, marginTop: 1, minWidth: 20 }}>{i + 1}.</span>
                <span style={{ fontFamily: "var(--sans)", fontSize: 13, color: "var(--text)", lineHeight: 1.7 }}>{s}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SETTINGS
═══════════════════════════════════════════════════════════════ */
function Settings({ settings, setSettings, trades, setTrades }) {
  const [s, setS] = useState(settings);
  const [msg, setMsg] = useState("");
  const set = (k, v) => setS(f => ({ ...f, [k]: v }));
  const notify = (m) => { setMsg(m); setTimeout(() => setMsg(""), 2500); };
  const save = () => { setSettings(s); notify("✓ Settings saved successfully!"); };
  const exportData = () => {
    const blob = new Blob([JSON.stringify({ trades, settings: s, exported: new Date().toISOString() }, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `trading-journal-v4-${new Date().toISOString().slice(0, 10)}.json`; a.click();
    notify("✓ Exported!");
  };
  const importData = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (data.trades) setTrades(data.trades.map(hydratePnl));
        if (data.settings) setSettings(data.settings);
        notify(`✓ Imported ${data.trades?.length || 0} trades!`);
      } catch { notify("✕ Invalid file format"); }
    };
    reader.readAsText(file);
  };
  const storageSize = (() => { try { return (localStorage.getItem(STORAGE_KEY)?.length / 1024 || 0).toFixed(1) + "KB"; } catch { return "N/A"; } })();

  return (
    <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 680 }}>
      {msg && <div style={{ background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.25)", borderRadius: 10, padding: "12px 18px", fontFamily: "var(--mono)", fontSize: 13, color: "var(--cyan)", animation: "fadeIn .3s ease" }}>{msg}</div>}
      <div className="glass-card">
        <div className="section-label">Account Settings</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {[["Trader Name", "name", "text", "Your name"], ["Trading Capital (₹)", "capital", "number", "1000000"], ["Risk Per Trade (%)", "riskPct", "number", "1"], ["Daily Loss Limit (₹)", "dailyLimit", "number", "5000"], ["Max Trades / Day", "maxTrades", "number", "3"]].map(([l, k, t, p]) => (
            <div key={k}><label style={{ fontFamily: "var(--sans)", fontSize: 10, letterSpacing: 1.5, color: "var(--text-dim)", textTransform: "uppercase", display: "block", marginBottom: 5 }}>{l}</label><input type={t} placeholder={p} value={s[k] || ""} onChange={e => set(k, e.target.value)} /></div>
          ))}
          <div>
            <label style={{ fontFamily: "var(--sans)", fontSize: 10, letterSpacing: 1.5, color: "var(--text-dim)", textTransform: "uppercase", display: "block", marginBottom: 5 }}>Primary Exchange</label>
            <select value={s.exchange || "NSE"} onChange={e => set("exchange", e.target.value)}>
              <option>NSE</option><option>BSE</option><option>NSE+BSE</option><option>MCX</option>
            </select>
          </div>
        </div>
        <button className="btn-gold" onClick={save} style={{ marginTop: 18 }}>Save Settings</button>
      </div>

      <div className="glass-card">
        <div className="section-label">Data Management</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "var(--glass)", border: "1px solid var(--border)", borderRadius: 10 }}>
            <div>
              <div style={{ fontFamily: "var(--sans)", fontSize: 13, color: "var(--text)", fontWeight: 500 }}>Local Storage</div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-dim)", marginTop: 2 }}>{storageSize} used · {STOCK_DB_DEDUPED.length} stocks in database</div>
            </div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 13, color: "var(--cyan)", fontWeight: 600 }}>{trades.length} trades</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <button className="btn-gold" onClick={exportData}>⬇ Export JSON</button>
            <label className="btn-outline" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer", borderRadius: 10, padding: "9px 20px" }}>⬆ Import JSON<input type="file" accept=".json" onChange={importData} style={{ display: "none" }} /></label>
            <button onClick={() => { if (window.confirm("Reset to sample data?")) { setTrades(SAMPLE); notify("✓ Reset to sample"); } }} className="btn-ghost">Reset to Sample</button>
            <button onClick={() => { if (window.confirm("Delete ALL trades?")) { setTrades([]); notify("✓ All trades cleared"); } }} className="btn-ghost" style={{ color: "var(--red)", borderColor: "rgba(240,64,96,0.25)" }}>Clear All Trades</button>
          </div>
        </div>
      </div>

      <div className="glass-card" style={{ borderLeft: "3px solid var(--cyan)" }}>
        <div style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--text-dim)", lineHeight: 2.2 }}>
          {["All data stored locally in your browser — zero cloud dependency", `${STOCK_DB_DEDUPED.length}+ NSE & BSE stocks in autocomplete database`, "Export JSON before clearing data — cannot be recovered", "TradingView charts load live data from NSE/BSE", "No API key required — everything runs locally"].map((t, i) => <div key={i}>◈ {t}</div>)}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   AMBIENT BACKGROUND
═══════════════════════════════════════════════════════════════ */
function AmbientBackground() {
  return (
    <>
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", backgroundImage: `radial-gradient(circle, rgba(0,212,255,0.035) 1px, transparent 1px)`, backgroundSize: "28px 28px", maskImage: "radial-gradient(ellipse at 50% 50%, black 40%, transparent 100%)", WebkitMaskImage: "radial-gradient(ellipse at 50% 50%, black 40%, transparent 100%)" }} />
      <div className="ambient-blob" style={{ width: 500, height: 500, top: "-10%", left: "-5%", background: "rgba(0,80,160,0.1)", animationDelay: "0s" }} />
      <div className="ambient-blob" style={{ width: 600, height: 600, bottom: "-15%", right: "-10%", background: "rgba(10,60,30,0.08)", animationDelay: "-4s" }} />
      <div className="ambient-blob" style={{ width: 350, height: 350, top: "40%", left: "40%", background: "rgba(0,212,255,0.03)", animationDelay: "-2s" }} />
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════
   DEFAULT DATA
═══════════════════════════════════════════════════════════════ */
const DEFAULT_SETTINGS = { capital: "", riskPct: "1", dailyLimit: "", maxTrades: "3", name: "", exchange: "NSE" };
const DEFAULT_PLAYBOOK = [
  { id: 1, name: "ORB Breakout", type: "Long", market: "Trending", setup: "Price breaks above Opening Range High (first 15-min candle) with volume surge > 1.5x avg.", entry: "Buy at ORH + small buffer on 5-min close above", exit: "Previous day high or 2x ATR from entry", stoploss: "Below ORH or Opening Range Low", rr: "1:2 to 1:3", notes: "Best in strong trending markets. Avoid on expiry or major news days." },
  { id: 2, name: "PDH Rejection Short", type: "Short", market: "Ranging", setup: "Price touches Previous Day High and shows reversal candle (engulfing, pin bar) on 15-min chart.", entry: "Short on close below reversal candle low", exit: "Previous Day Low or VWAP", stoploss: "Above PDH by 0.2%", rr: "1:2", notes: "Strong R:R setup. Works well in Bank Nifty. Avoid in strong trending days." },
  { id: 3, name: "VWAP Bounce", type: "Both", market: "Trending", setup: "Price pulls back to VWAP and shows bounce candle. Trade in direction of overall trend.", entry: "At VWAP touch with confirmation candle", exit: "Previous swing high/low", stoploss: "Opposite side of VWAP by 0.15%", rr: "1:2", notes: "High probability in trending markets. Multiple re-entries possible." },
];

/* ═══════════════════════════════════════════════════════════════
   NEWS TAB — Real news via Google News RSS (no API key needed)
═══════════════════════════════════════════════════════════════ */
function NewsTab() {
  const [query, setQuery]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [articles, setArticles] = useState([]);
  const [searched, setSearched] = useState("");
  const [error, setError]       = useState("");

  /* Parse a single <item> node from RSS DOM */
  const parseItem = (item) => {
    const getText = (tag) => item.querySelector(tag)?.textContent?.trim() || "";
    const raw = getText("title");
    // Google News titles are "Headline - Source"
    const dashIdx = raw.lastIndexOf(" - ");
    const headline = dashIdx > 0 ? raw.slice(0, dashIdx) : raw;
    const source   = dashIdx > 0 ? raw.slice(dashIdx + 3) : "News";
    const link     = getText("link") || item.querySelector("link")?.nextSibling?.textContent?.trim() || "#";
    const pubDate  = getText("pubDate");
    const desc     = getText("description").replace(/<[^>]+>/g, "").slice(0, 220);
    let date = "";
    try { date = new Date(pubDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); } catch {}
    return { headline, source, link, date, desc };
  };

  const fetchNews = async (companyName) => {
    if (!companyName.trim()) return;
    setLoading(true);
    setError("");
    setArticles([]);
    setSearched(companyName.trim());

    // Google News RSS — free, no key, real results
    const q = encodeURIComponent(`${companyName.trim()} NSE BSE stock`);
    const rssUrl = `https://news.google.com/rss/search?q=${q}&hl=en-IN&gl=IN&ceid=IN:en`;
    // CORS proxy (free, no auth)
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(rssUrl)}`;

    try {
      const res = await fetch(proxyUrl);
      if (!res.ok) throw new Error("Network error");
      const json = await res.json();
      const xmlStr = json.contents;
      const parser = new DOMParser();
      const xml = parser.parseFromString(xmlStr, "application/xml");
      const items = Array.from(xml.querySelectorAll("item")).slice(0, 15);
      if (items.length === 0) throw new Error("No articles found");
      setArticles(items.map(parseItem));
    } catch (e) {
      setError("Could not load news. Check your internet connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => fetchNews(query);
  const handleKey = (e) => { if (e.key === "Enter") fetchNews(query); };

  /* Colour-code source names */
  const sourceColor = (src) => {
    const s = src.toLowerCase();
    if (s.includes("economic times") || s.includes("et ")) return "#FF8C00";
    if (s.includes("moneycontrol"))  return "#1A73E8";
    if (s.includes("mint") || s.includes("livemint")) return "#00B0FF";
    if (s.includes("business standard")) return "#E53935";
    if (s.includes("ndtv"))          return "#D32F2F";
    if (s.includes("reuters"))       return "#FF6600";
    if (s.includes("bloomberg"))     return "#6B4FBB";
    if (s.includes("cnbc"))          return "#005DAA";
    if (s.includes("hindu"))         return "#1B5E20";
    return "var(--gold)";
  };

  /* Relative time label */
  const relTime = (dateStr) => {
    if (!dateStr) return "";
    try {
      const diff = Date.now() - new Date(dateStr).getTime(); // rough
      return "";
    } catch { return ""; }
  };

  return (
    <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Search Bar */}
      <div className="glass-card-gold" style={{ padding: "20px 24px" }}>
        <div style={{ fontFamily: "var(--gothic)", fontSize: 9, color: "var(--text-dim)", letterSpacing: 3, textTransform: "uppercase", marginBottom: 12 }}>
          ◈ Live Company News — Google News RSS
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ flex: 1, position: "relative" }}>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Type company name or ticker — e.g. Reliance, TCS, EIEL, Infosys, HDFC Bank..."
              style={{ paddingLeft: "44px !important", fontSize: "14px !important", height: 46 }}
            />
            <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 18, pointerEvents: "none", opacity: .5 }}>🔍</span>
          </div>
          <button
            className="btn-gold"
            onClick={handleSearch}
            disabled={loading || !query.trim()}
            style={{ height: 46, padding: "0 28px", fontSize: 12, flexShrink: 0, opacity: loading || !query.trim() ? .5 : 1 }}
          >
            {loading ? "Loading..." : "Get News"}
          </button>
        </div>
        <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-dim)", marginTop: 10, opacity: .6 }}>
          📡 Live results from Google News · No API key · Real articles · Press Enter to search
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "60px 0" }}>
          <div className="spin" style={{ width: 40, height: 40, border: "3px solid rgba(232,184,75,0.15)", borderTopColor: "var(--gold)", borderRadius: "50%" }} />
          <div style={{ fontFamily: "var(--gothic)", fontSize: 11, color: "var(--gold)", letterSpacing: 2, textTransform: "uppercase" }}>
            Fetching live news for "{query}"...
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="glass-card" style={{ borderColor: "var(--red)", padding: "16px 20px", color: "var(--red)", fontFamily: "var(--mono)", fontSize: 12 }}>
          ⚠ {error}
        </div>
      )}

      {/* Results */}
      {articles.length > 0 && !loading && (
        <>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
            <div>
              <div style={{ fontFamily: "var(--serif)", fontSize: 22, fontWeight: 700, color: "var(--text)" }}>
                News for <em style={{ color: "var(--gold)", fontStyle: "italic" }}>{searched}</em>
              </div>
              <div style={{ fontFamily: "var(--gothic)", fontSize: 9, color: "var(--text-dim)", letterSpacing: 2, marginTop: 4 }}>
                {articles.length} articles · Live from Google News · Click any card to read full article
              </div>
            </div>
            <div style={{ background: "rgba(0,220,255,0.06)", border: "1px solid var(--cyan-border)", borderRadius: 10, padding: "8px 18px", fontFamily: "var(--mono)", fontSize: 11, color: "var(--cyan)" }}>
              📡 {articles.length} live results
            </div>
          </div>

          {/* Article Cards */}
          <div className="stagger" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {articles.map((article, i) => (
              <a
                key={i}
                href={article.link}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: "none" }}
              >
                <div
                  className="fade-up glass-card"
                  style={{
                    borderLeft: "3px solid var(--gold-border)",
                    padding: "16px 20px",
                    transition: "transform .18s, box-shadow .18s, border-color .18s",
                    cursor: "pointer",
                    animationDelay: `${i * 0.05}s`,
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = "translateX(5px)";
                    e.currentTarget.style.borderLeftColor = "var(--cyan)";
                    e.currentTarget.style.boxShadow = "0 6px 40px rgba(0,0,0,0.55), -3px 0 0 var(--cyan), 0 0 28px rgba(0,220,255,0.1)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = "";
                    e.currentTarget.style.borderLeftColor = "var(--gold-border)";
                    e.currentTarget.style.boxShadow = "";
                  }}
                >
                  {/* Source + Date row */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 9, flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: sourceColor(article.source), boxShadow: `0 0 6px ${sourceColor(article.source)}88`, flexShrink: 0 }} />
                      <span style={{ fontFamily: "var(--gothic)", fontSize: 9.5, color: sourceColor(article.source), letterSpacing: 1.2, textTransform: "uppercase", fontWeight: 700 }}>
                        {article.source}
                      </span>
                    </div>
                    <div style={{ width: 1, height: 12, background: "var(--border)" }} />
                    <span style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--text-dim)" }}>
                      📅 {article.date}
                    </span>
                    <div style={{ flex: 1 }} />
                    <span style={{ fontFamily: "var(--gothic)", fontSize: 8.5, color: "var(--cyan)", letterSpacing: 1, opacity: .7 }}>
                      READ ↗
                    </span>
                  </div>

                  {/* Headline */}
                  <div style={{ fontFamily: "var(--serif)", fontSize: 15.5, fontWeight: 700, color: "var(--text)", lineHeight: 1.45, marginBottom: article.desc ? 8 : 0 }}>
                    {article.headline}
                  </div>

                  {/* Description snippet */}
                  {article.desc && (
                    <div style={{ fontFamily: "var(--sans)", fontSize: 12, color: "var(--text-mid)", lineHeight: 1.6, opacity: .85 }}>
                      {article.desc}{article.desc.length >= 220 ? "…" : ""}
                    </div>
                  )}
                </div>
              </a>
            ))}
          </div>

          {/* Disclaimer */}
          <div style={{ background: "rgba(255,165,0,0.03)", border: "1px solid rgba(255,165,0,0.12)", borderRadius: 12, padding: "11px 16px", fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-dim)", lineHeight: 1.6 }}>
            ⚠ <strong style={{ color: "var(--gold)" }}>Disclaimer:</strong> News sourced live from Google News RSS. Always verify from official BSE/NSE filings and original sources before making investment decisions.
          </div>
        </>
      )}

      {/* Empty state */}
      {!loading && articles.length === 0 && !error && (
        <div style={{ textAlign: "center", padding: "70px 0", opacity: .5 }}>
          <div style={{ fontSize: 48, marginBottom: 14 }}>📰</div>
          <div style={{ fontFamily: "var(--gothic)", fontSize: 14, color: "var(--text-mid)", letterSpacing: 2, textTransform: "uppercase" }}>Search for a Company</div>
          <div style={{ fontFamily: "var(--sans)", fontSize: 12, color: "var(--text-dim)", marginTop: 6 }}>Enter any company name or NSE/BSE ticker to pull live news</div>
          <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--cyan)", marginTop: 10, opacity: .6 }}>Powered by Google News RSS · 100% Free · No API key</div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN APP — v4
═══════════════════════════════════════════════════════════════ */
const TABS = [
  { id: "dashboard", icon: "◈", label: "Dashboard" },
  { id: "journal",   icon: "≡", label: "Journal" },
  { id: "calendar",  icon: "▦", label: "Calendar" },
  { id: "chart",     icon: "⌇", label: "Live Chart" },
  { id: "market",    icon: "🌐", label: "Markets" },
  { id: "risk",      icon: "⊕", label: "Risk Calc" },
  { id: "playbook",  icon: "◉", label: "Playbook" },
  { id: "news",      icon: "📰", label: "News" },
  { id: "coach",     icon: "★", label: "AI Coach" },
  { id: "settings",  icon: "⚙", label: "Settings" },
];

const PAGE_TITLES = {
  dashboard: ["Portfolio", "Overview"],
  journal:   ["Trade",     "Journal"],
  calendar:  ["Calendar",  "View"],
  chart:     ["Live",      "Chart"],
  market:    ["Market",    "Pulse"],
  risk:      ["Position",  "Sizer"],
  playbook:  ["Trading",   "Playbook"],
  news:      ["Company",   "News"],
  coach:     ["AI",        "Coach"],
  settings:  ["Account",   "Settings"],
};

function TradingJournalMain() {
  const stored = loadStorage();
  const [trades,   setTrades]   = useState(() => stored?.trades   ? stored.trades.map(hydratePnl) : SAMPLE);
  const [settings, setSettings] = useState(() => stored?.settings || DEFAULT_SETTINGS);
  const [playbook, setPlaybook] = useState(() => stored?.playbook || DEFAULT_PLAYBOOK);
  const [tab,      setTab]      = useState("dashboard");
  const [showForm, setShowForm] = useState(false);
  const [editTrade,setEditTrade]= useState(null);
  const [time, setTime] = useState(new Date());

  useEffect(() => { const iv = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(iv); }, []);
  useEffect(() => { saveStorage({ trades, settings, playbook, savedAt: new Date().toISOString() }); }, [trades, settings, playbook]);

  const addTrade    = (t) => setTrades(prev => [hydratePnl(t), ...prev]);
  const editSave    = (t) => setTrades(prev => prev.map(p => p.id === t.id ? hydratePnl(t) : p));
  const deleteTrade = (id) => setTrades(prev => prev.filter(t => t.id !== id));
  const totalNet    = trades.reduce((s, t) => s + t.pnl - t.fees, 0);

  const isMarketOpen = () => {
    const h = time.getHours(), mn = time.getMinutes(), day = time.getDay();
    const ist = new Date(time.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
    const hIST = ist.getHours(), mIST = ist.getMinutes(), minIST = hIST * 60 + mIST;
    const dayIST = ist.getDay();
    return dayIST >= 1 && dayIST <= 5 && minIST >= 555 && minIST < 930;
  };

  return (
    <>
      <FontLink />
      <AmbientBackground />

      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", position: "relative", zIndex: 1 }}>

        {/* ── TICKER TAPE ── */}
        <TickerTape />

        {/* ── HEADER ── */}
        <header style={{
          background: "rgba(3,3,9,0.92)",
          borderBottom: "1px solid rgba(0,212,255,0.1)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          padding: "0 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 60,
          position: "sticky",
          top: 0,
          zIndex: 100,
          boxShadow: "0 1px 0 rgba(0,212,255,0.06), 0 4px 24px rgba(0,0,0,0.5)",
        }}>
          {/* Left: Logo + Nav */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginRight: 4 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, rgba(232,184,75,0.25), rgba(0,220,255,0.1))", border: "1px solid rgba(232,184,75,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, boxShadow: "0 2px 16px rgba(232,184,75,0.2), 0 0 0 1px rgba(0,220,255,0.08)" }}>◈</div>
              <div>
                <div style={{ fontFamily: "var(--decorative)", fontSize: 15, letterSpacing: .5, lineHeight: 1.1 }}>
                  <span style={{ color: "var(--gold)" }}>Trading</span>
                  <span style={{ color: "var(--cyan)", marginLeft: 4 }}>Journal</span>
                </div>
                <div style={{ fontFamily: "var(--gothic)", fontSize: 8, color: "var(--text-dim)", marginTop: 1, letterSpacing: 2.5, textTransform: "uppercase" }}>
                  {settings.name ? settings.name : "Pro Edition"} · <span style={{ color: "var(--gold-dim)" }}>{settings.exchange || "NSE"}</span>
                </div>
              </div>
            </div>

            {/* Nav */}
            <nav style={{ display: "flex", gap: 1, background: "rgba(255,255,255,0.025)", borderRadius: 12, padding: 3, border: "1px solid var(--border)" }}>
              {TABS.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)} className="nav-tab" style={{
                  background: tab === t.id ? "linear-gradient(135deg, rgba(232,184,75,0.15), rgba(0,220,255,0.08))" : "transparent",
                  color: tab === t.id ? "var(--gold)" : "var(--text-dim)",
                  border: tab === t.id ? "1px solid rgba(232,184,75,0.25)" : "1px solid transparent",
                  borderRadius: 9, padding: "5px 12px",
                  fontFamily: "var(--gothic)", fontWeight: tab === t.id ? 700 : 400,
                  fontSize: 10.5, cursor: "pointer", transition: "all .2s",
                  display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap",
                  letterSpacing: ".8px", textTransform: "uppercase",
                  boxShadow: tab === t.id ? "0 2px 10px rgba(232,184,75,0.12)" : "none",
                }}>
                  <span style={{ opacity: .85 }}>{t.icon}</span> {t.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Right: Stats + Market Status + CTA */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <StreakBadge trades={trades} />

            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: "var(--gothic)", fontSize: 8, color: "var(--text-dim)", letterSpacing: 2, textTransform: "uppercase" }}>Net P&L</div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 16, fontWeight: 700, color: totalNet >= 0 ? "var(--green)" : "var(--red)", letterSpacing: -.5 }}>{fmt(totalNet)}</div>
            </div>

            <div style={{ width: 1, height: 28, background: "var(--border)" }} />

            <div style={{ textAlign: "right" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5, justifyContent: "flex-end" }}>
                <div className={isMarketOpen() ? "blink" : ""} style={{ width: 7, height: 7, borderRadius: "50%", background: isMarketOpen() ? "var(--green)" : "#444", boxShadow: isMarketOpen() ? "0 0 8px var(--green)" : "none" }} />
                <span style={{ fontFamily: "var(--gothic)", fontSize: 9, color: isMarketOpen() ? "var(--green)" : "var(--text-dim)", fontWeight: 600, letterSpacing: 1.5 }}>
                  {isMarketOpen() ? "MARKET OPEN" : "CLOSED"}
                </span>
              </div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--text-dim)", marginTop: 1 }}>
                {time.toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata" })} IST
              </div>
            </div>

            <button className="btn-gold" onClick={() => setShowForm(true)} style={{ padding: "8px 18px", flexShrink: 0, fontSize: 11 }}>
              ✦ Log Trade
            </button>
          </div>
        </header>

        {/* ── MAIN CONTENT ── */}
        <main style={{ flex: 1, padding: "24px 24px", maxWidth: 1540, width: "100%", margin: "0 auto", boxSizing: "border-box" }}>
          {/* Page heading */}
          <div style={{ marginBottom: 22 }}>
            <h1 style={{ fontFamily: "var(--serif)", fontSize: 30, fontWeight: 700, lineHeight: 1, color: "var(--text)", letterSpacing: -.3 }}>
              {PAGE_TITLES[tab]?.[0]}{" "}<em style={{ color: "var(--gold)", fontStyle: "italic" }}>{PAGE_TITLES[tab]?.[1]}</em>
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6 }}>
              <div style={{ height: 1, width: 32, background: "linear-gradient(90deg, var(--gold-border), transparent)" }} />
              <p style={{ fontFamily: "var(--gothic)", fontSize: 9, color: "var(--text-dim)", letterSpacing: 2, textTransform: "uppercase" }}>
                {tab === "dashboard" && `${trades.length} trades · ${new Date().toLocaleDateString("en-IN")} · ${settings.capital ? "Capital: " + fmtS(parseInt(settings.capital)) : "Set capital in Settings"}`}
                {tab === "journal"   && "Click a row to expand details · Edit or delete entries"}
                {tab === "calendar"  && "Daily P&L heatmap — hover cells for details"}
                {tab === "chart"     && `${STOCK_DB_DEDUPED.length} curated stocks + ALL 5000+ BSE & 3000+ NSE stocks via TradingView`}
                {tab === "market"    && "Live market overview + economic calendar for NSE/BSE/Global"}
                {tab === "risk"      && "Calculate optimal position size based on your risk rules"}
                {tab === "playbook"  && "Document and organize your proven trading setups"}
                {tab === "news"     && "Type a company name or NSE/BSE ticker to fetch the latest news"}
                {tab === "coach"    && "Rule-based analysis of your trading performance"}
                {tab === "settings"  && "Configure account parameters and manage journal data"}
              </p>
            </div>
          </div>

          {tab === "dashboard" && <Dashboard trades={trades} settings={settings} />}
          {tab === "journal"   && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button className="btn-gold" onClick={() => setShowForm(true)}>+ New Entry</button>
              </div>
              <Journal trades={trades} onDelete={deleteTrade} onEdit={(t) => { setEditTrade(t); setShowForm(true); }} />
            </div>
          )}
          {tab === "calendar"  && <CalendarView trades={trades} />}
          {tab === "chart"     && <ChartTab />}
          {tab === "market"    && <MarketTab />}
          {tab === "risk"      && <RiskCalculator settings={settings} />}
          {tab === "playbook"  && <Playbook playbook={playbook} setPlaybook={setPlaybook} />}
          {tab === "news"      && <NewsTab />}
          {tab === "coach"     && <AICoach trades={trades} />}
          {tab === "settings"  && <Settings settings={settings} setSettings={setSettings} trades={trades} setTrades={setTrades} />}
        </main>

        {/* ── FOOTER ── */}
        <footer style={{ borderTop: "1px solid rgba(232,184,75,0.08)", padding: "12px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(2,2,12,0.75)", backdropFilter: "blur(16px)" }}>
          <span style={{ fontFamily: "var(--gothic)", fontSize: 9, color: "var(--text-dim)", letterSpacing: 1.5, textTransform: "uppercase" }}>
            ◈ <span style={{ color: "var(--gold)" }}>TradingJournal</span> · Pro Edition · {STOCK_DB_DEDUPED.length} Curated + 8000+ via TradingView · NSE/BSE Full Coverage
          </span>
          <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-dim)" }}>
            {trades.length} trades · <span style={{ color: "var(--green)" }}>{trades.filter(t => t.result === "Win").length}W</span> · <span style={{ color: "var(--red)" }}>{trades.filter(t => t.result === "Loss").length}L</span> · <span style={{ color: "var(--gold)" }}>{trades.filter(t => t.result === "BE").length}BE</span>
          </span>
        </footer>
      </div>

      {/* ── TRADE FORM MODAL ── */}
      {showForm && (
        <TradeForm
          onSave={editTrade ? editSave : addTrade}
          onClose={() => { setShowForm(false); setEditTrade(null); }}
          initial={editTrade}
        />
      )}
    </>
  );
}


// ── STOCK MARKET OVERLAY WRAPPER ──────────────
function StockMarketOverlay({ onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "#02020c", overflow: "auto" }}>
      <button
        onClick={onClose}
        style={{
          position: "fixed", top: 14, right: 18, zIndex: 600,
          background: "rgba(255,30,60,0.12)", border: "1.5px solid rgba(255,30,60,0.45)",
          color: "#ff2244", fontSize: 11, padding: "7px 16px", borderRadius: 8,
          cursor: "pointer", fontFamily: "'Courier New', monospace", letterSpacing: 1.5,
          fontWeight: 700, backdropFilter: "blur(8px)",
          boxShadow: "0 2px 16px rgba(255,30,60,0.15)",
          transition: "all .2s",
        }}
        onMouseEnter={e=>{ e.currentTarget.style.background="rgba(255,30,60,0.25)"; e.currentTarget.style.boxShadow="0 2px 24px rgba(255,30,60,0.3)"; }}
        onMouseLeave={e=>{ e.currentTarget.style.background="rgba(255,30,60,0.12)"; e.currentTarget.style.boxShadow="0 2px 16px rgba(255,30,60,0.15)"; }}
      >
        ✕ BACK TO HUD
      </button>
      <TradingJournalMain />
    </div>
  );
}

export default function RyanHUD() {
  const [overlay, setOverlay] = useState(null);
  const [messages, setMessages] = useState([{type:"sys",text:"[SYS]   Ryan OS v13.0 online. Say 'Hey Ryan' to wake me up anytime.",id:0}]);
  const [inputVal, setInputVal] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [convMode, setConvMode] = useState(false);
  const [sttAvailable, setSttAvailable] = useState(false);
  const [micMode, setMicMode] = useState("sleeping");
  const [toast, setToast] = useState(""); const [toastVis, setToastVis] = useState(false);
  const [launcherFilter, setLauncherFilter] = useState("");
  const [notesList, setNotesList] = useState([]);
  const [noteInput, setNoteInput] = useState("");
  const [eventsList, setEventsList] = useState([]);
  const [calTitle, setCalTitle] = useState(""); const [calDt, setCalDt] = useState(()=>{const n=new Date();n.setMinutes(n.getMinutes()-n.getTimezoneOffset());return n.toISOString().slice(0,16);});
  const [todoList, setTodoList] = useState([]);
  const [habitData, setHabitData] = useState({});
  const [habitInput, setHabitInput] = useState("");
  const [settings, setSettings] = useState({loc:"Nashik",name:"Ryan",voice:"",ttsSpeed:"1.05",groqKey:"",geminiKey:"",cerebrasKey:"",mistralKey:""});
  const [voices, setVoices] = useState([]);
  // NEW features state
  const [moodLog, setMoodLog] = useState(()=>{try{return JSON.parse(safeLS.get("RYN_MOOD","[]"));}catch{return [];}});
  const [focusMode, setFocusMode] = useState(false);
  const [focusTimerLeft, setFocusTimerLeft] = useState(0);
  const [calcInput, setCalcInput] = useState("");
  const [calcHistory, setCalcHistory] = useState([]);
  const [ttsSpeed, setTtsSpeed] = useState(()=>parseFloat(safeLS.get("RYN_SPEED","1.05")));
  const [selectedPersona, setSelectedPersona] = useState(()=>safeLS.get("RYN_PERSONA","ryan"));

  const chatScrollRef = useRef(null);
  const inputRef = useRef(null);
  const sttRef = useRef(null);
  const lastTapRef = useRef(0);
  const tapTORef = useRef(null);
  const convModeRef = useRef(false);
  const isSpeakingRef = useRef(false);
  // Callback refs for cross-closure access
  const addMsgRef = useRef(null);
  const ttsRef = useRef(null);
  // Wake-word system refs
  const wakeRecRef = useRef(null);       // background wake-word recognizer
  const micModeRef = useRef("sleeping"); // "sleeping" | "awake"
  const sleepTimerRef = useRef(null);    // 1-min inactivity timer
  const lastSpeechRef = useRef(Date.now());
  const WAKE_WORDS = /\b(hey ryan|hi ryan|wake up ryan|wake ryan|yo ryan|ok ryan|okay ryan|ryan wake up|rise ryan|hello ryan|ryan are you there|ryan come back)\b/i;
  const SLEEP_MS = 60000;
  const focusModeRef = useRef(false);
  const focusIntervalRef = useRef(null);

  const hudStateRef = useRef({
    cpu:15,ram:35,disk:60,net_rx:0,net_tx:0,
    cpu_hist:new Array(80).fill(0),ram_hist:new Array(80).fill(0),
    ping:20,ip:"--",weather:null,sttEnabled:false,
  });

  const canvasRef = useHUDCanvas(hudStateRef);
  // Ref to allow init useEffect to call startWakeListener defined later
  const startWakeListenerRef = useRef(null);

  // Init
  useEffect(()=>{
    // Load settings from LS (no API keys needed)
    setSettings({loc:safeLS.get("RYN_LOC","Nashik"),name:safeLS.get("RYN_NAME","Ryan"),voice:safeLS.get("RYN_VOICE",""),ttsSpeed:safeLS.get("RYN_SPEED","1.05"),groqKey:safeLS.get("RYN_GROQ_KEY",""),geminiKey:safeLS.get("RYN_GEMINI_KEY",""),cerebrasKey:safeLS.get("RYN_CEREBRAS_KEY",""),mistralKey:safeLS.get("RYN_MISTRAL_KEY","")});
    Brain.init();
    // ── INIT STOCK ENGINE ──
    StockEngine.init();
    StockEngine.fetchAll().then(()=>{ console.log("Stocks loaded:", StockEngine.getAll().map(s=>s.name).join(", ")); });
    setInterval(()=>StockEngine.fetchAll(), 5*60*1000); // refresh every 5 min
    // ── STARTUP MESSAGE ──
    setTimeout(()=>{
      if(addMsgRef.current) addMsgRef.current("sys",`Ryan OS v13.0 online. KB: ${KB.getCount()} entries loaded. Ask me anything!`);
    }, 3000);
    // ── PURGE POLLUTED KB ENTRIES from old API-key era ──
    // Removes any saved entries that contain error/offline messages
    const BAD_PATTERNS = [
      "offline mode","no api key","api key","check api","add an api","openai","anthropic",
      "i can still do: math","type \"help\" for commands","learned entries. type",
      "i appreciate that! now let's get to work",
    ];
    const allEntries = KB.getAll ? KB.getAll() : [];
    let purged = 0;
    allEntries.forEach(e => {
      const answerLow = (e.answer||"").toLowerCase();
      if(BAD_PATTERNS.some(p => answerLow.includes(p))) {
        KB.delete ? KB.delete(e) : null;
        purged++;
      }
    });
    // Hard reset KB entries via internal access if purge found issues
    try {
      const raw = safeLS.get("RYN_KB");
      if(raw) {
        const parsed = JSON.parse(raw);
        if(Array.isArray(parsed.entries)) {
          const clean = parsed.entries.filter(e => {
            const a = (e.answer||"").toLowerCase();
            return !BAD_PATTERNS.some(p => a.includes(p));
          });
          if(clean.length < parsed.entries.length) {
            safeLS.set("RYN_KB", JSON.stringify({...parsed, entries: clean, count: clean.length}));
            console.log(`KB: purged ${parsed.entries.length - clean.length} polluted entries.`);
          }
        }
      }
    } catch(e) { console.warn("KB cleanup error:", e); }

    // ── LOAD TRAINING DATA into KB (313 built-in entries + grows with each convo) ──
    // Always bulk-load training data — KB.bulkLoad skips entries that already exist
    const loadedCount = KB.bulkLoad(TRAINING_DATA);
    if(loadedCount > 0) console.log(`Loaded ${loadedCount} training entries into KB. Total: ${KB.getCount()}`);
    WEATHER_CACHE.fetch().then(w=>{if(w)hudStateRef.current.weather=w;});
    fetch("https://api.ipify.org?format=json").then(r=>r.json()).then(d=>{hudStateRef.current.ip=d.ip;}).catch(()=>{});
    // Safe speech synthesis
    if(safeSynth){
      const loadVoices=()=>setVoices(safeSynth.getVoices()||[]);
      safeSynth.onvoiceschanged=loadVoices; loadVoices();
    }
    // STT check — start wake-word listener automatically
    if(window.SpeechRecognition||window.webkitSpeechRecognition){
      setSttAvailable(true);hudStateRef.current.sttEnabled=true;
      // Start wake-word listener after a short delay
      setTimeout(()=>{
        micModeRef.current="sleeping";
        setMicMode("sleeping");
        if(startWakeListenerRef.current) startWakeListenerRef.current();
      },2000);
    }
    // Stats loop
    const statsIv=setInterval(()=>{
      const t0=performance.now();let s=0;for(let i=0;i<50000;i++)s+=Math.sqrt(i);
      const elapsed=performance.now()-t0;
      const cpu=Math.min(95,Math.max(5,elapsed*8+(Math.random()-.5)*8));
      const ram=35+Math.sin(Date.now()*.00003)*5+(Math.random()-.5)*3;
      hudStateRef.current.cpu=cpu;hudStateRef.current.ram=ram;
      hudStateRef.current.disk=60+(Math.random()-.5)*.5;
      hudStateRef.current.net_rx=Math.max(0,512+Math.random()*2048);
      hudStateRef.current.net_tx=Math.max(0,128+Math.random()*512);
      hudStateRef.current.cpu_hist.push(cpu);hudStateRef.current.cpu_hist.shift();
      hudStateRef.current.ram_hist.push(ram);hudStateRef.current.ram_hist.shift();
      hudStateRef.current.ping=Math.round(12+8*Math.abs(Math.sin(Date.now()*.0007)));
    },2000);
    return ()=>clearInterval(statsIv);
  },[]);

  const showToast = useCallback((msg,dur=2500)=>{setToast(msg);setToastVis(true);setTimeout(()=>setToastVis(false),dur);},[]);
  const openOverlay = useCallback((id)=>setOverlay(id),[]);

  // ── PERSONA SETTINGS (rate/pitch per voice) ──
  const getPersonaSettings = useCallback(()=>{
    const pid = safeLS.get("RYN_PERSONA","ryan");
    const persona = VOICE_PERSONAS.find(p=>p.id===pid)||VOICE_PERSONAS[0];
    return { rate: persona.rate, pitch: persona.pitch };
  },[]);

  // ── BEST VOICE PICKER (persona-aware) ──
  const pickBestVoice = useCallback(()=>{
    if(!safeSynth) return null;
    const vs=safeSynth.getVoices();
    if(!vs.length) return null;
    // Check for persona-based selection first
    const pid = safeLS.get("RYN_PERSONA","ryan");
    const persona = VOICE_PERSONAS.find(p=>p.id===pid)||VOICE_PERSONAS[0];
    // Try preferred voice list for this persona
    for(const pref of persona.preferred) {
      const v = vs.find(v => v.name.toLowerCase().includes(pref.toLowerCase()) || v.lang === pref);
      if(v) return v;
    }
    // If persona search fails, fall back to manual saved voice
    const saved=safeLS.get("RYN_VOICE");
    if(saved){const v=vs.find(v=>v.name===saved);if(v)return v;}
    // Last resort: any English voice
    return vs.find(v=>v.lang.startsWith("en"))||vs[0]||null;
  },[]);

  // ── TTS — speaks reply, then restarts mic if convMode is on ──
  const tts = useCallback((text, onDone)=>{
    if(!safeSynth||!text) { onDone&&onDone(); return; }
    safeSynth.cancel();
    // Strip emojis and symbols for cleaner speech
    const clean=text.replace(/[^\x00-\x7F\u00C0-\u024F\u1E00-\u1EFF]/g," ").replace(/[🚀📺🎵📖🎬🔍🌐💬✈️🎮📧📹🔵🟦📸🐦👤💼🔴🛒🛍️🏪👗💳📱📈🌱🐱📦🔷🖊️▲🤖✨🧠🔮🔍☁️📄🗺️🌐📅🎓🏫🦊🌍📰🎨✏️📒📝✅🔥⏱️🧮⚙️🌤️📊⭐🟣💬]/g,"").trim();
    const utt=new SpeechSynthesisUtterance(clean);
    const v=pickBestVoice();if(v)utt.voice=v;
    const personaSettings = getPersonaSettings();
    // Persona pitch/rate + user speed multiplier blended
    utt.rate = personaSettings.rate * ((ttsSpeed||1.05) / 1.05);
    utt.pitch = personaSettings.pitch;
    utt.volume=1.0;
    utt.onstart=()=>{setIsSpeaking(true);isSpeakingRef.current=true;};
    utt.onend=()=>{
      setIsSpeaking(false);isSpeakingRef.current=false;
      onDone&&onDone();
      // Conversation mode: restart mic after Ryan finishes speaking (only if awake)
      if(convModeRef.current&&sttAvailable&&micModeRef.current==="awake"){
        setTimeout(()=>{if(convModeRef.current&&micModeRef.current==="awake")startListeningOnce();},400);
      }
    };
    utt.onerror=()=>{setIsSpeaking(false);isSpeakingRef.current=false;onDone&&onDone();};
    safeSynth.speak(utt);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[pickBestVoice,getPersonaSettings,sttAvailable,ttsSpeed]);

  // Keep ttsRef in sync
  useEffect(()=>{ttsRef.current=tts;},[tts]);

  const addMsg = useCallback((type,text,richData)=>{
    const prefix={ryn:"[RYAN]  ",you:"[YOU]   ",ai:"[AI]    ",sys:"[SYS]   ",err:"[ERR]   ",dim:"[...]   "}[type]||"";
    setMessages(prev=>[...prev,{type,text:richData?"":prefix+text,richData,id:Date.now()+Math.random()}]);
  },[]);

  // Keep refs in sync so wake-listener can call them
  useEffect(()=>{addMsgRef.current=addMsg;},[addMsg]);

  useEffect(()=>{if(chatScrollRef.current)chatScrollRef.current.scrollTop=chatScrollRef.current.scrollHeight;},[messages]);

  // ── WAKE-WORD SYSTEM ──
  const stopWakeListener = useCallback(()=>{
    if(wakeRecRef.current){try{wakeRecRef.current.stop();}catch{}wakeRecRef.current=null;}
  },[]);

  const startWakeListener = useCallback(()=>{
    if(!sttAvailable||wakeRecRef.current) return;
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SR) return;
    const rec=new SR();
    rec.lang="en-IN";rec.interimResults=false;rec.maxAlternatives=2;rec.continuous=false;
    rec.onresult=(e)=>{
      const t=Array.from(e.results).map(r=>r[0].transcript).join("").trim();
      if(WAKE_WORDS.test(t)){
        micModeRef.current="awake";
        setMicMode("awake");
        if(wakeRecRef.current){try{wakeRecRef.current.stop();}catch{}wakeRecRef.current=null;}
        setOverlay(o=>o||"chat");
        const greet="I'm here! What's on your mind?";
        if(addMsgRef.current) addMsgRef.current("ryn", greet);
        if(ttsRef.current) ttsRef.current(greet, ()=>{
          convModeRef.current=true; setConvMode(true);
          // reset sleep timer
          if(sleepTimerRef.current) clearTimeout(sleepTimerRef.current);
          sleepTimerRef.current=setTimeout(()=>{ goToSleep(); }, SLEEP_MS);
        });
      }
    };
    rec.onend=()=>{
      wakeRecRef.current=null;
      if(micModeRef.current==="sleeping"&&sttAvailable){
        setTimeout(()=>startWakeListener(),400);
      }
    };
    rec.onerror=(e)=>{
      wakeRecRef.current=null;
      setTimeout(()=>{ if(micModeRef.current==="sleeping") startWakeListener(); }, e.error==="no-speech"?200:1000);
    };
    try{rec.start();wakeRecRef.current=rec;}catch{}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[sttAvailable]);

  // Keep startWakeListenerRef in sync
  useEffect(()=>{startWakeListenerRef.current=startWakeListener;},[startWakeListener]);

  const goToSleep = useCallback(()=>{
    if(micModeRef.current==="sleeping") return;
    micModeRef.current="sleeping";
    setMicMode("sleeping");
    if(sttRef.current){try{sttRef.current.stop();}catch{}sttRef.current=null;}
    setIsListening(false);
    convModeRef.current=false; setConvMode(false);
    setTimeout(()=>startWakeListener(),400);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[startWakeListener]);

  const resetSleepTimer = useCallback(()=>{
    lastSpeechRef.current=Date.now();
    if(sleepTimerRef.current) clearTimeout(sleepTimerRef.current);
    sleepTimerRef.current=setTimeout(()=>{ goToSleep(); }, SLEEP_MS);
  },[goToSleep]);

  const wakeUp = useCallback(()=>{
    micModeRef.current="awake";
    setMicMode("awake");
    stopWakeListener();
    resetSleepTimer();
  },[stopWakeListener,resetSleepTimer]);

  const sendMessage = useCallback(async()=>{
    const msg=inputVal.trim(); if(!msg) return;
    setInputVal(""); addMsg("you",msg); if(safeSynth) safeSynth.cancel();
    // Wake up or reset sleep timer on typed input
    if(micModeRef.current==="sleeping") wakeUp();
    else resetSleepTimer();
    // Track topic for learning
    TopicTrack.track(msg, Date.now());
    // Handle "conversation mode" toggle command
    if(/^(conversation mode|convo mode|keep listening|always listen|stop listening|stop conversation)/i.test(msg.trim())) {
      const enabling=!/stop/i.test(msg.toLowerCase());
      convModeRef.current=enabling; setConvMode(enabling);
      const reply=enabling?"Conversation mode on! I'm listening — just talk and I'll respond.":"Conversation mode off. I'll wait for you to press the mic button.";
      addMsg("ryn",reply);tts(reply);return;
    }
    const localReply=await routeMessage(msg,addMsg,hudStateRef.current,showToast,openOverlay);
    if(localReply!==null){
      addMsg("ryn",localReply);tts(localReply);
      ConvLog.add("user", msg); ConvLog.add("ryan", localReply);
      ConvLog.autoExtract(msg, localReply, Memory, KB);
      Memory.learnFromExchange(msg,localReply);
      const skipKB = /^(Opening |Searching |Googling |Calling |Copied |Shared |Timer |Habit |Event |Todo |Note |Reminder |No timer|No )/i.test(localReply) || localReply.length < 20;
      if(!skipKB) KB.learn(msg, localReply, "local-command");
      return;
    }
    // Check if explanation is needed — render rich card (local fallback without API)
    const explainInfo = ExplainerEngine.detect(msg);
    if(explainInfo.needed) {
      // Try local explainer first, then web search as fallback
      const kbAnswer = KB.match(msg);
      if(!kbAnswer) {
        addMsg("dim","Searching for an explanation...");
        const webResult = await WebSearchEngine.search(msg);
        setMessages(prev=>prev.filter(m=>!m.text.includes("Searching for an explanation...")));
        if(webResult) {
          addMsg("ryn", webResult.result); tts(webResult.result);
          KB.learn(msg, webResult.result, "web-explained");
          return;
        }
      }
    }
    // ── SMART WEB SEARCH (works without any API key) ──
    const needsWeb = WebSearchEngine.needsWeb(msg);
    let webResult = null;
    let webContext = "";
    if(needsWeb) {
      addMsg("dim","Searching the web...");
      webResult = await WebSearchEngine.search(msg);
      if(webResult) webContext = `\n\n[WEB DATA]\n${webResult.result}`;
    }

    addMsg("dim","Thinking...");
    // If web search already found a result, use it directly — don't let LocalBrain overwrite it
    if(webResult) {
      setMessages(prev=>prev.filter(m=>!m.text.includes("Thinking...")&&!m.text.includes("Searching the web...")));
      addMsg("ryn", webResult.result); tts(webResult.result);
      ConvLog.add("user", msg); ConvLog.add("ryan", webResult.result);
      ConvLog.autoExtract(msg, webResult.result, Memory, KB);
      Memory.learnFromExchange(msg, webResult.result);
      KB.learn(msg, webResult.result, "web-answer");
      return;
    }
    const aiReply = await Brain.chat(msg, Memory.getContextBlock());
    setMessages(prev=>prev.filter(m=>!m.text.includes("Thinking...")&&!m.text.includes("Searching the web...")));
    if(aiReply){
      addMsg("ryn",aiReply); tts(aiReply);
      ConvLog.add("user", msg); ConvLog.add("ryan", aiReply);
      ConvLog.autoExtract(msg, aiReply, Memory, KB);
      Memory.learnFromExchange(msg, aiReply);
      KB.learn(msg, aiReply, "local-learned");
    } else {
      // Last resort: try web search if we haven't yet
      if(!needsWeb) {
        const lastResult = await WebSearchEngine.search(msg);
        if(lastResult?.result) {
          addMsg("ryn", lastResult.result); tts(lastResult.result);
          KB.learn(msg, lastResult.result, "web-answer");
          return;
        }
      }
      addMsg("ryn","I don't have an answer for that. Try 'search web [your question]' for a live result!");
    }
  },[inputVal,addMsg,tts,showToast,openOverlay,wakeUp,resetSleepTimer]);


  const startListeningOnce = useCallback(()=>{
    if(!sttAvailable||isListening||isSpeakingRef.current) return;
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    const rec=new SR();
    rec.lang="en-IN";rec.interimResults=false;rec.maxAlternatives=3;rec.continuous=false;
    rec.onresult=async(e)=>{
      const transcript=Array.from(e.results).map(r=>r[0].transcript).join("").trim();
      if(!transcript) return;
      resetSleepTimer();
      // Check for sleep command
      if(/^(sleep|go to sleep|stop listening|bye ryan|goodbye ryan|goodnight ryan|ryan sleep)/i.test(transcript)){
        addMsg("ryn","Going to sleep. Say 'Hey Ryan' to wake me up.");
        tts("Going to sleep. Say hey Ryan to wake me up.", ()=>{goToSleep();});
        return;
      }
      // Strip wake-word if user said it at start of a command
      const cleanTranscript = transcript.replace(WAKE_WORDS,"").trim() || transcript;
      setOverlay(o=>o||"chat");
      addMsg("you",`[VOICE] ${cleanTranscript}`);
      TopicTrack.track(cleanTranscript, Date.now());
      const lr=await routeMessage(cleanTranscript,addMsg,hudStateRef.current,showToast,openOverlay);
      if(lr!==null){
        addMsg("ryn",lr);tts(lr,null);
        Memory.learnFromExchange(cleanTranscript,lr);
        const skipKBv = /^(Opening |Searching |Googling |Calling |Copied |Shared |Timer |Habit |Event |Todo |Note |Reminder |No timer|No )/i.test(lr) || lr.length < 20;
        if(!skipKBv) KB.learn(cleanTranscript, lr, "local-command");
      }
      else{
        const ei=ExplainerEngine.detect(cleanTranscript);
        if(ei.needed) {
          const kbHitVoice = KB.match(cleanTranscript);
          if(!kbHitVoice) {
            addMsg("dim","Searching for an explanation...");
            const wrExp = await WebSearchEngine.search(cleanTranscript);
            setMessages(prev=>prev.filter(m=>!m.text.includes("Searching for an explanation...")));
            if(wrExp){addMsg("ryn",wrExp.result);tts(wrExp.result,null);KB.learn(cleanTranscript,wrExp.result,"web-explained");return;}
          }
        }
        addMsg("dim","Thinking...");
        let webCtx = "";
        let voiceWebResult = null;
        if(WebSearchEngine.needsWeb(cleanTranscript)) {
          addMsg("dim","Checking the web...");
          voiceWebResult = await WebSearchEngine.search(cleanTranscript);
          if(voiceWebResult) webCtx = `\n\n[WEB SEARCH RESULT]\n${voiceWebResult.result}\nSource: ${voiceWebResult.source}`;
        }
        // If web search found an answer, use it directly
        if(voiceWebResult?.result) {
          setMessages(prev=>prev.filter(m=>!m.text.includes("Thinking...")&&!m.text.includes("Checking the web...")));
          addMsg("ryn",voiceWebResult.result);tts(voiceWebResult.result,null);
          Memory.learnFromExchange(cleanTranscript,voiceWebResult.result);
          KB.learn(cleanTranscript, voiceWebResult.result, "web-answer");
          return;
        }
        const ar=await Brain.chat(cleanTranscript, Memory.getContextBlock()+webCtx);
        setMessages(prev=>prev.filter(m=>!m.text.includes("Thinking...")&&!m.text.includes("Checking the web...")));
        if(ar){
          addMsg("ryn",ar);tts(ar,null);
          Memory.learnFromExchange(cleanTranscript,ar);
          KB.learn(cleanTranscript, ar, "local-learned");
        }
        else addMsg("ryn","I don't have a local answer for that. Try 'search web [question]' for a live result!");
      }
    };
    rec.onend=()=>{setIsListening(false);sttRef.current=null;
      // In awake mode: auto-restart listening after a short pause (conv mode)
      if(micModeRef.current==="awake"&&convModeRef.current&&!isSpeakingRef.current){
        setTimeout(()=>{if(micModeRef.current==="awake"&&convModeRef.current)startListeningOnce();},400);
      }
    };
    rec.onerror=(e)=>{setIsListening(false);sttRef.current=null;if(e.error!=="no-speech"&&e.error!=="aborted")addMsg("err",`Mic error: ${e.error}`);
      // Restart in awake+conv mode
      if(micModeRef.current==="awake"&&convModeRef.current){
        setTimeout(()=>{if(micModeRef.current==="awake"&&convModeRef.current)startListeningOnce();},600);
      }
    };
    try{rec.start();sttRef.current=rec;setIsListening(true);}catch{}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[sttAvailable,addMsg,tts,showToast,openOverlay,resetSleepTimer,goToSleep]);

  const toggleMic = useCallback(()=>{
    if(!sttAvailable){addMsg("err","Microphone not available in this browser.");return;}
    if(isListening){
      if(sttRef.current)try{sttRef.current.stop();}catch{}
      setIsListening(false);
      return;
    }
    if(safeSynth)safeSynth.cancel();
    // Wake up if sleeping
    if(micModeRef.current==="sleeping") wakeUp();
    setOverlay(o=>o||"chat");
    startListeningOnce();
  },[sttAvailable,isListening,addMsg,wakeUp,startListeningOnce]);

  // Canvas click
  const handleCanvasClick = useCallback((e)=>{
    const now2=Date.now(); const dt=now2-lastTapRef.current; lastTapRef.current=now2;
    const W=window.innerWidth,CX=W/2,CY=window.innerHeight/2;
    if(e.clientX>W-140&&e.clientY<50){setOverlay("settings");return;}
    // Right panel = market overlay
    const RW=Math.min(220,W*.165);
    if(e.clientX>W-RW&&e.clientY>52&&e.clientY<window.innerHeight-46){setOverlay("market");return;}
    if(dt<400&&tapTORef.current){clearTimeout(tapTORef.current);tapTORef.current=null;setOverlay("launcher");setLauncherFilter("");return;}
    tapTORef.current=setTimeout(()=>{
      tapTORef.current=null;
      const diffX=Math.abs(e.clientX-CX),diffY=Math.abs(e.clientY-CY);
      if(diffX<160&&diffY<160){setOverlay(o=>o==="chat"?null:"chat");setTimeout(()=>inputRef.current?.focus(),50);}
    },400);
  },[]);

  // Keyboard shortcuts
  useEffect(()=>{
    const h=(e)=>{
      if(e.key==="Escape"){setOverlay(null);if(safeSynth)safeSynth.cancel();}
      if(e.ctrlKey&&e.key==="m"){e.preventDefault();toggleMic();}
      if(e.ctrlKey&&e.key==="l"){e.preventDefault();setOverlay("launcher");setLauncherFilter("");}
      if(e.ctrlKey&&e.key==="s"){e.preventDefault();setOverlay("settings");}
      if(e.ctrlKey&&e.key==="n"){e.preventDefault();setOverlay("notes");setNotesList(Notes.list());}
      if(e.ctrlKey&&e.key==="k"){e.preventDefault();setOverlay("calendar");setEventsList(Calendar.getAll());}
      if(e.ctrlKey&&e.key==="t"){e.preventDefault();setOverlay("todos");setTodoList(Todos.list());}
    };
    document.addEventListener("keydown",h); return ()=>document.removeEventListener("keydown",h);
  },[toggleMic]);

  const saveSettings=()=>{safeLS.set("RYN_LOC",settings.loc);safeLS.set("RYN_NAME",settings.name);safeLS.set("RYN_VOICE",settings.voice||"");const spd=parseFloat(settings.ttsSpeed)||1.05;safeLS.set("RYN_SPEED",String(spd));setTtsSpeed(spd);safeLS.set("RYN_PERSONA",selectedPersona);safeLS.set("RYN_GROQ_KEY",settings.groqKey||"");safeLS.set("RYN_GEMINI_KEY",settings.geminiKey||"");safeLS.set("RYN_CEREBRAS_KEY",settings.cerebrasKey||"");safeLS.set("RYN_MISTRAL_KEY",settings.mistralKey||"");Brain.init();setOverlay(null);showToast("Settings saved! ✓");};

  const msgColors={ryn:C.CYAN,you:C.GREEN,ai:"#88eeff",sys:"#00aaff",err:C.RED,dim:"#00ddee"};
  const filteredApps=APPS.filter(a=>!launcherFilter||a.name.toLowerCase().includes(launcherFilter.toLowerCase())||a.cat.toLowerCase().includes(launcherFilter.toLowerCase()));

  const handleAppClick=(app)=>{
    const acts={
      notes:()=>{setNotesList(Notes.list());setOverlay("notes");},
      todos:()=>{setTodoList(Todos.list());setOverlay("todos");},
      calendar:()=>{setEventsList(Calendar.getAll());setOverlay("calendar");},
      habits:()=>{setHabitData(Habits.getAll());setOverlay("habits");},
      timers:()=>{setOverlay("chat");addMsg("ryn","Timer ready. Say: set timer [N] minutes [named X]");},
      calc:()=>{setOverlay("calc");},
      mood:()=>{setMoodLog(JSON.parse(safeLS.get("RYN_MOOD","[]")));setOverlay("mood");},
      focus:()=>{setOverlay("chat");addMsg("ryn","Say 'focus mode 25 minutes' to start a focused work session. I'll block distractions and alert you when done.");},
      settings:()=>setOverlay("settings"),
      weather:async()=>{setOverlay("chat");const w=await WEATHER_CACHE.fetch();addMsg("ryn",w?WEATHER_CACHE.summary():"Could not fetch weather.");},
      jee:()=>addMsg("ryn","JEE Master — open your JEE tracking app for full access."),
    };
    if(app.special&&acts[app.special]){acts[app.special]();}
    else if(app.url){window.open(app.url,"_blank");}
    if(app.special!=="notes"&&app.special!=="todos"&&app.special!=="calendar"&&app.special!=="habits"&&app.special!=="settings"&&app.special!=="calc"&&app.special!=="mood"&&overlay==="launcher") setOverlay(null);
  };

  return (
    <div style={{background:"#000810",width:"100vw",height:"100vh",overflow:"hidden",userSelect:"none",fontFamily:'"Courier New",monospace'}}>
      <canvas ref={canvasRef} style={{position:"fixed",top:0,left:0,width:"100vw",height:"100vh",cursor:"crosshair"}} onClick={handleCanvasClick}/>

      {/* ── CHAT ── */}
      {overlay==="chat"&&(
        <div style={{...S.overlay,bottom:60,left:"50%",transform:"translateX(-50%)",width:"min(750px,96vw)",maxHeight:"75vh",border:`1px solid ${isSpeaking?C.GREEN:convMode?C.PURPLE:"rgba(0, 238, 255, 0.3)"}`,transition:"all 0.4s cubic-bezier(0.25,0.8,0.25,1)",boxShadow: `0 16px 40px rgba(0,0,0,0.5), 0 0 20px ${isSpeaking?C.GREEN+"33":convMode?C.PURPLE+"33":"rgba(0, 238, 255, 0.1)"}`}}>
          <div style={S.header}>
            <span style={S.headerTitle}>◈ RYAN OS v19 <span style={{color:"rgba(255,255,255,0.5)",fontWeight:400}}>// INTELLIGENCE CORE</span></span>
            <button style={{...S.closeBtn, ":hover":{color:"#fff", transform:"scale(1.1)"}}} onClick={()=>setOverlay(null)}>✕</button>
          </div>
          {/* Speaking indicator */}
          {isSpeaking&&(
            <div style={{background:"rgba(0, 255, 163, 0.05)",padding:"8px 16px",display:"flex",alignItems:"center",gap:12,borderBottom:"1px solid rgba(0, 255, 163, 0.2)"}}>
              <div style={{display:"flex",gap:3,alignItems:"center"}}>
                {[0,1,2,3,4].map(i=>(
                  <div key={i} style={{width:4,background:C.GREEN,borderRadius:4,animation:`ryanPulse ${0.3+i*0.1}s ease-in-out infinite alternate`,height:10+i*6,boxShadow:`0 0 8px ${C.GREEN}`}}/>
                ))}
              </div>
              <span style={{color:C.GREEN,fontSize:11,letterSpacing:3,fontFamily:"'Rajdhani', sans-serif",fontWeight:600}}>RYAN IS SPEAKING...</span>
            </div>
          )}
          {convMode&&!isSpeaking&&!isListening&&(
            <div style={{background:"rgba(176, 102, 255, 0.05)",padding:"6px 16px",borderBottom:"1px solid rgba(176, 102, 255, 0.2)",fontSize:11,color:C.PURPLE,letterSpacing:1,fontFamily:"'Rajdhani', sans-serif"}}>◈ CONV MODE ACTIVE — LISTENING CONTINUOUSLY · QUIET FOR 60s = AUTO SLEEP</div>
          )}
          {micMode==="sleeping"&&!convMode&&!isListening&&!isSpeaking&&(
            <div style={{background:"rgba(255,255,255,0.02)",padding:"6px 16px",borderBottom:"1px solid rgba(255,255,255,0.05)",fontSize:11,color:"rgba(255,255,255,0.4)",letterSpacing:1,fontFamily:"'Rajdhani', sans-serif"}}>◌ SLEEPING — SAY "HEY RYAN" TO WAKE ME UP</div>
          )}
          <div ref={chatScrollRef} style={{flex:1,overflowY:"auto",padding:"16px 20px",fontSize:14,lineHeight:1.6,minHeight:200,maxHeight:400,background:"rgba(0, 5, 15, 0.3)",fontFamily:"'Inter', sans-serif"}}>
            {messages.map(m=>m.richData
              ?<RichCard key={m.id} data={m.richData} onSpeak={()=>tts(m.richData.summary+" — "+(m.richData.sections||[]).slice(0,2).map(s=>s.title+": "+s.content).join(" — "))}/>
              :<div key={m.id} style={{
                  color:m.type==="you"?"#fff":msgColors[m.type]||C.CYAN,
                  background:m.type==="you"?"rgba(255,255,255,0.05)":"transparent",
                  padding:m.type==="you"?"8px 12px":"4px 0",
                  borderRadius:m.type==="you"?8:0,
                  marginBottom:12,
                  wordBreak:"break-word",
                  whiteSpace:"pre-wrap",
                  borderLeft:m.type==="ryn"?`3px solid ${C.CYAN}`:"none",
                  paddingLeft:m.type==="ryn"?12:m.type==="you"?12:0,
                  fontSize:m.type==="you"?13:14
                }}>{m.text}</div>
            )}
          </div>
          <div style={{display:"flex",alignItems:"center",padding:"12px 16px",gap:10,borderTop:"1px solid rgba(0, 238, 255, 0.15)",flexShrink:0,background:"rgba(0, 10, 25, 0.5)"}}>
            <input ref={inputRef} value={inputVal} onChange={e=>setInputVal(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendMessage()} style={{flex:1,background:"rgba(0, 0, 0, 0.3)",border:"1px solid rgba(0, 238, 255, 0.2)",outline:"none",color:"#fff",fontFamily:"'Inter', sans-serif",fontSize:14,padding:"10px 14px",borderRadius:8,transition:"all 0.3s",boxShadow:"inset 0 2px 5px rgba(0,0,0,0.5)"}} autoComplete="off" spellCheck={false} placeholder={convMode?"Say anything — I'm listening...":"Ask Ryan anything... (or press MIC to speak)"} onFocus={e=>e.target.style.borderColor="rgba(0, 238, 255, 0.6)"} onBlur={e=>e.target.style.borderColor="rgba(0, 238, 255, 0.2)"}/>
            <button onClick={()=>{const enabling=!convMode;convModeRef.current=enabling;setConvMode(enabling);if(enabling){if(micModeRef.current==="sleeping")wakeUp();showToast("Conv mode ON — always listening!");startListeningOnce();}else{showToast("Conv mode OFF. Say Hey Ryan to resume.");}}} style={{...S.hudBtn,borderColor:convMode?C.PURPLE:micMode==="sleeping"?"rgba(255,255,255,0.1)":"rgba(0, 238, 255, 0.3)",color:convMode?C.PURPLE:micMode==="sleeping"?"rgba(255,255,255,0.3)":C.TEAL,minWidth:60}} title="Toggle conversation mode">{convMode?"CONV●":"CONV"}</button>
            <button onClick={toggleMic} style={{...S.hudBtn,borderColor:isListening?C.GREEN:isSpeaking?C.ORANGE:"rgba(0, 238, 255, 0.3)",color:isListening?C.GREEN:isSpeaking?C.ORANGE:C.CYAN,background:isListening?"rgba(0, 255, 163, 0.1)":"linear-gradient(135deg, rgba(0, 238, 255, 0.1) 0%, rgba(0, 136, 255, 0.05) 100%)",boxShadow:isListening?`0 0 15px ${C.GREEN}44`:"none"}}>{isListening?"■ STOP":isSpeaking?"🔊 ...":"MIC"}</button>
            <button onClick={sendMessage} style={{...S.hudBtn, background:"rgba(0, 238, 255, 0.15)", color:"#fff", borderColor:"rgba(0, 238, 255, 0.5)"}}>SEND</button>
            <button onClick={()=>{Brain.resetHistory();setMessages([]);addMsg("sys","History cleared. Fresh start!");}} style={{...S.hudBtn, borderColor:"rgba(255, 42, 85, 0.3)", color:"#ff2a55"}}>RESET</button>
          </div>
          <div style={{padding:"6px 16px",background:"rgba(0, 0, 0, 0.4)",borderTop:"1px solid rgba(0, 238, 255, 0.05)",fontSize:10,color:"rgba(0, 238, 255, 0.5)",display:"flex",justifyContent:"space-between",flexShrink:0,fontFamily:"'Rajdhani', sans-serif",letterSpacing:1}}>
            <span style={{color:isListening?C.GREEN:isSpeaking?C.ORANGE:convMode?C.PURPLE:micMode==="sleeping"?"rgba(255,255,255,0.3)":C.CYAN, fontWeight:600}}>{isListening?"● LISTENING — SPEAK NOW":isSpeaking?"● SPEAKING":convMode?"● CONV — LISTENING...":micMode==="sleeping"?"◌ SLEEPING — SAY HEY RYAN":"● AWAKE — PRESS MIC TO TALK"}</span>
            <span>AI: {Brain.providerName}</span>
            <span>MEM: {Memory.getAll().length}</span>
          </div>
          <style>{`
            @keyframes ryanPulse { from { transform: scaleY(0.4); opacity: 0.6; } to { transform: scaleY(1.4); opacity: 1; } }
            ::-webkit-scrollbar { width: 6px; height: 6px; }
            ::-webkit-scrollbar-track { background: rgba(0, 0, 0, 0.2); border-radius: 10px; }
            ::-webkit-scrollbar-thumb { background: rgba(0, 238, 255, 0.3); border-radius: 10px; }
            ::-webkit-scrollbar-thumb:hover { background: rgba(0, 238, 255, 0.6); }
          `}</style>
        </div>
      )}

      {/* ── STOCK MARKET OVERLAY ── */}
      {overlay==="market"&&<StockMarketOverlay onClose={()=>setOverlay(null)}/>}

      {/* ── LAUNCHER ── */}
      {overlay==="launcher"&&(
        <div style={{...S.overlay,top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:"min(700px,96vw)",maxHeight:"85vh",background:"#00060f",border:"1.5px solid #00b4ff",borderRadius:4}}>
          <div style={S.header}><span style={S.headerTitle}>◈ RYAN OS v8 // SYSTEM LAUNCHER</span><button style={S.closeBtn} onClick={()=>setOverlay(null)}>✕</button></div>
          <div style={{padding:"8px 10px",background:"#00060f",borderBottom:"1px solid #001530"}}>
            <input autoFocus value={launcherFilter} onChange={e=>setLauncherFilter(e.target.value)} placeholder="SEARCH APPS..." style={{...S.input,width:"100%",fontSize:13,padding:"7px 10px"}}/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:8,padding:10,overflowY:"auto",maxHeight:"55vh"}}>
            {filteredApps.map((app,i)=>(
              <div key={i} onClick={()=>handleAppClick(app)} style={{background:"#000c22",border:"1px solid #0a2850",borderRadius:3,padding:"12px 8px",cursor:"pointer",textAlign:"center",transition:"all .15s"}} onMouseEnter={e=>{e.currentTarget.style.background="#001840";e.currentTarget.style.borderColor="#0070c8";}} onMouseLeave={e=>{e.currentTarget.style.background="#000c22";e.currentTarget.style.borderColor="#0a2850";}}>
                <div style={{fontSize:22,marginBottom:5}}>{app.ico}</div>
                <div style={{fontSize:10,color:"#00ddee",letterSpacing:1}}>{app.name}</div>
                <div style={{fontSize:9,color:"#004060",marginTop:2}}>{app.cat}</div>
              </div>
            ))}
          </div>
          <div style={{padding:"5px 10px",background:"#000c1e",borderTop:"1px solid #001530",fontSize:9,color:"#003050",display:"flex",justifyContent:"space-between"}}>
            <span>{filteredApps.length} app{filteredApps.length!==1?"s":""}</span>
            <span>DOUBLE-TAP REACTOR · ESC TO CLOSE</span>
          </div>
        </div>
      )}

      {/* ── SETTINGS ── */}
      {overlay==="settings"&&(
        <div style={{...S.overlay,top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:"min(520px,94vw)",background:"#000c1e",border:"1.5px solid #0070c8",borderRadius:4}}>
          <div style={S.header}><span style={S.headerTitle}>◈ RYAN OS v24 // SETTINGS</span><button style={S.closeBtn} onClick={()=>setOverlay(null)}>✕</button></div>
          <div style={{padding:14,overflowY:"auto",maxHeight:"82vh"}}>

            {/* ── AI ENGINE STATUS ── */}
            <div style={{marginBottom:14,background:"#000913",border:"1px solid #003060",borderRadius:4,padding:"10px 12px"}}>
              <div style={{fontSize:10,letterSpacing:2,marginBottom:6,color:Brain.provider==="local"?"#ffaa00":Brain.provider==="cerebras"?"#00ffdd":Brain.provider==="groq"?"#00ff99":Brain.provider==="mistral"?"#ff9966":"#4d9fff"}}>
                ◉ AI ENGINE: {Brain.providerName} {Brain.provider==="local"?"(OFFLINE FALLBACK)":"(ACTIVE ✓)"}
              </div>
              <div style={{fontSize:9,color:"#446688",lineHeight:1.7}}>
                {Brain.provider==="local"?"No API key set — running offline. Add at least one key below to unlock the 4-provider RDT brain.":Brain.provider==="cerebras"?"Cerebras WSE — ultra-fast inference. Smart router picks the best model per message.":Brain.provider==="groq"?"Groq LPU — Llama 3 models. Blazing fast, free tier at console.groq.com.":Brain.provider==="mistral"?"Mistral handles heavy prompts and code — Codestral for code, Large for long context.":"Gemini/Gemma 4 active — grounding-enabled for live web queries."}
              </div>
              <div style={{display:"flex",gap:10,marginTop:8,flexWrap:"wrap"}}>
                {[{p:"cerebras",label:"Cerebras",col:"#00ffdd",key:settings.cerebrasKey},{p:"groq",label:"Groq",col:"#00ff99",key:settings.groqKey},{p:"gemini",label:"Gemini",col:"#4d9fff",key:settings.geminiKey},{p:"mistral",label:"Mistral",col:"#ff9966",key:settings.mistralKey}].map(({p,label,col,key})=>(
                  <div key={p} style={{display:"flex",alignItems:"center",gap:4,fontSize:9}}>
                    <div style={{width:6,height:6,borderRadius:"50%",background:key?col:"#223344",boxShadow:key?`0 0 6px ${col}`:"none"}}/>
                    <span style={{color:key?col:"#334455",letterSpacing:1}}>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── API KEYS — 4 PROVIDERS ── */}
            <div style={{fontSize:10,color:"#446688",letterSpacing:2,marginBottom:8}}>◈ AI PROVIDER API KEYS</div>

            <div style={{marginBottom:12,background:"#00ffdd08",border:"1px solid #00ffdd18",borderRadius:4,padding:"10px 12px"}}>
              <label style={{display:"block",fontSize:10,color:"#00ffdd",marginBottom:4,letterSpacing:1}}>CEREBRAS API KEY <span style={{color:"#446688",fontWeight:"normal"}}>(free at cloud.cerebras.ai)</span></label>
              <input type="password" value={settings.cerebrasKey||""} onChange={e=>setSettings(s=>({...s,cerebrasKey:e.target.value}))} placeholder="csk-..." style={{...S.input,width:"100%",fontFamily:"monospace"}}/>
              {settings.cerebrasKey?<div style={{fontSize:9,color:"#00ffdd",marginTop:3}}>✓ Cerebras active — ultra-fast WSE for quick replies &amp; chit-chat</div>:<div style={{fontSize:9,color:"#334455",marginTop:3}}>◇ Fastest — Llama 3.1 8B + 70B on Cerebras WSE hardware</div>}
            </div>

            <div style={{marginBottom:12,background:"#00ff9908",border:"1px solid #00ff9918",borderRadius:4,padding:"10px 12px"}}>
              <label style={{display:"block",fontSize:10,color:"#00ff99",marginBottom:4,letterSpacing:1}}>GROQ API KEY <span style={{color:"#446688",fontWeight:"normal"}}>(free at console.groq.com)</span></label>
              <input type="password" value={settings.groqKey||""} onChange={e=>setSettings(s=>({...s,groqKey:e.target.value}))} placeholder="gsk_..." style={{...S.input,width:"100%",fontFamily:"monospace"}}/>
              {settings.groqKey?<div style={{fontSize:9,color:"#00ff99",marginTop:3}}>✓ Groq active — Llama 3.1 8B (reflex) + Llama 3.3 70B (chat)</div>:<div style={{fontSize:9,color:"#334455",marginTop:3}}>◇ Groq LPU — Llama 3.1 8B Instant + Llama 3.3 70B Versatile</div>}
            </div>

            <div style={{marginBottom:12,background:"#4d9fff08",border:"1px solid #4d9fff18",borderRadius:4,padding:"10px 12px"}}>
              <label style={{display:"block",fontSize:10,color:"#4d9fff",marginBottom:4,letterSpacing:1}}>GEMINI API KEY <span style={{color:"#446688",fontWeight:"normal"}}>(free at aistudio.google.com)</span></label>
              <input type="password" value={settings.geminiKey||""} onChange={e=>setSettings(s=>({...s,geminiKey:e.target.value}))} placeholder="AIza..." style={{...S.input,width:"100%",fontFamily:"monospace"}}/>
              {settings.geminiKey?<div style={{fontSize:9,color:"#4d9fff",marginTop:3}}>✓ Gemini/Gemma 4 active — E2B · E4B · 26B MoE · 31B · Flash · Pro + web grounding</div>:<div style={{fontSize:9,color:"#334455",marginTop:3}}>◇ Enables all Gemma 4 models + Gemini 2.5 Flash &amp; Pro</div>}
            </div>

            <div style={{marginBottom:14,background:"#ff996608",border:"1px solid #ff996618",borderRadius:4,padding:"10px 12px"}}>
              <label style={{display:"block",fontSize:10,color:"#ff9966",marginBottom:4,letterSpacing:1}}>MISTRAL API KEY <span style={{color:"#446688",fontWeight:"normal"}}>(free tier at console.mistral.ai)</span></label>
              <input type="password" value={settings.mistralKey||""} onChange={e=>setSettings(s=>({...s,mistralKey:e.target.value}))} placeholder="..." style={{...S.input,width:"100%",fontFamily:"monospace"}}/>
              {settings.mistralKey?<div style={{fontSize:9,color:"#ff9966",marginTop:3}}>✓ Mistral active — Small · Large · Codestral for heavy code &amp; long context</div>:<div style={{fontSize:9,color:"#334455",marginTop:3}}>◇ Mistral Small · Large (long context) · Codestral (code specialist)</div>}
            </div>

            {/* User prefs */}
            {[["YOUR CITY","loc","text","Nashik"],["AI NAME","name","text","Ryan"]].map(([label,key,type,ph])=>(
              <div key={key} style={{marginBottom:12}}>
                <label style={{display:"block",fontSize:10,color:"#009aad",marginBottom:4,letterSpacing:1}}>{label}</label>
                <input type={type} value={settings[key]} onChange={e=>setSettings(s=>({...s,[key]:e.target.value}))} placeholder={ph} style={{...S.input,width:"100%"}}/>
              </div>
            ))}

            {/* ── VOICE PERSONA SELECTOR ── */}
            {safeSynth&&(
              <div style={{marginBottom:14}}>
                <label style={{display:"block",fontSize:10,color:"#009aad",marginBottom:8,letterSpacing:1}}>◈ VOICE PERSONA</label>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:7}}>
                  {VOICE_PERSONAS.map(p=>{
                    const isActive = selectedPersona===p.id;
                    const maleColor  = "#00aaff";
                    const femaleColor= "#bb66ff";
                    const col = p.gender==="male" ? maleColor : femaleColor;
                    return (
                      <div key={p.id}
                        onClick={()=>{
                          setSelectedPersona(p.id);
                          safeLS.set("RYN_PERSONA",p.id);
                          // Preview voice immediately
                          if(safeSynth){
                            safeSynth.cancel();
                            const vs=safeSynth.getVoices();
                            const utt=new SpeechSynthesisUtterance(`Hi, I'm ${p.name}.`);
                            for(const pref of p.preferred){const v=vs.find(v=>v.name.toLowerCase().includes(pref.toLowerCase())||v.lang===pref);if(v){utt.voice=v;break;}}
                            utt.rate=p.rate*(ttsSpeed/1.05); utt.pitch=p.pitch; utt.volume=1.0;
                            safeSynth.speak(utt);
                          }
                        }}
                        style={{
                          background: isActive ? (p.gender==="male"?"#001840":"#120030") : "#000913",
                          border: `1.5px solid ${isActive ? col : "#0a2850"}`,
                          borderRadius:4, padding:"10px 8px", cursor:"pointer",
                          textAlign:"center", transition:"all .15s",
                          boxShadow: isActive ? `0 0 12px ${col}44` : "none",
                        }}
                        onMouseEnter={e=>{if(!isActive){e.currentTarget.style.borderColor=col+"88";e.currentTarget.style.background=p.gender==="male"?"#00101a":"#0e0020";}}}
                        onMouseLeave={e=>{if(!isActive){e.currentTarget.style.borderColor="#0a2850";e.currentTarget.style.background="#000913";}}}
                      >
                        <div style={{fontSize:22,marginBottom:4}}>{p.icon}</div>
                        <div style={{fontSize:11,color:isActive?col:C.LIGHT,fontWeight:"bold",letterSpacing:1}}>{p.name}</div>
                        <div style={{fontSize:8,color:isActive?col+"cc":"#446688",marginTop:3,letterSpacing:0.5}}>{p.desc}</div>
                        <div style={{fontSize:7,color:p.gender==="male"?"#004488":"#440088",marginTop:4,letterSpacing:1,textTransform:"uppercase"}}>{p.gender}</div>
                        {isActive&&<div style={{marginTop:5,fontSize:8,color:col,letterSpacing:1}}>● ACTIVE</div>}
                      </div>
                    );
                  })}
                </div>
                <div style={{marginTop:6,fontSize:9,color:"#004060",textAlign:"center"}}>Click a persona to preview · Blue = male · Purple = female</div>
              </div>
            )}

            {/* Manual voice override (advanced) */}
            {safeSynth&&voices.length>0&&(
              <div style={{marginBottom:12}}>
                <label style={{display:"block",fontSize:10,color:"#446688",marginBottom:4,letterSpacing:1}}>MANUAL VOICE OVERRIDE (optional)</label>
                <select value={settings.voice} onChange={e=>setSettings(s=>({...s,voice:e.target.value}))} style={{...S.input,width:"100%",fontSize:10}}>
                  <option value="">← Use persona auto-select</option>
                  {voices.map(v=><option key={v.name} value={v.name}>{v.name} ({v.lang})</option>)}
                </select>
              </div>
            )}

            {/* Speed slider */}
            <div style={{marginBottom:14}}>
              <label style={{display:"block",fontSize:10,color:"#009aad",marginBottom:4,letterSpacing:1}}>VOICE SPEED: {parseFloat(settings.ttsSpeed||1.05).toFixed(2)}x</label>
              <input type="range" min="0.5" max="2.0" step="0.05" value={settings.ttsSpeed||1.05} onChange={e=>setSettings(s=>({...s,ttsSpeed:e.target.value}))} style={{width:"100%",accentColor:"#00aaff"}}/>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:9,color:"#446688"}}>
                <span>0.5x Slow</span><span>1.0x Normal</span><span>2.0x Fast</span>
              </div>
            </div>

            <button onClick={saveSettings} style={{background:"#003070",border:"1px solid #0070c8",color:"#00eeff",fontFamily:'"Courier New",monospace',fontSize:11,cursor:"pointer",padding:"8px 18px",borderRadius:2,width:"100%",letterSpacing:2}}>SAVE SETTINGS</button>
            <div style={{marginTop:10,fontSize:9,color:"#004060",textAlign:"center"}}>Ctrl+L=Launcher · Ctrl+N=Notes · Ctrl+T=Todos · Ctrl+K=Calendar · Ctrl+M=Mic · Esc=Close</div>
          </div>
        </div>
      )}

      {/* ── NOTES ── */}
      {overlay==="notes"&&(
        <div style={{...S.overlay,top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:"min(520px,94vw)",maxHeight:"80vh",background:"#000c1e",border:"1.5px solid #0070c8",borderRadius:4}}>
          <div style={S.header}><span style={S.headerTitle}>◈ NOTES ENGINE  ({notesList.length})</span><button style={S.closeBtn} onClick={()=>setOverlay(null)}>✕</button></div>
          <div style={{padding:"6px 10px",borderBottom:"1px solid #001530"}}>
            <input placeholder="Search notes..." onChange={e=>{const q=e.target.value;setNotesList(q?Notes.search(q):Notes.list());}} style={{...S.input,width:"100%",fontSize:11}}/>
          </div>
          <div style={{flex:1,overflowY:"auto",padding:10,maxHeight:"45vh"}}>
            {notesList.map(n=>(
              <div key={n.id} style={{background:"#000913",borderLeft:`2px solid ${n.pinned?"#ffdd00":"#0070c8"}`,marginBottom:6,padding:"6px 8px",fontSize:11,color:"#88eeff",position:"relative"}}>
                <div style={{fontSize:9,color:"#004060",marginBottom:2}}>{n.created.slice(0,16).replace("T"," ")} {n.pinned&&"📌"}</div>
                <div style={{paddingRight:40,wordBreak:"break-word"}}>{n.text}</div>
                <div style={{position:"absolute",right:4,top:4,display:"flex",gap:4}}>
                  <button onClick={()=>{Notes.pin(n.id);setNotesList(Notes.list());}} style={{background:"none",border:"none",color:n.pinned?"#ffdd00":"#004060",cursor:"pointer",fontSize:11}}>📌</button>
                  <button onClick={()=>{Notes.delete(n.id);setNotesList(Notes.list());}} style={{background:"none",border:"none",color:"#ff4444",cursor:"pointer",fontSize:12}}>×</button>
                </div>
              </div>
            ))}
            {!notesList.length&&<div style={{color:"#004060",fontSize:11,padding:10}}>No notes yet. Add one below.</div>}
          </div>
          <div style={{display:"flex",gap:6,padding:"8px 10px",borderTop:"1px solid #001530"}}>
            <input value={noteInput} onChange={e=>setNoteInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&noteInput.trim()&&(Notes.add(noteInput),setNotesList(Notes.list()),setNoteInput(""))} placeholder="New note..." style={{...S.input,flex:1}}/>
            <button onClick={()=>{if(!noteInput.trim())return;Notes.add(noteInput);setNotesList(Notes.list());setNoteInput("");}} style={S.hudBtn}>ADD</button>
          </div>
        </div>
      )}

      {/* ── TODOS ── */}
      {overlay==="todos"&&(
        <div style={{...S.overlay,top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:"min(520px,94vw)",maxHeight:"80vh",background:"#000c1e",border:"1.5px solid #ff9900",borderRadius:4}}>
          <div style={{...S.header,borderBottom:"1px solid #3a1800"}}><span style={{...S.headerTitle,color:"#ff9900"}}>◈ TODO ENGINE  ({todoList.filter(t=>!t.done).length} pending)</span><button style={S.closeBtn} onClick={()=>setOverlay(null)}>✕</button></div>
          <div style={{flex:1,overflowY:"auto",padding:10,maxHeight:"50vh"}}>
            {["high","normal","low"].map(pri=>{
              const items=todoList.filter(t=>t.priority===pri);if(!items.length)return null;
              return(<div key={pri}><div style={{fontSize:9,color:pri==="high"?C.RED:pri==="normal"?C.CYAN:C.TEAL,letterSpacing:2,marginBottom:4,marginTop:6}}>{pri.toUpperCase()} PRIORITY</div>
              {items.map(t=>(
                <div key={t.id} style={{background:"#000913",borderLeft:`2px solid ${pri==="high"?C.RED:pri==="normal"?C.CYAN:C.TEAL}`,marginBottom:4,padding:"5px 8px",fontSize:11,color:t.done?"#003050":"#88eeff",display:"flex",alignItems:"center",gap:8,textDecoration:t.done?"line-through":"none"}}>
                  <button onClick={()=>{Todos.toggle(t.id);setTodoList(Todos.list());}} style={{background:"none",border:`1px solid ${C.CYAN}`,color:t.done?C.GREEN:C.CYAN,cursor:"pointer",fontSize:10,padding:"1px 5px",borderRadius:2,flexShrink:0}}>{t.done?"✓":"○"}</button>
                  <span style={{flex:1,wordBreak:"break-word"}}>{t.text}</span>
                  <button onClick={()=>{Todos.delete(t.id);setTodoList(Todos.list());}} style={{background:"none",border:"none",color:"#ff4444",cursor:"pointer",flexShrink:0}}>×</button>
                </div>
              ))}</div>);
            })}
            {!todoList.length&&<div style={{color:"#004060",fontSize:11,padding:10}}>No todos. Add one below!</div>}
          </div>
          <div style={{display:"flex",gap:6,padding:"8px 10px",borderTop:"1px solid #3a1800",flexWrap:"wrap"}}>
            <input id="todoInp" placeholder="New task..." style={{...S.input,flex:1,minWidth:150}} onKeyDown={e=>e.key==="Enter"&&(()=>{const inp=document.getElementById("todoInp");if(!inp.value.trim())return;Todos.add(inp.value.trim(),"normal");setTodoList(Todos.list());inp.value="";})()}/>
            <select id="todoPri" style={{...S.input,padding:"6px 4px"}}><option value="normal">Normal</option><option value="high">High</option><option value="low">Low</option></select>
            <button onClick={()=>{const inp=document.getElementById("todoInp");const pri=document.getElementById("todoPri").value;if(!inp.value.trim())return;Todos.add(inp.value.trim(),pri);setTodoList(Todos.list());inp.value="";}} style={S.hudBtn}>ADD</button>
            <button onClick={()=>{Todos.clearDone();setTodoList(Todos.list());showToast("Cleared done todos!");}} style={{...S.hudBtn,borderColor:"#444"}}>CLEAR DONE</button>
          </div>
        </div>
      )}

      {/* ── HABITS ── */}
      {overlay==="habits"&&(
        <div style={{...S.overlay,top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:"min(480px,94vw)",maxHeight:"80vh",background:"#000c1e",border:"1.5px solid #00ff99",borderRadius:4}}>
          <div style={{...S.header,borderBottom:"1px solid #003020"}}><span style={{...S.headerTitle,color:C.GREEN}}>◈ HABIT TRACKER</span><button style={S.closeBtn} onClick={()=>setOverlay(null)}>✕</button></div>
          <div style={{flex:1,overflowY:"auto",padding:10,maxHeight:"50vh"}}>
            {Object.values(habitData).map((h,i)=>(
              <div key={i} style={{background:"#000913",borderLeft:"2px solid #00ff99",marginBottom:6,padding:"8px 10px",fontSize:11}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{color:C.GREEN,fontWeight:"bold"}}>{h.name}</span>
                  <span style={{color:C.CYAN,fontSize:13}}>🔥 {h.streak} day streak</span>
                </div>
                <div style={{color:"#004060",fontSize:9,marginTop:3}}>Total: {h.total||0} logs · Last: {h.lastDate||"never"}</div>
                <div style={{marginTop:6,display:"flex",gap:4}}>
                  <button onClick={()=>{Habits.logHabit(h.name);setHabitData({...Habits.getAll()});showToast(`${h.name} logged! 🔥`);}} style={S.hudBtn}>LOG TODAY</button>
                </div>
              </div>
            ))}
            {!Object.keys(habitData).length&&<div style={{color:"#004060",fontSize:11,padding:10}}>No habits tracked. Add one below!</div>}
          </div>
          <div style={{display:"flex",gap:6,padding:"8px 10px",borderTop:"1px solid #003020"}}>
            <input value={habitInput} onChange={e=>setHabitInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&habitInput.trim()&&(Habits.logHabit(habitInput),setHabitData({...Habits.getAll()}),setHabitInput(""))} placeholder="Habit name (e.g. workout)" style={{...S.input,flex:1}}/>
            <button onClick={()=>{if(!habitInput.trim())return;Habits.logHabit(habitInput);setHabitData({...Habits.getAll()});setHabitInput("");showToast("Habit logged! 🔥");}} style={S.hudBtn}>LOG</button>
          </div>
        </div>
      )}

      {/* ── CALENDAR ── */}
      {overlay==="calendar"&&(
        <div style={{...S.overlay,top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:"min(480px,94vw)",maxHeight:"80vh",background:"#000c1e",border:"1.5px solid #0070c8",borderRadius:4}}>
          <div style={S.header}><span style={S.headerTitle}>◈ CALENDAR / EVENTS ({eventsList.length})</span><button style={S.closeBtn} onClick={()=>setOverlay(null)}>✕</button></div>
          <div style={{overflowY:"auto",padding:10,maxHeight:"45vh"}}>
            {eventsList.map(e=>(
              <div key={e.id} style={{background:"#000913",borderLeft:"2px solid #00aaff",marginBottom:6,padding:"6px 8px",fontSize:11,color:"#88eeff",position:"relative"}}>
                <div style={{fontSize:9,color:"#009aad"}}>{new Date(e.dt).toLocaleString().slice(0,16)}</div>
                {e.title}
                <button onClick={()=>{Calendar.deleteEvent(e.id);setEventsList(Calendar.getAll());}} style={{position:"absolute",right:6,top:4,background:"none",border:"none",color:"#ff4444",cursor:"pointer"}}>×</button>
              </div>
            ))}
            {!eventsList.length&&<div style={{color:"#004060",fontSize:11,padding:10}}>No events. Add one below!</div>}
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:5,padding:"8px 10px",borderTop:"1px solid #001530"}}>
            <input value={calTitle} onChange={e=>setCalTitle(e.target.value)} placeholder="Event title" style={S.input}/>
            <input type="datetime-local" value={calDt} onChange={e=>setCalDt(e.target.value)} style={S.input}/>
            <button onClick={()=>{if(!calTitle.trim()||!calDt)return;Calendar.addEvent(calTitle,calDt);setEventsList(Calendar.getAll());setCalTitle("");showToast("Event added! 📅");}} style={S.hudBtn}>ADD EVENT</button>
          </div>
        </div>
      )}

      {/* ── CALCULATOR ── */}
      {overlay==="calc"&&(
        <div style={{...S.overlay,top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:"min(420px,94vw)",background:"#000c1e",border:"1.5px solid #00aaff",borderRadius:4}}>
          <div style={S.header}><span style={S.headerTitle}>◈ RYAN CALCULATOR</span><button style={S.closeBtn} onClick={()=>setOverlay(null)}>✕</button></div>
          <div style={{padding:"10px 12px"}}>
            <input
              value={calcInput}
              onChange={e=>setCalcInput(e.target.value)}
              onKeyDown={e=>{
                if(e.key==="Enter"&&calcInput.trim()){
                  try{
                    const expr=calcInput.trim().replace(/\^/g,"**").replace(/sqrt\(/g,"Math.sqrt(").replace(/abs\(/g,"Math.abs(").replace(/floor\(/g,"Math.floor(").replace(/ceil\(/g,"Math.ceil(").replace(/round\(/g,"Math.round(").replace(/log\(/g,"Math.log10(").replace(/ln\(/g,"Math.log(").replace(/sin\(/g,"Math.sin(").replace(/cos\(/g,"Math.cos(").replace(/tan\(/g,"Math.tan(").replace(/pi\b/g,"Math.PI").replace(/e\b/g,"Math.E");
                    // eslint-disable-next-line no-new-func
                    const result=new Function("return "+expr)();
                    const entry={expr:calcInput,result:isNaN(result)?"Error":Number(result.toFixed(10)).toString()};
                    setCalcHistory(h=>[entry,...h].slice(0,20));
                    setCalcInput(entry.result==="Error"?"":entry.result);
                  }catch{
                    setCalcHistory(h=>[{expr:calcInput,result:"Syntax Error"},...h].slice(0,20));
                  }
                }
                if(e.key==="Escape") setCalcInput("");
              }}
              placeholder="e.g. 15*8, sqrt(144), 2^10, sin(pi/2)"
              style={{...S.input,width:"100%",fontSize:16,padding:"10px 12px",marginBottom:8}}
              autoFocus
            />
            <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:4,marginBottom:10}}>
              {["7","8","9","÷","C","4","5","6","×","⌫","1","2","3","−","(","0",".","=","+",")"].map((k,i)=>(
                <button key={i} onClick={()=>{
                  if(k==="C"){setCalcInput("");return;}
                  if(k==="⌫"){setCalcInput(v=>v.slice(0,-1));return;}
                  if(k==="="){
                    try{
                      const expr=calcInput.replace(/÷/g,"/").replace(/×/g,"*").replace(/−/g,"-").replace(/\^/g,"**").replace(/sqrt\(/g,"Math.sqrt(").replace(/pi\b/g,"Math.PI").replace(/e\b/g,"Math.E");
                      // eslint-disable-next-line no-new-func
                      const result=new Function("return "+expr)();
                      const entry={expr:calcInput,result:isNaN(result)?"Error":Number(result.toFixed(10)).toString()};
                      setCalcHistory(h=>[entry,...h].slice(0,20));
                      setCalcInput(entry.result);
                    }catch{setCalcInput("Error");}
                    return;
                  }
                  const map={"÷":"/","×":"*","−":"-"};
                  setCalcInput(v=>v+(map[k]||k));
                }}
                style={{...S.hudBtn,padding:"10px 4px",fontSize:14,borderColor:k==="="?"#00aaff":k==="C"?"#ff2244":"#0a3060",color:k==="="?C.CYAN:k==="C"?C.RED:C.LIGHT,borderRadius:3}}>
                  {k}
                </button>
              ))}
            </div>
            <div style={{maxHeight:180,overflowY:"auto"}}>
              {calcHistory.map((h,i)=>(
                <div key={i} onClick={()=>setCalcInput(h.result)} style={{display:"flex",justifyContent:"space-between",padding:"4px 6px",borderBottom:"1px solid #001530",cursor:"pointer",fontSize:11}} onMouseEnter={e=>e.currentTarget.style.background="#001838"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <span style={{color:"#446688"}}>{h.expr}</span>
                  <span style={{color:h.result==="Error"?C.RED:C.CYAN,fontWeight:"bold"}}>= {h.result}</span>
                </div>
              ))}
              {!calcHistory.length&&<div style={{color:"#003050",fontSize:11,padding:8,textAlign:"center"}}>Type an expression and press Enter or =</div>}
            </div>
          </div>
        </div>
      )}

      {/* ── MOOD TRACKER ── */}
      {overlay==="mood"&&(
        <div style={{...S.overlay,top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:"min(480px,94vw)",maxHeight:"80vh",background:"#000c1e",border:"1.5px solid #8866ff",borderRadius:4}}>
          <div style={{...S.header,borderBottom:"1px solid #220050"}}><span style={{...S.headerTitle,color:C.PURPLE}}>◈ MOOD TRACKER</span><button style={S.closeBtn} onClick={()=>setOverlay(null)}>✕</button></div>
          <div style={{padding:"10px 12px"}}>
            <div style={{fontSize:10,color:C.PURPLE,letterSpacing:2,marginBottom:8}}>HOW ARE YOU FEELING?</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:12}}>
              {[["😊","happy"],["😢","sad"],["😤","angry"],["😰","anxious"],["😫","stressed"],["😴","tired"],["🎯","focused"],["🤩","excited"],["😑","bored"],["😌","calm"],["💪","motivated"],["😵","overwhelmed"]].map(([emoji,mood])=>(
                <button key={mood} onClick={()=>{
                  const entry={mood,ts:new Date().toISOString(),note:""};
                  const log=JSON.parse(safeLS.get("RYN_MOOD","[]"));
                  log.push(entry);if(log.length>100)log.shift();
                  safeLS.set("RYN_MOOD",JSON.stringify(log));
                  setMoodLog([...log]);
                  showToast(`Mood logged: ${mood} ${emoji}`);
                }} style={{...S.hudBtn,borderColor:"#441188",padding:"6px 10px",fontSize:12,borderRadius:20}}>
                  {emoji} {mood}
                </button>
              ))}
            </div>
            <div style={{fontSize:10,color:"#666",letterSpacing:2,marginBottom:6}}>RECENT MOOD LOG</div>
            <div style={{maxHeight:220,overflowY:"auto"}}>
              {[...moodLog].reverse().slice(0,15).map((entry,i)=>{
                const emojis={happy:"😊",sad:"😢",angry:"😤",anxious:"😰",stressed:"😫",tired:"😴",focused:"🎯",excited:"🤩",bored:"😑",calm:"😌",motivated:"💪",overwhelmed:"😵"};
                const moodColors={happy:"#00ff99",sad:"#4488ff",angry:"#ff4444",anxious:"#ffaa00",stressed:"#ff6600",tired:"#888888",focused:"#00eeff",excited:"#ffdd00",bored:"#446688",calm:"#88ccff",motivated:"#00ff66",overwhelmed:"#ff2244"};
                return(
                  <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 8px",borderBottom:"1px solid #110033",borderLeft:`3px solid ${moodColors[entry.mood]||"#444"}`,marginBottom:3}}>
                    <span style={{fontSize:13}}>{emojis[entry.mood]||"❓"} <span style={{color:moodColors[entry.mood]||C.CYAN,fontSize:11}}>{entry.mood}</span></span>
                    <span style={{color:"#446688",fontSize:9}}>{new Date(entry.ts).toLocaleString().slice(0,16)}</span>
                  </div>
                );
              })}
              {!moodLog.length&&<div style={{color:"#330044",fontSize:11,padding:10,textAlign:"center"}}>No mood logs yet. Tap a mood above!</div>}
            </div>
            {moodLog.length>0&&(
              <button onClick={()=>{safeLS.set("RYN_MOOD","[]");setMoodLog([]);showToast("Mood log cleared.");}} style={{...S.hudBtn,marginTop:8,fontSize:10,borderColor:"#440000",color:"#ff4444"}}>CLEAR LOG</button>
            )}
          </div>
        </div>
      )}

      {/* ── TOAST ── */}
      <div style={{position:"fixed",bottom:70,left:"50%",transform:"translateX(-50%)",background:"#001838",border:"1px solid #0070c8",color:"#00ddee",fontSize:11,padding:"6px 16px",borderRadius:20,pointerEvents:"none",opacity:toastVis?1:0,transition:"opacity .3s",zIndex:999,whiteSpace:"nowrap"}}>
        {toast}
      </div>
    </div>
  );
}

