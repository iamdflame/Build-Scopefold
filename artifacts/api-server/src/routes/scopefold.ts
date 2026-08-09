import { Router, type IRouter, type Request } from "express";
import {
  LaunchProjectBody,
  ResolveAmbiguityBody,
  UpdateBrandSettingsBody,
} from "@workspace/api-zod";

type Project = {
  id: string;
  client: { id: string; name: string };
  name: string;
  valueCents: number;
  currency: string;
  lifecycle: string;
  progress: number;
  evidenceCompleteness: number;
  nextEvent: string;
  risk: string;
};

type Evidence = {
  id: string;
  clause: string;
  page: number;
  quote: string;
  classification: string;
  source: string;
  reviewed?: boolean;
};

type Obligation = {
  id: string;
  title: string;
  type: string;
  evidenceId: string;
  status: string;
  amountCents?: number | null;
  dueDate?: string | null;
};

type Operation = {
  id: string;
  title: string;
  type: string;
  status: string;
  sourceEvidenceId: string;
  dueDate?: string | null;
  amountCents?: number | null;
  detail?: string;
};

type Receipt = {
  id: string;
  provider: string;
  mode: string;
  action: string;
  status: string;
  timestamp: string;
  sourceQuote: string;
  page: number;
  externalUrl?: string | null;
  proof: string[];
};

type Ambiguity = {
  id: string;
  question: string;
  quote: string;
  options: { id: string; title: string; summary: string; impact: string }[];
  resolved: string | null;
};

type BrandSettings = {
  agencyName: string;
  brandName: string;
  primaryColor: string;
  evidenceColor: string;
  currency: string;
  clientTerm: string;
  projectTerm: string;
  milestoneTerm: string;
};

const contractText = `NORTHSTAR STUDIO
SERVICES AGREEMENT
Agreement NS-HPC-2026-04

This Services Agreement is entered into by Northstar Studio (“Studio”) and Harbor & Pine Coffee (“Client”).

1. ENGAGEMENT
The Studio will develop a brand strategy, visual identity, and responsive commerce website for the Client. Work begins after receipt of the initial payment and completion of the kickoff workshop.

2. DISCOVERY
The Studio will conduct one kickoff workshop, interview up to four stakeholders, and audit the Client’s existing identity, website, product catalog, and available customer research. Discovery findings will be delivered as a written summary.

3. BRAND STRATEGY
The Studio will prepare a positioning framework, audience definition, customer journey, initial website sitemap, and strategy presentation. The Client must approve the brand strategy before visual identity refinement begins.

4. VISUAL IDENTITY
The Studio will present two visual identity concept directions. Following selection of one direction, the Studio will refine the selected identity and prepare the approved logo suite, typography system, color system, and production asset package.

5. COMMERCE WEBSITE
The Studio will produce responsive wireframes, responsive interface designs, and a commerce implementation for desktop and mobile. The website will include the approved product catalog, product-detail pages, cart, checkout handoff, editorial content modules, and basic analytics instrumentation.

6. CLIENT MATERIALS AND DEPENDENCIES
The Client will provide final product photography, approved product copy, pricing, shipping information, and legal policies by October 16, 2026. Commerce implementation cannot begin until final product photography and approved product copy are received.

7. REVIEW AND APPROVAL
The Client will provide consolidated feedback within three business days of each review. Brand strategy and visual identity require explicit written approval. Silence does not constitute approval.

8. REVISIONS
The Client is entitled to two rounds of revisions during the engagement. Additional revisions or changes outside the approved scope require a written change request and may affect fees and schedule.

9. SCHEDULE
The anticipated schedule is:
Discovery complete: September 4, 2026
Brand strategy approval: September 18, 2026
Visual identity approval: October 9, 2026
Commerce website review: November 13, 2026
Launch and handoff: November 20, 2026

10. FEES AND PAYMENT
The total fee is USD 24,000.
USD 8,000 is due upon signing.
USD 8,000 is due after visual identity approval.
USD 8,000 is due before website launch.

11. LAUNCH AND HANDOFF
After final payment and Client approval, the Studio will coordinate launch, provide one recorded training session, and deliver the final brand and website handoff package.`;

