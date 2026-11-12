import { DURATION_TIERS, GST_PCT, MIN_HOURS, type VehicleModelDTO } from '@valleyride/shared';
import { formatPaise } from './format';
import type { Faq } from './seo';

/**
 * Copy for the SEO landing pages, the FAQ and the AI-readable summaries. Every answer opens with a direct,
 * self-contained sentence naming Valley Ride and Dehradun, so it can be quoted on its own by a search engine or
 * an AI assistant. Prices and allowances come from the live catalogue when it is available.
 */

const tiers = [...DURATION_TIERS].reverse().map((t) => `${t.pct}% off from ${t.minDays} days`).join(', ');
export const DISCOUNT_LINE = `Longer rentals cost less: ${tiers}.`;

const by = (models: VehicleModelDTO[], slug: string) => models.find((m) => m.slug === slug);

/** "Honda Activa 125 ₹649, Royal Enfield Hunter 350 ₹1,199, …" or null without the catalogue. */
export function priceList(models: VehicleModelDTO[]) {
  if (!models.length) return null;
  return [...models].sort((a, b) => a.pricePerDayPaise - b.pricePerDayPaise).map((m) => `${m.name} ${formatPaise(m.pricePerDayPaise)}`).join(', ');
}

function range(models: VehicleModelDTO[], pick: (m: VehicleModelDTO) => number, fmt: (n: number) => string) {
  if (!models.length) return null;
  const v = models.map(pick);
  return `${fmt(Math.min(...v))} to ${fmt(Math.max(...v))}`;
}

