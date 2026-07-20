/**
 * Telephony Observability (SIP/RTP) — deterministic mock generator.
 * See PRD/19-module-telephony-observability.md. In production this is replaced by a HomerAdapter
 * reading a real HEP feed (§2); here every SIP dialog + quality sample is derived, on demand, from
 * the existing seeded `Call` so the app Call Detail and this module stay correlated by `Call-ID`.
 *
 * Two tiers, kept separate for performance:
 *  - buildSipSummary(): cheap, safe to run over an entire scoped call set (list + filtering).
 *  - buildSipMessages()/buildSipQuality(): full dialog reconstruction, only for a single call detail.
 */
import type { Call, Project, SipCallDetail, SipCallSummary, SipMessage, SipQualitySample, SipQualityVerdict } from "@/lib/types";
import { Rng } from "@/lib/seed/rng";

function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const CODECS = ["PCMU/8000", "PCMA/8000", "G729/8000", "GSM-EFR/8000"] as const;
const FAILURE_CODES: { code: number; reason: string; weight: number }[] = [
  { code: 486, reason: "Busy Here", weight: 4 },
  { code: 404, reason: "Not Found", weight: 2 },
  { code: 480, reason: "Temporarily Unavailable", weight: 3 },
  { code: 500, reason: "Server Internal Error", weight: 1 },
  { code: 503, reason: "Service Unavailable", weight: 1 },
  { code: 403, reason: "Forbidden", weight: 1 },
];
const NO_ANSWER_CODES: { code: number; reason: string; weight: number }[] = [
  { code: 487, reason: "Request Terminated", weight: 3 },
  { code: 408, reason: "Request Timeout", weight: 1 },
];

function hexDigits(rng: Rng, n: number): string {
  let out = "";
  for (let i = 0; i < n; i++) out += rng.int(0, 15).toString(16);
  return out;
}

/** SIP Call-ID header value — synthetic but shaped like a real Asterisk/OpenSIPS one. */
function buildSipCallIdHeader(rng: Rng): string {
  return `${hexDigits(rng, 32).toUpperCase()}@sbc-wan.voicing.ai`;
}

/** Deterministic per-project DID (destination number) — same project always dials the same DID. */
function projectDid(project: Project): string {
  const rng = new Rng(hashSeed(`did:${project.id}`));
  return `61${rng.int(2, 9)}${Array.from({ length: 8 }, () => rng.int(0, 9)).join("")}`;
}

function callerAni(call: Call): string {
  const rng = new Rng(hashSeed(`ani:${call.id}`));
  return Array.from({ length: 9 }, () => rng.int(0, 9)).join("").replace(/^0/, "9");
}

function hopsFor(direction: "inbound" | "outbound"): string[] {
  return direction === "inbound" ? ["Carrier Trunk", "SBC OpenSIPS WAN", "Asterisk PBX"] : ["Asterisk PBX", "SBC OpenSIPS WAN", "Carrier Trunk"];
}

/** Cheap summary — safe to compute for an entire scoped/filtered call list. */
export function buildSipSummary(call: Call, project: Project): SipCallSummary {
  const rng = new Rng(hashSeed(`sip:${call.id}`));
  const direction: "inbound" | "outbound" = rng.bool(0.72) ? "inbound" : "outbound";
  const codec = rng.pick(CODECS);
  const retransmissions = rng.bool(0.12) ? rng.int(1, 3) : 0;

  let status: SipCallSummary["status"];
  let finalStatusCode: number | null;
  let finalReason: string | null;
  let methodsSequence: string[];

  if (call.status === "ACTIVE") {
    status = "activa";
    finalStatusCode = null;
    finalReason = null;
    methodsSequence = ["INVITE", "100", "180", "200", "ACK"];
  } else if (call.status === "FAILED") {
    const noAnswer = rng.bool(0.4);
    const pick = rng.weighted((noAnswer ? NO_ANSWER_CODES : FAILURE_CODES).map((f) => ({ value: f, weight: f.weight })));
    status = noAnswer ? "no_contesto" : "fallida";
    finalStatusCode = pick.code;
    finalReason = pick.reason;
    methodsSequence = noAnswer ? ["INVITE", "100", "180", "CANCEL", String(pick.code)] : ["INVITE", "100", String(pick.code), "ACK"];
  } else {
    status = "finalizada";
    finalStatusCode = 200;
    finalReason = "OK";
    methodsSequence = ["INVITE", "100", "180", "200", "ACK", "BYE", "200"];
  }

  return {
    id: `sip-${call.id}`,
    sipCallId: buildSipCallIdHeader(rng),
    linkedCallId: call.callId,
    orgId: call.orgId,
    projectId: call.projectId,
    direction,
    origin: direction === "inbound" ? callerAni(call) : projectDid(project),
    destination: direction === "inbound" ? projectDid(project) : callerAni(call),
    startTime: call.startTime,
    endTime: call.endTime,
    durationSecs: call.durationSecs,
    status,
    finalStatusCode,
    finalReason,
    trunkHops: hopsFor(direction),
    methodsSequence,
    retransmissions,
    codec,
  };
}

