// All the words and numbers the site states. Cited facts were checked against the linked sources;
// anything without a source is labelled as a suggestion or as having no agreed number.

export const SOURCES = {
  parry: {
    short: 'Parry et al., 2021',
    cite: 'Parry, D. A., et al. (2021). A systematic review and meta-analysis of discrepancies between logged and self-reported digital media use. Nature Human Behaviour, 5(11), 1535–1547.',
    url: 'https://doi.org/10.1038/s41562-021-01117-5',
  },
  winbush: {
    short: 'Winbush et al., 2025',
    cite: 'Winbush, A., et al. (2025). Logged smartphone use among 10,099 US adults on Android. PNAS, 122(43), e2427311122. Some authors work at Google, which collaborated on the study.',
    url: 'https://doi.org/10.1073/pnas.2427311122',
  },
  hunt: {
    short: 'Hunt et al., 2018',
    cite: 'Hunt, M. G., Marx, R., Lipson, C., & Young, J. (2018). No more FOMO: Limiting social media decreases loneliness and depression. Journal of Social and Clinical Psychology, 37(10), 751–768.',
    url: 'https://doi.org/10.1521/jscp.2018.37.10.751',
  },
  allcott: {
    short: 'Allcott et al., 2020',
    cite: 'Allcott, H., Braghieri, L., Eichmeyer, S., & Gentzkow, M. (2020). The welfare effects of social media. American Economic Review, 110(3), 629–676.',
    url: 'https://doi.org/10.1257/aer.20190658',
  },
  ding: {
    short: 'Ding et al., 2025',
    cite: 'Ding, D., et al. (2025). Daily steps and health outcomes in adults: a systematic review and dose-response meta-analysis. The Lancet Public Health, 10(8), e668–e681.',
    url: 'https://doi.org/10.1016/S2468-2667(25)00164-1',
  },
  white: {
    short: 'White et al., 2019',
    cite: 'White, M. P., et al. (2019). Spending at least 120 minutes a week in nature is associated with good health and wellbeing. Scientific Reports, 9, 7730.',
    url: 'https://doi.org/10.1038/s41598-019-44097-3',
  },
  hall: {
    short: 'Hall, 2019',
    cite: 'Hall, J. A. (2019). How many hours does it take to make a friend? Journal of Social and Personal Relationships, 36(4), 1278–1296.',
    url: 'https://doi.org/10.1177/0265407518761225',
  },
  kannan: {
    short: 'Kannan & Veazie, 2023',
    cite: 'Kannan, V. D., & Veazie, P. J. (2023). US trends in social isolation, social engagement, and companionship. SSM – Population Health, 21, 101331.',
    url: 'https://doi.org/10.1016/j.ssmph.2022.101331',
  },
  orben: {
    short: 'Orben & Przybylski, 2019',
    cite: 'Orben, A., & Przybylski, A. K. (2019). The association between adolescent well-being and digital technology use. Nature Human Behaviour, 3(2), 173–182.',
    url: 'https://doi.org/10.1038/s41562-018-0506-1',
  },
};

export const PARTS = [
  { id: 'attention', name: 'Attention', blurb: 'Where your eyes went.' },
  { id: 'people', name: 'People', blurb: 'Who you were actually in a room with.' },
  { id: 'body', name: 'Body', blurb: 'Whether your body went anywhere.' },
  { id: 'presence', name: 'Presence', blurb: 'The last time nothing stood between you and it.' },
];

const SCREEN_TIME = 'Settings › Screen Time › See All App & Website Activity › Week. Swipe to last week.';
const WELLBEING = 'Settings › Digital Wellbeing, then tap the chart. It shows one day at a time, so read a few days and average them.';

