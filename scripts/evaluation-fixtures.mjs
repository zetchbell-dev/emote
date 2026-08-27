// scripts/evaluation-fixtures.mjs
//
// Test-suite data for scripts/full-engine-evaluation.mjs. Kept in its
// own file so the harness script itself stays readable — this file
// contains ONLY data (text + synthetic GoEmotions-shaped scores +
// expected label), never engine logic.
//
// SCORES ARE SYNTHETIC, same convention as src/fixtures.mjs and
// scripts/replay-real-log.mjs: hand-authored {label, score} arrays
// standing in for real model output, because this evaluation runs
// offline (no network access to the actual transformer). `expect` is
// the label a human would assign the text; it is NOT a guarantee the
// current engine produces it — that gap is exactly what this harness
// is for.
import { scoreSet } from "../src/fixtures.mjs";

let n = 0;
function C(category, text, named, expect, background) {
  n += 1;
  return {
    id: `${category.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${n}`,
    category,
    expect,
    turns: [{ text, scores: scoreSet(named, background) }],
  };
}
function SEQ(category, turnDefs, expect) {
  n += 1;
  return {
    id: `${category.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${n}`,
    category,
    expect,
    turns: turnDefs.map(([text, named]) => ({ text, scores: scoreSet(named) })),
  };
}

