# Evaluation report

Generated: 2026-08-06T23:15:00.122Z
Config: useRealConfidence=false, categoryFilter=(none)

> **Scope note:** full per-turn diagnostic traces (raw label scores, forces, composite gates, dominance candidates, clamp reasons) for every test are in `evaluation-report.json`. This file has the aggregate stats and expanded detail for failures / low-confidence cases only. See the harness script's header comment for which report fields don't have a real equivalent in this engine (composites have no separate "transformer score"/"cue score"/"bypass" — those print as N/A in the console trace and JSON).

## Summary

- Total tests: **266**  (293 total turns)
- Passed: **147**
- Failed: **119**
- Accuracy: **55.3%**

## Per-emotion accuracy

| Emotion | Passed | Total | Accuracy |
|---|---|---|---|
| angry | 25 | 29 | 86.2% |
| anxious | 0 | 23 | 0.0% |
| bittersweet | 17 | 20 | 85.0% |
| conflicted | 7 | 18 | 38.9% |
| disgust | 0 | 15 | 0.0% |
| frustrated | 3 | 18 | 16.7% |
| happy | 38 | 39 | 97.4% |
| overwhelmed | 0 | 15 | 0.0% |
| sad | 24 | 26 | 92.3% |
| sarcastic | 0 | 24 | 0.0% |
| silent | 33 | 39 | 84.6% |

## Confusion matrix

Rows = expected, columns = predicted.

| expected \ predicted | angry | anxious | bittersweet | conflicted | disgust | frustrated | happy | overwhelmed | sad | sarcastic | silent |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **angry** | 25 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 3 | 0 |
| **anxious** | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 17 | 0 | 6 |
| **bittersweet** | 0 | 0 | 17 | 0 | 0 | 0 | 1 | 0 | 2 | 0 | 0 |
| **conflicted** | 0 | 0 | 3 | 7 | 0 | 0 | 0 | 0 | 3 | 5 | 0 |
| **disgust** | 6 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 4 | 0 | 5 |
| **frustrated** | 11 | 0 | 0 | 0 | 0 | 3 | 0 | 0 | 0 | 0 | 4 |
| **happy** | 0 | 0 | 0 | 0 | 0 | 0 | 38 | 0 | 0 | 1 | 0 |
| **overwhelmed** | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 3 | 0 | 12 |
| **sad** | 0 | 0 | 2 | 0 | 0 | 0 | 0 | 0 | 24 | 0 | 0 |
| **sarcastic** | 18 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 5 |
| **silent** | 6 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 33 |

## False positives

- **happy**: 1  (multi-sentence-conversation-251)
- **sad**: 29  (bittersweet-49, bittersweet-57, conflicted-59, conflicted-65, conflicted-69, anxious-101, anxious-103, anxious-104, anxious-105, anxious-107, anxious-109, anxious-111, anxious-112, anxious-113, overwhelmed-126, disgust-127, disgust-130, disgust-134, edge-cases-196, negation-202, idioms-213, idioms-215, idioms-216, idioms-217, very-short-237, very-long-242, multi-sentence-conversation-249, multi-sentence-conversation-252, multi-sentence-conversation-254)
- **angry**: 41  (sarcastic-70, sarcastic-71, sarcastic-72, sarcastic-75, sarcastic-76, sarcastic-77, sarcastic-78, sarcastic-79, sarcastic-80, sarcastic-81, sarcastic-83, sarcastic-84, frustrated-86, frustrated-88, frustrated-91, frustrated-92, frustrated-94, frustrated-95, frustrated-97, frustrated-98, frustrated-99, disgust-128, disgust-132, disgust-135, disgust-136, disgust-138, edge-cases-188, edge-cases-193, negation-201, idioms-210, irony-219, irony-220, irony-222, irony-223, irony-224, irony-226, very-short-233, very-short-238, very-long-241, ambiguous-255, ambiguous-256)
- **bittersweet**: 5  (rapid-transitions-158, mixed-emotions-161, mixed-emotions-164, mixed-emotions-166, negation-203)
- **sarcastic**: 9  (conflicted-62, conflicted-66, rapid-transitions-153, rapid-transitions-155, rapid-transitions-157, rapid-transitions-159, mixed-emotions-162, mixed-emotions-168, mixed-emotions-171)
- **frustrated**: 1  (sarcastic-73)
- **silent**: 32  (sarcastic-74, sarcastic-82, frustrated-89, frustrated-93, frustrated-96, anxious-100, anxious-102, anxious-106, anxious-108, anxious-110, anxious-114, overwhelmed-115, overwhelmed-116, overwhelmed-117, overwhelmed-118, overwhelmed-119, overwhelmed-120, overwhelmed-121, overwhelmed-122, overwhelmed-123, overwhelmed-124, overwhelmed-125, disgust-129, disgust-131, disgust-133, disgust-137, edge-cases-195, irony-221, irony-225, irony-228, very-long-239, very-long-243)
- **overwhelmed**: 1  (rapid-transitions-156)