export const MEASURES = [
  {
    id: 'phone', part: 'attention', better: 'less', unit: 'hours', unitLabel: 'hours a day', short: 'a day',
    min: 0, max: 24, floor: 0.25,
    label: 'Phone time',
    ask: 'How long were you on your phone each day, on average, over the last 7 days?',
    lineAsk: 'It would bother me if it were more than',
    badInput: 'Try hours like 4.5 or 4h 30m, up to 24.',
    where: [['iPhone', `${SCREEN_TIME} If you see a week total, divide by 7.`], ['Android', WELLBEING]],
    reference: { text: 'No agreed healthy limit exists. In one large logged study of US Android users, the median was about 6 hours of app time a day.', source: 'winbush' },
    change: {
      do: 'Charge your phone outside the bedroom for two weeks.',
      restsOn: 'the idea that removing the easiest moments to pick it up cuts total time. This is my suggestion, not a tested result.',
      check: 'your daily average hasn’t fallen when you retake this in two weeks.',
    },
  },
  {
    id: 'pickups', part: 'attention', better: 'less', unit: 'count', unitLabel: 'a day', short: 'a day',
    min: 0, max: 2000, floor: 1,
    label: 'Pickups',
    ask: 'How many times a day did you pick up your phone?',
    lineAsk: 'It would bother me if it were more than',
    badInput: 'Try a whole number, like 80.',
    where: [['iPhone', `${SCREEN_TIME} Scroll down to Pickups.`], ['Android', `${WELLBEING} Use “times opened”, which includes unlocks.`]],
    reference: { text: 'No agreed healthy limit exists. The same study found a median of 41 unlocks a day, on Android only, so it may not match an iPhone’s pickup count.', source: 'winbush' },
    change: {
      do: 'Turn off every notification except calls and messages from people for two weeks.',
      restsOn: 'the idea that many pickups are prompted rather than chosen. This is my suggestion, not a tested result.',
      check: 'your pickups don’t fall, which would mean the habit starts with you and not the buzz.',
    },
  },
  {
    id: 'feed', part: 'attention', better: 'less', unit: 'hours', unitLabel: 'hours a day', short: 'a day',
    min: 0, max: 24, floor: 0.25,
    label: 'Feed time',
    ask: 'How long a day went to feeds and watching: social, entertainment and games?',
    lineAsk: 'It would bother me if it were more than',
    badInput: 'Try hours like 1.5 or 1h 30m, up to 24.',
    where: [['iPhone', 'On the same Screen Time page, add up the Social, Entertainment and Games categories, or add up those apps if the categories differ.'], ['Android', 'In Digital Wellbeing, add up those apps from the list. Android doesn’t reliably show categories.']],
    reference: { text: 'No agreed limit exists. In a small trial of US undergraduates, limiting three apps to 10 minutes each a day reduced loneliness and depression over three weeks.', source: 'hunt' },
    change: {
      do: 'Set a 10-minute daily limit on your top feed app for two weeks.',
      restsOn: 'a small three-week trial of US undergraduates (Hunt et al., 2018), who may not resemble you. Paying people to leave Facebook also raised well-being, only slightly (Allcott et al., 2020).',
      check: 'your feed time falls and the week feels no different, or you bypass the limit every day.',
    },
  },
  {
    id: 'inPerson', part: 'people', better: 'more', unit: 'count', unitLabel: 'people', short: 'people',
    min: 0, max: 500, floor: 1,
    label: 'People seen in person',
    ask: 'How many people did you spend at least 15 minutes with, in person, in the last 7 days?',
    lineAsk: 'It would bother me if it were fewer than',
    badInput: 'Try a whole number, like 5.',
    where: [['Any phone', 'Go through your calendar and your photos for the last 7 days, and count names. Count people at home and at work too.']],
    reference: { text: 'No agreed number exists. Americans’ average time with friends fell from 60 to 34 minutes a day between 2003 and 2019.', source: 'kannan' },
    change: {
      do: 'Book one in-person hour with someone you’ve only been messaging, and put it in your calendar now.',
      restsOn: 'one study’s rough estimate that casual friendship takes about 50 hours together and close friendship over 200 (Hall, 2019). Time is what’s scarce.',
      check: 'you cancel it, or you leave wishing you’d stayed home.',
    },
  },
  {
    id: 'threads', part: 'people', better: 'more', unit: 'count', unitLabel: 'of 10', short: 'of 10',
    min: 0, max: 10, floor: 1,
    label: 'Latest chats you also saw',
    ask: 'Of your 10 most recent message threads, how many of those people did you also see in person this week?',
    lineAsk: 'It would bother me if it were fewer than',
    badInput: 'Try a whole number from 0 to 10.',
    where: [['Any phone', 'Open the chat app you use most. Go down the top 10 threads and count the people you also saw. Skip group chats and businesses.']],
    reference: { text: 'No agreed number exists. This measure is my own invention, so read it only against your own line.' },
    change: {
      do: 'Pick the person highest in your threads you haven’t seen, and suggest a time to meet this week.',
      restsOn: 'the idea that the people you message most are the easiest to see. This is my suggestion, not a tested result.',
      check: 'they live too far away to meet, in which case a call is the honest next step.',
    },
  },
  {
    id: 'steps', part: 'body', better: 'more', unit: 'count', unitLabel: 'steps a day', short: 'steps a day',
    min: 0, max: 100000, floor: 100,
    label: 'Steps',
    ask: 'How many steps a day did you average over the last 7 days?',
    lineAsk: 'It would bother me if it were fewer than',
    badInput: 'Try a whole number, like 7000.',
    where: [['iPhone', 'Health › Browse › Steps, then the week tab.'], ['Android 14+', 'Settings › Security and privacy › Privacy Controls › Health Connect › Browse data › Activity › Steps. Menu names vary by phone.']],
    reference: { text: 'Compared with 2,000 steps a day, about 7,000 is associated with roughly 47% lower risk of death. This is observational, so it doesn’t prove cause.', source: 'ding' },
    change: {
      do: 'Take one phone call a day on foot, for two weeks.',
      restsOn: 'the idea that attaching a walk to something you already do is easier than finding time. This is my suggestion; the step figure beside it is observational.',
      check: 'your weekly average hasn’t moved when you retake this.',
    },
  },
  {
    id: 'outdoors', part: 'body', better: 'more', unit: 'hours', unitLabel: 'hours in the week', short: 'in the week',
    min: 0, max: 168, floor: 0.5,
    label: 'Time outdoors',
    ask: 'How many hours were you outdoors in the last 7 days, in total?',
    lineAsk: 'It would bother me if it were fewer than',
    badInput: 'Try hours like 4 or 2h 30m.',
    where: [['Apple Watch', 'Health › Browse › Other Data › Time in Daylight.'], ['No watch', 'Go through your calendar day by day and add it up from memory. That’s rougher, so round down.']],
    reference: { text: 'People reporting at least 120 minutes a week in nature were more likely to report good health and wellbeing. This counts nature, not any outdoors, and doesn’t show cause.', source: 'white' },
    change: {
      do: 'Put two hours outdoors in this week’s calendar, split however you like.',
      restsOn: 'a survey of about 20,000 adults in England, where how the time was split made no difference (White et al., 2019). It shows a link, not a cause.',
      check: 'you do it and notice nothing after two weeks.',
    },
  },
  {
    id: 'phoneFree', part: 'presence', better: 'less', unit: 'count', unitLabel: 'days ago', short: 'days ago',
    min: 0, max: 3650, floor: 1,
    label: 'Last phone-free experience',
    ask: 'How many days ago did you last do something with no phone, and no plan to post or tell people about it?',
    lineAsk: 'It would bother me if it were more than',
    badInput: 'Try a whole number of days, like 7.',
    where: [['Any phone', 'There’s no log for this, so scroll back through your photos and calendar and find the real occasion. Name it to yourself. A gap in your photos is a clue, not proof.']],
    reference: { text: 'No agreed number exists. This measure is my own invention and comes from your memory, so it’s the softest of the eight.' },
    change: {
      do: 'This weekend, leave your phone at home for one thing you’d normally photograph.',
      restsOn: 'nothing more than the question itself. It’s a small experiment, not a tested result.',
      check: 'you felt nothing but mild anxiety, or you’d rather have had the photo.',
    },
  },
];

