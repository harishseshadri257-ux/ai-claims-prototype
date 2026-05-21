export type ClaimState =
  | 'NEW'
  | 'ASSESSING'
  | 'ESTIMATE_GENERATED'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED';

export type DamageLabel = {
  id: string;
  part: string;
  severity: 'Minor' | 'Moderate' | 'Severe';
  confidence: number;
  status: 'PENDING' | 'APPROVED' | 'ADJUSTED' | 'OVERRIDDEN';
  boundingBox: { x: number; y: number; width: number; height: number };
  traceData: { boundingBoxId: string; model: string; dataset: string };
  agentNotes?: string;
};

export type CostLineItem = {
  id: string;
  part: string;
  description: string;
  cost: number;
  source: string;
  sourceDetail: string;
  labourHours: number;
  labourRate: number;
  labourSource: string;
  labourSourceDetail: string;
  status: 'PENDING' | 'APPROVED' | 'ADJUSTED';
};

export type Claim = {
  id: string;
  policyHolder: string;
  policyNumber: string;
  policyStatus: 'ACTIVE' | 'EXPIRED';
  coverageType: string;
  incidentDate: string;
  incidentType: 'Single Vehicle' | 'Two Party';
  liableParty: 'Policyholder' | 'Third Party' | 'Disputed';
  policeReport: boolean;
  driverLicenseVerified: boolean;
  state: ClaimState;
  imageUrl: string;
  damageLabels: DamageLabel[];
  costLineItems: CostLineItem[];
  totalEstimate: number;
  totalLoss: boolean;
  submittedAt: string;
  adjusterNotes: string;
};

function makeDamageLabels(status: DamageLabel['status']): DamageLabel[] {
  return [
    {
      id: 'dl-001',
      part: 'Front Left Fender',
      severity: 'Severe',
      confidence: 92,
      status,
      boundingBox: { x: 28, y: 28, width: 22, height: 18 },
      traceData: { boundingBoxId: 'BB-001', model: 'DamageNet-v2', dataset: 'Sedan Front Impact Dataset v2' },
    },
    {
      id: 'dl-002',
      part: 'Left Headlight',
      severity: 'Severe',
      confidence: 87,
      status,
      boundingBox: { x: 28, y: 46, width: 18, height: 20 },
      traceData: { boundingBoxId: 'BB-002', model: 'DamageNet-v2', dataset: 'Sedan Front Impact Dataset v2' },
    },
    {
      id: 'dl-003',
      part: 'Front Bumper',
      severity: 'Moderate',
      confidence: 76,
      status,
      boundingBox: { x: 30, y: 66, width: 20, height: 16 },
      traceData: { boundingBoxId: 'BB-003', model: 'DamageNet-v2', dataset: 'Sedan Front Impact Dataset v2' },
    },
  ];
}

// Parts total: $2,470 | Labour total: $617.50 | Grand total: $3,087.50
function makeCostLineItems(status: CostLineItem['status']): CostLineItem[] {
  return [
    {
      id: 'cli-001',
      part: 'Front Left Fender',
      description: 'Full replacement',
      cost: 1200,
      source: 'Repair Cost DB',
      sourceDetail: 'Mitchell RepairDB v4.2 — Part #VW-FLF-2019',
      labourHours: 3.5,
      labourRate: 95,
      labourSource: 'Labour Rate DB',
      labourSourceDetail: 'Standard Labour Rate DB v2.1 — Body Panel Replacement, Zone 2',
      status,
    },
    {
      id: 'cli-002',
      part: 'Left Headlight',
      description: 'Full replacement',
      cost: 420,
      source: 'Repair Cost DB',
      sourceDetail: 'Mitchell RepairDB v4.2 — Part #VW-LHL-2019',
      labourHours: 1.0,
      labourRate: 95,
      labourSource: 'Labour Rate DB',
      labourSourceDetail: 'Standard Labour Rate DB v2.1 — Headlight Assembly Replacement',
      status,
    },
    {
      id: 'cli-003',
      part: 'Front Bumper',
      description: 'Repair and repaint',
      cost: 850,
      source: 'Historical Claim #4821',
      sourceDetail: 'Claim #4821 — VW Tiguan 2019, settled 2024-11-12, amount $880',
      labourHours: 2.0,
      labourRate: 95,
      labourSource: 'Labour Rate DB',
      labourSourceDetail: 'Standard Labour Rate DB v2.1 — Bumper Repair and Repaint',
      status,
    },
  ];
}

export const mockClaims: Claim[] = [
  {
    id: 'CLM-2025-001',
    policyHolder: 'James Thornton',
    policyNumber: 'POL-884821',
    policyStatus: 'ACTIVE',
    coverageType: 'Comprehensive',
    incidentDate: '2025-05-18',
    incidentType: 'Two Party',
    liableParty: 'Third Party',
    policeReport: true,
    driverLicenseVerified: true,
    state: 'ASSESSING',
    imageUrl: '/images/car-damage.jpg',
    damageLabels: makeDamageLabels('PENDING'),
    costLineItems: makeCostLineItems('PENDING'),
    totalEstimate: 3087.50,
    totalLoss: false,
    submittedAt: '2025-05-18T09:15:00Z',
    adjusterNotes: '',
  },
  {
    id: 'CLM-2025-002',
    policyHolder: 'Sarah Mitchell',
    policyNumber: 'POL-221943',
    policyStatus: 'ACTIVE',
    coverageType: 'Third Party',
    incidentDate: '2025-05-17',
    incidentType: 'Single Vehicle',
    liableParty: 'Policyholder',
    policeReport: false,
    driverLicenseVerified: true,
    state: 'NEW',
    imageUrl: '/images/car-damage.jpg',
    damageLabels: makeDamageLabels('PENDING'),
    costLineItems: makeCostLineItems('PENDING'),
    totalEstimate: 3087.50,
    totalLoss: false,
    submittedAt: '2025-05-17T14:30:00Z',
    adjusterNotes: '',
  },
  {
    id: 'CLM-2025-003',
    policyHolder: 'David Okafor',
    policyNumber: 'POL-559302',
    policyStatus: 'ACTIVE',
    coverageType: 'Comprehensive',
    incidentDate: '2025-05-15',
    incidentType: 'Two Party',
    liableParty: 'Disputed',
    policeReport: true,
    driverLicenseVerified: true,
    state: 'PENDING_APPROVAL',
    imageUrl: '/images/car-damage.jpg',
    damageLabels: makeDamageLabels('APPROVED'),
    costLineItems: makeCostLineItems('APPROVED'),
    totalEstimate: 3087.50,
    totalLoss: false,
    submittedAt: '2025-05-15T11:45:00Z',
    adjusterNotes: '',
  },
  {
    id: 'CLM-2025-004',
    policyHolder: 'Priya Nair',
    policyNumber: 'POL-774510',
    policyStatus: 'ACTIVE',
    coverageType: 'Comprehensive',
    incidentDate: '2025-05-12',
    incidentType: 'Two Party',
    liableParty: 'Third Party',
    policeReport: true,
    driverLicenseVerified: true,
    state: 'APPROVED',
    imageUrl: '/images/car-damage.jpg',
    damageLabels: makeDamageLabels('APPROVED'),
    costLineItems: makeCostLineItems('APPROVED'),
    totalEstimate: 3087.50,
    totalLoss: false,
    submittedAt: '2025-05-12T08:20:00Z',
    adjusterNotes: '',
  },
];