## False negatives

- **happy**: 1  (rapid-transitions-155)
- **sad**: 2  (rapid-transitions-158, negation-203)
- **angry**: 4  (rapid-transitions-153, rapid-transitions-156, rapid-transitions-157, rapid-transitions-159)
- **bittersweet**: 3  (bittersweet-49, bittersweet-57, multi-sentence-conversation-251)
- **conflicted**: 11  (conflicted-59, conflicted-62, conflicted-65, conflicted-66, conflicted-69, mixed-emotions-161, mixed-emotions-162, mixed-emotions-164, mixed-emotions-166, mixed-emotions-168, mixed-emotions-171)
- **sarcastic**: 24  (sarcastic-70, sarcastic-71, sarcastic-72, sarcastic-73, sarcastic-74, sarcastic-75, sarcastic-76, sarcastic-77, sarcastic-78, sarcastic-79, sarcastic-80, sarcastic-81, sarcastic-82, sarcastic-83, sarcastic-84, irony-219, irony-220, irony-221, irony-222, irony-223, irony-224, irony-225, irony-226, irony-228)
- **frustrated**: 15  (frustrated-86, frustrated-88, frustrated-89, frustrated-91, frustrated-92, frustrated-93, frustrated-94, frustrated-95, frustrated-96, frustrated-97, frustrated-98, frustrated-99, edge-cases-195, negation-201, very-long-241)
- **silent**: 6  (edge-cases-188, edge-cases-193, very-short-233, very-short-238, ambiguous-255, ambiguous-256)
- **anxious**: 23  (anxious-100, anxious-101, anxious-102, anxious-103, anxious-104, anxious-105, anxious-106, anxious-107, anxious-108, anxious-109, anxious-110, anxious-111, anxious-112, anxious-113, anxious-114, edge-cases-196, negation-202, idioms-213, idioms-215, very-short-237, very-long-242, multi-sentence-conversation-252, multi-sentence-conversation-254)
- **overwhelmed**: 15  (overwhelmed-115, overwhelmed-116, overwhelmed-117, overwhelmed-118, overwhelmed-119, overwhelmed-120, overwhelmed-121, overwhelmed-122, overwhelmed-123, overwhelmed-124, overwhelmed-125, overwhelmed-126, idioms-217, very-long-239, multi-sentence-conversation-249)
- **disgust**: 15  (disgust-127, disgust-128, disgust-129, disgust-130, disgust-131, disgust-132, disgust-133, disgust-134, disgust-135, disgust-136, disgust-137, disgust-138, idioms-210, idioms-216, very-long-243)

## Top 20 worst failures

(failing cases, ranked by how decisively the dominance call was won)

| id | expected | predicted | margin | text |
|---|---|---|---|---|
| sarcastic-72 | sarcastic | angry | 1.000 | Oh fantastic, another meeting that could've been an email. |
| sarcastic-75 | sarcastic | angry | 1.000 | Oh joy, the printer's broken again. |
| sarcastic-77 | sarcastic | angry | 1.000 | Oh wonderful, my flight got delayed, exactly what I wanted. |
| sarcastic-81 | sarcastic | angry | 1.000 | Oh brilliant, they lost my reservation. Perfect. |
| sarcastic-83 | sarcastic | angry | 1.000 | Oh amazing, the wifi is down during the presentation. Love that. |
| frustrated-88 | frustrated | angry | 1.000 | Every time I fix one bug, two more show up. |
| frustrated-91 | frustrated | angry | 1.000 | I keep re-submitting the form and it keeps rejecting it. |
| frustrated-94 | frustrated | angry | 1.000 | I've been on hold for 40 minutes, again. |
| frustrated-97 | frustrated | angry | 1.000 | It's been three weeks of the same bug resurfacing constantly. |
| overwhelmed-126 | overwhelmed | sad | 1.000 | There's the funeral arrangements, the will, the house, and telling my brother. |
| edge-cases-188 | silent | angry | 1.000 | !!!!!!!!!! |
| idioms-217 | overwhelmed | sad | 1.000 | I'm drowning under all of this right now — the move, the bills, the job hunt, the kids, everything. |
| irony-220 | sarcastic | angry | 1.000 | Oh sure, take your time, it's not like anyone's waiting. |
| irony-222 | sarcastic | angry | 1.000 | Fantastic, another 'quick fix' that took all week. |
| multi-sentence-conversation-249 | overwhelmed | sad | 1.000 | And now HR just added a mandatory training too. |
| frustrated-92 | frustrated | angry | 0.843 | I've explained this three times already and nothing's changed. |
| frustrated-98 | frustrated | angry | 0.818 | I've asked for this five times and it's still not done. |
| sarcastic-76 | sarcastic | angry | 0.797 | Great, totally loved waiting two hours for nothing. |
| sarcastic-79 | sarcastic | angry | 0.797 | Oh great, another software update that breaks everything. |
| sarcastic-71 | sarcastic | angry | 0.784 | Yeah right, like that's ever going to happen. |