export const WHY_GUESS = [
  'Before you step on a scale, you already have a number in mind. Afterwards it’s hard to remember what it was. Writing the guess down first keeps that from happening, because once you’ve seen the answer, it starts to feel like you knew it all along. Psychologists call that hindsight bias.',
  'It matters here because people are poor witnesses to their own screen use. Across 47 studies, self-reported use correlated only moderately with logged use, and estimates were accurate in about 5% of the studies.',
  'Setting your line before looking does a similar job. Once you see 5 hours, 5 hours starts to sound acceptable.',
  'It doesn’t help if you peek, or if your line is so loose nothing can cross it. The reusable idea: write down your prediction and your standard before you look at the data, for any question you care about.',
];

export const LIMITS = [
  'This describes your week. It doesn’t say your week harmed you. Across three large datasets, digital technology use explained at most 0.4% of the variation in teen wellbeing (Orben & Przybylski, 2019), and that is an average across teenagers, not a verdict on you.',
  'Causal evidence is small but real: paying US users to quit Facebook for four weeks freed about an hour a day and slightly raised well-being, by 0.09 standard deviations (Allcott et al., 2020). A standard deviation is the typical spread between people, so 0.09 is a small shift.',
  'A phone only sees your phone. Laptop hours don’t appear, so a desk job barely shows up, and an hour on the phone with someone you love counts the same as an hour of feeds.',
  'One week can be unusual: travel, illness, a deadline. Retake it before trusting a change.',
  'The Real, Between and Virtual labels and the surprise floor are my inventions. The directions for finding numbers can go out of date when phone software changes, so if a menu has moved, search for its name.',
];

export const SAMPLE_NOTE = 'Sample result: an invented person, nothing saved.';