/* ----- Full dialog reconstruction (single-call detail only) ----- */

interface Leg {
  a: string; // ip:port
  b: string; // ip:port
}

function legsFor(summary: SipCallSummary): [Leg, Leg] {
  const carrier = `198.51.100.${20 + (hashSeed(summary.sipCallId) % 60)}:5061`;
  const sbcWan = "10.35.13.68:5061";
  const sbcLan = "10.124.193.33:5061";
  const asterisk = "10.20.1.7:5060";
  return summary.direction === "inbound" ? [{ a: carrier, b: sbcWan }, { a: sbcLan, b: asterisk }] : [{ a: asterisk, b: sbcLan }, { a: sbcWan, b: carrier }];
}

function sdpBody(codec: string, port: number): string {
  const [name, rate] = codec.split("/");
  const rtpmap = { PCMU: 0, PCMA: 8, G729: 18, "GSM-EFR": 96 }[name] ?? 0;
  return [
    "v=0",
    `o=- 0 0 IN IP4 10.35.13.84`,
    "s=-",
    "c=IN IP4 10.35.13.84",
    "t=0 0",
    `m=audio ${port} RTP/AVP ${rtpmap} 101`,
    "b=AS:80",
    `a=rtpmap:${rtpmap} ${name}/${rate}`,
    "a=rtpmap:101 telephone-event/8000",
    "a=fmtp:101 0-16",
    "a=maxptime:20",
    "a=ptime:20",
  ].join("\r\n");
}

function rawSip(opts: {
  startLine: string;
  callId: string;
  from: string;
  to: string;
  cseq: string;
  via: string;
  contact?: string;
  sdp?: string;
}): string {
  const branch = hashSeed(`${opts.callId}:${opts.cseq}:${opts.via}:${opts.startLine}`).toString(16);
  const lines = [
    opts.startLine,
    `Via: SIP/2.0/UDP ${opts.via};branch=z9hG4bK${branch}`,
    `Max-Forwards: 70`,
    `From: ${opts.from}`,
    `To: ${opts.to}`,
    `Call-ID: ${opts.callId}`,
    `CSeq: ${opts.cseq}`,
    ...(opts.contact ? [`Contact: <sip:${opts.contact}>`] : []),
    `User-Agent: Voicing-SIP-Gateway/1.0`,
    ...(opts.sdp ? [`Content-Type: application/sdp`, `Content-Disposition: session;handling=required`, `Content-Length: ${opts.sdp.length}`] : [`Content-Length: 0`]),
    "",
    ...(opts.sdp ? [opts.sdp] : []),
  ];
  return lines.join("\r\n");
}