const seedProjects: Project[] = [
  {
    id: "harbor-pine",
    client: { id: "harbor-pine", name: "Harbor & Pine Coffee" },
    name: "Brand Identity and Commerce Website",
    valueCents: 2400000,
    currency: "USD",
    lifecycle: "Ready to fold",
    progress: 18,
    evidenceCompleteness: 94,
    nextEvent: "Resolve revision interpretation",
    risk: "Review required",
  },
  {
    id: "alder-row",
    client: { id: "alder-row", name: "Alder Row Interiors" },
    name: "Digital showroom refresh",
    valueCents: 1250000,
    currency: "USD",
    lifecycle: "Operating",
    progress: 62,
    evidenceCompleteness: 88,
    nextEvent: "Homepage approval",
    risk: "On track",
  },
  {
    id: "meridian-dental",
    client: { id: "meridian-dental", name: "Meridian Dental" },
    name: "Patient experience redesign",
    valueCents: 1800000,
    currency: "USD",
    lifecycle: "In review",
    progress: 41,
    evidenceCompleteness: 79,
    nextEvent: "Strategy decision",
    risk: "Awaiting client",
  },
];

const settings: BrandSettings = {
  agencyName: "Northstar Studio",
  brandName: "Scopefold",
  primaryColor: "#1746D1",
  evidenceColor: "#D7F53F",
  currency: "USD",
  clientTerm: "Client",
  projectTerm: "Engagement",
  milestoneTerm: "Milestone",
};

let ambiguityResolution: string | null = null;
let folded = false;
let receipts: Receipt[] = [];

const evidence: Evidence[] = [
  {
    id: "ev-discovery",
    clause: "02 · DISCOVERY",
    page: 1,
    quote:
      "The Studio will conduct one kickoff workshop, interview up to four stakeholders, and audit the Client’s existing identity, website, product catalog, and available customer research.",
    classification: "Task",
    source: "Deterministic",
    reviewed: true,
  },
  {
    id: "ev-strategy",
    clause: "03 · BRAND STRATEGY",
    page: 1,
    quote:
      "The Client must approve the brand strategy before visual identity refinement begins.",
    classification: "Approval",
    source: "Deterministic",
    reviewed: true,
  },
  {
    id: "ev-identity",
    clause: "04 · VISUAL IDENTITY",
    page: 2,
    quote:
      "The Studio will present two visual identity concept directions. Following selection of one direction, the Studio will refine the selected identity and prepare the approved logo suite, typography system, color system, and production asset package.",
    classification: "Milestone",
    source: "Deterministic",
    reviewed: true,
  },
  {
    id: "ev-dependency",
    clause: "06 · CLIENT MATERIALS AND DEPENDENCIES",
    page: 2,
    quote:
      "Commerce implementation cannot begin until final product photography and approved product copy are received.",
    classification: "Dependency",
    source: "Deterministic",
    reviewed: true,
  },
  {
    id: "ev-revision",
    clause: "08 · REVISIONS",
    page: 2,
    quote:
      "The Client is entitled to two rounds of revisions during the engagement.",
    classification: "Ambiguity",
    source: "Manual review",
    reviewed: true,
  },
  {
    id: "ev-payment",
    clause: "10 · FEES AND PAYMENT",
    page: 3,
    quote:
      "USD 8,000 is due upon signing. USD 8,000 is due after visual identity approval. USD 8,000 is due before website launch.",
    classification: "Payment",
    source: "Deterministic",
    reviewed: true,
  },
  {
    id: "ev-launch",
    clause: "11 · LAUNCH AND HANDOFF",
    page: 3,
    quote:
      "After final payment and Client approval, the Studio will coordinate launch, provide one recorded training session, and deliver the final brand and website handoff package.",
    classification: "Task",
    source: "Deterministic",
    reviewed: true,
  },
];

