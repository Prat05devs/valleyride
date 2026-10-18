'use strict';
/**
 * Model-page content for the four launch models (2026 model year), keyed by vehicle_models.slug.
 * Engine, chassis and dimension figures are the manufacturers' published specifications (sources listed per model).
 * Mileage marked "real-world" is a typical range from owner reports, not a manufacturer figure.
 * `fromUs` is left empty: helmets, mounts, variant and colour are the owner's facts to add in the admin console.
 * Shape: packages/shared/src/schemas/guide.ts (vehicleSpecsSchema).
 */
module.exports = {
  'activa-125': {
    modelYear: 2026,
    overview:
      "India's best-known scooter in its latest form: a 124 cc fuel-injected engine with Honda's idling-stop system, a 4.2-inch TFT display that pairs with your phone for turn-by-turn directions, and a USB Type-C port. It weighs only about 108 kg, has no gears to think about and is the easiest way to get around Dehradun, out to Sahastradhara or down to Rishikesh.",
    highlights: [
      { label: 'Power', value: '8.4 PS' },
      { label: 'Torque', value: '10.5 Nm' },
      { label: 'Mileage', value: '45–50 km/l' },
      { label: 'Weight', value: '≈108 kg' },
    ],
    groups: [
      { title: 'Engine', rows: [
        { label: 'Type', value: 'Single cylinder, 4-stroke, air-cooled, PGM-FI fuel injection' },
        { label: 'Displacement', value: '123.92 cc' },
        { label: 'Max power', value: '6.20 kW (8.4 PS)' },
        { label: 'Max torque', value: '10.5 Nm' },
        { label: 'Gearbox', value: 'Automatic (CVT): twist and go' },
        { label: 'Start', value: 'Self start; idling stop system' },
        { label: 'Emissions', value: 'BS6 phase 2 (OBD2B)' },
      ] },
      { title: 'Brakes, wheels and suspension', rows: [
        { label: 'Front brake', value: 'Disc (H-Smart) or drum (DLX)' },
        { label: 'Rear brake', value: 'Drum' },
        { label: 'Wheels', value: '12-inch front, 10-inch rear' },
        { label: 'Tyres', value: '90/90-12 front, 90/100-10 rear, tubeless' },
        { label: 'Front suspension', value: 'Telescopic fork' },
      ] },
      { title: 'Size and weight', rows: [
        { label: 'Seat height', value: '765 mm' },
        { label: 'Ground clearance', value: '162 mm' },
        { label: 'Kerb weight', value: 'About 108 kg (varies by variant)' },
        { label: 'Fuel tank', value: '5.3 litres' },
      ] },
      { title: 'Features', rows: [
        { label: 'Display', value: '4.2-inch TFT with Bluetooth' },
        { label: 'Phone app', value: 'Honda RoadSync: navigation, call and message alerts' },
        { label: 'Charging', value: 'USB Type-C' },
        { label: 'Lights', value: 'LED headlamp' },
        { label: 'Key', value: 'Smart key (H-Smart) or standard key (DLX)' },
      ] },
    ],
    mileage: {
      claimed: null,
      realWorld: '45–50 km/l',
      tankL: 5.3,
      range: 'About 240 km a tank',
      note: 'Honda does not publish an official figure. Expect the lower end with a pillion or on the Mussoorie climb.',
    },
    terrain: [
      { label: 'City and traffic', score: 5, note: 'Light, automatic and narrow. The best choice for Rajpur Road, Paltan Bazaar and the market lanes.' },
      { label: 'Hill climbs and hairpins', score: 3, note: 'Climbs to Mussoorie fine solo at a steady pace; slower with a pillion on the steepest bends near Kolhukhet and Kingcraig.' },
      { label: 'Highway', score: 3, note: 'Comfortable at 60–70 km/h on the Haridwar road to Rishikesh.' },
      { label: 'Broken roads and gravel', score: 2, note: 'Small wheels feel every pothole. Fine to Sahastradhara; not the bike for the dirt sections past Maldevta.' },
      { label: 'Two up', score: 4, note: 'Wide, flat seat and a light machine make it easy for couples in town.' },
    ],
    goodToKnow: [
      'No clutch and no gears: the left lever is the rear brake.',
      'Idling stop switches the engine off at a standstill; it restarts as soon as you twist the throttle.',
      'Scooters have little engine braking. Coming down from Mussoorie, brake in short firm squeezes instead of holding the brakes on.',
      'The 5.3-litre tank gives about 240 km. Fill up in the city before a hill ride.',
      'Pair your phone with the Honda RoadSync app before you set off to get directions on the display.',
    ],
    fromUs: [],
    sources: [
      { label: 'Honda 2Wheelers India: Activa 125', url: 'https://www.honda2wheelersindia.com/activa125' },
      { label: 'Honda: 2025 Activa 125 launch (OBD2B)', url: 'https://honda2wheelersindia.com/media-center/PressReleaseDetails/3549' },
    ],
  },

  'hunter-350': {
    modelYear: 2026,
    overview:
      "Royal Enfield's lightest, nimblest 350: the J-series single makes its torque low down, so it pulls cleanly out of hairpins without much gear-changing. The current model adds an assist-and-slip clutch for a lighter lever, an LED headlamp and a USB Type-C port. It is at home in city traffic and on the Mussoorie climb, and the most fuel-efficient motorcycle in the fleet.",
    highlights: [
      { label: 'Power', value: '20.2 bhp' },
      { label: 'Torque', value: '27 Nm' },
      { label: 'Mileage', value: '36.2 km/l' },
      { label: 'Weight', value: '181 kg' },
    ],
    groups: [
      { title: 'Engine', rows: [
        { label: 'Type', value: 'Single cylinder, 4-stroke, air-oil cooled, fuel injected' },
        { label: 'Displacement', value: '349 cc' },
        { label: 'Max power', value: '20.2 bhp (14.87 kW) at 6,100 rpm' },
        { label: 'Max torque', value: '27 Nm at 4,000 rpm' },
        { label: 'Gearbox', value: '5-speed' },
        { label: 'Clutch', value: 'Wet multi-plate, assist and slip' },
      ] },
      { title: 'Chassis and suspension', rows: [
        { label: 'Frame', value: 'Twin downtube spine frame' },
        { label: 'Front', value: '41 mm telescopic fork' },
        { label: 'Rear', value: 'Twin shocks, 6-step adjustable preload' },
      ] },
      { title: 'Brakes and tyres', rows: [
        { label: 'Front brake', value: '300 mm disc, twin-piston caliper' },
        { label: 'Rear brake', value: '270 mm disc' },
        { label: 'ABS', value: 'Dual channel' },
        { label: 'Tyres', value: '110/70-17 front, 140/70-17 rear, tubeless on alloy wheels' },
      ] },
      { title: 'Size and weight', rows: [
        { label: 'Seat height', value: '790 mm' },
        { label: 'Ground clearance', value: '160 mm' },
        { label: 'Wheelbase', value: '1,370 mm' },
        { label: 'Kerb weight', value: '181 kg (90% fuel and oil)' },
        { label: 'Fuel tank', value: '13 litres' },
      ] },
      { title: 'Features', rows: [
        { label: 'Lights', value: 'LED headlamp and tail lamp' },
        { label: 'Instruments', value: 'Digital-analogue cluster' },
        { label: 'Navigation', value: 'Tripper Pod turn-by-turn (Metro variant)' },
        { label: 'Charging', value: 'USB Type-C fast charging (Metro variant)' },
      ] },
    ],
    mileage: {
      claimed: '36.2 km/l',
      realWorld: '32–36 km/l',
      tankL: 13,
      range: 'About 420 km a tank',
      note: "Royal Enfield's figure is for ideal conditions. Hill riding and a pillion bring it down a little.",
    },
    terrain: [
      { label: 'City and traffic', score: 5, note: 'Short wheelbase, low seat and a light clutch. Easy to filter and park.' },
      { label: 'Hill climbs and hairpins', score: 4, note: 'Plenty of low-down torque for the Mussoorie and Landour climbs; second gear carries you round most hairpins.' },
      { label: 'Highway', score: 4, note: 'Settles at 80–90 km/h on the Rishikesh road.' },
      { label: 'Broken roads and gravel', score: 2, note: '160 mm of ground clearance and road tyres: take the rough stretches slowly.' },
      { label: 'Two up', score: 3, note: 'Fine for city rides and Mussoorie; the pillion seat is compact for long days.' },
    ],
    goodToKnow: [
      'The low 790 mm seat suits most riders, including first-time Royal Enfield riders.',
      'The assist-and-slip clutch keeps the lever light in stop-start traffic.',
      'Dual-channel ABS: brake firmly in a straight line and the bike stays stable.',
      'A 13-litre tank gives more than 400 km, enough for Mussoorie and back several times over.',
    ],
    fromUs: [],
    sources: [{ label: 'Royal Enfield: Hunter 350 specifications', url: 'https://www.royalenfield.com/in/en/motorcycles/hunter-350/' }],
  },

  'scram-440': {
    modelYear: 2026,
    overview:
      'A road-and-trail crossover built on the Himalayan platform: a 443 cc long-stroke single with a six-speed gearbox, a 19-inch front wheel, 190 mm of suspension travel and 200 mm of ground clearance. It is more comfortable than a street bike on broken hill roads and lighter to handle than a full adventure tourer. A good fit for the Mussoorie hills, the Maldevta valley and mixed-road weekends.',
    highlights: [
      { label: 'Power', value: '25.4 bhp' },
      { label: 'Torque', value: '34 Nm' },
      { label: 'Mileage', value: '30.1 km/l' },
      { label: 'Ground clearance', value: '200 mm' },
    ],
    groups: [
      { title: 'Engine', rows: [
        { label: 'Type', value: 'Single cylinder, 4-stroke, SOHC, air-cooled, fuel injected' },
        { label: 'Displacement', value: '443 cc' },
        { label: 'Max power', value: '25.4 bhp (18.7 kW) at 6,250 rpm' },
        { label: 'Max torque', value: '34 Nm at 4,000 rpm' },
        { label: 'Gearbox', value: '6-speed' },
        { label: 'Clutch', value: 'Wet multi-plate' },
      ] },
      { title: 'Chassis and suspension', rows: [
        { label: 'Frame', value: 'Half-duplex split cradle' },
        { label: 'Front', value: '41 mm telescopic fork, 190 mm travel' },
        { label: 'Rear', value: 'Linkage monoshock, 180 mm travel' },
      ] },
      { title: 'Brakes and tyres', rows: [
        { label: 'Front brake', value: '300 mm disc, twin-piston floating caliper' },
        { label: 'Rear brake', value: '240 mm disc' },
        { label: 'ABS', value: 'Dual channel, switchable at the rear' },
        { label: 'Tyres', value: '100/90-19 front, 120/90-17 rear, dual-purpose' },
        { label: 'Wheels', value: 'Spoke with tubes (Trail) or alloy, tubeless (Force)' },
      ] },
      { title: 'Size and weight', rows: [
        { label: 'Seat height', value: '795 mm' },
        { label: 'Ground clearance', value: '200 mm' },
        { label: 'Wheelbase', value: '1,460 mm' },
        { label: 'Kerb weight', value: '196 kg (90% fuel and oil)' },
        { label: 'Fuel tank', value: '15 litres' },
      ] },
      { title: 'Features', rows: [
        { label: 'Lights', value: 'LED headlamp and tail lamp' },
        { label: 'Instruments', value: 'Digital-analogue cluster' },
        { label: 'Charging', value: 'USB Type-A' },
        { label: 'Navigation', value: 'Tripper Pod (optional accessory)' },
      ] },
    ],
    mileage: {
      claimed: '30.12 km/l (ARAI)',
      realWorld: '28–32 km/l',
      tankL: 15,
      range: 'About 420 km a tank',
      note: 'ARAI-certified figure from Royal Enfield. Real-world economy depends on load and how much climbing you do.',
    },
    terrain: [
      { label: 'City and traffic', score: 4, note: 'Upright and easy to see over traffic; slightly heavier than the Hunter at walking pace.' },
      { label: 'Hill climbs and hairpins', score: 5, note: 'Strong mid-range torque and six gears make the ghat road to Mussoorie and the climb to Lal Tibba relaxed.' },
      { label: 'Highway', score: 4, note: 'Sixth gear keeps revs down at 80–90 km/h.' },
      { label: 'Broken roads and gravel', score: 4, note: 'Long travel, a 19-inch front and dual-purpose tyres soak up the dirt and stony sections past Maldevta.' },
      { label: 'Two up', score: 4, note: 'Long, flat seat and a stable chassis for rider and pillion.' },
    ],
    goodToKnow: [
      'The rear ABS can be switched off for loose gravel. Leave it on for normal roads.',
      'At 795 mm the seat is low for a bike with this much suspension.',
      'Spoke (Trail) variants run tubes: a puncture needs a repair, not a plug. Call the desk if it happens.',
      'Six gears: use fourth to sixth on the open road to save fuel.',
    ],
    fromUs: [],
    sources: [{ label: 'Royal Enfield: Scram 440 specifications', url: 'https://www.royalenfield.com/in/en/motorcycles/scram-440/' }],
  },

  'himalayan-450': {
    modelYear: 2026,
    overview:
      "Royal Enfield's purpose-built adventure tourer: a liquid-cooled 452 cc Sherpa engine with ride-by-wire, 40 PS and a slip-and-assist clutch. It rides on 200 mm of Showa suspension travel at each end, a 21-inch front wheel and 230 mm of ground clearance. The round TFT shows Google Maps navigation. It is the bike for long days, rough roads and anything past Mussoorie into the higher hills.",
    highlights: [
      { label: 'Power', value: '40 PS' },
      { label: 'Torque', value: '40 Nm' },
      { label: 'Mileage', value: '25–30 km/l' },
      { label: 'Ground clearance', value: '230 mm' },
    ],
    groups: [
      { title: 'Engine', rows: [
        { label: 'Type', value: 'Single cylinder, liquid-cooled, DOHC, 4 valves, ride-by-wire' },
        { label: 'Displacement', value: '452 cc' },
        { label: 'Max power', value: '40.02 PS (29.44 kW) at 8,000 rpm' },
        { label: 'Max torque', value: '40 Nm at 5,500 rpm' },
        { label: 'Gearbox', value: '6-speed' },
        { label: 'Clutch', value: 'Wet multi-plate, slip and assist' },
      ] },
      { title: 'Chassis and suspension', rows: [
        { label: 'Frame', value: 'Steel twin-spar tubular' },
        { label: 'Front', value: '43 mm Showa upside-down fork, 200 mm travel' },
        { label: 'Rear', value: 'Linkage monoshock, 200 mm travel' },
      ] },
      { title: 'Brakes and tyres', rows: [
        { label: 'Front brake', value: '320 mm disc, twin-piston caliper' },
        { label: 'Rear brake', value: '270 mm disc' },
        { label: 'ABS', value: 'Dual channel, switchable' },
        { label: 'Tyres', value: '90/90-21 front, 140/80-17 rear, spoke wheels' },
      ] },
      { title: 'Size and weight', rows: [
        { label: 'Seat height', value: '825–845 mm (adjustable)' },
        { label: 'Ground clearance', value: '230 mm' },
        { label: 'Wheelbase', value: '1,510 mm' },
        { label: 'Kerb weight', value: '196 kg (90% fuel and oil)' },
        { label: 'Fuel tank', value: '17 litres' },
      ] },
      { title: 'Features', rows: [
        { label: 'Display', value: '4-inch round TFT with Google Maps navigation and media controls' },
        { label: 'Ride modes', value: 'Selectable ride modes' },
        { label: 'Charging', value: 'USB Type-C' },
        { label: 'Lights', value: 'All-LED' },
      ] },
    ],
    mileage: {
      claimed: null,
      realWorld: '25–30 km/l',
      tankL: 17,
      range: 'About 450 km a tank',
      note: 'Royal Enfield does not publish a figure for the Himalayan 450. Eco mode and steady riding give the upper end.',
    },
    terrain: [
      { label: 'City and traffic', score: 3, note: 'Tall and wide-barred. Manageable, but not where it shines.' },
      { label: 'Hill climbs and hairpins', score: 5, note: 'Smooth power all the way to 8,000 rpm. The Mussoorie climb and the road on to Dhanaulti or Kempty are effortless.' },
      { label: 'Highway', score: 5, note: 'Happy at 100 km/h with power in reserve; the best bike in the fleet for long days.' },
      { label: 'Broken roads and gravel', score: 5, note: '21-inch front, 200 mm of travel and 230 mm of clearance: built for the river-bed tracks past Maldevta.' },
      { label: 'Two up', score: 4, note: 'Roomy for two, and comfortable on long days.' },
    ],
    goodToKnow: [
      'The seat is 825–845 mm. If you are on the shorter side, sit on it at pickup before you set off.',
      'Pair the Royal Enfield app before the ride to get Google Maps on the dash.',
      'Ride modes change throttle response; the softer mode is smoother in traffic and on wet roads.',
      'Rear ABS can be switched off for gravel. Switch it back on for the road.',
    ],
    fromUs: [],
    sources: [{ label: 'Royal Enfield: Himalayan 450 specifications', url: 'https://www.royalenfield.com/in/en/motorcycles/himalayan/' }],
  },
};
