/**
 * English UI strings — the canonical dictionary.
 *
 * This is the source of truth for the *shape*: `ur.ts` is typed against it, so
 * adding a key here and forgetting the Urdu is a compile error rather than a
 * blank label in production.
 *
 * Only interface text lives here. Content that an admin can edit — vehicles,
 * services, industries, the About copy — is bilingual in MongoDB instead; see
 * lib/i18n/localize.ts.
 */
export const en = {
  // The first-visit chooser deliberately keeps its own bilingual copy in the
  // component: at that point the visitor has not picked a language yet, so it
  // has to speak both at once rather than guess one.
  language: {
    switchLabel: "Switch language",
    label: "Language",
    english: "English",
    urdu: "اردو",
    nowReading: "Reading in English",
  },

  nav: {
    home: "Home",
    fleet: "Fleet",
    rates: "Rates",
    corporate: "Corporate",
    industries: "Industries",
    services: "Services",
    about: "About",
    contact: "Contact",
    menu: "Menu",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    siteMenu: "Site menu",
    mobile: "Mobile",
    bookShort: "Book",
    bookVehicle: "Book a vehicle",
    call: "Call",
    whatsapp: "WhatsApp",
    brandName: "Shani Travels",
    brandTagline: "Car Rental",
    logoAlt: "Shani Travels — 24 Hours Car Rental Service",
  },

  footer: {
    tagline:
      "Chauffeur-driven car rental and nationwide project transport, trusted by organizations across Pakistan since 1997.",
    explore: "Explore",
    company: "Company",
    getInTouch: "Get in touch",
    alsoIn: "Also in",
    whatsappUs: "WhatsApp us",
    bookVehicle: "Book a vehicle",
    clients: "Clients",
    corporateTransport: "Corporate transport",
    safety: "Safety & Security",
    aboutUs: "About us",
    ourNetwork: "Our network",
    rights: "All rights reserved.",
    partOfGroup: "part of the Shani Group",
  },

  gallery: {
    noImage: "No image available",
    noImageShort: "No image",
    openFullScreen: "Open full-screen gallery",
    previous: "Previous image",
    next: "Next image",
    close: "Close",
    scrollUp: "Scroll thumbnails up",
    scrollDown: "Scroll thumbnails down",
    viewImage: "View image {n} of {total}",
    imageOf: "{n} / {total}",
    galleryOf: "{name} gallery",
    view: "{name} — view {n}",
  },

  promo: {
    useCode: "Use code",
    dismiss: "Dismiss offer",
    fieldLabel: "Promo code",
    fieldHint: "Have a code? Enter it and our team will apply it when they confirm.",
    fieldPlaceholder: "e.g. {code}",
    applied: "Code {code} will be applied when we confirm your booking.",
  },

  common: {
    perDay: "/day",
    perHour: "/hour",
    perWeek: "/week",
    perMonth: "/month",
    startingFrom: "Starting from",
    from: "From",
    fromLower: "from",
    selfDrive: "Self-drive",
    armored: "Armored",
    offRoad: "Off-road",
    rates: "Rates",
    details: "View details",
    onRequest: "On request",
    viewDetails: "View details",
    viewAll: "View all",
    learnMore: "Learn more",
    readMore: "Read more",
    getQuote: "Get a quote",
    bookNow: "Book now",
    enquireNow: "Enquire now",
    backToHome: "Home",
    browseFleet: "Browse the fleet",
    seats: "Seats",
    seatsCount: "{n} seats",
    engine: "Engine",
    transmission: "Transmission",
    drive: "Drive",
    breadcrumb: "Breadcrumb",
    loading: "Loading…",
    optional: "optional",
    required: "required",
    submit: "Submit",
    sending: "Sending…",
    close: "Close",
  },

  hero: {
    ribbon: "Trusted Ground-Transport Partner Since 1997",
    trustEstablished: "Established 1997",
    trustInsured: "Insured & Tracked",
    trustNationwide: "Nationwide",
    trustSupport: "24/7 Support",
    bgAlt: "Shani Travels chauffeur-driven fleet",
    carouselLabel: "Shani Travels at a glance",
    showSlide: "Show slide {n}",
    retailBrowse: "Browse the fleet",
    corporateProposal: "Corporate & projects",
    // Slide one keeps the CMS headline; these carry the slides after it.
    slideCorporateEyebrow: "Corporate & project transport",
    slideCorporateTitle: "One operator for every movement",
    slideCorporateDesc:
      "From a single airport transfer to a hundred-vehicle project fleet — dedicated vehicles, vetted drivers and one monthly invoice.",
    slideCoverageEyebrow: "Nationwide, around the clock",
    slideCoverageTitle: "Ready before you are",
    slideCoverageDesc:
      "Offices in eight cities, backup vehicles held in every province, and an operations desk that answers at four in the morning.",
    slideSafetyEyebrow: "Safety & compliance",
    slideSafetyTitle: "Every kilometre accounted for",
    slideSafetyDesc:
      "GPS-tracked, comprehensively insured and serviced on schedule, with HSE-briefed chauffeurs on every trip.",
    pillarChauffeurTitle: "Chauffeur-driven, door to door",
    pillarChauffeurDesc:
      "No counters, no paperwork. A vetted driver and a cleaned vehicle waiting at your gate, on time.",
    pillarFleetTitle: "A vehicle for every journey",
    pillarFleetDesc:
      "Economy saloons to B-6 armored SUVs and 45-seat coaches — one operator, one invoice.",
    pillarDeskTitle: "Operations desk, always on",
    pillarDeskDesc:
      "Plans change mid-journey. Call or WhatsApp and a person answers — day, night or public holiday.",
  },

  home: {
    fleetEyebrow: "Browse the fleet",
    fleetTitle: "Find the right vehicle",
    fleetDesc:
      "From economy cars to B-6 armored SUVs and 45-seat buses — pick a category to see rates and availability.",
    allVehicles: "All vehicles",
    offersEyebrow: "Offers & published rates",
    offersTitle: "Plan your next journey",
    offersDesc:
      "Transparent pricing, longer-hire discounts and a vehicle for every kind of trip — booked with one phone call.",
    offersCta: "See all rates",
    offerLongTitle: "The longer the hire, the lower the day rate",
    offerLongDesc:
      "Weekly and monthly rates published for the everyday fleet, with fuel and driver terms agreed up front.",
    offerAirportTitle: "Airport transfers, one agreed fare",
    offerAirportDesc: "Flight watched, driver waiting, no meter and no surge.",
    offerNationwideTitle: "City to city, right across Pakistan",
    offerNationwideDesc: "Offices in eight cities with backup vehicles held in every province.",
    featuredEyebrow: "Popular vehicles",
    featuredTitle: "Book from our featured fleet",
    featuredDesc: "Transparent per-day rates. Every vehicle comes with a professional chauffeur.",
    viewFullFleet: "View full fleet",
    whyEyebrow: "Why Shani Travels",
    whyTitle: "Trusted transport, done properly",
    whyDesc: "Nearly three decades serving organizations and families across Pakistan.",
    whyInsuredTitle: "Insured & tracked",
    whyInsuredDesc: "Every vehicle GPS-tracked and comprehensively insured.",
    whyDriversTitle: "Vetted drivers",
    whyDriversDesc: "Background-checked, professionally trained chauffeurs.",
    whyCoverageTitle: "National coverage",
    whyCoverageDesc: "Offices in 8 cities with provincial backup fleets.",
    whyOpsTitle: "24/7 operations",
    whyOpsDesc: "A team that answers the phone, whenever you need us.",
    clientsEyebrow: "Trusted by",
    clientsTitle: "Organizations that rely on us",
    clientsDesc: "UN agencies, donors, NGOs, telecoms and government institutions across Pakistan.",
    seeAllClients: "See all clients",
    servicesEyebrow: "What we do",
    servicesTitle: "Services for every journey",
    testimonialsEyebrow: "In their words",
    testimonialsTitle: "What our clients say",
    testimonialsDesc: "Paraphrased from appreciation letters by the organizations we serve.",
    networkEyebrow: "National network",
    networkTitle: "Wherever your journey takes you",
    networkDesc: "Offices in {count} cities, with provincial backup vehicles for project fleets.",
    hq: "(HQ)",
    viewNetwork: "View our network",
  },

  sections: {
    statYears: "Years of service",
    statCities: "Cities covered",
    statFleet: "Vehicles in fleet",
    statOps: "Operations support",
    accountEyebrow: "Shani Corporate Account",
    accountTitle: "More control. More coverage. No surprises.",
    accountDesc:
      "Organizations that move people every week don't book trip by trip. A corporate account puts your fleet, your drivers and your billing on one agreement.",
    accountCta: "Open a corporate account",
    accountBillingTitle: "One monthly invoice",
    accountBillingDesc:
      "Consolidated billing across every city, vehicle and trip — no cash on the road, no per-ride settlements.",
    accountManagerTitle: "A named account manager",
    accountManagerDesc:
      "One number for bookings, changes and escalations, answered by someone who knows your contract.",
    accountBackupTitle: "Backup vehicles held",
    accountBackupDesc:
      "Replacement units on standby in every province, so a vehicle off the road never becomes your delay.",
    ctaTitle: "Ready when you are",
    ctaBody:
      "Book a vehicle in minutes, or request a tailored proposal for your organization. Our team confirms every request personally.",
    ctaBook: "Book a vehicle",
    ctaProposal: "Corporate proposal",
  },

  bookARide: {
    title: "Book a Ride",
    description:
      "Reach us on whichever channel suits you — every request is confirmed by a person.",
    defaultMessage: "Hello Shani Travels, I'd like to book a ride.",
    emailSubject: "Ride booking enquiry",
    email: "Email",
  },

  // Mirrors VEHICLE_CLASSES in lib/types.ts. These were VEHICLE_CLASS_LABELS —
  // a code constant — but they are user-visible, so the dictionary owns them
  // now and the constant stays only for admin-side display.
  vehicleClass: {
    all: "All vehicles",
    economy: "Economy",
    sedan: "Sedan",
    suv: "SUV / 4x4",
    event: "Event Transport",
    vip: "Executive",
    specialized: "Specialized",
    logistics: "Logistics",
  },

  vehicleClassBlurb: {
    economy: "Compact, fuel-efficient cars for city runs",
    sedan: "Comfortable saloons for daily and business travel",
    suv: "4x4s and crossovers for any terrain",
    event: "Vans, coasters and buses for groups and weddings",
    vip: "Mercedes, BMW and flagship SUVs with protocol chauffeurs",
    specialized: "B-6 armored vehicles for secure movement",
    logistics: "Pickups, trucks and carriers for cargo",
  },

  fleet: {
    eyebrow: "Rent a vehicle",
    title: "Our fleet",
    description:
      "Economy cars to executive saloons, B-6 armored SUVs and logistics trucks — insured, tracked, and chauffeur-driven (or self-drive where marked). Filter by class, seats or price.",
    minSeats: "Min seats",
    any: "Any",
    searchLabel: "Search the fleet",
    searchPlaceholder: "Search by name — Corolla, Prado, Hiace",
    searchClear: "Clear search",
    company: "Company",
    allCompanies: "All companies",
    companiesSelected: "{n} selected",
    sort: "Sort",
    sortFeatured: "Recommended",
    sortPriceAsc: "Price: low to high",
    sortPriceDesc: "Price: high to low",
    sortSeatsDesc: "Most seats",
    selfDriveAvailable: "Self-drive available",
    showing: "Showing",
    vehicle: "vehicle",
    vehicles: "vehicles",
    inClass: " in {label}",
    noMatch: "No vehicles match these filters.",
    clearFilters: "Clear filters",
    classDescription: "{blurb} — insured, GPS-tracked and chauffeur-driven.",
    metaTitle: "Our Fleet — Cars, SUVs, Event Transport & Logistics",
    metaDescription:
      "Browse the Shani Travels fleet: economy cars, sedans, 4x4 SUVs, event transport, executive saloons, B-6 armored vehicles and logistics trucks. Transparent per-day rates.",
    metaClassTitle: "{label} Vehicles for Rent in Pakistan",
    metaClassDescription:
      "{blurb}. Chauffeur-driven hire across Pakistan with transparent rates, insured and GPS-tracked.",
    orgCtaTitle: "Renting for an organization?",
    orgCtaBody:
      "We contract dedicated fleets for multi-month projects — with national coverage, HSE compliance and references.",
    orgCtaLink: "Corporate & project transport",
  },

  rates: {
    eyebrow: "Transparent pricing",
    title: "Rate card",
    description:
      "No hidden charges — the quote you get is the price you pay. All rates exclude GST. Use the estimator for an indicative total.",
    metaTitle: "Rate Card — Transparent Vehicle Rental Rates",
    metaDescription:
      "The full Shani Travels rate card. Per-hour, per-day, per-week, per-month and airport transfer rates for every vehicle. All prices exclude GST.",
    search: "Search vehicles…",
    allClasses: "All classes",
    vehicle: "Vehicle",
    colHour: "Hour",
    colDay: "Day",
    colWeek: "Week",
    colMonth: "Month",
    colAirport: "Airport",
    book: "Book",
    noMatch: "No vehicles match your search.",
    footnote: "All amounts in PKR and exclude GST · “—” means on request",
  },

  estimator: {
    title: "Fare estimator",
    subtitle: "Get an indicative total. Final quotes are confirmed by our team.",
    vehicle: "Vehicle",
    rateType: "Rate type",
    hours: "Hours",
    weeks: "Weeks",
    days: "Days",
    distance: "Estimated distance (km) — optional",
    indicativeTotal: "Indicative total",
    disclaimer: "Excludes GST · fuel & allowances may apply",
    bookThis: "Book this vehicle",
    typeHour: "Per hour",
    typeDay: "Per day",
    typeWeek: "Per week",
    typeAirport: "Airport transfer",
  },

  vehicleDetail: {
    notFound: "Vehicle not found",
    metaArmored: "{level} Armored Hire",
    metaWithDriver: "Rent with Driver",
    armoredBadge: "{level} Armored — ballistic protection",
    selfDriveAvailable: "Self-drive available",
    features: "Features",
    chauffeurRates: "Chauffeur-driven rates",
    rates: "Rates",
    selfDriveRates: "Self-drive rates",
    securityDeposit: "Security deposit",
    confirmedAtBooking: "Confirmed at booking",
    startingFrom: "Starting from",
    pricing: "Pricing",
    bookThis: "Book this vehicle",
    requestProject: "Request for a project",
    alsoLike: "You may also like",
    ratePerHour: "Per hour",
    ratePerDay: "Per day",
    ratePerWeek: "Per week",
    ratePerMonth: "Per month",
    rateAirport: "Airport transfer",
    rateFuelPerKm: "Fuel per km",
    metaPriceFrom: " From {price}/day.",
    metaRatesOnRequest: " Rates on request.",
    metaDescription:
      "Hire the {name} ({seats} seats) with a professional chauffeur from Shani Travels.{price}",
    ratesNote:
      "All rates in {currency}, exclude GST. Daily rate covers a standard 10-hour working day; overtime, fuel and allowances billed as applicable.",
    selfDriveNote:
      "Self-drive requires document verification and a joint handover inspection at pickup — see ",
    selfDriveNoteLink: "how self-drive works",
  },

  error: {
    title: "Something went wrong",
    body: "Please try again. If the problem persists, contact Shani Travels directly.",
    retry: "Try again",
    publicBody:
      "We hit an unexpected error loading this page. Please try again, or reach us directly and we'll help right away.",
  },

  contact: {
    eyebrow: "Get in touch",
    title: "Contact us",
    description:
      "Booking a vehicle, planning a project, or just have a question? Reach us however suits you — we answer the phone.",
    metaTitle: "Contact Us — Get in Touch with Shani Travels",
    metaDescription:
      "Call, WhatsApp, email or visit Shani Travels. Head office in Blue Area, Islamabad, with offices across 8 cities. We respond within one business day.",
    headOffice: "Head office",
    mapTitle: "Head office location",
    alsoIn: "Also in",
    sendMessage: "Send us a message",
    replyPromise: "We'll get back to you within one business day.",
    whatsappSuffix: "(WhatsApp)",
  },

  form: {
    name: "Name",
    namePlaceholder: "Your name",
    phone: "Phone",
    phonePlaceholder: "+92 3XX XXXXXXX",
    email: "Email",
    emailPlaceholder: "you@example.com (optional)",
    message: "Message",
    messagePlaceholder: "How can we help?",
    send: "Send message",
    organization: "Organization",
    organizationPlaceholder: "e.g. UNDP Pakistan",
    contactName: "Contact name",
    workEmailPlaceholder: "you@organization.org",
    sector: "Sector",
    selectSector: "Select sector…",
    duration: "Expected duration",
    durationPlaceholder: "e.g. 6 months",
    vehiclesNeeded: "Vehicles needed",
    vehiclesPlaceholder: "e.g. 4 Land Cruisers + 2 Hi-Ace vans",
    citiesOfOperation: "Cities of operation",
    projectDetails: "Project details",
    projectPlaceholder: "Tell us about your requirements, HSE expectations, and timeline…",
    requestProposal: "Request a proposal",
    enquiryFootnote:
      "We'll respond within one business day. No online payment — corporate work is contracted.",
  },

  network: {
    eyebrow: "National coverage",
    title: "Our network",
    description:
      "Offices across Pakistan mean local knowledge, faster response, and provincial backup vehicles wherever your journey takes you.",
    metaTitle: "Our Network — Offices Across 8 Cities in Pakistan",
    metaDescription:
      "Shani Travels operates from offices in Islamabad, Lahore, Karachi, Peshawar, Quetta, Multan, Sukkur and Hyderabad, with provincial backup for project fleets.",
    empty: "Office details will appear here soon.",
    headOffice: "Head office",
    viewOnMap: "View on map",
  },

  clients: {
    eyebrow: "Trusted by",
    title: "Our clients",
    description:
      "Trust is our product. For nearly three decades, the organizations that set the highest bar for safety and reliability have chosen Shani Travels.",
    metaTitle: "Our Clients — Trusted by UN Agencies, NGOs & Corporates",
    metaDescription:
      "Organizations that trust Shani Travels for their ground transport — UN agencies, donors, NGOs, telecoms, government and hospitality, across Pakistan since 1997.",
    testimonialsEyebrow: "In their words",
    testimonialsTitle: "Appreciation from our clients",
    testimonialsDesc: "Paraphrased from the letters and references we've received over the years.",
  },

  about: {
    eyebrow: "Since 1997",
    title: "About Shani Travels",
    description:
      "The ground-transport arm of the Shani Group of Companies — trusted by organizations and families across Pakistan for nearly three decades.",
    metaTitle: "About Us — Shani Travels, Serving Pakistan Since 1997",
    metaDescription:
      "Shani Travels is the ground-transport arm of the Shani Group, serving Pakistan since 1997. Learn about our story, leadership, credentials and HSE commitment.",
    missionEyebrow: "Our mission",
    missionTitle: "Every journey, safely and on time",
    /** Default body. An admin can replace it from Settings → About. */
    missionBody:
      "To move people and cargo across Pakistan safely and on time — with insured, GPS-tracked vehicles, drivers we train and stand behind, and an operations desk that answers day or night. We measure ourselves on journeys completed without incident, and on the clients who call us back.",
    storyEyebrow: "Why choose Shani Travels",
    storyTitle: "Built on reliability",
    leadershipEyebrow: "Leadership",
    leadershipTitle: "A message from our CEO",
    ceoRole: ", Chief Executive Officer",
    credentialsEyebrow: "Registered & compliant",
    credentialsTitle: "Our credentials",
    ctaTitle: "Work with a team you can trust",
    ctaBody: "Operating from {count} cities, ready to move your team wherever you need to be.",
    ctaCorporate: "Corporate transport",
    ctaContact: "Contact us",
  },

  services: {
    eyebrow: "What we do",
    title: "Our services",
    description:
      "From a single airport pickup to a nationwide project fleet — every service backed by insured vehicles, vetted drivers and our since-1997 reliability.",
    metaTitle: "Services — Corporate, Individual & Specialized Transport",
    metaDescription:
      "13 transport services for organizations and individuals: corporate rental, staff and airline crew transport, airport transfers, tours, executive & VIP movement, B-6 armored and self-drive.",
    empty: "Services will be listed here soon.",
    groupCorporate: "For Organizations",
    groupIndividual: "For Individuals & Families",
    groupSpecialized: "Specialized Services",
    groupCorporateDesc:
      "Contracted transport for companies, institutions and programmes — dedicated fleets, invoicing and account management.",
    groupIndividualDesc:
      "Book in minutes for yourself or your family — confirmed personally by our team.",
    groupSpecializedDesc:
      "Capabilities beyond standard rental: protocol, protection and self-drive.",
    safetyTitle: "How we keep every journey safe",
    safetyBody:
      "Driver verification, documented inspections, journey management and a 24/7 operations room — read the full protocol our corporate clients contract against.",
    safetyCta: "Safety & Security",
  },

  industries: {
    eyebrow: "Who we serve",
    title: "Industries",
    description:
      "Every sector moves differently. Nearly three decades of contracts have taught us exactly how — from airline crew dispatch to embassy protocol to donor-project field fleets.",
    metaTitle: "Industries We Serve — Transport for Every Sector",
    metaDescription:
      "Specialised ground transport for airlines, government, embassies, NGOs, UN agencies, oil & gas, telecom, construction, banks, education and families — across Pakistan since 1997.",
    empty: "Industry pages are being prepared.",
  },

  safety: {
    kicker: "Written for procurement & security officers",
    title: "Safety & Security Protocol",
    description:
      "The operating procedures every Shani Travels movement runs on — verification, inspection, journey management and response. This is the document our corporate contracts are built against.",
    metaTitle: "Safety & Security Protocol",
    metaDescription:
      "The Shani Travels safety and security protocol: driver verification, documented inspections, journey management, self-drive handover procedures, GPS tracking and 24/7 operations control.",
    sectionsNav: "Protocol sections",
    empty: "The protocol is being prepared for publication.",
    categoryChauffeur: "Chauffeur-Driven Protocol",
    categorySelfDrive: "Self-Drive Protocol",
    categoryGeneral: "General Requirements",
    ctaTitle: "Contract against this protocol",
    ctaBody:
      "Every corporate engagement adopts these procedures as service terms. Ask for a proposal and our team will include the compliance documentation your procurement requires.",
    ctaButton: "Request a proposal",
  },

  corporate: {
    eyebrow: "For organizations",
    title: "Corporate & project transport",
    description:
      "For nearly three decades, UN agencies, donors, NGOs and corporates have trusted us to move their teams safely across Pakistan. Dedicated fleets, contracted and managed end to end.",
    metaTitle: "Corporate & Project Transport — Dedicated Fleets Nationwide",
    metaDescription:
      "Dedicated project fleets for UN agencies, donors, NGOs and corporates across Pakistan. HSE-compliant, insured & tracked vehicles, vetted drivers, provincial backup. Request a proposal.",
    pillDonor: "UN & donor experience",
    pillSince: "Since 1997",
    pillInsured: "Insured & tracked",
    pillNetwork: "8-city network",
    capabilitiesEyebrow: "Capabilities",
    capabilitiesTitle: "Everything a project fleet demands",
    capabilitiesDesc:
      "Built for the operational and compliance requirements of institutional clients.",
    capFleetsTitle: "Project fleets",
    capFleetsDesc: "Dedicated vehicles assigned to your programme for the full contract term.",
    capCoverageTitle: "National coverage",
    capCoverageDesc: "Offices in 8 cities with the reach to operate in every province.",
    capHseTitle: "HSE compliance",
    capHseDesc: "Journey management, documented inspections and incident reporting.",
    capInsuredTitle: "Insured & tracked",
    capInsuredDesc: "Every vehicle GPS-tracked and comprehensively insured.",
    capDriversTitle: "Vetted drivers",
    capDriversDesc: "Background-checked, defensively-trained chauffeurs with route inductions.",
    capBackupTitle: "Provincial backup",
    capBackupDesc: "Standby vehicles so your operations never stop.",
    sectorEyebrow: "Sector experience",
    sectorTitle: "We know your industry",
    sectorDesc: "Purpose-built pages for every sector we serve — capability, fleet and references.",
    procurementPrefix: "Procurement officer? Read the full",
    procurementLink: "Safety & Security protocol",
    procurementSuffix: "our contracts are built on.",
    credentialsEyebrow: "Registered & compliant",
    credentialsTitle: "Our credentials",
    clientsEyebrow: "Trusted by",
    clientsTitle: "Organizations we serve",
    clientsDesc:
      "A track record built with the institutions that set the highest bar for safety and reliability.",
    referencesEyebrow: "References",
    referencesTitle: "What our clients say",
    proposalEyebrow: "Get started",
    proposalTitle: "Request a proposal",
    proposalDesc:
      "Tell us what you need. We'll come back within one business day with a tailored proposal.",
  },

  clientSector: {
    "un-donor": "UN Agencies & Donors",
    ngo: "NGOs & INGOs",
    "telecom-corporate": "Telecom & Corporate",
    government: "Government",
    hospitality: "Hospitality",
  },

  selfDrive: {
    eyebrow: "Drive yourself",
    title: "Self-drive rental",
    description:
      "The keys are yours — with a process that's transparent from pickup to return. Documents verified in person, a joint inspection that protects both sides, and 24/7 support on the road.",
    metaTitle: "Self-Drive Car Rental — How It Works",
    metaDescription:
      "Rent a car and drive yourself. Documents verified at pickup (nothing uploaded online), a joint handover inspection that protects you too, transparent terms and 24/7 support.",
    notFound: "Not found",
    breadcrumb: "Self-drive",
    step1Title: "1 · Verify",
    step1Text:
      "Bring your original CNIC (or passport) and a valid driving licence to pickup. We verify them in person and you sign the rental agreement — nothing is uploaded online, ever.",
    step2Title: "2 · Joint handover inspection",
    step2Text:
      "Together we walk around the car: condition, fuel, mileage and any existing damage — photographed and recorded with your signature. It protects you as much as us.",
    step3Title: "3 · Drive",
    step3Text:
      "The car is yours within the agreed use and area. Keep it locked and secure when parked, and our 24/7 helpline rides with you for breakdowns or questions.",
    step4Title: "4 · Return",
    step4Text:
      "A joint return inspection against the handover record — fuel, mileage, condition. Anything new is assessed transparently per the agreement, and your deposit is released.",
    protocolPrefix: "The full self-drive protocol is published on our",
    protocolLink: "Safety & Security page",
    whatToBring: "What to bring",
    permittedUse: "Permitted use",
    notPermitted: "Not permitted",
    req1: "Original CNIC, or passport for foreign nationals",
    req2: "Valid driving licence (held for at least 2 years recommended)",
    req3: "Security deposit — amount confirmed at booking per vehicle",
    req4: "Minimum age 21; named additional drivers verified the same way",
    req5: "A few minutes at pickup and return for the joint inspections",
    perm1: "Drive within the agreed geographical area",
    perm2: "Named, verified drivers behind the wheel",
    perm3: "Normal private and business travel",
    perm4: "Keep the vehicle locked and parked securely",
    proh1: "Unauthorized or unverified drivers",
    proh2: "Racing, contests, towing or any illegal use",
    proh3: "Out-of-area travel without written approval",
    proh4: "Alcohol or intoxicants — zero tolerance",
    vehiclesTitle: "Self-drive vehicles",
    vehiclesDesc:
      "Selected economy cars and sedans. Rates marked \u201Con request\u201D are confirmed when we call.",
    allEligible: "All eligible vehicles",
    noneYet: "Eligible vehicles are being finalised — call us and we'll arrange one.",
    ctaTitle: "Ready for the keys?",
    ctaBody:
      "Book online in minutes — our team confirms the car, the deposit and your pickup time by phone.",
    ctaBook: "Book self-drive",
    ctaTalk: "Talk to us first",
  },

  serviceDetail: {
    notFound: "Service not found",
    ctaTitle: "Ready to move?",
    ctaCorporate: "Request a tailored proposal for your organization.",
    ctaIndividual: "Choose a vehicle, or ask us to plan it for you.",
    requestProposal: "Request a proposal",
    askUs: "Ask us",
    industriesServed: "Industries we serve with this",
    vehiclesForService: "Vehicles for this service",
    allServices: "All services",
  },

  industryDetail: {
    notFound: "Industry not found",
    heroTitle: "Transport for {name}",
    relevantServices: "Relevant services",
    fleetFor: "Fleet for {name}",
    trustedInSector: "Trusted in this sector",
    planTitle: "Let's plan your {name} transport",
    planBody:
      "Tell us your requirement and we'll respond within one business day with a tailored proposal and references from this sector.",
    allIndustries: "All industries",
    requestProposal: "Request a proposal",
    readSafety: "Read our safety protocol",
  },

  book: {
    eyebrow: "Reserve your ride",
    title: "Book a vehicle",
    description:
      "A few quick steps. No payment now — our team calls to confirm availability and the final quote.",
    metaTitle: "Book a Vehicle",
    metaDescription:
      "Book a chauffeur-driven vehicle — or a self-drive rental where available — in a few simple steps. Our team confirms every request by phone or WhatsApp.",
    breadcrumb: "Book",
    empty: "Our fleet is being updated. Please call or WhatsApp us to book.",
  },

  wizard: {
    stepService: "Service",
    stepVehicle: "Vehicle",
    stepDates: "Dates",
    stepDetails: "Details",
    reviewSubmit: "Review & submit",
    stepReview: "Review",
    preferToTalk: "Prefer to talk?",
    callUs: "Call us",
    whatsappMessage: "Hello, I'd like to book a vehicle.",
    modeQuestion: "How would you like to travel?",
    chauffeurTitle: "With chauffeur",
    chauffeurDesc:
      "A professional driver takes care of the road. Our classic service — every vehicle in the fleet.",
    selfDriveTitle: "Self-drive",
    selfDriveDesc:
      "Drive yourself. Documents verified at pickup, joint handover inspection, deposit applies.",
    newToSelfDrive: "New to self-drive? Read",
    howItWorks: "how it works",
    twoMinuteRead: "— 2-minute read.",
    chooseVehicle: "Choose a vehicle",
    selfDriveEligible: " (self-drive eligible)",
    searchFleet: "Search the fleet…",
    ratesOnRequest: "Rates on request",
    noVehiclesMatch: "No {mode}vehicles match your search.",
    selfDrivePrefix: "self-drive ",
    datesTitle: "Dates & pickup",
    rateType: "Rate type",
    pickupCity: "Pick-up city",
    startDate: "Start date",
    endDate: "End date (optional)",
    detailsTitle: "Your details",
    fullName: "Full name",
    emailOptional: "Email (optional)",
    notesOptional: "Notes (optional)",
    notesPlaceholder: "Flight number, special requests…",
    rowService: "Service",
    rowVehicle: "Vehicle",
    rowRateType: "Rate type",
    rowPickup: "Pick-up",
    rowStart: "Start",
    rowEnd: "End",
    rowName: "Name",
    rowPhone: "Phone",
    indicativeFare: "Indicative fare",
    selfDriveReqTitle: "Self-drive requirements at pickup",
    selfDriveReq1: "Original CNIC (or passport) and valid driving licence — shown in person",
    selfDriveReq2Prefix: "Security deposit",
    selfDriveReq2Amount: "of {amount}",
    selfDriveReq2Unknown: "(confirmed at booking)",
    selfDriveReq3: "A joint handover inspection before you drive, and again at return",
    consent:
      "I understand my original CNIC/passport and driving licence will be verified at pickup and a joint vehicle inspection will be conducted.",
    indicativeNote:
      "Indicative only, excludes GST. Our team will call to confirm availability and the final quote{extra}.",
    indicativeExtraSelfDrive: ", deposit and pickup time",
    back: "Back",
    continue: "Continue",
    submitting: "Submitting…",
    submitBooking: "Submit booking request",
  },

  confirmation: {
    bookingReceived: "Booking request received",
    bookingMessage:
      "Thank you! Your request is in. Our team will call to confirm availability, timing and the final quote — usually within a couple of hours.",
    bookingMessageSelfDrive:
      "Thank you! Your self-drive request is in. Our team will call to confirm the car, the deposit and your pickup time.",
    proposalReceived: "Proposal request received",
    proposalMessage:
      "Thank you. Our corporate team will review your requirements and respond within one business day with a tailored proposal.",
    messageReceived: "Message received",
    messageMessage:
      "Thanks for reaching out. Our team will get back to you within one business day.",
    yourReference: "Your reference",
    followUpMessage: "Hello, I'd like to follow up on my request {reference}.",
    preparedPrefix: "We've prepared your booking details for WhatsApp.",
    tapSend: "Tap send in WhatsApp to reach our team instantly.",
    sendOnWhatsApp: "Send my booking details on WhatsApp",
    preferTalkShort: "Prefer to talk instead?",
    preferTalkLong: "Prefer to talk now? Reach us directly — quote your reference number.",
    callUs: "Call us",
    bringTitle: "What to bring to pickup",
    bringCnic: "Your original CNIC (or passport for foreign nationals)",
    bringLicence: "Your valid driving licence",
    bringDeposit: "The security deposit (amount confirmed on our call)",
    bringInspection: "A few minutes for the joint handover inspection — it protects you too",
    popupBlocked:
      "Your browser blocked the WhatsApp window. Use the WhatsApp button below to send your booking details.",
  },

  misc: {
    downloadPdf: "Download as PDF",
  },

  notFound: {
    code: "404",
    title: "Page not found",
    body: "The page you're looking for doesn't exist or may have moved. Let's get you back on the road.",
  },
};

/**
 * The shape every other dictionary must satisfy.
 *
 * Note there is no `as const` above: it would infer each value as its own
 * literal type, and `satisfies Dictionary` in ur.ts would then demand the Urdu
 * string be character-for-character the English one. Widening to `string` is
 * what makes the constraint about *keys*, which is the point.
 */
export type Dictionary = typeof en;