const obligations: Obligation[] = [
  { id: "ob-1", title: "Kickoff workshop and discovery audit", type: "task", evidenceId: "ev-discovery", status: "Reviewed" },
  { id: "ob-2", title: "Written brand strategy approval", type: "approval", evidenceId: "ev-strategy", status: "Reviewed", dueDate: "2026-09-18" },
  { id: "ob-3", title: "Visual identity concepts and production assets", type: "milestone", evidenceId: "ev-identity", status: "Reviewed", dueDate: "2026-10-09" },
  { id: "ob-4", title: "Final photography and approved product copy", type: "dependency", evidenceId: "ev-dependency", status: "Reviewed", dueDate: "2026-10-16" },
  { id: "ob-5", title: "Two rounds of revisions", type: "ambiguity", evidenceId: "ev-revision", status: "Reviewed" },
  { id: "ob-6", title: "Three scheduled payments", type: "payment", evidenceId: "ev-payment", status: "Reviewed", amountCents: 2400000 },
  { id: "ob-7", title: "Launch, training, and final handoff", type: "task", evidenceId: "ev-launch", status: "Reviewed", dueDate: "2026-11-20" },
];

const ambiguity: Ambiguity = {
  id: "amb-revisions",
  question: "How should the two revision rounds be allocated?",
  quote: "The Client is entitled to two rounds of revisions during the engagement.",
  options: [
    {
      id: "total",
      title: "Two rounds total across the engagement",
      summary: "Allocate one identity revision round and one website revision round.",
      impact: "Balanced schedule · 2 rounds total",
    },
    {
      id: "milestone",
      title: "Two rounds for every milestone",
      summary: "Every reviewable milestone receives two rounds, increasing estimated effort.",
      impact: "Schedule risk · 10 rounds allocated",
    },
  ],
  resolved: null,
};

const baseOperations: Operation[] = [
  { id: "op-discovery", title: "Discovery", type: "milestone", status: "Ready", sourceEvidenceId: "ev-discovery", dueDate: "2026-09-04", detail: "3 tasks · evidence linked" },
  { id: "op-kickoff", title: "Kickoff workshop", type: "task", status: "Ready", sourceEvidenceId: "ev-discovery", detail: "Up to four stakeholder interviews" },
  { id: "op-strategy", title: "Brand Strategy", type: "milestone", status: "Blocked by approval", sourceEvidenceId: "ev-strategy", dueDate: "2026-09-18", detail: "Positioning, audience, journey, sitemap" },
  { id: "op-identity", title: "Visual Identity", type: "milestone", status: "Queued", sourceEvidenceId: "ev-identity", dueDate: "2026-10-09", detail: "Two concept directions" },
  { id: "op-dependency", title: "Client materials", type: "dependency", status: "Blocking", sourceEvidenceId: "ev-dependency", dueDate: "2026-10-16", detail: "Photography and approved product copy" },
  { id: "op-commerce", title: "Commerce Website", type: "milestone", status: "Queued", sourceEvidenceId: "ev-dependency", dueDate: "2026-11-13", detail: "Wireframes through accessibility QA" },
  { id: "op-final", title: "Launch and Handoff", type: "milestone", status: "Queued", sourceEvidenceId: "ev-launch", dueDate: "2026-11-20", detail: "Training and final package" },
  { id: "op-deposit", title: "Deposit · $8,000", type: "payment", status: "Ready to request", sourceEvidenceId: "ev-payment", amountCents: 800000, detail: "Due upon signing" },
  { id: "op-midpoint", title: "Midpoint · $8,000", type: "payment", status: "Scheduled", sourceEvidenceId: "ev-payment", amountCents: 800000, detail: "After visual identity approval" },
  { id: "op-final-payment", title: "Final · $8,000", type: "payment", status: "Scheduled", sourceEvidenceId: "ev-payment", amountCents: 800000, detail: "Before website launch" },
  { id: "op-approval", title: "Brand strategy approval", type: "approval", status: "Awaiting client", sourceEvidenceId: "ev-strategy", dueDate: "2026-09-18", detail: "Written approval required" },
];