function parseHeaders(raw: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of raw.split("\r\n").slice(1)) {
    if (!line) break;
    const i = line.indexOf(":");
    if (i > 0) out[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return out;
}

/** Full message-by-message reconstruction for one call — expensive, call-detail only. */
export function buildSipMessages(call: Call, summary: SipCallSummary): SipMessage[] {
  const rng = new Rng(hashSeed(`sip-msgs:${call.id}`));
  const [leg1, leg2] = legsFor(summary);
  const t0 = new Date(summary.startTime).getTime();
  const from = `"${summary.origin}" <sip:${summary.origin}@voicing.ai>;tag=${hexDigits(rng, 8)}`;
  const to = `<sip:${summary.destination}@voicing.ai>`;
  const sdp = sdpBody(summary.codec, 20000 + rng.int(0, 9000));

  const rows: { t: number; method: string; src: string; dst: string; raw: string }[] = [];
  let cseq = 1;
  const push = (t: number, method: string, src: string, dst: string, raw: string) => rows.push({ t, method, src, dst, raw });

  const invite1 = rawSip({ startLine: `INVITE sip:${summary.destination}@${leg1.b} SIP/2.0`, callId: summary.sipCallId, from, to, cseq: `${cseq} INVITE`, via: leg1.a, contact: leg1.a, sdp });
  push(0, "INVITE", leg1.a, leg1.b, invite1);
  for (let i = 0; i < summary.retransmissions; i++) {
    push(500 * (i + 1), "INVITE", leg1.a, leg1.b, invite1);
  }
  push(2, "100", leg1.b, leg1.a, rawSip({ startLine: "SIP/2.0 100 Trying", callId: summary.sipCallId, from, to, cseq: `${cseq} INVITE`, via: leg1.a }));
  push(3, "INVITE", leg2.a, leg2.b, rawSip({ startLine: `INVITE sip:${summary.destination}@${leg2.b} SIP/2.0`, callId: summary.sipCallId, from, to, cseq: `${cseq} INVITE`, via: leg2.a, contact: leg2.a, sdp }));
  push(5, "100", leg2.b, leg2.a, rawSip({ startLine: "SIP/2.0 100 Trying", callId: summary.sipCallId, from, to, cseq: `${cseq} INVITE`, via: leg2.a }));

  const ringMs = rng.int(400, 1600);
  if (summary.status !== "fallida" || rng.bool(0.6)) {
    push(ringMs, "180", leg2.b, leg2.a, rawSip({ startLine: "SIP/2.0 180 Ringing", callId: summary.sipCallId, from, to, cseq: `${cseq} INVITE`, via: leg2.a }));
    push(ringMs + 2, "180", leg1.b, leg1.a, rawSip({ startLine: "SIP/2.0 180 Ringing", callId: summary.sipCallId, from, to, cseq: `${cseq} INVITE`, via: leg1.a }));
  }

  if (summary.status === "no_contesto") {
    const cancelMs = ringMs + rng.int(8000, 20000);
    push(cancelMs, "CANCEL", leg1.a, leg1.b, rawSip({ startLine: `CANCEL sip:${summary.destination}@${leg1.b} SIP/2.0`, callId: summary.sipCallId, from, to, cseq: `${cseq} CANCEL`, via: leg1.a }));
    push(cancelMs + 2, String(summary.finalStatusCode), leg1.b, leg1.a, rawSip({ startLine: `SIP/2.0 ${summary.finalStatusCode} ${summary.finalReason}`, callId: summary.sipCallId, from, to, cseq: `${cseq} INVITE`, via: leg1.a }));
    return rows.map((r, i) => toSipMessage(r, i, t0));
  }

  if (summary.status === "fallida") {
    const failMs = ringMs + rng.int(200, 3000);
    push(failMs, String(summary.finalStatusCode), leg2.b, leg2.a, rawSip({ startLine: `SIP/2.0 ${summary.finalStatusCode} ${summary.finalReason}`, callId: summary.sipCallId, from, to, cseq: `${cseq} INVITE`, via: leg2.a }));
    push(failMs + 2, String(summary.finalStatusCode), leg1.b, leg1.a, rawSip({ startLine: `SIP/2.0 ${summary.finalStatusCode} ${summary.finalReason}`, callId: summary.sipCallId, from, to, cseq: `${cseq} INVITE`, via: leg1.a }));
    push(failMs + 4, "ACK", leg1.a, leg1.b, rawSip({ startLine: `ACK sip:${summary.destination}@${leg1.b} SIP/2.0`, callId: summary.sipCallId, from, to, cseq: `${cseq} ACK`, via: leg1.a }));
    return rows.map((r, i) => toSipMessage(r, i, t0));
  }

  // Answered (active or completed): 200 both legs, then ACK both legs.
  const answerMs = ringMs + rng.int(500, 4000);
  push(answerMs, "200", leg2.b, leg2.a, rawSip({ startLine: "SIP/2.0 200 OK", callId: summary.sipCallId, from, to, cseq: `${cseq} INVITE`, via: leg2.a, contact: leg2.b, sdp }));
  push(answerMs + 2, "ACK", leg2.a, leg2.b, rawSip({ startLine: `ACK sip:${summary.destination}@${leg2.b} SIP/2.0`, callId: summary.sipCallId, from, to, cseq: `${cseq} ACK`, via: leg2.a }));
  push(answerMs + 3, "200", leg1.b, leg1.a, rawSip({ startLine: "SIP/2.0 200 OK", callId: summary.sipCallId, from, to, cseq: `${cseq} INVITE`, via: leg1.a, contact: leg1.b, sdp }));
  push(answerMs + 5, "ACK", leg1.a, leg1.b, rawSip({ startLine: `ACK sip:${summary.destination}@${leg1.b} SIP/2.0`, callId: summary.sipCallId, from, to, cseq: `${cseq} ACK`, via: leg1.a }));

  if (summary.status === "finalizada") {
    cseq += 1;
    const byeMs = answerMs + summary.durationSecs * 1000;
    // Whichever side hangs up sends BYE on its leg first; the far leg is torn down right after.
    const [first, second]: [Leg, Leg] = rng.bool(0.55) ? [leg1, leg2] : [{ a: leg2.b, b: leg2.a }, { a: leg1.b, b: leg1.a }];
    push(byeMs, "BYE", first.a, first.b, rawSip({ startLine: `BYE sip:${summary.destination}@${first.b} SIP/2.0`, callId: summary.sipCallId, from, to, cseq: `${cseq} BYE`, via: first.a }));
    push(byeMs + 2, "200", first.b, first.a, rawSip({ startLine: "SIP/2.0 200 OK", callId: summary.sipCallId, from, to, cseq: `${cseq} BYE`, via: first.a }));
    push(byeMs + 3, "BYE", second.a, second.b, rawSip({ startLine: `BYE sip:${summary.destination}@${second.b} SIP/2.0`, callId: summary.sipCallId, from, to, cseq: `${cseq} BYE`, via: second.a }));
    push(byeMs + 5, "200", second.b, second.a, rawSip({ startLine: "SIP/2.0 200 OK", callId: summary.sipCallId, from, to, cseq: `${cseq} BYE`, via: second.a }));
  }

  return rows.sort((a, b) => a.t - b.t).map((r, i) => toSipMessage(r, i, t0));
}

function toSipMessage(r: { t: number; method: string; src: string; dst: string; raw: string }, index: number, t0: number): SipMessage {
  return {
    seq: index + 1,
    ts: new Date(t0 + r.t).toISOString(),
    deltaMs: r.t,
    method: r.method,
    sizeBytes: new TextEncoder().encode(r.raw).length,
    src: r.src,
    dst: r.dst,
    transport: "UDP",
    raw: r.raw,
    headers: parseHeaders(r.raw),
    sdp: r.raw.includes("v=0") ? r.raw.slice(r.raw.indexOf("v=0")) : null,
  };
}

/** RTCP-derived quality samples across the call — call-detail only. */
export function buildSipQuality(call: Call, summary: SipCallSummary): SipQualitySample[] {
  if (summary.status === "fallida" || summary.status === "no_contesto") return [];
  const rng = new Rng(hashSeed(`sip-quality:${call.id}`));
  const durationSecs = Math.max(5, summary.durationSecs);
  const stepSecs = 5;
  const n = Math.max(2, Math.round(durationSecs / stepSecs));
  const t0 = new Date(summary.startTime).getTime();
  const degraded = rng.bool(0.15); // simulate an occasional bad-quality call
  const baseJitter = degraded ? rng.float(28, 55) : rng.float(4, 16);
  const baseLoss = degraded ? rng.float(1.5, 4) : rng.float(0, 0.8);

  const samples: SipQualitySample[] = [];
  for (const direction of ["caller", "callee"] as const) {
    for (let i = 0; i < n; i++) {
      const jitterMs = Math.max(0, baseJitter + rng.float(-4, 6) + (rng.bool(0.05) ? rng.float(10, 30) : 0));
      const packetLossPct = Math.max(0, +(baseLoss + rng.float(-0.3, 0.5)).toFixed(2));
      const rttMs = Math.round(rng.gaussian(60, 20, 15, 220));
      const mos = Math.min(4.5, Math.max(1, +(4.4 - jitterMs / 45 - packetLossPct * 0.25 - rttMs / 800).toFixed(2)));
      samples.push({
        ts: new Date(t0 + i * stepSecs * 1000).toISOString(),
        direction,
        jitterMs: +jitterMs.toFixed(1),
        packetLossPct,
        mos,
        rttMs,
        codec: summary.codec,
      });
    }
  }
  return samples.sort((a, b) => a.ts.localeCompare(b.ts));
}

export function qualityVerdict(quality: SipQualitySample[]): SipQualityVerdict {
  if (quality.length === 0) return "pass";
  const avgJitter = quality.reduce((s, q) => s + q.jitterMs, 0) / quality.length;
  const avgLoss = quality.reduce((s, q) => s + q.packetLossPct, 0) / quality.length;
  if (avgJitter > 30 || avgLoss > 3) return "fail";
  if (avgJitter > 15 || avgLoss > 1) return "warn";
  return "pass";
}

/* ----- Export: plain text + PCAP ----- */

export function buildTextExport(summary: SipCallSummary, messages: SipMessage[]): string {
  const header = [`# SIP trace — Call-ID: ${summary.sipCallId}`, `# Linked call: ${summary.linkedCallId ?? "—"}`, `# Exported ${new Date().toISOString()}`, ""].join("\n");
  return header + messages.map((m) => `--- #${m.seq} ${m.method} (+${m.deltaMs}ms) ${m.src} -> ${m.dst} ---\n${m.raw}\n`).join("\n");
}

function writeUint32LE(buf: number[], v: number) {
  buf.push(v & 0xff, (v >>> 8) & 0xff, (v >>> 16) & 0xff, (v >>> 24) & 0xff);
}
function writeUint16BE(buf: number[], v: number) {
  buf.push((v >>> 8) & 0xff, v & 0xff);
}
function ipToBytes(ip: string): number[] {
  return ip.split(".").map((n) => parseInt(n, 10) || 0);
}
function parseHostPort(hostPort: string): { host: string; port: number } {
  const [host, port] = hostPort.split(":");
  return { host, port: Number(port) || 5060 };
}

/**
 * Reconstructs a minimal but valid PCAP (classic, not pcapng) from the stored SIP messages:
 * fake Ethernet + real IPv4/UDP headers + the raw SIP payload. Opens cleanly in Wireshark.
 */
export function buildPcapBytes(messages: SipMessage[]): Uint8Array {
  const out: number[] = [];
  // Global header (magic, version, tz, sigfigs, snaplen, network=Ethernet)
  writeUint32LE(out, 0xa1b2c3d4);
  writeUint16LEArr(out, 2);
  writeUint16LEArr(out, 4);
  writeUint32LE(out, 0);
  writeUint32LE(out, 0);
  writeUint32LE(out, 65535);
  writeUint32LE(out, 1); // LINKTYPE_ETHERNET

  const baseTs = messages.length ? new Date(messages[0].ts).getTime() : Date.now();

  for (const m of messages) {
    const payload = Array.from(new TextEncoder().encode(m.raw));
    const { host: srcIp, port: srcPort } = parseHostPort(m.src);
    const { host: dstIp, port: dstPort } = parseHostPort(m.dst);

    const udpLen = 8 + payload.length;
    const udp: number[] = [];
    writeUint16BE(udp, srcPort);
    writeUint16BE(udp, dstPort);
    writeUint16BE(udp, udpLen);
    writeUint16BE(udp, 0); // checksum (0 = not computed)
    udp.push(...payload);

    const ipLen = 20 + udp.length;
    const ip: number[] = [];
    ip.push(0x45, 0x00); // version/IHL, DSCP/ECN
    writeUint16BE(ip, ipLen);
    writeUint16BE(ip, 0); // identification
    writeUint16BE(ip, 0x4000); // flags/fragment (DF)
    ip.push(64, 17); // TTL, protocol=UDP
    writeUint16BE(ip, 0); // checksum placeholder (0 = not computed)
    ip.push(...ipToBytes(srcIp));
    ip.push(...ipToBytes(dstIp));
    ip.push(...udp);

    const eth: number[] = [
      0x02, 0x00, 0x00, 0x00, 0x00, 0x01, // dst mac (fake)
      0x02, 0x00, 0x00, 0x00, 0x00, 0x02, // src mac (fake)
      0x08, 0x00, // ethertype = IPv4
      ...ip,
    ];

    const tsMs = new Date(m.ts).getTime() - baseTs;
    const tsSec = Math.floor((baseTs + tsMs) / 1000);
    const tsUsec = ((baseTs + tsMs) % 1000) * 1000;
    writeUint32LE(out, tsSec);
    writeUint32LE(out, tsUsec);
    writeUint32LE(out, eth.length);
    writeUint32LE(out, eth.length);
    out.push(...eth);
  }

  return new Uint8Array(out);
}
function writeUint16LEArr(buf: number[], v: number) {
  buf.push(v & 0xff, (v >>> 8) & 0xff);
}

export function buildSipCallDetail(call: Call, summary: SipCallSummary, linkedCall: { callId: string; projectName: string; orgName: string } | null): SipCallDetail {
  const messages = buildSipMessages(call, summary);
  const quality = buildSipQuality(call, summary);
  return { summary, linkedCall, messages, quality, qualityVerdict: qualityVerdict(quality) };
}
