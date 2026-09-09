import { MasterCostItem, Project, Vendor, WeeklyProgressPoint, ScheduleItem, InteriorProject, InteriorSpecification } from '../types';

export const INITIAL_INTERIOR_SPEC_DB: InteriorSpecification[] = [
  { id: "spc-1", category: "Base Material", name: "Base Plywood BBCC - UTY OP", baseCost: 750000, unit: "set", notes: "Standard inner paneling" },
  { id: "spc-2", category: "Base Material", name: "Base HMR Panel", baseCost: 300000, unit: "m2", notes: "Moisture resistant" },
  { id: "spc-3", category: "Finishing Material", name: "Interior Fin. HPL ex. Taco", baseCost: 250000, unit: "m2", notes: "Standard finish" },
  { id: "spc-4", category: "Finishing Material", name: "Exterior Fin. Duco", baseCost: 450000, unit: "m2", notes: "Premium finish" },
  { id: "spc-5", category: "Hardware", name: "Tandem Box ex. BLUM NL=500mm", baseCost: 850000, unit: "Unit", notes: "Premium hardware" }
];

export const INITIAL_INTERIOR_PROJECTS: InteriorProject[] = [
  {
    id: "iprj-001",
    projectCode: "IPRJ-2026-001",
    name: "Paramount Hill Project",
    description: "Desain interior custom residential & living room",
    ownerName: "Mr. Budi",
    location: "BSD City, Tangerang",
    status: "On Tender",
    createdAt: "2026-09-08",
    requirements: {
      landArea: 250,
      buildingArea: 180,
      floorsCount: 2,
      ceilingHeight: 3.2,
      designStyle: 'Modern Minimalist',
      finishingGrade: 'Deluxe (Medium)',
      scopeOfWork: ['Interior Fit-Out', 'Custom Furniture']
    },
    grandTotal: 18090921,
    revisions: [
      {
        id: "rev-1",
        name: "Rev.01",
        date: "2026-09-08",
        version: 1,
        isDraft: true,
        usePpn: false,
        grandTotal: 18090921,
        sections: [
          {
            id: "sec-1",
            sectionName: "PRELIMINARIES",
            profitMarginPercent: 0,
            items: [
              {
                id: "itm-1",
                description: "Pek Persiapan & Pembersihan Lokasi",
                unit: "ls",
                qty: 1,
                specs: [
                  { id: "spc-1", specName: "Kebersihan Lokasi Kerja, Proteksi", length_l: 0, width_w: 0, height_h: 0, factor: 1, model: "", baseCostUnitPrice: 1000000 }
                ]
              }
            ]
          },
          {
            id: "sec-2",
            sectionName: "INTERIOR WORK",
            profitMarginPercent: 33,
            items: [
              {
                id: "itm-2",
                description: "Bawah Tangga Service & Cabinet Panel",
                unit: "set",
                qty: 1,
                specs: [
                  { id: "spc-2", specName: "Base Plywood BBCC - UTY OP", length_l: 1.6, width_w: 0, height_h: 1.7, factor: 1, model: "", baseCostUnitPrice: 750000 }
                ]
              }
            ]
          }
        ]
      },
      {
        id: "rev-2",
        name: "Rev.02",
        date: "2026-09-08",
        version: 2,
        isDraft: true,
        usePpn: true,
        contingencyPercent: 3,
        overheadProfitPercent: 5,
        grandTotal: 21545000,
        sections: [
          {
            id: "sec-1",
            sectionName: "PRELIMINARIES",
            profitMarginPercent: 0,
            items: [
              {
                id: "itm-1",
                description: "Pek Persiapan & Pembersihan Lokasi",
                unit: "ls",
                qty: 1,
                specs: [
                  { id: "spc-1", specName: "Kebersihan Lokasi Kerja, Proteksi", length_l: 0, width_w: 0, height_h: 0, factor: 1, model: "", baseCostUnitPrice: 1000000 }
                ]
              }
            ]
          },
          {
            id: "sec-2",
            sectionName: "INTERIOR WORK",
            profitMarginPercent: 35,
            items: [
              {
                id: "itm-2",
                description: "Bawah Tangga Service & Cabinet Panel (Custom Finish)",
                unit: "set",
                qty: 1,
                specs: [
                  { id: "spc-2", specName: "Base Plywood BBCC - UTY OP Finishing HPL Taco", length_l: 1.8, width_w: 0, height_h: 1.7, factor: 1, model: "", baseCostUnitPrice: 850000 }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
];

export const INITIAL_CATEGORIES = [
  'Preparatory Works',
  'Earthworks & Foundations',
  'Structural Works',
  'Wall & Partition Works',
  'Doors & Windows',
  'Ceilings & Partitions',
  'Wall Finishes',
  'Flooring & Floor Finishes',
  'Roofing & Waterproofing',
  'Plumbing & Sanitary',
  'Mechanical & Electrical (M&E)',
  'Painting & Coatings',
  'Interior Fit-Out',
  'Exterior & Landscape'
];

export const INITIAL_CATEGORY_MARGINS = {
  'Structural Works': 10,
  'Wall Finishes': 10,
  'Flooring & Floor Finishes': 15,
  'Ceilings & Partitions': 15,
  'Doors & Windows': 15,
  'Painting & Coatings': 15,
  'Interior Fit-Out': 25,
  'Mechanical & Electrical (M&E)': 20
};

export const INITIAL_MASTER_DATABASE: MasterCostItem[] = [
  // 1. Persiapan & Struktur
  {
    id: 'mst-001',
    itemCode: 'AHS-STR-01',
    itemName: 'Pondasi Batu Kali 1:4',
    category: 'Structural Works',
    specifications: [
      {
        id: 'spec-1',
        specName: 'Batu belah 15/20cm, semen PC type 1, pasir pasang ayak kasar, adukan 1:4 SNI 2835:2008',
        unit: 'm3',
        materialCost: 785000,
        laborCost: 285000,
        equipmentCost: 25000,
        unitPrice: 1095000
      }
    ],
    ahsCode: 'SNI 2835:2008-6.1',
    ahsDescription: 'Batu belah 1.2 m3, Semen PC 163 kg, Pasir pasang 0.52 m3, Mandor, Tukang, Pekerja.',
    updatedAt: '2025-01-15'
  },
  {
    id: 'mst-002',
    itemCode: 'AHS-STR-02',
    itemName: 'Beton Bertulang Kolom & Balok K-250 (Ready-Mix + Besi 120kg/m3)',
    category: 'Structural Works',
    specifications: [
      {
        id: 'spec-1',
        specName: 'Beton Ready-Mix mutu K-250 slump 12±2cm, besi ulir BJTD-40 120kg/m3, bekisting multiplek 12mm',
        unit: 'm3',
        materialCost: 3850000,
        laborCost: 1150000,
        equipmentCost: 280000,
        unitPrice: 5280000
      }
    ],
    ahsCode: 'SNI 7394:2008-6.3',
    ahsDescription: 'Beton ready-mix K-250, Besi ulir BJTD-40, Kawat beton, Bekisting multiplek 12mm & kayu dolken.',
    updatedAt: '2025-01-20'
  },
  {
    id: 'mst-003',
    itemCode: 'AHS-STR-03',
    itemName: 'Pekerjaan Rangka Atap Baja Ringan C75.75 + Reng',
    category: 'Structural Works',
    specifications: [
      {
        id: 'spec-1',
        specName: 'Kanal C75 ketebalan 0.75mm Zincalume G550, reng 0.45mm, dynabolt 12x100mm, screw self-drilling',
        unit: 'm2',
        materialCost: 165000,
        laborCost: 45000,
        equipmentCost: 15000,
        unitPrice: 225000
      }
    ],
    ahsCode: 'AHS-BJR-01',
    ahsDescription: 'Canal C75 tebal 0.75mm zinc-aluminium, Reng 0.45mm, Dynabolt, Self drilling screw.',
    updatedAt: '2025-02-01'
  },

  // 2. Dinding & Plesteran
  {
    id: 'mst-004',
    itemCode: 'AHS-DND-01',
    itemName: 'Pasangan Dinding Bata Ringan (Hebel) t=10cm + Mortar Perekat',
    category: 'Wall Finishes',
    specifications: [
      {
        id: 'spec-1',
        specName: 'Bata ringan AAC presisi 10x20x60cm Grade A, semen instan thin-bed mortar MU-380 / semen mortar 4kg/m2',
        unit: 'm2',
        materialCost: 98000,
        laborCost: 38000,
        equipmentCost: 4000,
        unitPrice: 140000
      }
    ],
    ahsCode: 'SNI-HBL-10',
    ahsDescription: 'Bata ringan kualitas AAC 10x20x60, Thinbed mortar perekat 4kg/m2.',
    updatedAt: '2025-01-22'
  },
  {
    id: 'mst-005',
    itemCode: 'AHS-DND-02',
    itemName: 'Plesteran + Acian Dinding Semen Mortar Halus',
    category: 'Wall Finishes',
    specifications: [
      {
        id: 'spec-1',
        specName: 'Plesteran semen instan t=15mm MU-301, acian skimcoat putih MU-200 bebas retak rambut',
        unit: 'm2',
        materialCost: 48000,
        laborCost: 42000,
        equipmentCost: 3000,
        unitPrice: 93000
      }
    ],
    ahsCode: 'SNI 2837:2008',
    ahsDescription: 'Mortar plester siap pakai t=15mm, Semen acian skim coat finish halus tanpa retak rambut.',
    updatedAt: '2025-02-10'
  },

  // 3. Lantai & Dinding Keramik
  {
    id: 'mst-006',
    itemCode: 'AHS-LNT-01',
    itemName: 'Pasangan Lantai Homogeneous Tile (Granit) 60x60 cm Polished',
    category: 'Flooring & Floor Finishes',
    specifications: [
      {
        id: 'spec-1',
        specName: 'Granite tile glazed polished 60x60 Grade 1 (Roman/Indogress), mortar adhesive MU-400, nat epoxy waterproof',
        unit: 'm2',
        materialCost: 225000,
        laborCost: 65000,
        equipmentCost: 10000,
        unitPrice: 300000
      }
    ],
    ahsCode: 'SNI 7395:2008-6.35',
    ahsDescription: 'Granite tile glazed polished Grade 1, Mortar adhesive tile, Tile spacer, Pengisi nat epoksi waterproof.',
    updatedAt: '2025-01-28'
  },
  {
    id: 'mst-007',
    itemCode: 'AHS-LNT-02',
    itemName: 'Pasangan Lantai SPC Flooring 5mm + Underlayer Foam (Wood Grain)',
    category: 'Flooring & Floor Finishes',
    specifications: [
      {
        id: 'spec-1',
        specName: 'SPC rigid core 5mm (wear layer 0.3mm UV coating), underlayer foam IXPE 1.5mm acoustic dampener, plint PVC 8cm',
        unit: 'm2',
        materialCost: 195000,
        laborCost: 40000,
        equipmentCost: 5000,
        unitPrice: 240000
      }
    ],
    ahsCode: 'INT-SPC-01',
    ahsDescription: 'SPC Core anti-rayap anti-air ketebalan 5mm wear layer 0.3mm, IXPE acoustic foam.',
    updatedAt: '2025-02-12'
  },

  // 4. Plafond & Partisi
  {
    id: 'mst-008',
    itemCode: 'AHS-PLF-01',
    itemName: 'Plafond Gypsum Board 9mm Rangka Hollow Galvanis 40x40/20x40',
    category: 'Ceilings & Partitions',
    specifications: [
      {
        id: 'spec-1',
        specName: 'Gypsum Jayaboard 9mm flush joint, rangka hollow galvanis tebal 0.35mm grid 60x60cm, rod penggantung M6',
        unit: 'm2',
        materialCost: 92000,
        laborCost: 48000,
        equipmentCost: 5000,
        unitPrice: 145000
      }
    ],
    ahsCode: 'SNI 2839:2008',
    ahsDescription: 'Gypsum board Jayaboard/Knauf 9mm, Rangka hollow galvanis 0.35mm, Rod gantungan, Compound & cotton tape.',
    updatedAt: '2025-02-05'
  },
  {
    id: 'mst-009',
    itemCode: 'AHS-PLF-02',
    itemName: 'Partisi Gypsum 2 Muka Rangka Metal Stud 75mm + Insulasi Glasswool',
    category: 'Ceilings & Partitions',
    specifications: [
      {
        id: 'spec-1',
        specName: 'Gypsum 9mm 2 sisi, rangka metal stud & track 75mm zincalume tebal 0.5mm, insulasi glasswool 24kg/m3 STC 45dB',
        unit: 'm2',
        materialCost: 175000,
        laborCost: 75000,
        equipmentCost: 10000,
        unitPrice: 260000
      }
    ],
    ahsCode: 'INT-PRT-02',
    ahsDescription: 'Gypsum board 9mm 2 sisi, Metal stud & track zincalume 75mm, Glasswool density 24kg/m3 peredam suara.',
    updatedAt: '2025-02-14'
  },

  // 5. Kusen, Pintu & Jendela
  {
    id: 'mst-010',
    itemCode: 'AHS-KSN-01',
    itemName: 'Kusen & Daun Pintu Kayu Kamper Samarinda Oven + Finishing Melamic',
    category: 'Doors & Windows',
    specifications: [
      {
        id: 'spec-1',
        specName: 'Kusen 6/15 kamper oven kiln dried, daun pintu solid engineering, engsel SUS304 Dekkson 4", lockset mortise',
        unit: 'unit',
        materialCost: 2600000,
        laborCost: 650000,
        equipmentCost: 50000,
        unitPrice: 3300000
      }
    ],
    ahsCode: 'SNI-KSN-03',
    ahsDescription: 'Kusen 6/15 balok kamper oven kiln-dried, Daun pintu panel solid, Engsel stainless Dekkson, Kunci lever set.',
    updatedAt: '2025-01-30'
  },
  {
    id: 'mst-011',
    itemCode: 'AHS-KSN-02',
    itemName: 'Kusen Aluminium 4 Inch Powder Coating + Kaca Polos 8mm Tempered',
    category: 'Doors & Windows',
    specifications: [
      {
        id: 'spec-1',
        specName: 'Aluminium profil 4" YKK/Alexindo powder coating hitam matte, kaca clear tempered 8mm, sealant Dow Corning',
        unit: 'm1',
        materialCost: 210000,
        laborCost: 65000,
        equipmentCost: 15000,
        unitPrice: 290000
      }
    ],
    ahsCode: 'SNI-ALM-04',
    ahsDescription: 'Profil aluminium Alexindo/YKK 4 inch finishing powder coating matte black, Kaca 8mm tempered, Sealant netral.',
    updatedAt: '2025-02-18'
  },

  // 6. Pengecatan
  {
    id: 'mst-012',
    itemCode: 'AHS-CAT-01',
    itemName: 'Pengecatan Dinding Interior Acrylic Premium (Dulux Pentalite / Jotun)',
    category: 'Painting & Coatings',
    specifications: [
      {
        id: 'spec-1',
        specName: 'Sealer alkali resisting primer 1 lapis, finish coat 2-3 lapis cat emulsi Jotun Majestic / Dulux Pentalite matte',
        unit: 'm2',
        materialCost: 28000,
        laborCost: 18000,
        equipmentCost: 2000,
        unitPrice: 48000
      }
    ],
    ahsCode: 'SNI 2837:2008-Cat',
    ahsDescription: 'Alkali primer 1 lapis, Cat finish interior 2-3 lapis matte/eggshell finish, Amplas & masking tape.',
    updatedAt: '2025-02-11'
  },

  // 7. Interior & Custom Furniture
  {
    id: 'mst-013',
    itemCode: 'AHS-INT-01',
    itemName: 'Custom Kitchen Set Bawah: Multiplek 18mm + HPL Taco + Solid Surface Top',
    category: 'Interior Fit-Out',
    specifications: [
      {
        id: 'spec-1',
        specName: 'Bodi multiplek maritim 18mm dalam melaminto putih, luar HPL Taco tekstur kayu, top table solid surface akrilik 12mm',
        unit: 'm1',
        materialCost: 2450000,
        laborCost: 850000,
        equipmentCost: 150000,
        unitPrice: 3450000
      }
    ],
    ahsCode: 'INT-KIT-01',
    ahsDescription: 'Bodi multiplek maritim 18mm lapis melaminto putih dalam, Luar HPL Taco tekstur kayu/solid, Top table solid surface akrilik, Engsel soft-close slow motion.',
    updatedAt: '2025-02-20'
  },
  {
    id: 'mst-014',
    itemCode: 'AHS-INT-02',
    itemName: 'Custom Wardrobe Full Plafon: Multiplek 18mm + Pintu Sliding Kaca Brown Glass',
    category: 'Interior Fit-Out',
    specifications: [
      {
        id: 'spec-1',
        specName: 'Bodi multiplek 18mm HPL linen dalam, pintu sliding frame aluminium slimline bronze, kaca tempered tinted brown 5mm + LED sensor',
        unit: 'm2',
        materialCost: 2200000,
        laborCost: 750000,
        equipmentCost: 150000,
        unitPrice: 3100000
      }
    ],
    ahsCode: 'INT-WRD-02',
    ahsDescription: 'Rangka bodi multiplek 18mm, Pintu sliding frame aluminium slimline bronze, Kaca tempered tinted brown 5mm, Lampu LED strip sensor gerak.',
    updatedAt: '2025-02-22'
  },
  {
    id: 'mst-015',
    itemCode: 'AHS-INT-03',
    itemName: 'Wall Panel Fluted Wood WPC / Akustik Slat Wood + Backlight LED',
    category: 'Interior Fit-Out',
    specifications: [
      {
        id: 'spec-1',
        specName: 'Panel WPC louvre/slat wood finish natural oak, rangka hollow penguat, strip LED 3000K warm white + driver 12V 10A',
        unit: 'm2',
        materialCost: 680000,
        laborCost: 220000,
        equipmentCost: 35000,
        unitPrice: 935000
      }
    ],
    ahsCode: 'INT-WPN-03',
    ahsDescription: 'Panel WPC louvre/slat wood premium natural oak, Rangka hollow penyangga, Driver LED 12V + LED strip warm white 3000K.',
    updatedAt: '2025-02-25'
  },

  // 8. MEP
  {
    id: 'mst-016',
    itemCode: 'AHS-MEP-01',
    itemName: 'Instalasi Titik Lampu Kabel NYM 3x2.5mm + Fitting Downlight LED Philips 9W',
    category: 'Mechanical & Electrical (M&E)',
    specifications: [
      {
        id: 'spec-1',
        specName: 'Kabel NYM 3x2.5mm Supreme dalam pipa conduit PVC clipsal 20mm, saklar Panasonic Wide, downlight recessed LED Philips 9W 4000K',
        unit: 'titik',
        materialCost: 165000,
        laborCost: 85000,
        equipmentCost: 15000,
        unitPrice: 265000
      }
    ],
    ahsCode: 'SNI-ELK-01',
    ahsDescription: 'Kabel NYM 3x2.5mm Supreme/Kabelindo dalam pipa conduit clipsal, Saklar Panasonic Wide Series, Downlight recessed Philips 9W.',
    updatedAt: '2025-02-15'
  },
  {
    id: 'mst-017',
    itemCode: 'AHS-MEP-02',
    itemName: 'Instalasi Titik Stop Kontak Dinding Arde + Pipa Conduit Clipsal',
    category: 'Mechanical & Electrical (M&E)',
    specifications: [
      {
        id: 'spec-1',
        specName: 'Stop kontak arde Panasonic Wide Series, inbow dos metal, kabel NYM 3x2.5mm dalam pipa conduit PVC clipsal',
        unit: 'titik',
        materialCost: 125000,
        laborCost: 70000,
        equipmentCost: 10000,
        unitPrice: 205000
      }
    ],
    ahsCode: 'SNI-ELK-02',
    ahsDescription: 'Stop kontak arde Panasonic, Inbow dos, Pipa conduit 20mm + klem + T-dos.',
    updatedAt: '2025-02-15'
  }
];

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'prj-001',
    projectCode: 'PRJ-2025-001',
    name: 'Renovasi Interior & Fit-Out Penthouse Sudirman',
    description: 'Pekerjaan interior fit-out lengkap, custom built-in furniture, plafon drop ceiling, dan pencahayaan smart architectural untuk unit penthouse 240 m2.',
    ownerName: 'Bpk. Hendra Gunawan & Ibu Stephanie',
    location: 'District 8 Penthouse Tower, SCBD, Jakarta Selatan',
    status: 'On Progress',
    createdAt: '2025-02-01',
    requirements: {
      landArea: 0,
      buildingArea: 240,
      floorsCount: 1,
      ceilingHeight: 3.4,
      designStyle: 'Modern Minimalist',
      structuralSystem: 'Beton Bertulang (Reinforced Concrete)',
      finishingGrade: 'Premium (Luxury / High-End)',
      scopeOfWork: ['Interior Fit-Out', 'MEP'],
      estimatedDurationWeeks: 12
    },
    revisions: [
      {
        id: 'rev-001-1',
        projectId: 'prj-001',
        revisionNumber: 'Rev.01',
        title: 'Initial Tender Submission Draft',
        createdAt: '2025-01-12',
        isLatest: false,
        notes: 'Penawaran awal konsep standar interior',
        itemCount: 5,
        subtotal: 210000000,
        grandTotal: 268107000
      },
      {
        id: 'rev-001-2',
        projectId: 'prj-001',
        revisionNumber: 'Rev.02',
        title: 'Client Value Engineering Revision',
        createdAt: '2025-01-24',
        isLatest: false,
        notes: 'Penyesuaian spesifikasi lantai SPC dan wardrobe master bedroom',
        itemCount: 6,
        subtotal: 225000000,
        grandTotal: 287257500
      },
      {
        id: 'rev-001-3',
        projectId: 'prj-001',
        revisionNumber: 'Rev.03',
        title: 'Contract Approved Final BoQ (Active)',
        createdAt: '2025-02-01',
        isLatest: true,
        notes: 'Disepakati untuk pelaksanaan konstruksi On Progress',
        itemCount: 7,
        subtotal: 236780000,
        grandTotal: 302302046
      }
    ],
    items: [
      {
        id: 'item-1',
        masterItemId: 'mst-007',
        workCategory: 'Flooring & Floor Finishes',
        itemName: 'Pasangan Lantai SPC Flooring 5mm + Underlayer Foam (Wood Grain)',
        specification: 'SPC rigid core 5mm (wear layer 0.3mm UV coating), underlayer foam IXPE 1.5mm acoustic dampener, plint PVC 8cm',
        unit: 'm2',
        volume: 180,
        unitPrice: 240000,
        totalPrice: 43200000,
        notes: 'Area Living Room, Master Bedroom, 2 Guest Bedrooms'
      },
      {
        id: 'item-2',
        masterItemId: 'mst-008',
        workCategory: 'Ceilings & Partitions',
        itemName: 'Plafond Gypsum Board 9mm Rangka Hollow Galvanis 40x40/20x40',
        specification: 'Gypsum Jayaboard 9mm flush joint, rangka hollow galvanis tebal 0.35mm grid 60x60cm, rod penggantung M6',
        unit: 'm2',
        volume: 240,
        unitPrice: 145000,
        totalPrice: 34800000,
        notes: 'Drop ceiling dengan cove lighting LED strip warm white'
      },
      {
        id: 'item-3',
        masterItemId: 'mst-013',
        workCategory: 'Interior Fit-Out',
        itemName: 'Custom Kitchen Set Bawah: Multiplek 18mm + HPL Taco + Solid Surface Top',
        specification: 'Bodi multiplek maritim 18mm dalam melaminto putih, luar HPL Taco tekstur kayu, top table solid surface akrilik 12mm',
        unit: 'm1',
        volume: 8.5,
        unitPrice: 3450000,
        totalPrice: 29325000,
        notes: 'Dry kitchen island + bodi cabinet finishing matte grey'
      },
      {
        id: 'item-4',
        masterItemId: 'mst-014',
        workCategory: 'Interior Fit-Out',
        itemName: 'Custom Wardrobe Full Plafon: Multiplek 18mm + Pintu Sliding Kaca Brown Glass',
        specification: 'Bodi multiplek 18mm HPL linen dalam, pintu sliding frame aluminium slimline bronze, kaca tempered tinted brown 5mm + LED sensor',
        unit: 'm2',
        volume: 18.5,
        unitPrice: 3100000,
        totalPrice: 57350000,
        notes: 'Walk-in closet Master Bedroom'
      },
      {
        id: 'item-5',
        masterItemId: 'mst-015',
        workCategory: 'Interior Fit-Out',
        itemName: 'Wall Panel Fluted Wood WPC / Akustik Slat Wood + Backlight LED',
        specification: 'Panel WPC louvre/slat wood finish natural oak, rangka hollow penguat, strip LED 3000K warm white + driver 12V 10A',
        unit: 'm2',
        volume: 32,
        unitPrice: 935000,
        totalPrice: 29920000,
        notes: 'Foyer entrance & living room TV backdrop'
      },
      {
        id: 'item-6',
        masterItemId: 'mst-012',
        workCategory: 'Painting & Coatings',
        itemName: 'Pengecatan Dinding Interior Acrylic Premium (Dulux Pentalite / Jotun)',
        specification: 'Sealer alkali resisting primer 1 lapis, finish coat 2-3 lapis cat emulsi Jotun Majestic / Dulux Pentalite matte',
        unit: 'm2',
        volume: 520,
        unitPrice: 48000,
        totalPrice: 24960000,
        notes: 'Warna off-white Jotun Majestic True Beauty'
      },
      {
        id: 'item-7',
        masterItemId: 'mst-016',
        workCategory: 'Mechanical & Electrical (M&E)',
        itemName: 'Instalasi Titik Lampu Kabel NYM 3x2.5mm + Fitting Downlight LED Philips 9W',
        specification: 'Kabel NYM 3x2.5mm Supreme dalam pipa conduit PVC clipsal 20mm, saklar Panasonic Wide, downlight recessed LED Philips 9W 4000K',
        unit: 'titik',
        volume: 65,
        unitPrice: 265000,
        totalPrice: 17225000,
        notes: 'Titik pencahayaan arsitektural downlight gimbal'
      }
    ],
    contingencyPercent: 5,
    overheadProfitPercent: 10,
    taxPercent: 11,
    subtotal: 236780000,
    grandTotal: 302302046
  },
  {
    id: 'prj-002',
    projectCode: 'PRJ-2025-002',
    name: 'Pembangunan Rumah Tinggal 2 Lantai Minimalis Modern',
    description: 'Pekerjaan konstruksi struktur beton bertulang, pasangan dinding hebel, finishing lantai granit 60x60, plafond gypsum, atap baja ringan, dan sanitary.',
    ownerName: 'Ibu Dr. Ratna Wulandari, Sp.A',
    location: 'Cluster Greenwich Park, BSD City, Tangerang',
    status: 'Deal',
    createdAt: '2025-01-18',
    requirements: {
      landArea: 200,
      buildingArea: 280,
      floorsCount: 2,
      ceilingHeight: 3.6,
      designStyle: 'Tropical Contemporary',
      structuralSystem: 'Beton Bertulang (Reinforced Concrete)',
      finishingGrade: 'Deluxe (Medium)',
      scopeOfWork: ['Struktur', 'Arsitektur', 'MEP'],
      estimatedDurationWeeks: 24
    },
    revisions: [
      {
        id: 'rev-002-1',
        projectId: 'prj-002',
        revisionNumber: 'Rev.01',
        title: 'Initial Concept & Preliminary BoQ',
        createdAt: '2025-01-05',
        isLatest: false,
        notes: 'Estimasi struktur & dinding awal',
        itemCount: 3,
        subtotal: 480000000,
        grandTotal: 612816000
      },
      {
        id: 'rev-002-2',
        projectId: 'prj-002',
        revisionNumber: 'Rev.02',
        title: 'Deal Contract Agreed BoQ (Latest)',
        createdAt: '2025-01-18',
        isLatest: true,
        notes: 'Final BoQ disetujui untuk SPK & Kontrak Kerja',
        itemCount: 4,
        subtotal: 553115000,
        grandTotal: 706173000
      }
    ],
    items: [
      {
        id: 'item-201',
        masterItemId: 'mst-001',
        workCategory: 'Structural Works',
        itemName: 'Pondasi Batu Kali 1:4',
        specification: 'Batu belah 15/20cm, semen PC type 1, pasir pasang ayak kasar, adukan 1:4 SNI 2835:2008',
        unit: 'm3',
        volume: 45,
        unitPrice: 1095000,
        totalPrice: 49275000
      },
      {
        id: 'item-202',
        masterItemId: 'mst-002',
        workCategory: 'Structural Works',
        itemName: 'Beton Bertulang Kolom & Balok K-250 (Ready-Mix + Besi 120kg/m3)',
        specification: 'Beton Ready-Mix mutu K-250 slump 12±2cm, besi ulir BJTD-40 120kg/m3, bekisting multiplek 12mm',
        unit: 'm3',
        volume: 68,
        unitPrice: 5280000,
        totalPrice: 359040000
      },
      {
        id: 'item-203',
        masterItemId: 'mst-004',
        workCategory: 'Wall Finishes',
        itemName: 'Pasangan Dinding Bata Ringan (Hebel) t=10cm + Mortar Perekat',
        specification: 'Bata ringan AAC presisi 10x20x60cm Grade A, semen instan thin-bed mortar MU-380 / semen mortar 4kg/m2',
        unit: 'm2',
        volume: 520,
        unitPrice: 140000,
        totalPrice: 72800000
      },
      {
        id: 'item-204',
        masterItemId: 'mst-006',
        workCategory: 'Flooring & Floor Finishes',
        itemName: 'Pasangan Lantai Homogeneous Tile (Granit) 60x60 cm Polished',
        specification: 'Granite tile glazed polished 60x60 Grade 1 (Roman/Indogress), mortar adhesive MU-400, nat epoxy waterproof',
        unit: 'm2',
        volume: 240,
        unitPrice: 300000,
        totalPrice: 72000000
      }
    ],
    contingencyPercent: 5,
    overheadProfitPercent: 10,
    taxPercent: 11,
    subtotal: 553115000,
    grandTotal: 706173000
  },
  {
    id: 'prj-003',
    projectCode: 'PRJ-2025-003',
    name: 'Commercial Cafe & Roastery "Kopi Selasar"',
    description: 'Renovasi fit-out ruko 3 lantai menjadi cafe artisanal dengan konsep industrial modern, exposed brick, bar counter konkrit, dan partisi kaca.',
    ownerName: 'PT Selasar Kreasi Prima (Bpk. Adrian)',
    location: 'Jl. Riau No. 42, Citarum, Bandung',
    status: 'On Tender',
    createdAt: '2025-02-10',
    requirements: {
      landArea: 120,
      buildingArea: 210,
      floorsCount: 3,
      ceilingHeight: 3.8,
      designStyle: 'Industrial Chic',
      structuralSystem: 'Baja WF / H-Beam (Structural Steel)',
      finishingGrade: 'Deluxe (Medium)',
      scopeOfWork: ['Arsitektur', 'Interior Fit-Out', 'MEP'],
      estimatedDurationWeeks: 10
    },
    revisions: [
      {
        id: 'rev-003-1',
        projectId: 'prj-003',
        revisionNumber: 'Rev.01',
        title: 'Tender BoQ Proposal (Latest)',
        createdAt: '2025-02-10',
        isLatest: true,
        notes: 'Dokumen penawaran harga tender komersial',
        itemCount: 2,
        subtotal: 30560000,
        grandTotal: 39016992
      }
    ],
    items: [
      {
        id: 'item-301',
        masterItemId: 'mst-011',
        workCategory: 'Doors & Windows',
        itemName: 'Kusen Aluminium 4 Inch Powder Coating + Kaca Polos 8mm Tempered',
        specification: 'Aluminium profil 4" YKK/Alexindo powder coating hitam matte, kaca clear tempered 8mm, sealant Dow Corning',
        unit: 'm1',
        volume: 48,
        unitPrice: 290000,
        totalPrice: 13920000
      },
      {
        id: 'item-302',
        masterItemId: 'mst-009',
        workCategory: 'Ceilings & Partitions',
        itemName: 'Partisi Gypsum 2 Muka Rangka Metal Stud 75mm + Insulasi Glasswool',
        specification: 'Gypsum 9mm 2 sisi, rangka metal stud & track 75mm zincalume tebal 0.5mm, insulasi glasswool 24kg/m3 STC 45dB',
        unit: 'm2',
        volume: 64,
        unitPrice: 260000,
        totalPrice: 16640000
      }
    ],
    contingencyPercent: 5,
    overheadProfitPercent: 10,
    taxPercent: 11,
    subtotal: 30560000,
    grandTotal: 39016992
  },
  {
    id: 'prj-004',
    projectCode: 'PRJ-2024-004',
    name: 'Pembangunan Gedung Kantor PT Triputra Logistics',
    description: 'Proyek kantor operasional 4 lantai struktur baja WF, cladding aluminium composite panel (ACP), curtain wall, dan lift.',
    ownerName: 'PT Triputra Mega Logistik (Bpk. Gunawan)',
    location: 'Kawasan Pergudangan Marunda Center, Bekasi',
    status: 'Retention',
    createdAt: '2024-09-01',
    requirements: {
      landArea: 600,
      buildingArea: 950,
      floorsCount: 4,
      ceilingHeight: 3.5,
      designStyle: 'Modern Minimalist',
      structuralSystem: 'Baja WF / H-Beam (Structural Steel)',
      finishingGrade: 'Deluxe (Medium)',
      scopeOfWork: ['Struktur', 'Arsitektur', 'MEP'],
      estimatedDurationWeeks: 36
    },
    revisions: [
      {
        id: 'rev-004-1',
        projectId: 'prj-004',
        revisionNumber: 'Rev.01',
        title: 'Tender Submission BoQ',
        createdAt: '2024-08-15',
        isLatest: false,
        notes: 'Pengajuan tender awal rekanan',
        itemCount: 8,
        subtotal: 820000000,
        grandTotal: 1046894000
      },
      {
        id: 'rev-004-2',
        projectId: 'prj-004',
        revisionNumber: 'Rev.02',
        title: 'Addendum MEP & Cladding Spec',
        createdAt: '2024-11-20',
        isLatest: false,
        notes: 'Perubahan panel ACP Seven & fire hydrant sprinkler',
        itemCount: 9,
        subtotal: 940000000,
        grandTotal: 1200100000
      },
      {
        id: 'rev-004-3',
        projectId: 'prj-004',
        revisionNumber: 'Rev.03',
        title: 'As-Built Handover BoQ (Latest)',
        createdAt: '2025-01-05',
        isLatest: true,
        notes: 'Masa pemeliharaan (retention 5%) selama 180 hari kalender',
        itemCount: 9,
        subtotal: 980000000,
        grandTotal: 1251166000
      }
    ],
    items: [
      {
        id: 'item-401',
        masterItemId: 'mst-002',
        workCategory: 'Structural Works',
        itemName: 'Beton Bertulang Kolom & Balok K-250 (Ready-Mix + Besi 120kg/m3)',
        specification: 'Beton Ready-Mix K-250, tulangan ulir 120kg/m3, bekisting multiplek 12mm',
        unit: 'm3',
        volume: 120,
        unitPrice: 5280000,
        totalPrice: 633600000
      }
    ],
    contingencyPercent: 5,
    overheadProfitPercent: 10,
    taxPercent: 11,
    subtotal: 980000000,
    grandTotal: 1251166000
  },
  {
    id: 'prj-005',
    projectCode: 'PRJ-2024-005',
    name: 'Renovasi Rumah Kolonial Heritage Menteng',
    description: 'Restorasi arsitektur kolonial, lantai marmer klasik, kusen kayu jati solid, atap sirap genteng keramik, dan landscape taman tropis.',
    ownerName: 'Keluarga Bpk. Sastroamidjojo',
    location: 'Jl. Teuku Umar No. 18, Menteng, Jakarta Pusat',
    status: 'Done',
    createdAt: '2024-06-12',
    requirements: {
      landArea: 450,
      buildingArea: 320,
      floorsCount: 1,
      ceilingHeight: 4.2,
      designStyle: 'Classic Luxury',
      structuralSystem: 'Bata Merah / Hebel Bearing Wall',
      finishingGrade: 'Premium (Luxury / High-End)',
      scopeOfWork: ['Arsitektur', 'Interior Fit-Out', 'Landscape'],
      estimatedDurationWeeks: 20
    },
    revisions: [
      {
        id: 'rev-005-1',
        projectId: 'prj-005',
        revisionNumber: 'Rev.01',
        title: 'Initial Restoration Quotation',
        createdAt: '2024-06-12',
        isLatest: false,
        notes: 'Estimasi awal pemugaran cagar budaya',
        itemCount: 4,
        subtotal: 150000000,
        grandTotal: 191505000
      },
      {
        id: 'rev-005-2',
        projectId: 'prj-005',
        revisionNumber: 'Rev.02',
        title: 'Final Handover BoQ (Done)',
        createdAt: '2024-08-20',
        isLatest: true,
        notes: 'Pekerjaan selesai 100%, BAST ditandatangani',
        itemCount: 5,
        subtotal: 165000000,
        grandTotal: 210655500
      }
    ],
    items: [
      {
        id: 'item-501',
        masterItemId: 'mst-006',
        workCategory: 'Flooring & Floor Finishes',
        itemName: 'Pasangan Lantai Marmer Ujung Pandang 60x60 Polished',
        specification: 'Marmer alam lokal poles kristalisasi, semen putih, nat resin transparan',
        unit: 'm2',
        volume: 180,
        unitPrice: 850000,
        totalPrice: 153000000
      }
    ],
    contingencyPercent: 5,
    overheadProfitPercent: 10,
    taxPercent: 11,
    subtotal: 165000000,
    grandTotal: 210655500
  }
];

export const INITIAL_VENDORS: Vendor[] = [
  {
    id: 'vnd-001',
    name: 'PT Sumber Baja & Hollow Perkasa',
    category: 'Struktur Baja & Rangka Atap',
    contactPerson: 'Agus Setiawan (Sales Manager)',
    phoneNumber: '0812-9844-3210',
    email: 'sales@sumberbajaperkasa.co.id',
    address: 'Kawasan Industri Jababeka Blok C-12, Cikarang, Bekasi',
    catalogFileName: 'Katalog_BajaWF_BajaRingan_2025.pdf',
    catalogFilePath: 'C:\\RAB_Data\\Catalogs\\Vendors\\PT_Sumber_Baja_2025.pdf',
    catalogFileType: 'pdf',
    rating: 4.8,
    notes: 'Distributor resmi baja WF Gunung Garuda & truss Zincalume. Diskon project volume > 50 ton.'
  },
  {
    id: 'vnd-002',
    name: 'CV Citra Interior Woodwork & Multiplek',
    category: 'Custom Furniture & Kayu',
    contactPerson: 'Bambang Triatmojo',
    phoneNumber: '0857-1122-8899',
    email: 'citra.woodwork@gmail.com',
    address: 'Jl. Raya Kranggan No. 88, Jatisampurna, Kota Bekasi',
    catalogFileName: 'Portofolio_HPL_Taco_Sheet_Finish.pdf',
    catalogFilePath: 'C:\\RAB_Data\\Catalogs\\Vendors\\CV_Citra_Interior_HPL.pdf',
    catalogFileType: 'pdf',
    rating: 4.9,
    notes: 'Spesialis kitchen set, wardrobe duco & HPL. Mesin cutting CNC router & edge banding otomatis.'
  },
  {
    id: 'vnd-003',
    name: 'Mitra Keramik & Granit Nusantara',
    category: 'Granit Tile, Marmer & Sanitair',
    contactPerson: 'Linda Wijaya',
    phoneNumber: '0813-4455-6677',
    email: 'linda.wijaya@mitragranit.id',
    address: 'Panglima Polim Raya No. 14A, Kebayoran Baru, Jakarta Selatan',
    catalogFileName: 'PriceList_Granit_60x60_120x60_Glazed.pdf',
    catalogFilePath: 'C:\\RAB_Data\\Catalogs\\Vendors\\Mitra_Granit_Catalogue.pdf',
    catalogFileType: 'pdf',
    rating: 4.7,
    notes: 'Ready stock Roman Granit, Wisma Asri, Niro Granite, Indogress. Melayani potong bevel & skirting.'
  },
  {
    id: 'vnd-004',
    name: 'PT Gyproc Prima Plafond & Insulation',
    category: 'Gypsum, Acoustic & Insulation',
    contactPerson: 'Eko Purnomo',
    phoneNumber: '0819-0505-1212',
    email: 'order@gyprocprima.co.id',
    address: 'Jl. Daan Mogot KM 12 No. 8, Cengkareng, Jakarta Barat',
    catalogFileName: 'Gypsum_Jayaboard_RangkaMetal_Spec.pdf',
    catalogFilePath: 'C:\\RAB_Data\\Catalogs\\Vendors\\Gyproc_Jayaboard_Spec.pdf',
    catalogFileType: 'pdf',
    rating: 4.6,
    notes: 'Jayaboard, Knauf, Armstrong acoustic tile, Glasswool & Rockwool peredam suara bioskop/studio.'
  }
];

export const INITIAL_SCHEDULE_ITEMS: ScheduleItem[] = [
  {
    id: 'sch-01',
    wbsCode: '1.0',
    taskName: 'Pekerjaan Persiapan, Pembongkaran & Proteksi Area',
    category: 'Structural Works',
    weightPercent: 4.5,
    targetProgressPercent: 100,
    actualProgressPercent: 100,
    startDate: '2025-02-01',
    endDate: '2025-02-07',
    status: 'Completed'
  },
  {
    id: 'sch-02',
    wbsCode: '2.0',
    taskName: 'Pekerjaan Partisi Gypsum 2 Sisi & Drop Ceiling Rangka Hollow',
    category: 'Ceilings & Partitions',
    weightPercent: 14.8,
    targetProgressPercent: 100,
    actualProgressPercent: 95,
    startDate: '2025-02-08',
    endDate: '2025-02-21',
    status: 'On Track'
  },
  {
    id: 'sch-03',
    wbsCode: '3.0',
    taskName: 'Instalasi MEP (Kabel Titik Lampu, Stop Kontak, Pemipaan AC)',
    category: 'Mechanical & Electrical (M&E)',
    weightPercent: 12.0,
    targetProgressPercent: 85,
    actualProgressPercent: 80,
    startDate: '2025-02-15',
    endDate: '2025-03-01',
    status: 'On Track'
  },
  {
    id: 'sch-04',
    wbsCode: '4.0',
    taskName: 'Pekerjaan Pemasangan Lantai SPC Wood Flooring & Skirting',
    category: 'Flooring & Floor Finishes',
    weightPercent: 18.2,
    targetProgressPercent: 60,
    actualProgressPercent: 50,
    startDate: '2025-02-22',
    endDate: '2025-03-08',
    status: 'Delayed'
  },
  {
    id: 'sch-05',
    wbsCode: '5.0',
    taskName: 'Painting & Coatings Dinding & Plafond Dasar s/d Finish',
    category: 'Painting & Coatings',
    weightPercent: 10.5,
    targetProgressPercent: 40,
    actualProgressPercent: 35,
    startDate: '2025-03-01',
    endDate: '2025-03-15',
    status: 'On Track'
  },
  {
    id: 'sch-06',
    wbsCode: '6.0',
    taskName: 'Instalasi Custom Furniture (Kitchen Set, Wardrobe, Backdrop TV)',
    category: 'Interior Fit-Out',
    weightPercent: 32.0,
    targetProgressPercent: 20,
    actualProgressPercent: 15,
    startDate: '2025-03-08',
    endDate: '2025-04-05',
    status: 'On Track'
  },
  {
    id: 'sch-07',
    wbsCode: '7.0',
    taskName: 'Testing & Commissioning MEP, Deep Cleaning & Handover',
    category: 'Structural Works',
    weightPercent: 8.0,
    targetProgressPercent: 0,
    actualProgressPercent: 0,
    startDate: '2025-04-06',
    endDate: '2025-04-15',
    status: 'Not Started'
  }
];

export const INITIAL_S_CURVE_DATA: WeeklyProgressPoint[] = [
  { week: 1, label: 'W01', targetCumulative: 4.5, actualCumulative: 4.5 },
  { week: 2, label: 'W02', targetCumulative: 11.2, actualCumulative: 10.8 },
  { week: 3, label: 'W03', targetCumulative: 21.0, actualCumulative: 19.5 },
  { week: 4, label: 'W04', targetCumulative: 34.5, actualCumulative: 31.0 },
  { week: 5, label: 'W05', targetCumulative: 49.0, actualCumulative: 44.5 }, // Current week (Week 5)
  { week: 6, label: 'W06', targetCumulative: 64.0, actualCumulative: null },
  { week: 7, label: 'W07', targetCumulative: 78.5, actualCumulative: null },
  { week: 8, label: 'W08', targetCumulative: 89.0, actualCumulative: null },
  { week: 9, label: 'W09', targetCumulative: 96.0, actualCumulative: null },
  { week: 10, label: 'W10', targetCumulative: 100.0, actualCumulative: null }
];