const projectById = (id: string) => seedProjects.find((project) => project.id === id) ?? seedProjects[0];

const operationsFor = (projectId: string): Operation[] =>
  projectId === "harbor-pine" ? baseOperations.map((item) => ({ ...item })) : [
    { id: `${projectId}-next`, title: projectById(projectId).nextEvent, type: "approval", status: "Awaiting client", sourceEvidenceId: "ev-strategy", detail: "Source evidence linked" },
  ];

const previewFor = () => {
  const expanded = ambiguityResolution === "milestone";
  return {
    blocked: !ambiguityResolution,
    milestones: 5,
    tasks: expanded ? 16 : 14,
    payments: 3,
    approvals: 2,
    dependencies: 1,
    risks: expanded
      ? ["Two rounds allocated to every reviewable milestone", "Estimated effort increases by 8 rounds", "Schedule risk visible through launch"]
      : ["Commerce implementation waits for final photography and approved product copy"],
    revisionPlan: expanded ? "10 total rounds · two per reviewable milestone" : "2 total rounds · one identity + one website",
    evidenceCompleteness: 100,
  };
};

const receiptFor = (provider: string, action: string, index: number): Receipt => ({
  id: `rcpt-${provider.toLowerCase()}-${index}`,
  provider,
  mode: "Simulated",
  action,
  status: "Succeeded",
  timestamp: new Date().toISOString(),
  sourceQuote: evidence[index % evidence.length].quote,
  page: evidence[index % evidence.length].page,
  externalUrl: provider === "Stripe" ? "https://simulated.scopefold.local/payment/harbor-pine" : null,
  proof: [
    "Receipt",
    `${provider} action`,
    "Operational item",
    "Reviewed obligation",
    evidence[index % evidence.length].clause,
  ],
});

const router: IRouter = Router();

router.get("/health", (_req, res) => res.json({ status: "ok", service: "scopefold" }));

router.get("/v1/bootstrap", (_req, res) => {
  res.json({ workspace: { name: "Northstar Studio", mode: "DEMO" }, projects: seedProjects, settings });
});

router.get("/v1/projects", (req: Request, res) => {
  const q = String(req.query.q ?? "").toLowerCase();
  const lifecycle = String(req.query.lifecycle ?? "");
  const result = seedProjects.filter((project) => {
    const searchable = `${project.client.name} ${project.name}`.toLowerCase();
    return (!q || searchable.includes(q)) && (!lifecycle || project.lifecycle === lifecycle);
  });
  res.json(result);
});

router.get("/v1/projects/:projectId", (req, res) => {
  const project = projectById(req.params.projectId);
  res.json({ project, operations: operationsFor(project.id), receipts });
});

router.get("/v1/projects/:projectId/review", (req, res) => {
  const project = projectById(req.params.projectId);
  res.json({
    project: { ...project, lifecycle: ambiguityResolution ? "Ready to fold" : "Ready to fold", risk: ambiguityResolution ? project.risk : "Blocking ambiguity" },
    documentName: "NS-HPC-2026-04 · Services Agreement",
    documentText: contractText,
    evidence,
    obligations,
    ambiguities: [{ ...ambiguity, resolved: ambiguityResolution }],
  });
});

