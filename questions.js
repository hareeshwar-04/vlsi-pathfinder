/**
 * VLSI Elective Navigator — 15-Question Scenario Data Bank
 * 
 * Questions are framed as problem-solving approaches.
 * Options are shuffled at render time so A/B/C don't
 * always correspond to the same track.
 * 
 * LP options use neutral language to avoid bias.
 * 
 * Track mapping (internal):
 *   "lp" → Low Power Circuits  (22EV354)
 *   "md" → Memory Design       (22EV355)
 *   "dm" → Device Modelling    (22EV356)
 */
export const questions = [
  {
    id: 1,
    title: "Smartwatch Design Challenge",
    scenario: "You're on a team building a next-generation smartwatch. The product lead wants everyone to pick one core problem to own. Which challenge would you want to dig into?",
    options: [
      { key: "lp", text: "Making the watch last 3 days on one charge by finding clever ways to shut down parts of the chip whenever they're not actively needed." },
      { key: "md", text: "Designing the tiny storage cells inside the chip that keep all your health data, apps, and settings safe — even when the battery runs out." },
      { key: "dm", text: "Understanding exactly how the microscopic transistors inside the processor behave when electricity flows through them, so the design doesn't fail at small sizes." }
    ]
  },
  {
    id: 2,
    title: "The Invisible Drain",
    scenario: "Modern chips waste electricity even when idle — like a water tap that drips even when turned off. Your team needs to fix this. How would you approach it?",
    options: [
      { key: "lp", text: "Design 'master switches' that completely cut off supply to idle sections of the chip — like turning off lights in empty rooms of a building." },
      { key: "md", text: "Pick storage cell designs that naturally hold their data without constant power — so idle sections don't need energy just to remember things." },
      { key: "dm", text: "Study why electrons 'leak' through the tiny gates at the atomic level, and build equations that predict exactly how much energy is wasted." }
    ]
  },
  {
    id: 3,
    title: "What Fills Your Workday",
    scenario: "Imagine your typical day as a chip engineer. You get to pick what you spend most of your time doing. Which activity sounds most fulfilling?",
    options: [
      { key: "lp", text: "Writing rules that define when each section of a large chip should turn on, sleep, or wake up — like programming a smart building's schedule." },
      { key: "md", text: "Arranging tiny memory cells in rows and columns and designing the helper circuits that read and write data to them — like organizing a massive automated warehouse." },
      { key: "dm", text: "Running simulations to see how a transistor's electrical behavior changes when you tweak its size, shape, or the voltage applied — like a virtual physics lab." }
    ]
  },
  {
    id: 4,
    title: "Lab Mystery",
    scenario: "A freshly manufactured chip is failing its tests. The team splits up to investigate different leads. Which mystery would you want to crack?",
    options: [
      { key: "lp", text: "Signals got scrambled when passing between two chip sections running at different voltage levels — the 'translator' circuit between them seems broken." },
      { key: "md", text: "Data is randomly getting corrupted because neighboring storage cells are electrically interfering with each other, flipping bits that should stay fixed." },
      { key: "dm", text: "Individual transistors are behaving unpredictably because at their tiny size, the normal rules of how current flows don't apply the same way." }
    ]
  },
  {
    id: 5,
    title: "Factory Upgrade",
    scenario: "The chip factory upgrades from flat 2D transistors to new 3D 'fin-shaped' ones. This changes everything. What aspect would you want to explore first?",
    options: [
      { key: "lp", text: "Using the new structures to create separate zones on the chip — fast ones where speed matters, efficient ones elsewhere — to get the best of both worlds." },
      { key: "md", text: "Figuring out how these smaller 3D transistors let us pack dramatically more storage cells into the same area, so chips can hold way more data." },
      { key: "dm", text: "Building new mathematical models that describe how electricity flows through the 3D fin shape, since the old flat-transistor equations aren't accurate anymore." }
    ]
  },
  {
    id: 6,
    title: "Keeping State During Sleep",
    scenario: "When your phone's screen turns off, the chip enters 'sleep mode' but needs to remember what you were doing. How would you approach this problem?",
    options: [
      { key: "lp", text: "Create small 'always-on' islands on the chip that keep essential info alive on minimal resources, while shutting down everything else completely." },
      { key: "md", text: "Build memory cells that hold data permanently without any power — so even if the battery dies during sleep, nothing is lost when you recharge." },
      { key: "dm", text: "Calculate exactly how fast transistors can switch back on after being asleep, and how their internal electrical charges settle during the wake-up transition." }
    ]
  },
  {
    id: 7,
    title: "Gaming Graphics Engine",
    scenario: "A company is designing a graphics chip for ultra-smooth 4K gaming. Different engineers handle different subsystems. Which part would you volunteer for?",
    options: [
      { key: "lp", text: "Building smart circuits that pause the internal clock signal to unused chip sections during rendering, preventing waste without slowing down the game." },
      { key: "md", text: "Designing the on-chip memory that feeds pixel data to the display — specialized high-bandwidth storage that can handle massive video data streams simultaneously." },
      { key: "dm", text: "Analyzing how transistors handle signals switching billions of times per second, making sure they don't distort or lose data at extreme operating speeds." }
    ]
  },
  {
    id: 8,
    title: "The Voltage Mismatch",
    scenario: "A phone chip has the processor at one voltage, Wi-Fi at another, and the display controller at a third. Signals need to travel between them safely. What's your angle?",
    options: [
      { key: "lp", text: "Design 'voltage translator' circuits that convert signals when they cross between chip sections running at different levels, preventing data corruption." },
      { key: "md", text: "Create delicate sensing circuits that can detect incredibly tiny voltage differences inside memory arrays, correctly distinguishing stored 0s from 1s." },
      { key: "dm", text: "Study how changing the voltage on a transistor's terminals affects the speed and amount of current flowing through it, at the fundamental electron level." }
    ]
  },
  {
    id: 9,
    title: "Quality Before Shipping",
    scenario: "Before shipping millions of chips, they must be tested for manufacturing defects. Which testing problem would you enjoy solving?",
    options: [
      { key: "lp", text: "Making sure the chip's startup and shutdown sequences work perfectly — ensuring it never freezes in a half-on, half-off state during boot or shut-down." },
      { key: "md", text: "Running clever test patterns to catch defective storage cells — ones that are permanently stuck, ones that flip their neighbors, or ones that fail only under specific data patterns." },
      { key: "dm", text: "Measuring the precise voltage-vs-current curves of individual transistors on a real chip and checking if they match what the design simulations predicted." }
    ]
  },
  {
    id: 10,
    title: "Firmware Upgrade Path",
    scenario: "A chip's permanent program storage needs upgrading from write-once memory to rewritable memory so firmware can be updated in the field. Which part interests you?",
    options: [
      { key: "lp", text: "Designing the chip so the firmware block only receives supply during system startup, then shuts down completely to conserve resources during normal operation." },
      { key: "md", text: "Comparing different rewritable storage technologies — understanding which cell design gives the best combination of speed, size, and number of times it can be rewritten." },
      { key: "dm", text: "Understanding the physics of how electrons tunnel through ultra-thin insulating layers to store data — a quantum-level effect that makes rewritable memory possible." }
    ]
  },
  {
    id: 11,
    title: "Your Natural Zoom Level",
    scenario: "Engineers naturally gravitate to different levels of detail. Some see the big picture, others zoom into fine details. Which perspective feels most comfortable?",
    options: [
      { key: "lp", text: "The big picture: deciding which blocks of a large chip share supply lines, when each block sleeps or wakes, and coordinating it all — like managing a city's grid." },
      { key: "md", text: "The mid-level: designing grids of memory cells, the wiring that connects them, and the peripheral circuits that manage data flow — like architecting a high-tech automated library." },
      { key: "dm", text: "The deep dive: working with equations about how charged particles move inside materials — understanding the fundamental science behind how a single transistor works." }
    ]
  },
  {
    id: 12,
    title: "The Overheating Chip",
    scenario: "A chip is running too hot, threatening both performance and long-term reliability. Three approaches are proposed. Which would you champion?",
    options: [
      { key: "lp", text: "Add self-regulating intelligence so the chip automatically reduces its own speed and voltage when it senses rising temperature, then ramps back up when it cools." },
      { key: "md", text: "Focus on the stored data: ensure that heat doesn't cause stored bits to randomly flip inside the memory cells, by choosing heat-resilient storage cell designs." },
      { key: "dm", text: "Model how rising temperature changes the electrical properties of each transistor — predicting exactly how heat degrades current flow and switching speed at the device level." }
    ]
  },
  {
    id: 13,
    title: "AI Chip Startup",
    scenario: "An AI startup is building a custom chip for instant pattern matching. Three critical modules need leads. Which would you take ownership of?",
    options: [
      { key: "lp", text: "The management brain — it decides which AI processing clusters are active, which are asleep, and which are fully off, to keep total consumption under budget." },
      { key: "md", text: "A special memory block that searches all its stored data simultaneously in a single step — instead of checking entries one at a time like normal storage." },
      { key: "dm", text: "The high-speed analog front-end using specialized transistor types tuned for processing fast incoming signals before they're converted to digital data for AI." }
    ]
  },
  {
    id: 14,
    title: "Simulation Before Silicon",
    scenario: "Before spending millions to manufacture a chip, your team simulates everything in software. Which simulation task would you take on?",
    options: [
      { key: "lp", text: "Verifying the startup sequence — making sure different sections activate in the right order and no section receives garbled signals while its neighbors are still booting." },
      { key: "md", text: "Checking that the memory can reliably read and write under worst-case conditions — testing timing margins, noise tolerance, and data integrity across millions of cells." },
      { key: "dm", text: "Validating that the mathematical transistor models accurately predict real-world behavior — especially the weird effects that only appear when devices shrink to a few nanometers." }
    ]
  },
  {
    id: 15,
    title: "Your Dream Role in 5 Years",
    scenario: "Fast-forward 5 years. You've grown into a specialist role that you genuinely love. Which career path sounds most 'you'?",
    options: [
      { key: "lp", text: "You design the master plan for entire chips — deciding which parts sleep, wake, and at what voltages — making products last all day on a single charge." },
      { key: "md", text: "You create the storage building blocks used inside processors and SSDs — designing the tiny cells that reliably hold billions of bits of data." },
      { key: "dm", text: "You build the mathematical models that predict how transistors behave — the essential bridge between semiconductor physics and chip design software." }
    ]
  }
];