export function generalFaqs(models: VehicleModelDTO[]): Faq[] {
  const prices = priceList(models);
  const activa = by(models, 'activa-125');
  const deposits = range(models, (m) => m.depositPaise, (n) => formatPaise(n));
  const km = range(models, (m) => m.kmPerDay, (n) => `${n} km`);
  return [
    {
      q: 'Where can I rent a bike or scooty in Dehradun?',
      a: 'Valley Ride rents scooters and Royal Enfield motorcycles in Dehradun from one pickup and return point: Dorm Hub, 4th Floor, Sahastradhara Road, near Doon IT Park, Aman Vihar, Dehradun. It is open every day from 8 AM to 8 PM. Book online at valleyride.in or in the Valley Ride app, where you see live availability before you pay.',
    },
    {
      q: 'How much does it cost to rent a bike in Dehradun?',
      a: prices
        ? `At Valley Ride the daily rent is: ${prices}. These prices include ${GST_PCT}% GST. ${DISCOUNT_LINE} A refundable security deposit is paid with the booking.`
        : `Valley Ride shows the full daily rent, including ${GST_PCT}% GST, on every bike's page before you book. ${DISCOUNT_LINE} A refundable security deposit is paid with the booking.`,
    },
    {
      q: 'What documents do I need to rent a bike in Dehradun?',
      a: 'To rent from Valley Ride you need a valid driving licence for two-wheelers and an ID proof. The Royal Enfield motorcycles need a licence for geared motorcycles (MCWG); the Honda Activa 125 is gearless (MCWOG or MCWG). Upload photos of the documents in your account before pickup and bring the originals to Dorm Hub. If you upload Aadhaar, you can use a masked Aadhaar.',
    },
    {
      q: 'Is there a security deposit for bike rental in Dehradun?',
      a: `Yes. Valley Ride takes a refundable security deposit with the booking${deposits ? `, from ${deposits} depending on the bike` : ''}. After you return the bike to Dorm Hub and it is inspected, the deposit is refunded to the same UPI account or card you paid with. Only damage found at return is deducted.`,
    },
    {
      q: 'Can I take a scooty from Dehradun to Mussoorie?',
      a: `Yes, for a solo rider. The Honda Activa 125${activa ? ` (${formatPaise(activa.pricePerDayPaise)} a day at Valley Ride)` : ''} manages the 33 km climb to Mussoorie at a gentle pace, including the hairpins above Kolhukhet. With a pillion, take a motorcycle such as the Royal Enfield Hunter 350 or Scram 440, which pull strongly through the climb.`,
    },
    {
      q: 'How long does it take to ride from Dehradun to Mussoorie?',
      a: 'The ride from Dehradun to Mussoorie is about 33–35 km and takes 1.5 to 2 hours one way. The road climbs from about 640 m to just over 2,000 m: city traffic up Rajpur Road, sal forest after the Mussoorie Diversion, then 11 km of hairpins. On weekends leave before 8 AM to beat the traffic below Kolhukhet.',
    },
    {
      q: 'Can I take a rental bike from Dehradun to Rishikesh, Dhanaulti, Chakrata or on a multi-day trip?',
      a: `Yes. Riders take Valley Ride bikes to Mussoorie, Rishikesh, Dhanaulti, Chakrata, Tehri and on multi-day Uttarakhand trips. Each booking includes a daily km allowance${km ? ` (${km} a day depending on the bike)` : ''}, and extra kilometres are charged at the per-km rate shown when you book. Return the bike to Dorm Hub, Dehradun.`,
    },
    {
      q: 'What is the minimum rental period? Can I rent a bike for a few hours?',
      a: `The minimum booking at Valley Ride is ${MIN_HOURS} hours. Rent is charged per day, for each started 24 hours, so a half-day ride costs one day's rent. Pick the exact pickup and return times when you book.`,
    },
    {
      q: 'Can I rent a bike monthly in Dehradun?',
      a: `Yes. Valley Ride gives ${DURATION_TIERS[0].pct}% off rentals of ${DURATION_TIERS[0].minDays} days or more, which suits students, interns and people working at Doon IT Park, close to the Dorm Hub pickup point on Sahastradhara Road. ${DISCOUNT_LINE}`,
    },
    {
      q: 'Can I return the bike at a different place?',
      a: 'Not at the moment. Every Valley Ride bike is picked up and returned at the same point: Dorm Hub, Sahastradhara Road, Dehradun, between 8 AM and 8 PM.',
    },
    {
      q: 'What is the cancellation policy?',
      a: 'If you cancel a Valley Ride booking more than 24 hours before pickup, the full rent is refunded; within 24 hours, 50% is refunded. The security deposit is always refunded in full.',
    },
    {
      q: 'How do I pay for a bike rental?',
      a: 'Pay online by UPI, debit or credit card through Razorpay. Your bike is held for 15 minutes while you pay. The rent, GST and the refundable deposit are paid together, so there is nothing to settle at the desk.',
    },
    {
      q: 'What is the best time to ride in Dehradun and Mussoorie?',
      a: 'October to June is the best season to ride around Dehradun and Mussoorie. October to February brings the clearest Himalayan views; December to February mornings can bring black ice in the shade near Landour and snow around Dhanaulti. In the monsoon, July to September, roads in the hills can be hit by landslides: check conditions before you set off.',
    },
    {
      q: 'How do I reach Dorm Hub from ISBT, the railway station or Jolly Grant airport?',
      a: 'Dorm Hub is on Sahastradhara Road near Doon IT Park, on the north-east side of Dehradun. From Dehradun ISBT, Dehradun railway station or Jolly Grant airport, take an auto, a cab or a bike taxi and search "Dorm Hub Dehradun" in Google Maps.',
    },
    {
      q: 'Are helmets compulsory?',
      a: 'Yes. Helmets are compulsory for both the rider and the pillion everywhere in Uttarakhand, and Valley Ride requires them on every ride.',
    },
  ];
}