## Top 20 weakest-confidence predictions

| id | confidence | expected | predicted | pass | text |
|---|---|---|---|---|---|
| overwhelmed-117 | 0.100 | overwhelmed | silent | FAIL | Bills, laundry, the kids' schedules, dinner, and a work call I forgot about. |
| overwhelmed-119 | 0.100 | overwhelmed | silent | FAIL | Taxes, the audit, the new hire, the server migration, and a board meeting Friday. |
| overwhelmed-123 | 0.100 | overwhelmed | silent | FAIL | I have three papers due, a group project falling apart, and a part-time shift tonight. |
| overwhelmed-124 | 0.100 | overwhelmed | silent | FAIL | The wedding planning, the seating chart, the caterer, and my dress alterations are all due this week. |
| overwhelmed-125 | 0.100 | overwhelmed | silent | FAIL | Client escalations, a hiring freeze, two resignations, and the quarterly report are all due now. |
| disgust-127 | 0.100 | disgust | sad | FAIL | The smell made my skin crawl and I felt sick to my stomach. |
| disgust-129 | 0.100 | disgust | silent | FAIL | The mold in that fridge is stomach-turning. |
| disgust-131 | 0.100 | disgust | silent | FAIL | The bathroom at that gas station was truly revolting. |
| disgust-133 | 0.100 | disgust | silent | FAIL | The whole situation is nauseating, honestly. |
| disgust-138 | 0.100 | disgust | angry | FAIL | The whole scandal is stomach-turning once you read the details. |
| disgust-137 | 0.120 | disgust | silent | FAIL | Finding roaches in the kitchen made my skin crawl. |
| very-long-243 | 0.120 | disgust | silent | FAIL | The whole apartment reeked the second I opened the door, and when I finally traced it back to the fridge I found something in the back that had clearly been forgotten for months, and honestly just describing it now makes my skin crawl all over again, it was one of the most stomach-turning things I've had to clean up in a long time. |
| sarcastic-80 | 0.150 | sarcastic | angry | FAIL | Yeah, right, tell me another one. |
| overwhelmed-115 | 0.150 | overwhelmed | silent | FAIL | I have exams, assignments, a job interview, family stuff, and my car broke down. |
| overwhelmed-116 | 0.150 | overwhelmed | silent | FAIL | There's the move, the wedding, work deadlines, and my mom's surgery all this month. |
| overwhelmed-118 | 0.150 | overwhelmed | silent | FAIL | I've got three deadlines, a sick dog, a leaking roof, and no sleep. |
| overwhelmed-120 | 0.150 | overwhelmed | silent | FAIL | I have to pack, cancel the lease, notify the school, and find a new job, all by Monday. |
| overwhelmed-121 | 0.150 | overwhelmed | silent | FAIL | Between the baby, the in-laws visiting, and the kitchen renovation I can't think straight. |
| overwhelmed-122 | 0.150 | overwhelmed | silent | FAIL | There's rent, the car payment, the vet bill, and my hours got cut. |
| overwhelmed-126 | 0.150 | overwhelmed | sad | FAIL | There's the funeral arrangements, the will, the house, and telling my brother. |

## Averages

- confidence: 0.460
- cue contribution (proxy — count of FORCE_MAP labels above noise floor): 1.692
- transformer contribution (avg total raw force energy): 0.492
- composite contribution (avg final score, composite-winning cases only, n=43): 0.796
- dominance margin: 0.656