router.post("/v1/projects/:projectId/review/ambiguity", (req, res) => {
  const parsed = ResolveAmbiguityBody.safeParse(req.body);
  if (!parsed.success || parsed.data.ambiguityId !== ambiguity.id) {
    res.status(400).json({ error: "Choose a valid ambiguity option." });
    return;
  }
  ambiguityResolution = parsed.data.optionId;
  res.json({
    project: { ...projectById(req.params.projectId), lifecycle: "Ready to fold", risk: ambiguityResolution === "milestone" ? "Schedule risk" : "Review required" },
    documentName: "NS-HPC-2026-04 · Services Agreement",
    documentText: contractText,
    evidence,
    obligations,
    ambiguities: [{ ...ambiguity, resolved: ambiguityResolution }],
  });
});

router.get("/v1/projects/:projectId/fold/preview", (_req, res) => res.json(previewFor()));

router.post("/v1/projects/:projectId/fold", (req, res) => {
  const project = projectById(req.params.projectId);
  if (!ambiguityResolution) {
    res.status(409).json({ error: "Resolve the revision ambiguity before folding." });
    return;
  }
  folded = true;
  project.lifecycle = "Operating";
  project.progress = 28;
  project.risk = ambiguityResolution === "milestone" ? "Schedule risk" : "On track";
  res.json({ project, operations: operationsFor(project.id), preview: previewFor() });
});

router.get("/v1/projects/:projectId/operations", (req, res) => {
  const project = projectById(req.params.projectId);
  res.json({
    project,
    milestones: operationsFor(project.id).filter((item) => item.type === "milestone"),
    operations: operationsFor(project.id),
    receipts,
  });
});

router.get("/v1/projects/:projectId/launch/preflight", (req, res) => {
  const project = projectById(req.params.projectId);
  res.json({
    project,
    blocked: !folded && project.id === "harbor-pine",
    providers: [
      { name: "Stripe", mode: "Simulated", state: "simulated", action: "Create 3 payment links", destination: "Harbor & Pine Coffee", objectCount: 3 },
      { name: "Resend", mode: "Simulated", state: "simulated", action: "Send launch summary and portal invite", destination: "client contact · redacted", objectCount: 1 },
      { name: "Linear", mode: "Simulated", state: "simulated", action: "Create project and 14 issues", destination: "Northstar Studio workspace", objectCount: 14 },
    ],
  });
});

router.post("/v1/projects/:projectId/launch", (req, res) => {
  const parsed = LaunchProjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "An idempotency key is required." });
    return;
  }
  if (!folded && req.params.projectId === "harbor-pine") {
    res.status(409).json({ error: "Fold the reviewed scope before launching." });
    return;
  }
  if (receipts.length) {
    res.json({ status: "succeeded", receipts });
    return;
  }
  receipts = [
    receiptFor("Stripe", "Payment links created", 5),
    receiptFor("Resend", "Launch summary sent", 1),
    receiptFor("Linear", "Project and task issues created", 0),
  ];
  res.json({ status: "succeeded", receipts });
});

router.get("/v1/projects/:projectId/portal", (req, res) => {
  const project = projectById(req.params.projectId);
  const ops = operationsFor(project.id);
  res.json({
    project,
    milestones: ops.filter((item) => item.type === "milestone"),
    payments: ops.filter((item) => item.type === "payment"),
    approvals: ops.filter((item) => item.type === "approval"),
    files: ["Final product photography", "Approved product copy", "Shipping information", "Legal policies"],
  });
});

router.get("/v1/settings", (_req, res) => res.json(settings));

router.patch("/v1/settings", (req, res) => {
  const parsed = UpdateBrandSettingsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid brand settings." });
    return;
  }
  Object.assign(settings, parsed.data);
  res.json(settings);
});

router.post("/v1/demo/reset", (_req, res) => {
  ambiguityResolution = null;
  folded = false;
  receipts = [];
  seedProjects[0].lifecycle = "Ready to fold";
  seedProjects[0].progress = 18;
  seedProjects[0].risk = "Review required";
  res.json({ workspace: { name: "Northstar Studio", mode: "DEMO" }, projects: seedProjects, settings });
});

export default router;