/** Hindi answers for Hindi and Hinglish searches; the same facts as generalFaqs. */
export function hindiFaqs(models: VehicleModelDTO[]): Faq[] {
  const prices = models.length
    ? [...models].sort((a, b) => a.pricePerDayPaise - b.pricePerDayPaise).map((m) => `${m.name} ${formatPaise(m.pricePerDayPaise)}`).join(', ')
    : null;
  return [
    {
      q: 'देहरादून में बाइक या स्कूटी किराये पर कहाँ मिलेगी?',
      a: 'Valley Ride देहरादून में स्कूटी और रॉयल एनफील्ड बाइक किराये पर देता है। पिकअप और वापसी एक ही जगह होती है: Dorm Hub, चौथी मंज़िल, सहस्रधारा रोड, दून आईटी पार्क के पास, अमन विहार, देहरादून। हर दिन सुबह 8 बजे से रात 8 बजे तक खुला। बुकिंग valleyride.in या Valley Ride ऐप से करें।',
    },
    {
      q: 'देहरादून में बाइक का किराया कितना है?',
      a: prices
        ? `Valley Ride पर एक दिन का किराया: ${prices}। इसमें ${GST_PCT}% GST शामिल है। 3 दिन से 10%, 7 दिन से 20% और 28 दिन से 35% की छूट मिलती है।`
        : `हर बाइक का पूरा एक दिन का किराया, ${GST_PCT}% GST सहित, बुकिंग से पहले उसके पेज पर दिखता है। 3 दिन से 10%, 7 दिन से 20% और 28 दिन से 35% की छूट मिलती है।`,
    },
    {
      q: 'बाइक किराये पर लेने के लिए कौन-से दस्तावेज़ चाहिए?',
      a: 'दोपहिया वाहन का वैध ड्राइविंग लाइसेंस और एक पहचान पत्र। रॉयल एनफील्ड के लिए गियर वाली मोटरसाइकिल (MCWG) का लाइसेंस चाहिए; होंडा एक्टिवा बिना गियर की है (MCWOG या MCWG)। पिकअप से पहले अपने अकाउंट में दस्तावेज़ों की फोटो अपलोड करें और असली दस्तावेज़ साथ लाएँ।',
    },
    {
      q: 'क्या सिक्योरिटी डिपॉज़िट वापस मिलता है?',
      a: 'हाँ। डिपॉज़िट बुकिंग के साथ ऑनलाइन जमा होता है। बाइक लौटाने और जाँच के बाद यह उसी UPI या कार्ड में वापस आ जाता है जिससे भुगतान किया था। सिर्फ़ नुकसान होने पर ही कटौती होती है।',
    },
    {
      q: 'क्या स्कूटी से देहरादून से मसूरी जा सकते हैं?',
      a: 'हाँ, अकेले सवार के लिए होंडा एक्टिवा 125 मसूरी की 33 किमी की चढ़ाई आराम से चढ़ लेती है। पीछे कोई बैठा हो तो रॉयल एनफील्ड हंटर 350 या स्क्रैम 440 लें। देहरादून से मसूरी बाइक से लगभग 1.5 से 2 घंटे लगते हैं।',
    },
    {
      q: 'क्या मासिक किराये पर बाइक मिलती है?',
      a: '28 दिन या उससे ज़्यादा की बुकिंग पर 35% की छूट मिलती है। यह छात्रों और आईटी पार्क में काम करने वालों के लिए अच्छा है, क्योंकि Dorm Hub सहस्रधारा रोड पर आईटी पार्क के पास है।',
    },
  ];
}

/* ---------- Places to ride from Dehradun ---------- */

export interface Place {
  id: string;
  name: string;
  /** Approximate road distance from Dehradun city centre; checked against maps, rounded. */
  distance: string;
  time: string;
  bikes: string;
  season: string;
  blurb: string;
  guide?: string;
}