export const TEST_CASES = [
  // ================= HAPPY (15) =================
  C("Happy", "This is the best day of my life!", { joy: 0.85, excitement: 0.6 }, "happy"),
  C("Happy", "Thank you so much, this means the world to me.", { gratitude: 0.88, joy: 0.4 }, "happy"),
  C("Happy", "I'm really proud of how this turned out.", { pride: 0.75, admiration: 0.3 }, "happy"),
  C("Happy", "I can't stop smiling right now.", { joy: 0.8, amusement: 0.3 }, "happy"),
  C("Happy", "We got the house! I'm so excited!", { excitement: 0.85, joy: 0.5 }, "happy"),
  C("Happy", "That's such a lovely surprise, thank you.", { gratitude: 0.6, surprise: 0.4, joy: 0.3 }, "happy"),
  C("Happy", "I love spending time with you.", { love: 0.9, joy: 0.3 }, "happy"),
  C("Happy", "What a wonderful concert that was.", { admiration: 0.5, joy: 0.6 }, "happy"),
  C("Happy", "I'm optimistic about how next year is going to go.", { optimism: 0.8 }, "happy"),
  C("Happy", "Finally relaxing after a long week, feels great.", { relief: 0.7, joy: 0.3 }, "happy"),
  C("Happy", "Congratulations, you totally earned this.", { admiration: 0.7, pride: 0.3 }, "happy"),
  C("Happy", "This meal was absolutely delightful.", { joy: 0.6, admiration: 0.3 }, "happy"),
  C("Happy", "I'm grateful for everything you've done for me.", { gratitude: 0.9 }, "happy"),
  C("Happy", "Getting that promotion made my whole month.", { pride: 0.6, joy: 0.5 }, "happy"),
  C("Happy", "I'm really looking forward to the trip.", { excitement: 0.6, optimism: 0.4 }, "happy"),

  // ================= SAD (15) =================
  C("Sad", "I feel so lonely and empty tonight.", { sadness: 0.8, grief: 0.3 }, "sad"),
  C("Sad", "I really regret how I handled that.", { remorse: 0.75, sadness: 0.4 }, "sad"),
  C("Sad", "I'm so disappointed this didn't work out.", { disappointment: 0.8, sadness: 0.2 }, "sad"),
  C("Sad", "I miss the way things used to be.", { sadness: 0.7, grief: 0.2 }, "sad"),
  C("Sad", "Nothing feels like it matters right now.", { sadness: 0.75, disappointment: 0.2 }, "sad"),
  C("Sad", "I keep thinking about the funeral.", { grief: 0.85 }, "sad"),
  C("Sad", "I let everyone down and I feel terrible about it.", { remorse: 0.8, sadness: 0.3 }, "sad"),
  C("Sad", "It hurts to see the house empty like this.", { sadness: 0.7, grief: 0.4 }, "sad"),
  C("Sad", "I wish I could have said goodbye properly.", { grief: 0.7, remorse: 0.3 }, "sad"),
  C("Sad", "This year has been one loss after another.", { sadness: 0.8, grief: 0.3 }, "sad"),
  C("Sad", "I don't have the energy to do anything today.", { sadness: 0.65, disappointment: 0.2 }, "sad"),
  C("Sad", "Watching them leave was harder than I expected.", { sadness: 0.7 }, "sad"),
  C("Sad", "I feel like I failed everyone who counted on me.", { remorse: 0.7, sadness: 0.3 }, "sad"),
  C("Sad", "The apartment feels so quiet without her.", { sadness: 0.75, grief: 0.25 }, "sad"),
  C("Sad", "I'm mourning a version of my life I thought I'd have.", { grief: 0.8, sadness: 0.2 }, "sad"),

  // ================= ANGRY (15) =================
  C("Angry", "You're an idiot and I hate this.", { anger: 0.85, annoyance: 0.5 }, "angry"),
  C("Angry", "This is completely unacceptable behavior.", { anger: 0.7, disapproval: 0.5 }, "angry"),
  C("Angry", "Stop wasting my time, this is infuriating.", { anger: 0.75, annoyance: 0.4 }, "angry"),
  C("Angry", "How dare you go behind my back like that.", { anger: 0.8 }, "angry"),
  C("Angry", "I am furious about how this was handled.", { anger: 0.9 }, "angry"),
  C("Angry", "This company keeps lying to its customers.", { anger: 0.6, disapproval: 0.6 }, "angry"),
  C("Angry", "You broke your promise again and I'm done.", { anger: 0.7, annoyance: 0.4 }, "angry"),
  C("Angry", "Get out of my way right now.", { anger: 0.85 }, "angry"),
  C("Angry", "I can't believe they cancelled without telling anyone.", { anger: 0.6, annoyance: 0.5 }, "angry"),
  C("Angry", "That referee call was absolutely outrageous.", { anger: 0.75, disapproval: 0.3 }, "angry"),
  C("Angry", "You had one job and you blew it.", { anger: 0.7, annoyance: 0.4 }, "angry"),
  C("Angry", "This policy is a disgraceful abuse of power.", { anger: 0.8, disapproval: 0.5 }, "angry"),
  C("Angry", "Don't ever talk to me like that again.", { anger: 0.75 }, "angry"),
  C("Angry", "I'm sick of being ignored in every meeting.", { anger: 0.6, annoyance: 0.5 }, "angry"),
  C("Angry", "That was a spiteful, petty thing to do.", { anger: 0.65, disapproval: 0.4 }, "angry"),

  // ================= BITTERSWEET (12) =================
  C("Bittersweet", "I'm proud of her but I'll miss having her at home.", { pride: 0.5, sadness: 0.55 }, "bittersweet"),
  C("Bittersweet", "Graduation was wonderful and heartbreaking at the same time.", { joy: 0.5, sadness: 0.5 }, "bittersweet"),
  C("Bittersweet", "I'm happy for them, even though it means saying goodbye.", { joy: 0.45, sadness: 0.5 }, "bittersweet"),
  C("Bittersweet", "Selling the old house felt like closing a good chapter.", { sadness: 0.5, relief: 0.4 }, "bittersweet"),
  C("Bittersweet", "It was a beautiful wedding, but it made me miss mom so much.", { joy: 0.45, grief: 0.5 }, "bittersweet"),
  C("Bittersweet", "I'm excited for the new job but sad to leave this team.", { excitement: 0.45, sadness: 0.5 }, "bittersweet"),
  C("Bittersweet", "Watching my son move out was proud and painful at once.", { pride: 0.5, sadness: 0.5 }, "bittersweet"),
  C("Bittersweet", "The reunion was lovely, though it reminded me who's gone.", { joy: 0.4, grief: 0.5 }, "bittersweet"),
  C("Bittersweet", "I'm relieved it's over but I already miss the routine.", { relief: 0.45, sadness: 0.45 }, "bittersweet"),
  C("Bittersweet", "Retiring felt like freedom and loss all in one day.", { relief: 0.5, sadness: 0.5 }, "bittersweet"),
  C("Bittersweet", "I loved that trip, but coming home made me nostalgic and low.", { joy: 0.45, sadness: 0.45 }, "bittersweet"),
  C("Bittersweet", "So happy the surgery went well, still grieving what we lost getting here.", { relief: 0.45, grief: 0.5 }, "bittersweet"),

  // ================= CONFLICTED (12) =================
  C("Conflicted", "I'm thrilled and terrified about the move, honestly furious at myself for waiting this long.", { excitement: 0.4, sadness: 0.35, anger: 0.35 }, "conflicted"),
  C("Conflicted", "Part of me is proud, part of me is devastated, and part of me is just angry it happened at all.", { pride: 0.35, sadness: 0.4, anger: 0.35 }, "conflicted"),
  C("Conflicted", "I love him, I resent him, and I don't know which feeling to trust.", { love: 0.4, sadness: 0.35, anger: 0.35 }, "conflicted"),
  C("Conflicted", "I'm grateful for the offer but angry it took this long, and honestly a little sad it's ending here.", { gratitude: 0.35, anger: 0.35, sadness: 0.35 }, "conflicted"),
  C("Conflicted", "Relieved it's over, resentful about how it went, and weirdly happy too.", { relief: 0.35, anger: 0.35, joy: 0.35 }, "conflicted"),
  C("Conflicted", "I'm so happy for you and so hurt you didn't tell me sooner, and kind of mad about it.", { joy: 0.35, sadness: 0.35, anger: 0.35 }, "conflicted"),
  C("Conflicted", "Excited about the wedding, devastated about the cost, irritated no one is helping plan it.", { excitement: 0.35, sadness: 0.35, anger: 0.35 }, "conflicted"),
  C("Conflicted", "I admire what she did, I'm heartbroken by the outcome, and I'm still angry it came to this.", { admiration: 0.35, sadness: 0.35, anger: 0.35 }, "conflicted"),
  C("Conflicted", "I'm thankful, resentful, and a little proud, all in the same breath.", { gratitude: 0.35, anger: 0.35, pride: 0.35 }, "conflicted"),
  C("Conflicted", "Happy the diagnosis wasn't worse, furious it took three visits to get it, sad about the recovery ahead.", { joy: 0.35, anger: 0.35, sadness: 0.35 }, "conflicted"),
  C("Conflicted", "I'm proud of the team, disappointed in myself, and irritated at the client.", { pride: 0.35, sadness: 0.35, anger: 0.35 }, "conflicted"),
  C("Conflicted", "So relieved, so sad, so angry — all of it at once, I can't pick one.", { relief: 0.35, sadness: 0.35, anger: 0.35 }, "conflicted"),

  // ================= SARCASTIC (15) =================
  C("Sarcastic", "Oh wow, great job breaking it again.", { annoyance: 0.2, approval: 0.15 }, "sarcastic"),
  C("Sarcastic", "Yeah right, like that's ever going to happen.", { annoyance: 0.3, disapproval: 0.2 }, "sarcastic"),
  C("Sarcastic", "Oh fantastic, another meeting that could've been an email.", { annoyance: 0.25 }, "sarcastic"),
  C("Sarcastic", "Just what I needed today, more paperwork.", { annoyance: 0.2, disappointment: 0.15 }, "sarcastic"),
  C("Sarcastic", "Wow, couldn't be happier about spending my Saturday on this.", { annoyance: 0.2 }, "sarcastic"),
  C("Sarcastic", "Oh joy, the printer's broken again.", { annoyance: 0.25 }, "sarcastic"),
  C("Sarcastic", "Great, totally loved waiting two hours for nothing.", { annoyance: 0.25, disapproval: 0.15 }, "sarcastic"),
  C("Sarcastic", "Oh wonderful, my flight got delayed, exactly what I wanted.", { annoyance: 0.25 }, "sarcastic"),
  C("Sarcastic", "Sure, because that plan worked out so well last time.", { disapproval: 0.2, annoyance: 0.15 }, "sarcastic"),
  C("Sarcastic", "Oh great, another software update that breaks everything.", { annoyance: 0.25, disapproval: 0.15 }, "sarcastic"),
  C("Sarcastic", "Yeah, right, tell me another one.", { disapproval: 0.15, annoyance: 0.1 }, "sarcastic"),
  C("Sarcastic", "Oh brilliant, they lost my reservation. Perfect.", { annoyance: 0.25 }, "sarcastic"),
  C("Sarcastic", "Just what I wanted, a surprise inspection on my day off.", { annoyance: 0.2 }, "sarcastic"),
  C("Sarcastic", "Oh amazing, the wifi is down during the presentation. Love that.", { annoyance: 0.25 }, "sarcastic"),
  C("Sarcastic", "Wow, thanks for the heads up five minutes before the deadline.", { annoyance: 0.2, disapproval: 0.15 }, "sarcastic"),

  // ================= FRUSTRATED (15) =================
  C("Frustrated", "I've tried this six times and nothing works.", { annoyance: 0.2, disappointment: 0.15 }, "frustrated"),
  C("Frustrated", "It keeps failing again, no matter how many times I try.", { annoyance: 0.22, disappointment: 0.1 }, "frustrated"),
  C("Frustrated", "I'm still stuck on the same problem after 3 hours.", { annoyance: 0.2, disappointment: 0.15 }, "frustrated"),
  C("Frustrated", "Every time I fix one bug, two more show up.", { annoyance: 0.25 }, "frustrated"),
  C("Frustrated", "I've restarted the router five times and it's still not connecting.", { annoyance: 0.2 }, "frustrated"),
  C("Frustrated", "Nothing works no matter what I try, I've been at this for hours.", { annoyance: 0.2, disappointment: 0.15 }, "frustrated"),
  C("Frustrated", "I keep re-submitting the form and it keeps rejecting it.", { annoyance: 0.22 }, "frustrated"),
  C("Frustrated", "I've explained this three times already and nothing's changed.", { annoyance: 0.25, disapproval: 0.1 }, "frustrated"),
  C("Frustrated", "This is the fourth call today about the same issue.", { annoyance: 0.2 }, "frustrated"),
  C("Frustrated", "I've been on hold for 40 minutes, again.", { annoyance: 0.22 }, "frustrated"),
  C("Frustrated", "Every single attempt has failed so far, over and over.", { annoyance: 0.2, disappointment: 0.1 }, "frustrated"),
  C("Frustrated", "I keep hitting the same wall no matter what I change.", { annoyance: 0.2 }, "frustrated"),
  C("Frustrated", "It's been three weeks of the same bug resurfacing constantly.", { annoyance: 0.22 }, "frustrated"),
  C("Frustrated", "I've asked for this five times and it's still not done.", { annoyance: 0.2, disapproval: 0.1 }, "frustrated"),
  C("Frustrated", "I keep trying and keep failing at the exact same step.", { annoyance: 0.2, disappointment: 0.1 }, "frustrated"),

  // ================= ANXIOUS (15) =================
  C("Anxious", "What if I fail the interview tomorrow?", { nervousness: 0.2 }, "anxious"),
  C("Anxious", "I can't stop worrying about the test results.", { nervousness: 0.25, sadness: 0.1 }, "anxious"),
  C("Anxious", "What if they don't like the presentation?", { nervousness: 0.2 }, "anxious"),
  C("Anxious", "I'm terrified something will go wrong on the trip.", { fear: 0.3 }, "anxious"),
  C("Anxious", "What if I say the wrong thing at the meeting?", { nervousness: 0.22 }, "anxious"),
  C("Anxious", "I keep dreading the phone call I have to make.", { fear: 0.25 }, "anxious"),
  C("Anxious", "What if this decision turns out to be a huge mistake?", { nervousness: 0.2 }, "anxious"),
  C("Anxious", "I'm so nervous about the surgery next week.", { nervousness: 0.3 }, "anxious"),
  C("Anxious", "What if nobody shows up to the event?", { nervousness: 0.2 }, "anxious"),
  C("Anxious", "I can't stop thinking about what could go wrong.", { nervousness: 0.22 }, "anxious"),
  C("Anxious", "What if the plane gets delayed and I miss the connection?", { nervousness: 0.2 }, "anxious"),
  C("Anxious", "I'm scared this rash means something serious.", { fear: 0.3 }, "anxious"),
  C("Anxious", "What if my boss thinks I'm not pulling my weight?", { nervousness: 0.22 }, "anxious"),
  C("Anxious", "I'm dreading what the doctor is going to say.", { fear: 0.28 }, "anxious"),
  C("Anxious", "What if I forget everything the second I walk in?", { nervousness: 0.2 }, "anxious"),

  // ================= OVERWHELMED (12) =================
  C("Overwhelmed", "I have exams, assignments, a job interview, family stuff, and my car broke down.", { disappointment: 0.15 }, "overwhelmed"),
  C("Overwhelmed", "There's the move, the wedding, work deadlines, and my mom's surgery all this month.", { disappointment: 0.15 }, "overwhelmed"),
  C("Overwhelmed", "Bills, laundry, the kids' schedules, dinner, and a work call I forgot about.", { disappointment: 0.1 }, "overwhelmed"),
  C("Overwhelmed", "I've got three deadlines, a sick dog, a leaking roof, and no sleep.", { disappointment: 0.15 }, "overwhelmed"),
  C("Overwhelmed", "Taxes, the audit, the new hire, the server migration, and a board meeting Friday.", { disappointment: 0.1 }, "overwhelmed"),
  C("Overwhelmed", "I have to pack, cancel the lease, notify the school, and find a new job, all by Monday.", { disappointment: 0.15 }, "overwhelmed"),
  C("Overwhelmed", "Between the baby, the in-laws visiting, and the kitchen renovation I can't think straight.", { disappointment: 0.15 }, "overwhelmed"),
  C("Overwhelmed", "There's rent, the car payment, the vet bill, and my hours got cut.", { disappointment: 0.15 }, "overwhelmed"),
  C("Overwhelmed", "I have three papers due, a group project falling apart, and a part-time shift tonight.", { disappointment: 0.1 }, "overwhelmed"),
  C("Overwhelmed", "The wedding planning, the seating chart, the caterer, and my dress alterations are all due this week.", { disappointment: 0.1 }, "overwhelmed"),
  C("Overwhelmed", "Client escalations, a hiring freeze, two resignations, and the quarterly report are all due now.", { disappointment: 0.1 }, "overwhelmed"),
  C("Overwhelmed", "There's the funeral arrangements, the will, the house, and telling my brother.", { disappointment: 0.15, sadness: 0.1 }, "overwhelmed"),

  // ================= DISGUST (12) =================
  C("Disgust", "The smell made my skin crawl and I felt sick to my stomach.", { disgust: 0.1, sadness: 0.1 }, "disgust"),
  C("Disgust", "That was so gross I nearly threw up.", { disgust: 0.15 }, "disgust"),
  C("Disgust", "The mold in that fridge is stomach-turning.", { disgust: 0.1 }, "disgust"),
  C("Disgust", "Reading about how they treated those animals made me feel sick.", { disgust: 0.1, sadness: 0.15 }, "disgust"),
  C("Disgust", "The bathroom at that gas station was truly revolting.", { disgust: 0.1 }, "disgust"),
  C("Disgust", "It makes my skin crawl just thinking about what he did.", { disgust: 0.08, anger: 0.15 }, "disgust"),
  C("Disgust", "The whole situation is nauseating, honestly.", { disgust: 0.1 }, "disgust"),
  C("Disgust", "I felt sick to my stomach reading the report.", { disgust: 0.08, sadness: 0.15 }, "disgust"),
  C("Disgust", "That leftover food had gone completely rancid, so gross.", { disgust: 0.15 }, "disgust"),
  C("Disgust", "The way he spoke to her was repulsive to watch.", { disgust: 0.1, anger: 0.15 }, "disgust"),
  C("Disgust", "Finding roaches in the kitchen made my skin crawl.", { disgust: 0.12 }, "disgust"),
  C("Disgust", "The whole scandal is stomach-turning once you read the details.", { disgust: 0.1, anger: 0.1 }, "disgust"),

  // ================= NEUTRAL (12, expect silent) =================
  C("Neutral", "The meeting is at 3pm in room 204.", { neutral: 0.8 }, "silent"),
  C("Neutral", "I bought a new stapler for the office.", { neutral: 0.75 }, "silent"),
  C("Neutral", "The train departs from platform 6.", { neutral: 0.8 }, "silent"),
  C("Neutral", "Please find the attached spreadsheet.", { neutral: 0.78 }, "silent"),
  C("Neutral", "The recipe calls for two cups of flour.", { neutral: 0.75 }, "silent"),
  C("Neutral", "Our office is closed on public holidays.", { neutral: 0.8 }, "silent"),
  C("Neutral", "The report is due at the end of the quarter.", { neutral: 0.75, realization: 0.1 }, "silent"),
  C("Neutral", "It's currently 68 degrees outside.", { neutral: 0.8 }, "silent"),
  C("Neutral", "The library closes at 9pm on weekdays.", { neutral: 0.78 }, "silent"),
  C("Neutral", "The invoice number is on the top right corner.", { neutral: 0.8 }, "silent"),
  C("Neutral", "We'll reconvene next Tuesday to finalize the budget.", { neutral: 0.75, realization: 0.1 }, "silent"),
  C("Neutral", "The package should arrive within five business days.", { neutral: 0.78 }, "silent"),

  // ================= RAPID TRANSITIONS (10, multi-turn) =================
  SEQ("Rapid Transitions", [
    ["I got the job!!", { joy: 0.9, excitement: 0.6 }],
    ["Wait, they just said the offer fell through.", { disappointment: 0.7, sadness: 0.4 }],
    ["This is such garbage, they can't do this to me.", { anger: 0.85, annoyance: 0.5 }],
  ], "angry"),
  SEQ("Rapid Transitions", [
    ["I'm so relieved the surgery is over.", { relief: 0.8 }],
    ["The doctor just came back with bad news.", { sadness: 0.8, fear: 0.4 }],
  ], "sad"),
  SEQ("Rapid Transitions", [
    ["This new update is amazing, everything works.", { joy: 0.7, admiration: 0.4 }],
    ["Never mind, it just crashed my whole system.", { anger: 0.75, annoyance: 0.5 }],
  ], "angry"),
  SEQ("Rapid Transitions", [
    ["I'm nervous about the pitch.", { nervousness: 0.5 }],
    ["We just won the client! I'm thrilled!", { joy: 0.85, excitement: 0.6 }],
  ], "happy"),
  SEQ("Rapid Transitions", [
    ["I was so angry at him this morning.", { anger: 0.8 }],
    ["We talked it out and I feel so much better now.", { relief: 0.7, joy: 0.3 }],
  ], "happy"),
  SEQ("Rapid Transitions", [
    ["Everything was fine an hour ago.", { neutral: 0.7 }],
    ["Now I just found out we lost the account.", { sadness: 0.6, anger: 0.5 }],
  ], "angry"),
  SEQ("Rapid Transitions", [
    ["I was excited about the concert all week.", { excitement: 0.8 }],
    ["It just got cancelled with no refund.", { anger: 0.7, disappointment: 0.5 }],
  ], "angry"),
  SEQ("Rapid Transitions", [
    ["I'm proud of finishing the marathon.", { pride: 0.8 }],
    ["I just found out I have a stress fracture.", { sadness: 0.7, fear: 0.3 }],
  ], "sad"),
  SEQ("Rapid Transitions", [
    ["The house inspection went great.", { relief: 0.7, joy: 0.3 }],
    ["They just backed out of the sale entirely.", { anger: 0.7, disappointment: 0.5 }],
  ], "angry"),
  SEQ("Rapid Transitions", [
    ["I was dreading this appointment all week.", { nervousness: 0.6 }],
    ["Turns out everything's fine, what a relief.", { relief: 0.8, joy: 0.3 }],
  ], "happy"),

  // ================= MIXED EMOTIONS (12) =================
  C("Mixed Emotions", "I'm proud of the win but embarrassed about how I celebrated.", { pride: 0.5, embarrassment: 0.5 }, "conflicted"),
  C("Mixed Emotions", "Grateful for the help, annoyed it took this long to arrive.", { gratitude: 0.5, annoyance: 0.4 }, "conflicted"),
  C("Mixed Emotions", "Relieved and exhausted, I don't know what to feel first.", { relief: 0.5, sadness: 0.4 }, "bittersweet"),
  C("Mixed Emotions", "I admire her courage but I'm scared for what comes next.", { admiration: 0.5, fear: 0.4 }, "conflicted"),
  C("Mixed Emotions", "So happy for the raise, so guilty my coworker didn't get one.", { joy: 0.45, remorse: 0.45 }, "bittersweet"),
  C("Mixed Emotions", "I'm hopeful about the treatment but terrified of the side effects.", { optimism: 0.45, fear: 0.45 }, "conflicted"),
  C("Mixed Emotions", "Excited to travel, sad to leave my routine behind.", { excitement: 0.45, sadness: 0.45 }, "bittersweet"),
  C("Mixed Emotions", "Thankful it's resolved, resentful it ever happened.", { gratitude: 0.45, anger: 0.45 }, "conflicted"),
  C("Mixed Emotions", "I love the new city but I miss my old friends terribly.", { love: 0.45, sadness: 0.45 }, "bittersweet"),
  C("Mixed Emotions", "Pride and heartbreak in the same breath watching her leave for college.", { pride: 0.5, sadness: 0.5 }, "bittersweet"),
  C("Mixed Emotions", "I'm happy it's finally decided, angry it took a lawsuit to get there.", { joy: 0.4, anger: 0.4 }, "conflicted"),
  C("Mixed Emotions", "So relieved the storm passed, so devastated about the roof.", { relief: 0.45, sadness: 0.45 }, "bittersweet"),

  // ================= FALSE POSITIVES (12, designed to NOT fire a composite) =================
  C("False Positives", "Wow, great job on the presentation, seriously well done.", { admiration: 0.7, joy: 0.3 }, "happy"),
  C("False Positives", "Thank you so much, this is exactly what I needed.", { gratitude: 0.8, joy: 0.3 }, "happy"),
  C("False Positives", "I've been thinking about this for six hours and finally figured it out!", { joy: 0.7, excitement: 0.3 }, "happy"),
  C("False Positives", "I'm a little nervous but mostly just excited for the trip.", { excitement: 0.6, nervousness: 0.15 }, "happy"),
  C("False Positives", "That soup smells amazing, I can't wait to eat it.", { joy: 0.5, admiration: 0.2 }, "happy"),
  C("False Positives", "I've asked for feedback three times because I really want to improve.", { optimism: 0.5, approval: 0.2 }, "happy"),
  C("False Positives", "What a wonderful, wonderful surprise party, thank you all.", { joy: 0.7, gratitude: 0.4 }, "happy"),
  C("False Positives", "I keep coming back to this recipe, it's my favorite.", { joy: 0.5, admiration: 0.3 }, "happy"),
  C("False Positives", "The results made me feel sick with relief, honestly.", { relief: 0.7 }, "happy"),
  C("False Positives", "I have a busy week but it's all good stuff — the wedding, the trip, the promotion.", { joy: 0.6, excitement: 0.3 }, "happy"),
  C("False Positives", "That was gross, in the best way — spiciest ramen I've ever had.", { amusement: 0.5, joy: 0.3 }, "happy"),
  C("False Positives", "I've tried it again and again and I finally love how it turned out.", { joy: 0.6, pride: 0.3 }, "happy"),

  // ================= EDGE CASES (12) =================
  C("Edge Cases", "", { neutral: 0.9 }, "silent"),
  C("Edge Cases", "   ", { neutral: 0.9 }, "silent"),
  C("Edge Cases", "k", { neutral: 0.7 }, "silent"),
  C("Edge Cases", "!!!!!!!!!!", { anger: 0.3, neutral: 0.4 }, "silent"),
  C("Edge Cases", "??????", { confusion: 0.4, neutral: 0.4 }, "silent"),
  C("Edge Cases", "😀😀😀", { joy: 0.5, neutral: 0.3 }, "happy"),
  C("Edge Cases", "😡😡😡", { anger: 0.6, neutral: 0.2 }, "angry"),
  C("Edge Cases", "12345", { neutral: 0.9 }, "silent"),
  C("Edge Cases", "HELLO THIS IS VERY IMPORTANT PLEASE READ IMMEDIATELY", { anger: 0.3, nervousness: 0.2, neutral: 0.2 }, "silent"),
  C("Edge Cases", "asdkjfh aslkdjf laksjdf", { neutral: 0.85 }, "silent"),
  C("Edge Cases", "again again again again again", { annoyance: 0.15, neutral: 0.3 }, "frustrated"),
  C("Edge Cases", "what if what if what if", { nervousness: 0.2, confusion: 0.3 }, "anxious"),

  // ================= NEGATION (12) =================
  C("Negation", "I am not happy about this at all.", { anger: 0.3, disapproval: 0.4 }, "angry"),
  C("Negation", "This isn't bad, actually — I kind of like it.", { approval: 0.4, joy: 0.2 }, "happy"),
  C("Negation", "I don't hate it, I just don't love it either.", { neutral: 0.5, disappointment: 0.15 }, "silent"),
  C("Negation", "Nothing about this feels okay to me.", { sadness: 0.5, anger: 0.3 }, "sad"),
  C("Negation", "It's not like I'm not trying, I've tried everything.", { annoyance: 0.3, disappointment: 0.2 }, "frustrated"),
  C("Negation", "I wouldn't say I'm scared, but I am a little on edge.", { nervousness: 0.25 }, "anxious"),
  C("Negation", "I never said it wasn't hard, just that it's worth it.", { optimism: 0.3, sadness: 0.2 }, "sad"),
  C("Negation", "Not everyone gets a second chance like this, I'm grateful.", { gratitude: 0.6 }, "happy"),
  C("Negation", "I'm not not annoyed, if that makes sense.", { annoyance: 0.35 }, "angry"),
  C("Negation", "This isn't the disaster it could have been.", { relief: 0.4 }, "happy"),
  C("Negation", "I can't say I'm not disappointed in how this went.", { disappointment: 0.55 }, "sad"),
  C("Negation", "It's not nothing, this really hurt.", { sadness: 0.55 }, "sad"),

  // ================= IDIOMS (10) =================
  C("Idioms", "I'm on cloud nine about the news.", { joy: 0.7, excitement: 0.3 }, "happy"),
  C("Idioms", "This whole thing left a bad taste in my mouth.", { disgust: 0.1, disapproval: 0.3 }, "disgust"),
  C("Idioms", "I nearly hit the roof when I saw the bill.", { anger: 0.7 }, "angry"),
  C("Idioms", "My heart sank the moment I read the email.", { sadness: 0.6, fear: 0.2 }, "sad"),
  C("Idioms", "I've got butterflies about the interview tomorrow.", { nervousness: 0.3 }, "anxious"),
  C("Idioms", "It makes my blood boil every time I think about it.", { anger: 0.8 }, "angry"),
  C("Idioms", "I'm walking on eggshells around him lately.", { nervousness: 0.3, fear: 0.2 }, "anxious"),
  C("Idioms", "That story really made my skin crawl.", { disgust: 0.1, fear: 0.15 }, "disgust"),
  C("Idioms", "I'm drowning under all of this right now — the move, the bills, the job hunt, the kids, everything.", { sadness: 0.15 }, "overwhelmed"),
  C("Idioms", "I've hit rock bottom this week.", { sadness: 0.75, grief: 0.2 }, "sad"),

  // ================= IRONY (10) =================
  C("Irony", "Well, that could not possibly have gone better. (It went terribly.)", { annoyance: 0.2, disapproval: 0.2 }, "sarcastic"),
  C("Irony", "Oh sure, take your time, it's not like anyone's waiting.", { annoyance: 0.25 }, "sarcastic"),
  C("Irony", "Perfect. Absolutely perfect. Right on schedule, as always.", { annoyance: 0.2 }, "sarcastic"),
  C("Irony", "Fantastic, another 'quick fix' that took all week.", { annoyance: 0.25 }, "sarcastic"),
  C("Irony", "I'm sure the third reschedule will finally stick.", { disapproval: 0.2, annoyance: 0.15 }, "sarcastic"),
  C("Irony", "Nothing says 'reliable service' like a two-hour wait.", { annoyance: 0.2, disapproval: 0.15 }, "sarcastic"),
  C("Irony", "Oh, I love when the deadline moves up with no warning.", { annoyance: 0.2 }, "sarcastic"),
  C("Irony", "Sure, blame the intern, that always fixes things.", { disapproval: 0.25 }, "sarcastic"),
  C("Irony", "Great weather for a wedding. (It was pouring rain.)", { disappointment: 0.2 }, "sad"),
  C("Irony", "Oh good, another 'mandatory optional' meeting.", { annoyance: 0.2 }, "sarcastic"),

  // ================= VERY SHORT INPUTS (10) =================
  C("Very Short", "ok", { neutral: 0.7 }, "silent"),
  C("Very Short", "fine.", { neutral: 0.5, disappointment: 0.15 }, "silent"),
  C("Very Short", "ugh", { annoyance: 0.3 }, "angry"),
  C("Very Short", "wow", { surprise: 0.4, joy: 0.2 }, "happy"),
  C("Very Short", "no", { disapproval: 0.2, neutral: 0.4 }, "silent"),
  C("Very Short", "sure", { neutral: 0.6, approval: 0.15 }, "silent"),
  C("Very Short", "whatever", { annoyance: 0.25, disapproval: 0.15 }, "angry"),
  C("Very Short", "great.", { annoyance: 0.15, neutral: 0.4 }, "silent"),
  C("Very Short", "yikes", { fear: 0.25, surprise: 0.2 }, "anxious"),
  C("Very Short", "nope", { disapproval: 0.2, neutral: 0.4 }, "silent"),

  // ================= VERY LONG PARAGRAPHS (8) =================
  C(
    "Very Long",
    "I don't even know where to start honestly, because this week has just been one thing after another " +
      "and I keep trying to catch up but I never quite get there, between the kids' schedules and the car " +
      "trouble and the fact that my manager keeps moving the deadline earlier every single time I ask for " +
      "clarification, and on top of that my mother called again about the house and I still haven't called " +
      "the contractor back, and I know I need to just sit down and make a list but every time I try I get " +
      "another email that makes the list longer instead of shorter.",
    { disappointment: 0.15 },
    "overwhelmed"
  ),
  C(
    "Very Long",
    "It's strange, because objectively today should have felt like a good day — we closed the deal, the " +
      "client seemed happy, everyone on the team got the recognition they deserved in the meeting — and yet " +
      "I keep thinking about my old coworker who isn't here to see it, who would have loved this win more " +
      "than any of us, and it makes the whole thing feel heavier than it should, like I'm celebrating with " +
      "one hand and holding something back with the other.",
    { joy: 0.4, sadness: 0.45 },
    "bittersweet"
  ),
  C(
    "Very Long",
    "I've called the support line five times this week about the exact same billing error, and every single " +
      "time I get a different answer, and every single time they tell me it's been escalated and someone " +
      "will call back within 24 to 48 hours, and every single time nobody calls, and now I'm on hold again " +
      "for the sixth time listening to the same three bars of hold music on repeat.",
    { annoyance: 0.22, disappointment: 0.15 },
    "frustrated"
  ),
  C(
    "Very Long",
    "What if the surgery doesn't go the way they think it will, what if the recovery takes longer than they " +
      "said, what if I can't go back to work in time, what if the insurance doesn't cover what they told me " +
      "it would, I keep running through every possible thing that could go wrong and I can't seem to stop " +
      "even though I know it isn't helping.",
    { nervousness: 0.28, fear: 0.2 },
    "anxious"
  ),
  C(
    "Very Long",
    "The whole apartment reeked the second I opened the door, and when I finally traced it back to the " +
      "fridge I found something in the back that had clearly been forgotten for months, and honestly just " +
      "describing it now makes my skin crawl all over again, it was one of the most stomach-turning things " +
      "I've had to clean up in a long time.",
    { disgust: 0.12 },
    "disgust"
  ),
  C(
    "Very Long",
    "I'm genuinely thrilled about the new role, the pay bump is real, the team seems great from what I've " +
      "seen so far, and my manager has already said good things about my first two weeks, so overall I think " +
      "this was absolutely the right call and I'm glad I made the jump when I did.",
    { joy: 0.7, pride: 0.3 },
    "happy"
  ),
  C(
    "Very Long",
    "Every year around this time I think about how things used to be before everything changed, before the " +
      "move, before the diagnosis, before all of it, and I know there's no use dwelling on it because it " +
      "doesn't bring any of it back, but some years the quiet just sits heavier than others and this is one " +
      "of those years.",
    { sadness: 0.6, grief: 0.3 },
    "sad"
  ),
  C(
    "Very Long",
    "At first I was just annoyed that the flight was delayed, then I was annoyed that nobody at the gate " +
      "would give a straight answer, and now three hours later with no update, no rebooking option, and a " +
      "connecting flight I'm definitely going to miss, annoyed doesn't really cover it anymore, I am " +
      "completely and utterly furious with how this whole airline operates.",
    { anger: 0.85, annoyance: 0.5 },
    "angry"
  ),

  // ================= MULTI-SENTENCE CONVERSATIONS (8, multi-turn) =================
  SEQ("Multi-Sentence Conversation", [
    ["Hey, how was the doctor's appointment?", { neutral: 0.6, nervousness: 0.15 }],
    ["It went okay I think, still waiting on the bloodwork.", { nervousness: 0.3 }],
    ["Just got the results back and everything's clear.", { relief: 0.8, joy: 0.3 }],
  ], "happy"),
  SEQ("Multi-Sentence Conversation", [
    ["Can we talk about what happened at dinner?", { nervousness: 0.2 }],
    ["I felt really disrespected honestly.", { anger: 0.5, sadness: 0.3 }],
    ["You didn't even apologize afterward either.", { anger: 0.7, disapproval: 0.4 }],
  ], "angry"),
  SEQ("Multi-Sentence Conversation", [
    ["I have so much to get through before Friday.", { disappointment: 0.15 }],
    ["The report, the client call, the audit prep, the onboarding docs, all of it.", { disappointment: 0.15 }],
    ["And now HR just added a mandatory training too.", { disappointment: 0.2 }],
  ], "overwhelmed"),
  SEQ("Multi-Sentence Conversation", [
    ["I keep replaying the argument in my head.", { sadness: 0.4 }],
    ["I know I overreacted but I still feel justified.", { anger: 0.3, remorse: 0.3 }],
    ["I think I need to apologize either way.", { remorse: 0.5 }],
  ], "sad"),
  SEQ("Multi-Sentence Conversation", [
    ["So the renovation is finally done.", { relief: 0.5 }],
    ["It looks incredible, way better than I imagined.", { joy: 0.7, admiration: 0.3 }],
    ["Only downside is we're way over budget now.", { disappointment: 0.4 }],
  ], "bittersweet"),
  SEQ("Multi-Sentence Conversation", [
    ["I'm nervous about telling them I'm leaving.", { nervousness: 0.3 }],
    ["What if they take it badly?", { nervousness: 0.3 }],
    ["What if this ruins the relationship entirely?", { nervousness: 0.35 }],
  ], "anxious"),
  SEQ("Multi-Sentence Conversation", [
    ["The trip started off rough with the flight delay.", { annoyance: 0.2 }],
    ["Then we lost a bag at the layover.", { annoyance: 0.3 }],
    ["But the hotel upgraded us for free and it's been amazing since.", { joy: 0.7, relief: 0.3 }],
  ], "happy"),
  SEQ("Multi-Sentence Conversation", [
    ["I thought the review went fine.", { neutral: 0.6 }],
    ["Turns out they had a lot of concerns they didn't say out loud.", { disappointment: 0.4 }],
    ["Now I'm worried about where this leaves my role here.", { nervousness: 0.35 }],
  ], "anxious"),

  // ================= AMBIGUOUS WORDING (12) =================
  C("Ambiguous", "I guess that's one way to handle it.", { neutral: 0.4, disapproval: 0.2 }, "silent"),
  C("Ambiguous", "That's certainly a choice.", { neutral: 0.4, disapproval: 0.2 }, "silent"),
  C("Ambiguous", "I don't know how I feel about this yet.", { neutral: 0.5, confusion: 0.3 }, "silent"),
  C("Ambiguous", "Interesting approach, I'll give you that.", { neutral: 0.4, approval: 0.2 }, "silent"),
  C("Ambiguous", "Well, it is what it is.", { neutral: 0.5, disappointment: 0.15 }, "silent"),
  C("Ambiguous", "I have thoughts, but I'll keep them to myself for now.", { neutral: 0.4, disapproval: 0.15 }, "silent"),
  C("Ambiguous", "That's not nothing, I suppose.", { neutral: 0.4, approval: 0.15 }, "silent"),
  C("Ambiguous", "We'll see how it goes.", { neutral: 0.5, nervousness: 0.1 }, "silent"),
  C("Ambiguous", "It could be worse, it could be better.", { neutral: 0.45, disappointment: 0.1 }, "silent"),
  C("Ambiguous", "I'm processing it, I guess.", { neutral: 0.4, confusion: 0.2 }, "silent"),
  C("Ambiguous", "Take that as you will.", { neutral: 0.45 }, "silent"),
  C("Ambiguous", "Sure, let's call it that.", { neutral: 0.4, disapproval: 0.15 }, "silent"),
];

console.error(`evaluation fixtures loaded: ${TEST_CASES.length} cases, ${TEST_CASES.reduce((s, c) => s + c.turns.length, 0)} total turns`);
