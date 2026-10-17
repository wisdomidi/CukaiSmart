import { Router } from 'express';
import {
  usageState,
  GOOGLE_DAILY_FREE_LIMIT,
  GOOGLE_RPM_FREE_LIMIT,
  checkDailyRollover,
  cleanMinuteTimestamps,
  checkUserAbuse,
  addAuditRecord,
  checkAndIncrementGuestQuotaServer,
} from '../services/sentinel.ts';
import { ai, buildSystemInstruction, pdpaShield } from '../services/gemini.ts';
import type { ServerAIAuditRecord } from '../types.ts';

export const scanRouter = Router();

// =========================================================================
// AI RECEIPT SCANNER & SMART VALIDATOR ENDPOINT (WITH CIRCUIT BREAKER)
// =========================================================================
scanRouter.post('/scan-receipt', async (req, res) => {
  const startTime = Date.now();
  checkDailyRollover();

  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  const userId = req.body.userId || 'guest-session';
  const userEmail = req.body.userEmail || 'guest@cukaismart.local';
  const sessionId = req.body.sessionId || (typeof clientIp === 'string' ? clientIp : 'guest-session');
  const isGuest = !req.body.userId || req.body.userId === 'guest-session' || userEmail.includes('guest');

  // 1. Abuse & Scraper Check
  const abuseCheck = checkUserAbuse(typeof clientIp === 'string' ? clientIp : userId);
  if (abuseCheck.isAbusive) {
    return res.status(429).json({
      error: 'Rate limit exceeded: Too many document scan requests in a short burst. Please wait 30 seconds.',
      isRateLimited: true,
      isTaxDeductible: false,
      confidenceScore: 0,
      category: 'Rate Limited',
      reason: abuseCheck.reason || 'High frequency burst detected. Please wait a moment.',
      isClaimableOutcome: 'no',
      merchantName: 'Rate Limit Sentinel',
      totalAmount: 0,
      items: [],
    });
  }

  // 1b. Anonymous / Guest User Daily Quota Check (Max 3 scans / day)
  if (isGuest) {
    const guestQuota = checkAndIncrementGuestQuotaServer(sessionId, 'scan');
    if (!guestQuota.allowed) {
      return res.status(429).json({
        error: guestQuota.reason,
        isGuestLimitReached: true,
        isTaxDeductible: false,
        confidenceScore: 0,
        category: 'Guest Limit Reached',
        reason: guestQuota.reason,
        isClaimableOutcome: 'no',
        merchantName: 'Guest Scan Guardrail',
        totalAmount: 0,
        items: [],
      });
    }
  }


  // 2. Google Free Usage Guardrail & Hard Circuit Breaker
  const currentDailyPct = (usageState.requestsToday / GOOGLE_DAILY_FREE_LIMIT) * 100;
  const isCircuitBreakerTripped =
    usageState.autoThrottleEnabled &&
    currentDailyPct >= usageState.circuitBreakerThresholdPercent;

  if (isCircuitBreakerTripped) {
    usageState.circuitBreakerActive = true;
    console.warn(
      `[API /api/scan-receipt] CIRCUIT BREAKER TRIPPED! Current: ${usageState.requestsToday}/${GOOGLE_DAILY_FREE_LIMIT} (${currentDailyPct.toFixed(1)}%). Threshold: ${usageState.circuitBreakerThresholdPercent}%.`
    );
    return res.status(429).json({
      error: 'Google Free Tier Protection: Circuit breaker engaged.',
      isCircuitBreakerActive: true,
      message: `The platform has reached ${currentDailyPct.toFixed(1)}% of Google's free usage quota (${usageState.requestsToday} / ${GOOGLE_DAILY_FREE_LIMIT} daily requests). To guarantee zero billing costs, scans are temporarily halted until daily rollover at midnight UTC. Administrators can adjust this threshold in the Admin Console.`,
      isTaxDeductible: false,
      confidenceScore: 0,
      category: 'System Quota Protected',
      documentType: 'Non-Tax Document / Disallowed',
      reason: 'Free tier safety threshold reached. No billable cloud calls permitted.',
      isClaimableOutcome: 'no',
      merchantName: 'Google Free Tier Sentinel',
      totalAmount: 0,
      items: [],
    });
  }

  // Check Rate per minute (15 RPM)
  const currentRPM = cleanMinuteTimestamps();
  if (currentRPM >= GOOGLE_RPM_FREE_LIMIT) {
    console.warn(`[API /api/scan-receipt] RPM LIMIT EXCEEDED: ${currentRPM}/${GOOGLE_RPM_FREE_LIMIT} requests in current minute.`);
    return res.status(429).json({
      error: 'Free Tier Rate Limit Exceeded (15 RPM). Please wait 30 seconds before submitting the next document.',
      isRateLimited: true,
      isTaxDeductible: false,
      confidenceScore: 0,
      category: 'Rate Limited',
      reason: 'Google Gemini free tier limits requests to 15 per minute. Retrying shortly.',
      isClaimableOutcome: 'no',
      merchantName: 'Rate Limit Sentinel',
      totalAmount: 0,
      items: [],
    });
  }

  try {
    const { imageBase64, mimeType = 'image/jpeg', persona = 'individual', activeTaxYear = 2026 } = req.body;

    console.log(`[API /api/scan-receipt] Processing document. Persona: ${persona}, TaxYear: ${activeTaxYear}, User: ${userEmail}`);

    if (!imageBase64) {
      console.warn('[API /api/scan-receipt] REJECTED: Image data missing in request body.');
      return res.status(400).json({ error: 'Image data is required' });
    }

    const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '');
    const payloadSizeKb = Math.round(cleanBase64.length / 1024);

    let detectedMime = mimeType;
    if (imageBase64.startsWith('data:application/pdf')) {
      detectedMime = 'application/pdf';
    } else if (imageBase64.startsWith('data:image/png')) {
      detectedMime = 'image/png';
    } else if (imageBase64.startsWith('data:image/webp')) {
      detectedMime = 'image/webp';
    } else if (imageBase64.startsWith('data:image/jpeg') || imageBase64.startsWith('data:image/jpg')) {
      detectedMime = 'image/jpeg';
    }

    if (!process.env.GEMINI_API_KEY) {
      console.warn('[API /api/scan-receipt] GEMINI_API_KEY missing from environment.');
      return res.status(500).json({
        error: 'GEMINI_API_KEY environment variable is not configured.',
        isTaxDeductible: false,
        confidenceScore: 0,
        category: 'Unclaimable Document',
        documentType: 'Non-Tax Document / Disallowed',
        reason: 'Gemini AI key is missing. Unable to analyze document.',
        isClaimableOutcome: 'no',
        merchantName: 'Unknown',
        totalAmount: 0,
        items: [],
      });
    }

    // Increment Usage Counters for Free Tier tracking
    usageState.requestsToday += 1;
    usageState.requestsMonth += 1;
    usageState.minuteTimestamps.push(Date.now());

    const systemInstruction = buildSystemInstruction(persona, activeTaxYear);
    const apiStartTime = Date.now();

    let response: any;
    try {
      response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          {
            inlineData: {
              mimeType: detectedMime,
              data: cleanBase64,
            },
          },
          {
            text: `Analyze this document for Assessment Year ${activeTaxYear} under Malaysian Income Tax Act 1967 LHDN rules. Taxpayer persona: ${persona}. Evaluate if this is a valid tax invoice or receipt, identify documentType, extract items, verify merchant SSM/TIN, check MyInvois e-invoice compliance, and determine tax deductibility. Return ONLY the JSON object.`,
          },
        ],
        config: {
          systemInstruction: pdpaShield(systemInstruction),
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      });
    } catch (primaryErr: any) {
      console.warn('[Scan] Primary gemini-3.8-flash retry, falling back to gemini-flash-latest...');
      try {
        response = await ai.models.generateContent({
          model: 'gemini-flash-latest',
          contents: [
            {
              inlineData: {
                mimeType: detectedMime,
                data: cleanBase64,
              },
            },
            {
              text: `Analyze this document for Assessment Year ${activeTaxYear} under Malaysian Income Tax Act 1967 LHDN rules. Taxpayer persona: ${persona}. Evaluate if this is a valid tax invoice or receipt, identify documentType, extract items, verify merchant SSM/TIN, check MyInvois e-invoice compliance, and determine tax deductibility. Return ONLY the JSON object.`,
            },
          ],
          config: {
            systemInstruction: pdpaShield(systemInstruction),
            responseMimeType: 'application/json',
            temperature: 0.1,
          },
        });
      } catch (fallbackErr: any) {
        console.warn('[Scan] Trying secondary fallback gemini-3.1-flash-lite...');
        response = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents: [
            {
              inlineData: {
                mimeType: detectedMime,
                data: cleanBase64,
              },
            },
            {
              text: `Analyze this document for Assessment Year ${activeTaxYear} under Malaysian Income Tax Act 1967 LHDN rules. Taxpayer persona: ${persona}. Evaluate if this is a valid tax invoice or receipt, identify documentType, extract items, verify merchant SSM/TIN, check MyInvois e-invoice compliance, and determine tax deductibility. Return ONLY the JSON object.`,
            },
          ],
          config: {
            systemInstruction: pdpaShield(systemInstruction),
            responseMimeType: 'application/json',
            temperature: 0.1,
          },
        });
      }
    }

    const apiElapsed = Date.now() - apiStartTime;
    const responseText = response.text || '';

    let parsedData: any;
    try {
      parsedData = JSON.parse(responseText.trim());
    } catch {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse JSON response structure from Gemini API');
      }
    }

    parsedData.isTaxDeductible = parsedData.isTaxDeductible ?? (parsedData.isClaimableOutcome !== 'no');
    parsedData.category = parsedData.category || parsedData.categoryName || 'Tax Expense';
    parsedData.documentType = parsedData.documentType || (parsedData.isTaxDeductible ? 'Official Tax Invoice' : 'Non-Tax Document / Disallowed');
    parsedData.confidenceScore = typeof parsedData.confidenceScore === 'number' ? parsedData.confidenceScore : (parsedData.aiConfidence || 90);

    const totalElapsed = Date.now() - startTime;
    const estimatedInputTokens = Math.round(payloadSizeKb * 1.3) + 1100;
    const estimatedOutputTokens = Math.round(responseText.length / 4);

    // Record in Server-Side Audit Trail
    const auditRecord: ServerAIAuditRecord = {
      id: `ai-audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      userId: String(userId),
      userEmail: String(userEmail),
      documentType: String(parsedData.documentType),
      merchantName: parsedData.merchantName || 'Unknown Merchant',
      ssmNumber: parsedData.ssmNumber || '',
      category: parsedData.category,
      statutorySection: parsedData.statutoryRule || (persona === 'business' ? 'Sec 33(1) ITA 1967' : 'Sec 46(1) ITA 1967'),
      claimableAmount: parsedData.claimableTotal || 0,
      totalAmount: parsedData.totalAmount || 0,
      isTaxDeductible: Boolean(parsedData.isTaxDeductible),
      confidenceScore: parsedData.confidenceScore,
      auditStatus: !parsedData.isTaxDeductible ? 'flagged' : (parsedData.auditRiskScore === 'HIGH' ? 'warning' : 'compliant'),
      aiModel: 'gemini-3.8-flash',
      latencyMs: apiElapsed,
      inputTokens: estimatedInputTokens,
      outputTokens: estimatedOutputTokens,
      payloadSizeKb,
      abuseFlag: abuseCheck.isAbusive,
      abuseReason: abuseCheck.reason,
      riskScore: abuseCheck.isAbusive ? 'HIGH' : (!parsedData.isTaxDeductible ? 'MEDIUM' : 'LOW'),
      clientIpOrSession: String(clientIp),
      isAccurateByLHDN: parsedData.isTaxDeductible,
      ruleCheckNote: parsedData.reason || `Compliant with ${parsedData.category}`,
      adminVerifiedStatus: 'pending',
    };

    addAuditRecord(auditRecord);

    return res.json({
      ...parsedData,
      _auditRecord: {
        id: auditRecord.id,
        timestamp: auditRecord.timestamp,
        documentType: auditRecord.documentType,
        userId: auditRecord.userId,
        abuseFlag: auditRecord.abuseFlag,
      },
      _telemetry: {
        serverDurationMs: totalElapsed,
        geminiDurationMs: apiElapsed,
        payloadSizeKb,
        todayRequests: usageState.requestsToday,
        dailyFreeLimit: GOOGLE_DAILY_FREE_LIMIT,
        dailyPercentage: ((usageState.requestsToday / GOOGLE_DAILY_FREE_LIMIT) * 100).toFixed(1),
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    const totalElapsed = Date.now() - startTime;
    console.error(`[API /api/scan-receipt] EXCEPTION after ${totalElapsed}ms:`, error?.message || error);
    return res.status(500).json({
      error: `Gemini AI Scan Error: ${error?.message || 'Unable to scan document'}`,
      isTaxDeductible: false,
      confidenceScore: 0,
      category: 'Unclaimable Non-Tax Document',
      documentType: 'Non-Tax Document / Disallowed',
      reason: `Document analysis failed: ${error?.message || 'The uploaded file could not be analyzed.'}. Please upload a clear official tax receipt or invoice photo.`,
      isClaimableOutcome: 'no',
      merchantName: 'Invalid Document',
      totalAmount: 0,
      items: [],
    });
  }
});