export const PLACES: { group: string; intro: string; places: Place[] }[] = [
  {
    group: 'In and around Dehradun: half-day rides',
    intro: 'Short city rides that suit the Honda Activa 125. Dorm Hub is on Sahastradhara Road itself, so the springs are the closest ride of all.',
    places: [
      { id: 'sahastradhara', name: 'Sahastradhara', distance: '14 km from the Clock Tower, about 6 km from Dorm Hub', time: '20 minutes from Dorm Hub', bikes: 'Activa 125', season: 'Mornings, March to June and October to November', guide: '/routes/sahastradhara-loop',
        blurb: 'Sulphur springs where water drips from mossy limestone caves into the stream, with a ropeway up the hill. Go early: it is crowded after 11 AM on weekends, and in the monsoon stay out if the water is rising.' },
      { id: 'robbers-cave', name: 'Robbers Cave (Guchhupani)', distance: 'About 8 km from the city centre', time: '25–30 minutes', bikes: 'Activa 125', season: 'March to June; avoid after heavy rain',
        blurb: 'A narrow limestone gorge where you walk up a stream bed through a cave, in ankle- to knee-deep water. Wear sandals you do not mind getting wet.' },
      { id: 'tapkeshwar', name: 'Tapkeshwar Mahadev Temple', distance: 'About 6 km from the city centre, in Garhi Cantt', time: '20 minutes', bikes: 'Activa 125', season: 'All year; very busy on Shivratri',
        blurb: 'A cave temple on a stream bank where water drips onto the Shivling from the rock above. Combine it with Robbers Cave for a half-day loop.' },
      { id: 'fri', name: 'Forest Research Institute (FRI)', distance: 'About 7 km from the city centre', time: '20 minutes', bikes: 'Activa 125', season: 'All year; check museum timings locally',
        blurb: 'A huge red-brick colonial building in wooded grounds, with forestry museums inside. One of the most photographed buildings in Dehradun.' },
      { id: 'mindrolling', name: 'Mindrolling Monastery, Clement Town', distance: 'About 9 km south of the city centre', time: '25–30 minutes', bikes: 'Activa 125', season: 'All year',
        blurb: 'A Tibetan Buddhist monastery with a tall stupa, quiet gardens and cafés around it. A calm evening ride.' },
      { id: 'maldevta', name: 'Maldevta and the Song river', distance: 'About 20 km east, via Raipur', time: 'About 45 minutes', bikes: 'XPulse 210, Scram 440, Himalayan 450 off the tarmac', season: 'October to June, in daylight; avoid the monsoon', guide: '/routes/maldevta',
        blurb: 'A forest picnic spot on the Song river with a temple up a flight of steps. Beyond it, stony river beds and dirt tracks are popular with trail riders. Carry water and food: there are no stalls at Maldevta.' },
    ],
  },
  {
    group: 'Mussoorie and the ridge: day rides',
    intro: 'The classic hill rides from Dehradun. With a pillion, take a Royal Enfield.',
    places: [
      { id: 'mussoorie', name: 'Mussoorie and Landour', distance: '33–35 km', time: '1.5–2 hours one way', bikes: 'Hunter 350, Scram 440 (Activa 125 solo)', season: 'October to June; leave before 8 AM on weekends', guide: '/routes/dehradun-mussoorie',
        blurb: 'The Queen of the Hills: Mall Road, Gun Hill and Camel\'s Back Road, then up to Landour for Char Dukan, St Paul\'s Church and the snow peaks from Lal Tibba. Mall Road is closed to vehicles from 4:30 to 10:30 PM: park at Kingcraig or Library.' },
      { id: 'kempty-falls', name: 'Kempty Falls', distance: '13–15 km beyond Mussoorie, about 48 km in all', time: '2–2.5 hours one way', bikes: 'Hunter 350, Scram 440', season: 'March to June; very busy on summer weekends',
        blurb: 'Tiered falls on the Chakrata road below Mussoorie, with pools you can wade in. Ride it as a detour on the Mussoorie day.' },
      { id: 'george-everest', name: 'George Everest\'s House', distance: 'About 6 km west of Library Chowk, Mussoorie', time: '20 minutes from Mussoorie', bikes: 'Hunter 350, Scram 440', season: 'October to June',
        blurb: 'The restored home and laboratory of Sir George Everest on an open ridge, with wide views over the Doon valley on one side and the snow peaks on the other.' },
      { id: 'dhanaulti', name: 'Dhanaulti and Surkanda Devi', distance: 'About 60 km via Mussoorie; Surkanda Devi is above Kaddukhal, about 8 km beyond Dhanaulti', time: '2.5–3 hours one way', bikes: 'Hunter 350, Scram 440, Himalayan 450, Scrambler 400 X, V-Strom SX 250', season: 'All year; snow possible December to February',
        blurb: 'Deodar forest, apple orchards and the Eco Park on the quiet road east of Mussoorie. Surkanda Devi temple sits on a summit with one of the widest Himalayan views in Garhwal. Expect ice on shaded bends in winter.' },
      { id: 'kanatal', name: 'Kanatal', distance: 'About 75 km, 12–13 km beyond Dhanaulti on the Chamba road', time: '3 hours one way', bikes: 'Scram 440, Himalayan 450, KTM 390 Adventure X, XPulse 210', season: 'October to June',
        blurb: 'A small ridge village known for camping and the Kodia forest. Best as an overnight trip with Dhanaulti.' },
    ],
  },
  {
    group: 'Rishikesh, Haridwar and the Ganga',
    intro: 'Easy, mostly flat highway rides through the sal forest on the edge of the Rajaji reserve.',
    places: [
      { id: 'rishikesh', name: 'Rishikesh', distance: 'About 45 km', time: '1.25–1.5 hours one way', bikes: 'Activa 125, Hunter 350', season: 'October to March; arrive by 6 PM for the evening aarti', guide: '/routes/dehradun-rishikesh',
        blurb: 'Ram Jhula, Triveni Ghat\'s evening Ganga aarti, the Beatles Ashram and the cafés of Tapovan. Park and walk near the river. Meat and alcohol are not sold in Rishikesh.' },
      { id: 'haridwar', name: 'Haridwar', distance: 'About 55 km', time: '1.5 hours one way', bikes: 'Activa 125, Hunter 350', season: 'All year; very crowded during festivals and the Kanwar Yatra',
        blurb: 'The Ganga aarti at Har Ki Pauri at sunset. Park well away from the ghats: the old town lanes are narrow and busy.' },
      { id: 'lachhiwala', name: 'Lachhiwala Nature Park', distance: 'About 22 km, on the Haridwar road', time: '40 minutes', bikes: 'Any', season: 'All year',
        blurb: 'A Forest Department park among sal trees, with streams and shaded paths. A good break on the way to Rishikesh.' },
    ],
  },
  {
    group: 'Longer rides: overnight and multi-day',
    intro: 'For experienced riders on the Scram 440 or Himalayan 450. Check the weather and road status before you leave, and carry rain gear.',
    places: [
      { id: 'chakrata', name: 'Chakrata and Tiger Falls', distance: 'About 90 km via Vikasnagar and Kalsi; Tiger Falls is about 20 km beyond', time: '3–3.5 hours one way', bikes: 'Scram 440, Himalayan 450, KTM 390 Adventure X, XPulse 210', season: 'October to June',
        blurb: 'A quiet cantonment town in deodar forest above the Yamuna valley, reached by a long climb of hairpins after Kalsi. Tiger Falls is one of the tallest falls in the region. Fuel up in Vikasnagar.' },
      { id: 'tehri', name: 'Tehri Lake', distance: 'About 110 km via Mussoorie, Dhanaulti and Chamba', time: '4 hours one way', bikes: 'Scram 440, Himalayan 450, KTM 390 Adventure X, XPulse 210', season: 'October to June',
        blurb: 'The vast reservoir behind the Tehri dam, with water sports at Koti Colony. Ride out over the ridge through Dhanaulti and Chamba and stay the night.' },
      { id: 'nag-tibba', name: 'Nag Tibba trek base (Pantwari)', distance: 'About 90–95 km via Mussoorie, Kempty and Nainbagh', time: '3.5–4 hours one way', bikes: 'Scram 440, Himalayan 450, KTM 390 Adventure X, XPulse 210', season: 'October to June; winter treks in snow',
        blurb: 'The base village for the Nag Tibba trek, the highest peak in the lower Garhwal range. Ride up, trek overnight, ride back.' },
      { id: 'chopta', name: 'Chopta and Tungnath', distance: 'About 250 km via Rishikesh, Devprayag, Rudraprayag and Ukhimath', time: 'Two days each way is comfortable', bikes: 'Himalayan 450, KTM 390 Adventure X, V-Strom SX 250', season: 'April to June and October to November; snow can close the road in winter',
        blurb: 'Meadows below Tungnath, the highest Shiva temple in the world, and the Chandrashila summit. A proper Himalayan trip: plan at least four days, and check the km allowance and extra-km rate when you book.' },
    ],
  },
];