/** Elective metadata with codes, colors, icons, and descriptions */
export const electives = {
  lp: {
    name: "Low Power Circuits",
    code: "22EV354",
    color: "#22d3ee",
    colorRgb: "34, 211, 238",
    gradient: "linear-gradient(135deg, #06b6d4, #22d3ee, #67e8f9)",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>`,
    description: "Master how to design chips that use power intelligently — shutting down idle sections, adjusting voltage on the fly, and coordinating power across complex systems to maximize battery life.",
    cssClass: "cyan",
    syllabus: [
      "Power gating & switching strategies",
      "Clock gating & gate-level optimization",
      "Multi-voltage design & level shifters",
      "Dynamic voltage & frequency scaling",
      "State retention & always-on regions",
      "Power intent (UPF) & verification"
    ]
  },
  md: {
    name: "Memory Design",
    code: "22EV355",
    color: "#34d399",
    colorRgb: "52, 211, 153",
    gradient: "linear-gradient(135deg, #10b981, #34d399, #6ee7b7)",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><line x1="4" y1="10" x2="20" y2="10"/><line x1="10" y1="4" x2="10" y2="20"/><line x1="4" y1="16" x2="20" y2="16"/><line x1="16" y1="4" x2="16" y2="20"/></svg>`,
    description: "Learn to design every type of memory used in chips — from fast SRAM and DRAM to permanent Flash storage and parallel-search CAMs. Includes testing strategies to catch defects.",
    cssClass: "emerald",
    syllabus: [
      "SRAM & DRAM cell structures",
      "Flash, EPROM & EEPROM architectures",
      "Content-Addressable Memory (CAM)",
      "Sense amplifiers & peripheral circuits",
      "Memory fault models & testing",
      "Built-In Self-Test (BIST) design"
    ]
  },
  dm: {
    name: "Device Modelling",
    code: "22EV356",
    color: "#c084fc",
    colorRgb: "192, 132, 252",
    gradient: "linear-gradient(135deg, #a855f7, #c084fc, #e9d5ff)",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>`,
    description: "Dive into the physics of transistors — from P-N junctions and BJTs to MOSFETs and FinFETs. Build the mathematical models that chip designers rely on to simulate real devices.",
    cssClass: "purple",
    syllabus: [
      "P-N junction & diode modelling",
      "BJT models & high-frequency behavior",
      "MOSFET characteristics & scaling",
      "Short-channel effects & threshold voltage",
      "FinFET compact models (BSIM)",
      "Carrier mobility & breakdown physics"
    ]
  }
};
