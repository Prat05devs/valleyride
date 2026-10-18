'use strict';
/**
 * Route-page content for the four launch guides, keyed by route_guides.slug. Shape: packages/shared/src/schemas/guide.ts.
 * Kilometres are approximate and counted from the Clock Tower. Opening hours change, so pages say "check locally" where
 * sources disagree. Photos live in apps/api/public/guides and come from Wikimedia Commons under the licences credited below.
 */

/** Commons credits for the files in apps/api/public/guides. */
const PHOTOS = {
  'clock-tower':    ['Aditya Oberai', 'CC BY-SA 4.0', 'File:The_Dehradun_Clock_Tower.jpg'],
  'kipling-trail':  ['Daniel Romanson', 'CC0', 'File:View_of_Doon_Valley_from_Kipling_Trail_Uttarakhand_India.jpg'],
  'doon-night':     ['Faizking321', 'CC BY-SA 3.0', 'File:Dehradun_-_Night_Lights_-_A_View_from_Mussoorie.jpg'],
  'mussoorie-town': ['Pinakpani', 'CC BY-SA 4.0', 'File:Mussoorie_town,_a_hill_station_in_Dehradun_district_01.jpg'],
  'mall-road':      ['Harshanh', 'CC BY-SA 3.0', 'File:Mall_Road,_Mussoorie_03.JPG'],
  'gun-hill':       ['Harshanh', 'CC BY-SA 3.0', 'File:Gun_hill,_Mussoorie_08.JPG'],
  'camels-back':    ['Poojamangrolia', 'CC BY-SA 4.0', 'File:Mountains_(Camel_back_road,_Mussoorie,_Dehradun,_Uttarakhand,_India)_2013.jpg'],
  'everest-house':  ['Ps14061990', 'CC BY-SA 4.0', 'File:Park_Estate,_George_Everest,_Mussoorie.jpg'],
  'kempty-falls':   ['BestMan20', 'CC0', 'File:Kempty_Falls,_May_2024.jpg'],
  'char-dukan':     ['SMarndi', 'CC BY-SA 4.0', 'File:Landour_SM-16-2026-04-07.jpg'],
  'st-pauls':       ['Paul Hamilton', 'CC BY-SA 2.0', "File:St._Paul%27s_Church_Landour_exterior.jpg"],
  'lal-tibba':      ['SHUVADIP', 'CC BY-SA 4.0', 'File:View_of_the_Himalayan_range_from_The_Lal_Tibba,_Landour,_Mussourie.jpg'],
  'triveni-aarti':  ['Bhuvi Uniyal', 'CC BY-SA 4.0', 'File:Ganga_Arti_At_Triveni_Ghat_In_Rishikesh.jpg'],
  'ram-jhula':      ['Paradise Chronicle', 'CC BY-SA 4.0', 'File:Ram_Jhula_footbridge_-_Rishikesh.jpg'],
  'beatles-ashram': ['Athulvis', 'CC BY-SA 4.0', 'File:Beatles_Ashram_01.jpg'],
  'neer-garh':      ['Wittystef', 'CC BY-SA 4.0', 'File:Neer_Garh_Waterfall.jpg'],
  'tapovan':        ['Roliwrites', 'CC0', 'File:Sunrise_in_Tapovan_(_near_Lakshman_Jhula,_Bajrang_Setu)_Rishikesh.jpg'],
  'sahastradhara':  ['Pinakpani', 'CC BY-SA 4.0', 'File:Sahasradhara_in_Dehradun_in_Uttrakhand_02.jpg'],
  'robbers-cave':   ['Daniel Romanson', 'CC0', 'File:Amazing_view_of_Robber_Cave_Dehradun_Uttarakhand_India.jpg'],
  'tapkeshwar':     ['Jassimehra', 'CC BY-SA 3.0', 'File:Shiv_tapkeshwar_temple.jpg'],
  'song-river':     ['NN10', 'CC BY-SA 4.0', 'File:Song_River,_Raipur.jpg'],
};