export function scootyFaqs(models: VehicleModelDTO[]): Faq[] {
  const a = by(models, 'activa-125');
  return [
    {
      q: 'How much is a scooty on rent in Dehradun?',
      a: a
        ? `A Honda Activa 125 from Valley Ride costs ${formatPaise(a.pricePerDayPaise)} a day including ${GST_PCT}% GST, with ${a.kmPerDay} km a day included and a refundable deposit of ${formatPaise(a.depositPaise)}. ${DISCOUNT_LINE}`
        : `Valley Ride rents the Honda Activa 125 by the day; the price, including ${GST_PCT}% GST, is on the Activa page before you book. ${DISCOUNT_LINE}`,
    },
    {
      q: 'Which scooty is best for Dehradun?',
      a: 'The Honda Activa 125 is the easiest way around Dehradun: light, gearless and easy to park at Sahastradhara, Robbers Cave, FRI and the Rajpur Road cafés. It is comfortable at 60–70 km/h on the highway to Rishikesh.',
    },
    {
      q: 'Can a scooty go from Dehradun to Mussoorie?',
      a: 'Yes, with one rider. The Activa 125 manages the 33 km climb to Mussoorie at a gentle pace. With a pillion, rent a Royal Enfield Hunter 350 or Scram 440 instead. Coming down, brake in short, firm squeezes rather than holding the brakes on.',
    },
    {
      q: 'Which licence do I need to rent a scooty?',
      a: 'The Activa 125 is gearless, so a licence for motorcycles without gear (MCWOG) is enough; a geared motorcycle licence (MCWG) also covers it. Bring the original licence and an ID proof to Dorm Hub.',
    },
    {
      q: 'Is there a monthly scooty rental in Dehradun for students?',
      a: `Yes. Rentals of ${DURATION_TIERS[0].minDays} days or more get ${DURATION_TIERS[0].pct}% off at Valley Ride. The Dorm Hub pickup point is on Sahastradhara Road near Doon IT Park, handy for students and people working nearby.`,
    },
  ];
}

