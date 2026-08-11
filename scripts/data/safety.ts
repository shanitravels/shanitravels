/**
 * Security protocol as structured content, seeded from the owners' document
 * and lightly edited for web reading. Rendered on /safety in three sections.
 */

type SeedSafetySection = {
  slug: string; category: "chauffeur" | "self-drive" | "general";
  title: string; intro: string; items: string[]; order: number;
};

export const safetySections: SeedSafetySection[] = [
  // --- Chauffeur-driven protocol -------------------------------------------
  {
    slug: "driver-verification", category: "chauffeur", title: "Driver Verification", order: 0,
    intro: "Every chauffeur is verified before their first assignment and re-checked periodically.",
    items: [
      "Valid driving licence verified against the issuing authority",
      "CNIC verified and copied to the personnel file",
      "Police character verification completed before first duty",
      "Employment references checked and recorded",
      "Periodic re-verification of licence validity and record",
    ],
  },
  {
    slug: "vehicle-inspection", category: "chauffeur", title: "Vehicle Inspection", order: 1,
    intro: "A documented pre-trip inspection is filed before every departure.",
    items: [
      "Brakes, tyres, lights, horn, mirrors and wipers checked",
      "Engine oil, coolant and fuel levels confirmed",
      "First aid kit and fire extinguisher present and in date",
      "Spare tyre, jack, wheel spanner and emergency tools on board",
      "GPS tracker and mobile communication device operational",
      "Any failed item logged with a note and resolved before departure",
    ],
  },
  {
    slug: "journey-management", category: "chauffeur", title: "Journey Management", order: 2,
    intro: "Movements are planned and monitored by the 24/7 Operations Control Room.",
    items: [
      "Routes planned before departure, with alternates for long or sensitive movements",
      "GPS tracking monitored throughout the journey",
      "Scheduled check-ins on intercity and field routes",
      "Night-travel and no-go-hour rules enforced where clients require them",
      "Immediate escalation path from driver to operations to client focal point",
    ],
  },
  {
    slug: "driver-conduct", category: "chauffeur", title: "Driver Conduct", order: 3,
    intro: "Professional conduct is a contract condition, not a courtesy.",
    items: [
      "Punctual, presentable and courteous at all times",
      "No smoking in vehicles; phones on hands-free for operations calls only",
      "Speed limits and traffic law observed without exception",
      "Passenger instructions followed within the agreed journey plan",
      "Confidentiality: what is said or seen in the vehicle stays in the vehicle",
    ],
  },
  {
    slug: "passenger-security", category: "chauffeur", title: "Passenger Security", order: 4,
    intro: "Simple habits that keep passengers safe on every trip.",
    items: [
      "Doors locked during travel; windows managed by passenger preference",
      "Identity of waiting passengers confirmed before departure",
      "Luggage loaded and unloaded by the driver, checked before leaving",
      "No unauthorized passengers or unplanned stops",
      "Seatbelts required for all occupants",
    ],
  },
  {
    slug: "emergency-response", category: "chauffeur", title: "Emergency Response", order: 5,
    intro: "When something goes wrong, the response is procedure, not improvisation.",
    items: [
      "Driver secures passengers first, then reports to the Operations Control Room",
      "Breakdowns: replacement vehicle dispatched immediately; passengers never stranded",
      "Accidents: scene safety, medical assistance, police involvement per law, full incident report",
      "Medical emergencies: nearest appropriate facility, client focal point informed en route",
      "All incidents documented with photos and closed with a resolution note",
    ],
  },
  {
    slug: "high-risk-vip", category: "chauffeur", title: "High-Risk & VIP Procedures", order: 6,
    intro: "Elevated-threat and protocol movements run under additional controls.",
    items: [
      "Security-trained drivers with defensive and evasive driving instruction",
      "B-6 armored vehicles available as the fleet standard for protected movement",
      "Route reconnaissance and timing rehearsals for formal protocol movements",
      "Convoy and escort coordination with client security details",
      "Movement details shared on a strict need-to-know basis",
    ],
  },

  // --- Self-drive protocol --------------------------------------------------
  {
    slug: "sd-verification", category: "self-drive", title: "Renter Verification", order: 0,
    intro: "Verification happens in person, at pickup. The site never collects document uploads.",
    items: [
      "Original CNIC (or passport for foreign nationals) presented and verified",
      "Valid driving licence presented and verified — no licence, no handover",
      "Rental agreement and security declaration signed at the counter",
      "Security deposit confirmed per the agreement",
      "Only the verified renter and named additional drivers may drive",
    ],
  },
  {
    slug: "sd-handover", category: "self-drive", title: "Joint Handover Inspection", order: 1,
    intro: "The handover inspection protects the renter as much as the company.",
    items: [
      "Exterior and interior condition inspected jointly with the renter",
      "Fuel level and odometer reading recorded and agreed",
      "Existing damages noted and photographed together before departure",
      "Accessories and tools checklist confirmed (spare tyre, jack, documents)",
      "Renter signs the inspection record and receives the summary",
    ],
  },
  {
    slug: "sd-permitted-use", category: "self-drive", title: "Permitted Use", order: 2,
    intro: "Clear rules, agreed in writing, so there are no surprises at return.",
    items: [
      "Vehicle driven only by the verified renter and named drivers",
      "No racing, contests, towing or any illegal use",
      "Travel limited to the agreed geographical area; written approval required to extend",
      "Vehicle kept locked and parked securely when unattended",
      "Zero tolerance for driving under the influence of alcohol or intoxicants",
    ],
  },
  {
    slug: "sd-emergencies", category: "self-drive", title: "Emergencies on the Road", order: 3,
    intro: "Self-drive renters are backed by the same 24/7 operations room as our chauffeured fleet.",
    items: [
      "24/7 breakdown helpline printed on the agreement and in the vehicle",
      "Accidents reported immediately to the helpline and to police as required by law",
      "Do not admit liability or settle at the scene; the operations room guides next steps",
      "Replacement or recovery arranged per the agreement terms",
    ],
  },
  {
    slug: "sd-return", category: "self-drive", title: "Return & Closure", order: 4,
    intro: "The rental closes the way it opened — jointly, and on the record.",
    items: [
      "Joint return inspection against the handover record",
      "Fuel level and odometer recorded and compared",
      "New damages, if any, assessed transparently per the agreement",
      "Fines or penalties incurred during the rental are the renter's responsibility",
      "Deposit released per the agreement once the inspection closes clean",
    ],
  },

  // --- General requirements -------------------------------------------------
  {
    slug: "zero-tolerance", category: "general", title: "Zero-Tolerance Standards", order: 0,
    intro: "Some rules have no exceptions, for anyone, on any contract.",
    items: [
      "No alcohol or intoxicants — drivers or self-drive renters",
      "No unauthorized use of client vehicles or client information",
      "No cash handling or errands outside the agreed journey plan",
      "Violations end assignments immediately and are reported to the client",
    ],
  },
  {
    slug: "confidentiality", category: "general", title: "Confidentiality", order: 1,
    intro: "Clients discuss business in our vehicles. That fact shapes our contracts.",
    items: [
      "Driver confidentiality is a written condition of employment",
      "Movement details shared on a need-to-know basis only",
      "No photography or disclosure of client activities",
      "Client data handled per the service agreement and never re-used",
    ],
  },
  {
    slug: "maintenance-schedule", category: "general", title: "Maintenance Schedule", order: 2,
    intro: "Reliability is scheduled, not hoped for.",
    items: [
      "Documented preventive maintenance for every vehicle",
      "Service records retained and auditable per vehicle",
      "Tyres, brakes and safety systems replaced on wear thresholds, not failure",
      "Vehicles rotated out of service for scheduled maintenance without client impact",
    ],
  },
  {
    slug: "gps-tracking", category: "general", title: "GPS Tracking", order: 3,
    intro: "Every vehicle reports its position to the Operations Control Room.",
    items: [
      "Fleet-wide GPS tracking, monitored 24/7",
      "Movement history retained for client reporting and investigations",
      "Geo-fencing and route-deviation alerts on managed journeys",
      "Tracking data available to corporate clients under agreement",
    ],
  },
  {
    slug: "periodic-training", category: "general", title: "Periodic Training", order: 4,
    intro: "Standards decay without reinforcement, so training is recurring.",
    items: [
      "Defensive-driving training with periodic refreshers",
      "Client-specific inductions (HSE, safeguarding, protocol) before assignment",
      "First-aid and emergency-response basics for all drivers",
      "Conduct and confidentiality briefings repeated annually",
    ],
  },
  {
    slug: "security-audits", category: "general", title: "Security Audits", order: 5,
    intro: "We audit our own compliance the way our clients audit us.",
    items: [
      "Periodic internal audits of driver files, inspections and incident records",
      "Client audits and site inspections welcomed under agreement",
      "Corrective actions tracked to closure",
      "Protocol reviewed and updated annually",
    ],
  },
];