const photo = (name) => {
  const [credit, license, file] = PHOTOS[name];
  return { url: `/static/guides/${name}.jpg`, credit, license, source: `https://commons.wikimedia.org/wiki/${file}` };
};

const start = { name: 'Clock Tower (Ghanta Ghar)', kind: 'start', section: 'way', km: 0 };

const GUIDES = {
  'dehradun-mussoorie': {
    // The seeded one-liner is replaced only if staff haven't edited it in the CMS.
    oldBody: 'About 1.5 hours. A winding climb into the hills, with a detour to Kempty Falls.',
    bodyMd:
      'The classic Doon ride: 33 km from the Clock Tower to Library Chowk, climbing from about 640 m to just over 2,000 m. The first 10 km up Rajpur Road are city traffic; after the Mussoorie Diversion the road winds up through sal forest, past the Maggi points and their views over the whole valley, to the Kolhukhet barrier. The last 11 km are tight hairpins of ghat road.\n\n'
      + 'Give yourself the whole day: park in Mussoorie, walk the Mall, then ride up to Landour for Char Dukan, St Paul\'s Church and the Himalayan view from Lal Tibba. Kempty Falls is a 13–15 km detour beyond the town.',
    rideTime: '1.5–2 h one way',
    bestTime: 'October to June. On weekends leave the city before 8 AM.',
    difficulty: 'moderate',
    bikeAdvice:
      'The Hunter 350 and Scram 440 both pull strongly from low revs through 33 km of climbing and hairpins, and are easy to turn in Landour\'s narrow lanes. The Scram\'s longer suspension is more comfortable over broken patches. The Activa 125 manages the climb solo at a gentle pace. With a pillion, take a motorcycle.',
    highlights: ['Doon valley views from the Maggi points', '11 km of hairpins above Kolhukhet', 'Mall Road, Gun Hill and Camel\'s Back Road', 'Char Dukan, St Paul\'s and Lal Tibba in Landour', 'Kempty Falls detour'],
    cover: photo('camels-back'),
    stops: [
      { ...start, blurb: 'Start in the centre of Dehradun and head north up Rajpur Road. Fill the tank in the city: there are few pumps once the climb starts.', photo: photo('clock-tower') },
      { name: 'Mussoorie Diversion', kind: 'junction', section: 'way', km: 10, blurb: 'At the Pacific Mall junction on Rajpur Road, bear right for Mussoorie. The traffic thins and the climb begins through sal forest.' },
      { name: 'Maggi points', kind: 'viewpoint', section: 'way', km: 14,
        blurb: 'From about 14 km out, stalls on the outer edge of the bends serve Maggi, bun-omelette and chai. Pull into one with a proper parking bay and look back over the whole Doon valley. After dark the city lights spread out below.',
        tip: 'Park fully off the tarmac and well away from the bend.', photo: photo('doon-night') },
      { name: 'Kolhukhet', kind: 'junction', section: 'way', km: 18, blurb: 'The municipal barrier for Mussoorie: keep UPI or change handy in case a toll is being collected. Above here the road narrows into tight hairpins for the last stretch.' },
      { name: 'Bhatta Falls', kind: 'waterfall', section: 'way', km: 26,
        blurb: 'About 7 km before Mussoorie, near Bhatta village: a small, family-friendly fall with pools, reached by a short ropeway or a walk from the road.',
        hours: 'About 8 AM–5 PM', tip: 'Parking fills quickly on summer weekends.' },
      { name: 'Kingcraig', kind: 'junction', section: 'way', km: 29,
        blurb: 'The fork at the edge of town. Left for Library Chowk, Gandhi Chowk and the road to Kempty Falls; right for Picture Palace, Kulri and Landour. Kingcraig has multi-level parking if you would rather walk.', photo: photo('mussoorie-town') },
      { name: 'Mall Road, Mussoorie', kind: 'end', section: 'way', km: 33,
        blurb: 'Mussoorie\'s promenade between Library Chowk and Picture Palace: shops, cafés and views down to Dehradun. Park and walk it.',
        hours: 'Closed to vehicles 4:30–10:30 PM', photo: photo('mall-road') },

      { name: 'Gun Hill', kind: 'viewpoint', section: 'explore', km: null, blurb: 'A short ropeway from Mall Road climbs to one of Mussoorie\'s highest points, with views over the town and, on clear days, the snow peaks.', photo: photo('gun-hill') },
      { name: 'Camel\'s Back Road', kind: 'walk', section: 'explore', km: null, blurb: 'A quiet 3 km road from Kulri to Library, named after a rock outcrop shaped like a camel\'s hump. Best on foot in the evening, when the sun sets over the hills.', photo: photo('camels-back') },
      { name: 'Lal Tibba, Landour', kind: 'viewpoint', section: 'explore', km: null,
        blurb: 'At 2,275 m, the highest point in Landour. On a clear morning the line of snow peaks runs from Bandarpoonch and Swargarohini to Kedarnath and Badrinath.',
        tip: 'Clearest October to February, before mid-morning.', photo: photo('lal-tibba') },
      { name: 'St Paul\'s Church', kind: 'sight', section: 'explore', km: null, blurb: 'A church from 1840 at Char Dukan in Landour, among cedars on the ridge.', photo: photo('st-pauls') },
      { name: 'George Everest\'s House', kind: 'sight', section: 'explore', km: null, blurb: 'The restored home and laboratory of Sir George Everest on the Park Estate, west of Library Chowk, on an open ridge with wide views over the Doon valley.', photo: photo('everest-house') },
      { name: 'Kempty Falls', kind: 'waterfall', section: 'explore', km: null,
        blurb: '13–15 km beyond Mussoorie on the Chakrata road: the best-known falls in the area, dropping in tiers into pools you can wade in. Very busy on summer weekends.',
        hours: 'Daytime; timings vary, check locally', photo: photo('kempty-falls') },
      { name: 'Kipling Trail', kind: 'walk', section: 'explore', km: null, blurb: 'The old bridle path from Rajpur up to Mussoorie, about 9 km on foot, starting near Shahanshahi Ashram. Views over the Doon valley the whole way.', photo: photo('kipling-trail') },

      { name: 'Char Dukan', kind: 'cafe', section: 'eat', km: null, blurb: 'The cluster of old shop-cafés by St Paul\'s Church in Landour: bun-omelette, pancakes, Maggi and hot chocolate.', hours: 'About 9 AM–7 PM', photo: photo('char-dukan') },
      { name: 'Landour Bakehouse', kind: 'cafe', section: 'eat', km: null, blurb: 'A bakery café in an old Landour house, known for its apple pie and cakes.', hours: 'About 8 AM–7 PM' },
      { name: 'Prakash Store, Sisters Bazaar', kind: 'food', section: 'eat', km: null, blurb: 'Landour\'s old provision store, famous for home-made peanut butter, jams and cheddar to take home.' },
      { name: 'Kalsang, Mall Road', kind: 'cafe', section: 'eat', km: null, blurb: 'Tibetan food on Mall Road: momos, thukpa and noodle soups for a warm-up after the ride.' },
      { name: 'Chic Chocolate, Mall Road', kind: 'cafe', section: 'eat', km: null, blurb: 'A long-running Mall Road café for coffee, hot chocolate and snacks.' },
    ],
    tips: [
      'On weekends traffic backs up below Kolhukhet by mid-morning. Leave before 8 AM.',
      'Mall Road is closed to vehicles from 4:30 to 10:30 PM. Park at Kingcraig or Library and walk.',
      'December to February mornings can bring black ice in the shade near Landour and Lal Tibba. Ride slowly and stay off the brakes on ice.',
      'Never overtake on blind bends. Sound the horn before each hairpin.',
      'Landour runs one-way loops on busy weekends: follow the police signs.',
      'Coming down, use a low gear and engine braking. On the Activa, brake in short, firm squeezes.',
    ],
  },

  'dehradun-rishikesh': {
    oldBody: 'About 1.25 hours through the Rajaji forest road.',
    bodyMd:
      'An easy 45 km run south-east to the Ganga. Leave Dehradun on the Haridwar road through Harrawala and Doiwala. From there two good roads go on to Rishikesh: one past Jolly Grant airport and Ranipokhari, the other along the highway past Lachhiwala and Nepali Farm. Both run through sal forest on the edge of the Rajaji reserve and take about the same time.\n\n'
      + 'In Rishikesh, park and walk: Ram Jhula, Triveni Ghat, the Beatles Ashram and the cafés of Tapovan are all close together. Time the ride back for the evening aarti at Triveni Ghat, or start home before dark.',
    rideTime: '1.25–1.5 h one way',
    bestTime: 'October to March. Arrive by 6 PM for the evening aarti.',
    difficulty: 'easy',
    bikeAdvice:
      'Mostly flat, smooth highway with forest stretches. The Activa 125 is comfortable at 60–70 km/h, and the Hunter 350 cruises easily with a pillion. Rishikesh\'s riverside lanes are narrow and busy, and a lighter bike is easier to park near the ghats.',
    highlights: ['Sal forest on the edge of the Rajaji reserve', 'Ganga aarti at Triveni Ghat', 'Ram Jhula and the Tapovan cafés', 'The Beatles Ashram murals', 'Neer Garh waterfall'],
    cover: photo('ram-jhula'),
    stops: [
      { ...start, blurb: 'Head south on the Haridwar road through Harrawala.' },
      { name: 'Doiwala', kind: 'junction', section: 'way', km: 19, blurb: 'A small market town and the last easy stop for water and snacks. Just beyond, the roads to Rishikesh divide: past Jolly Grant airport, or on along the highway past Lachhiwala.' },
      { name: 'Lachhiwala Nature Park', kind: 'sight', section: 'way', km: 22, blurb: 'A Forest Department park among sal trees, with streams, shaded paths and secure parking. A good halfway break on the highway route.' },
      { name: 'Nepali Farm', kind: 'junction', section: 'way', km: 33, blurb: 'Turn off the Haridwar highway here for Rishikesh.' },
      { name: 'Triveni Ghat, Rishikesh', kind: 'end', section: 'way', km: 45,
        blurb: 'The biggest ghat in Rishikesh, where the evening Ganga aarti fills the steps with lamps and chanting.',
        hours: 'Aarti around 6–7 PM, earlier in winter', photo: photo('triveni-aarti') },

      { name: 'Ram Jhula', kind: 'sight', section: 'explore', km: null, blurb: 'The iron suspension footbridge across the Ganga between Sivananda Nagar and Swarg Ashram. Park on your side of the river and walk across.', photo: photo('ram-jhula') },
      { name: 'Tapovan and Bajrang Setu', kind: 'sight', section: 'explore', km: null,
        blurb: 'Laxman Jhula has been closed to traffic since 2019. Bajrang Setu, a new glass-deck bridge, has been built beside it. Tapovan, on the west bank, is Rishikesh\'s café and yoga quarter.',
        tip: 'Check locally which crossings are open, and park before you cross.', photo: photo('tapovan') },
      { name: 'Beatles Ashram (Chaurasi Kutia)', kind: 'sight', section: 'explore', km: null,
        blurb: 'The Maharishi\'s ashram where the Beatles stayed in 1968, now inside the Rajaji reserve: meditation huts in the forest and walls covered in murals.',
        hours: 'About 10 AM–4 PM; ticketed', photo: photo('beatles-ashram') },
      { name: 'Neer Garh Waterfall', kind: 'waterfall', section: 'explore', km: null, blurb: 'A short uphill walk from the Badrinath road above Tapovan to a chain of cascades and pools.', hours: 'About 8 AM–6 PM; small entry fee', photo: photo('neer-garh') },
      { name: 'Patna Waterfall', kind: 'walk', section: 'explore', km: null, blurb: 'A quieter fall near Tapovan, about 1.5 km on foot through forest.' },

      { name: 'Little Buddha Café', kind: 'cafe', section: 'eat', km: null, blurb: 'A popular café near Laxman Jhula overlooking the river.' },
      { name: 'Ganga View Café', kind: 'cafe', section: 'eat', km: null, blurb: 'Laid-back café near Laxman Jhula: breakfast, coffee and a long look at the river.' },
      { name: 'Beatles Café', kind: 'cafe', section: 'eat', km: null, blurb: 'Beatles-themed café with Ganga views, a good stop on the way to or from the ashram.' },
    ],
    tips: [
      'Meat and alcohol are not sold in Rishikesh, so plan meals around vegetarian cafés.',
      'Elephants, deer and langurs cross the forest stretches, especially at dawn and dusk. Slow down and never stop close to wildlife.',
      'The Haridwar highway gets heavy on weekends; set out early.',
      'The forest stretches are unlit. Start home before dark or ride slowly with your headlamp on high beam where it is safe.',
      'Prefer a quieter forest road? The Thano road from Raipur runs about 16 km through sal forest towards Bhogpur and Jolly Grant. It is slippery in rain.',
    ],
  },

  'sahastradhara-loop': {
    oldBody: 'About 40 minutes. An easy ride out to the sulphur springs.',
    bodyMd:
      'A short, easy ride north-east from the city along Sahastradhara Road, climbing gently to the sulphur springs 14 km out. Sahastradhara means "thousand-fold spring": water drips from mossy limestone ledges and caves into the stream, and many visitors bathe in it for its sulphur.\n\n'
      + 'Make a half-day loop of it: the springs in the morning, then back across town to Tapkeshwar\'s cave temple and the gorge at Robbers Cave.',
    rideTime: 'About 40 min one way',
    bestTime: 'Mornings, March to June and October to November.',
    difficulty: 'easy',
    bikeAdvice:
      'A short, smooth city ride with a gentle climb at the end. The Activa 125 is ideal, and parking at the springs is easier on a scooter.',
    highlights: ['Sulphur springs and dripping caves', 'Ropeway over the valley', 'Robbers Cave gorge walk', 'Tapkeshwar cave temple'],
    cover: photo('sahastradhara'),
    stops: [
      { ...start, blurb: 'Head north-east out of the centre towards Sahastradhara Road.' },
      { name: 'IT Park, Sahastradhara Road', kind: 'junction', section: 'way', km: 8, blurb: 'Past the IT Park the city thins out and the road climbs gently towards the hills. Tasalli, the rooftop café, is on this stretch: a good stop on the way back.' },
      { name: 'Sahastradhara', kind: 'end', section: 'way', km: 14,
        blurb: 'Sulphur water drips from limestone caves and ledges into the stream below. There is a ropeway up the hill for the view, and stalls selling chai, Maggi and pakoras.',
        hours: 'Roughly 8 AM–7 PM; check locally', tip: 'The rocks are slippery: wear footwear with grip.', photo: photo('sahastradhara') },

      { name: 'Robbers Cave (Guchhupani)', kind: 'walk', section: 'explore', km: null, blurb: 'A narrow limestone gorge north of the city where a stream runs through a cave. You walk up the stream bed in ankle- to knee-deep water.', tip: 'Wear sandals or shoes you do not mind getting wet.', photo: photo('robbers-cave') },
      { name: 'Tapkeshwar Mahadev', kind: 'temple', section: 'explore', km: null, blurb: 'A cave temple on a stream bank in Garhi Cantt, where water drips onto the Shivling from the rock above.', photo: photo('tapkeshwar') },

      { name: 'Tasalli The Rooftop Café', kind: 'cafe', section: 'eat', km: null, blurb: 'A rooftop café on Sahastradhara Road (opposite the Electricity Office, Rishi Nagar) with views over the hills.' },
      { name: 'Stalls at the springs', kind: 'food', section: 'eat', km: null, blurb: 'Chai, Maggi, corn and pakoras by the water. Simple, and exactly right after a dip.' },
    ],
    tips: [
      'Go early: the springs are crowded after 11 AM on weekends.',
      'In the monsoon (July to September) the stream can rise fast after rain in the hills. Stay out if the water is brown or rising.',
      'Carry a change of clothes if you plan to get into the water.',
    ],
  },

  maldevta: {
    oldBody: 'A river valley ride with gravel sections.',
    bodyMd:
      'East out of the city through Raipur, onto the quiet, narrow Maldevta road and down to the Song river, which rises on the Mussoorie ridge. Maldevta, about 20 km out in Shripur, is a picnic spot in the forest with a temple up a flight of steps and clear pools in the dry months.\n\n'
      + 'Beyond it the tarmac gets narrower, and the stony river beds and dirt tracks of the valley are popular with trail riders. Experienced riders can follow the road as it climbs after a small bridge over the Song towards Kaddukhal, Surkanda Devi and Dhanaulti. That is a full day out and back.',
    rideTime: 'About 45 min to Maldevta',
    bestTime: 'October to June, in daylight. Avoid the monsoon.',
    difficulty: 'challenging',
    bikeAdvice:
      'The tarmac to Maldevta is fine on any bike. The river beds, dirt tracks and broken road beyond are where the Scram 440 and Himalayan 450 earn their place: long-travel suspension, big front wheels and plenty of ground clearance.',
    highlights: ['The Song river and its stony beds', 'Forest picnic spot and temple at Maldevta', 'Dirt tracks for trail riding', 'Climb towards Kaddukhal and Dhanaulti'],
    cover: photo('song-river'),
    stops: [
      { ...start, blurb: 'Leave the city eastwards on Raipur Road.' },
      { name: 'Raipur', kind: 'food', section: 'way', km: 10, blurb: 'The last market on the way out. Buy water and snacks here: there is no food at Maldevta.' },
      { name: 'The Song river', kind: 'viewpoint', section: 'way', km: 17, blurb: 'The road drops to the Song: wide, stony beds and clear water in the dry months, forest on both banks.', photo: photo('song-river') },
      { name: 'Maldevta', kind: 'end', section: 'way', km: 20,
        blurb: 'A forest picnic spot on the river in Shripur, with the Maldevta temple up a flight of steps and pools for a dip in summer.',
        hours: 'About 10 AM–6 PM. Leave before dark.' },

      { name: 'River-bed and dirt tracks', kind: 'viewpoint', section: 'explore', km: null, blurb: 'Stony river beds and dirt tracks along the valley floor, popular with trail riders. Only on the Scram 440 or Himalayan 450, and never when the river is up.' },
      { name: 'Kumalda and the valley villages', kind: 'walk', section: 'explore', km: null, blurb: 'Small villages on terraced slopes above Maldevta. Park and walk the lanes for a slower look at the valley.' },
      { name: 'On to Kaddukhal and Dhanaulti', kind: 'sight', section: 'explore', km: null, blurb: 'The road keeps climbing towards Kaddukhal, the base for Surkanda Devi temple, and on to Dhanaulti about 8 km further. A full-day ride for experienced riders; check road conditions first.' },

      { name: 'Raipur market', kind: 'food', section: 'eat', km: null, blurb: 'The last stop for snacks, water and chai before Maldevta. Pack a lunch here.' },
    ],
    tips: [
      'There are no food stalls at Maldevta. Carry water and a packed lunch.',
      'Stay out of the river in the monsoon: the Song rises fast after rain upstream, and cloudbursts have damaged village roads in this valley.',
      'Wild animals pass through after dark. Do not camp alone, and leave before sunset.',
      'On gravel, stand on the pegs, keep the speed low and look ahead. On the Scram and Himalayan, switch off rear ABS only on loose surfaces.',
      'Take your litter home: plastic left by picnickers is choking the river bed.',
    ],
  },
};

module.exports = { GUIDES, PHOTOS };