export function enfieldFaqs(models: VehicleModelDTO[]): Faq[] {
  const enfields = models.filter((m) => m.name.startsWith('Royal Enfield'));
  const prices = priceList(enfields);
  return [
    {
      q: 'How much does it cost to rent a Royal Enfield in Dehradun?',
      a: prices
        ? `Royal Enfield rent at Valley Ride, per day including ${GST_PCT}% GST: ${prices}. ${DISCOUNT_LINE} A refundable deposit is paid with the booking and returned after inspection.`
        : `Valley Ride rents the Royal Enfield Hunter 350, Scram 440 and Himalayan 450 by the day; prices including ${GST_PCT}% GST are on each bike's page. ${DISCOUNT_LINE}`,
    },
    {
      q: 'Which Royal Enfield is best for a Mussoorie ride?',
      a: 'The Hunter 350 and the Scram 440. Both pull strongly from low revs through the 33 km of climbing and hairpins to Mussoorie and are easy to turn in Landour\'s narrow lanes. The Scram\'s longer suspension is more comfortable over broken patches.',
    },
    {
      q: 'Which bike should I rent for Chakrata, Tehri or Chopta?',
      a: 'For long hill rides and multi-day trips, rent the Royal Enfield Himalayan 450 or Scram 440. Their long-travel suspension, big front wheels and ground clearance suit broken roads, river beds and gravel, and the Himalayan 450 is built for long-distance Himalayan touring. Valley Ride also rents the KTM 390 Adventure X and the Suzuki V-Strom SX 250 for the same trips.',
    },
    {
      q: 'Can I ride a rented Royal Enfield off-road near Dehradun?',
      a: 'The river beds and dirt tracks beyond Maldevta, about 20 km east of Dehradun, are popular with trail riders on the Scram 440 and Himalayan 450 (and on the Hero XPulse 210 and KTM 390 Adventure X, which Valley Ride also rents). Stay out when the Song river is up, ride in daylight, and on loose surfaces stand on the pegs and keep the speed low.',
    },
    {
      q: 'Which licence do I need to rent a Royal Enfield?',
      a: 'A driving licence for geared motorcycles (MCWG). Upload it with an ID proof before pickup and bring the originals to Dorm Hub, Sahastradhara Road.',
    },
  ];
}

/** The adventure and premium bikes: KTM, Triumph, Suzuki, Hero and the Himalayan. */
export const ADVENTURE_SLUGS = ['390-adventure-x', 'scrambler-400-x', 'v-strom-sx-250', 'xpulse-210', 'himalayan-450'];

export function adventureFaqs(models: VehicleModelDTO[]): Faq[] {
  const bikes = models.filter((m) => ADVENTURE_SLUGS.includes(m.slug));
  const prices = priceList(bikes);
  return [
    {
      q: 'Can I rent a KTM in Dehradun?',
      a: `Yes. Valley Ride rents the KTM 390 Adventure X (399 cc, 46 PS) at Dorm Hub, Sahastradhara Road${by(models, '390-adventure-x') ? ` for ${formatPaise(by(models, '390-adventure-x')!.pricePerDayPaise)} a day including GST` : ''}. It is the most powerful bike in the fleet and suits experienced riders heading to Chakrata, Harsil, Chopta and the high passes.`,
    },
    {
      q: 'Can I rent a Triumph in Dehradun?',
      a: `Yes, the Triumph Scrambler 400 X${by(models, 'scrambler-400-x') ? `, ${formatPaise(by(models, 'scrambler-400-x')!.pricePerDayPaise)} a day including GST` : ''}. It has a 349 cc liquid-cooled engine, upside-down forks and a 19-inch front wheel: a premium bike for Mussoorie, Dhanaulti and weekend hill rides with some broken road.`,
    },
    {
      q: 'How much does an adventure bike cost on rent in Dehradun?',
      a: prices
        ? `Per day including ${GST_PCT}% GST: ${prices}. ${DISCOUNT_LINE} A refundable deposit is paid with the booking.`
        : `Prices including ${GST_PCT}% GST are on each bike's page. ${DISCOUNT_LINE}`,
    },
    {
      q: 'Which adventure bike should I rent for a Himalayan trip from Dehradun?',
      a: 'For Chopta, Harsil, Auli or multi-day Garhwal loops: the KTM 390 Adventure X if you are an experienced rider who wants power, the Royal Enfield Himalayan 450 for relaxed long-distance touring, and the Suzuki V-Strom SX 250 for a light, comfortable and frugal tourer. For dirt trails and river crossings near Maldevta, the Hero XPulse 210 is the easiest.',
    },
    {
      q: 'Which licence do I need for a KTM, Triumph or adventure bike?',
      a: 'A driving licence for geared motorcycles (MCWG). Upload it with an ID proof before pickup and bring the originals to Dorm Hub.',
    },
  ];
}

/** Valley Ride Capital. Plain, honest answers: fixed plans, simple interest, not a bank deposit. */
export function investFaqs(): Faq[] {
  return [
    {
      q: 'What is Valley Ride Capital?',
      a: 'Valley Ride Capital is how Valley Ride, a bike and scooty rental company in Dehradun, raises money to grow its two-wheeler fleet. Investors fund the fleet and are paid interest every month from the rental business.',
    },
    {
      q: 'How much can I invest?',
      a: 'Two fixed plans: ₹1 lakh or ₹2.5 lakh. No other amounts are offered.',
    },
    {
      q: 'What return does Valley Ride Capital pay?',
      a: 'Simple interest of 20% a year, paid every month: ₹1,666.67 a month on the ₹1 lakh plan and ₹4,166.67 a month on the ₹2.5 lakh plan, before any TDS or taxes.',
    },
    {
      q: 'When do I get my money back?',
      a: 'The principal is returned in full at the end of the fixed 18-month lock-in, with the last interest payment. It cannot be withdrawn early.',
    },
    {
      q: 'How do I invest?',
      a: 'Message the Valley Ride Capital team on WhatsApp or call +91 70553 33321. The team shares the agreement and the bank details for the transfer; interest starts after the agreement is signed and the money is received.',
    },
    {
      q: 'Is the return guaranteed?',
      a: 'No. Payments depend on the rental business\'s ability to pay. This is not a bank fixed deposit and is not insured or guaranteed by a bank or regulator. Interest is taxable. Read the agreement and take independent advice before investing.',
    },
  ];
}
