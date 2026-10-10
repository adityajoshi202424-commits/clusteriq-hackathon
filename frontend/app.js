/**
 * ClusterIQ - Cluster Review Intelligence Frontend Controller
 * Powers Hotel GM Mode (B2B), Uttarakhand Tourism Board Mode (B2G), and Live ABSA Playground.
 * Includes Air-Gapped Demo Mode, Telemetry Metrics, Graceful Fallback Alerting, and Hinglish Translation.
 */

// State
let currentPropertyId = 'welcomhotel_savoy';
let allProperties = [];
let currentBenchmarkData = null;
let tourismData = null;
let demoMode = true; // Air-Gapped Warm Cache active by default

// DOM Ready
document.addEventListener('DOMContentLoaded', () => {
    initModeSwitcher();
    initWarmCacheControls();
    loadProperties();
    loadEfficiencyMetrics();
    initLiveTester();
    initDrawerClose();
    initModalClose();
});

// Mode Switching Controller
function initModeSwitcher() {
    const btnHotel = document.getElementById('btn-mode-hotel');
    const btnB2G = document.getElementById('btn-mode-b2g');
    const btnLive = document.getElementById('btn-mode-live');

    const viewHotel = document.getElementById('view-hotel');
    const viewB2G = document.getElementById('view-b2g');
    const viewLive = document.getElementById('view-live');

    btnHotel.addEventListener('click', () => setMode('hotel'));
    btnB2G.addEventListener('click', () => {
        setMode('b2g');
        if (!tourismData) loadTourismData();
    });
    btnLive.addEventListener('click', () => setMode('live'));

    function setMode(mode) {
        btnHotel.className = `mode-btn ${mode === 'hotel' ? 'active' : ''}`;
        btnB2G.className = `mode-btn ${mode === 'b2g' ? 'active b2g-active' : ''}`;
        btnLive.className = `mode-btn ${mode === 'live' ? 'active play-active' : ''}`;

        viewHotel.className = `hotel-view ${mode === 'hotel' ? 'active' : ''}`;
        viewB2G.className = `b2g-view ${mode === 'b2g' ? 'active' : ''}`;
        viewLive.className = `live-view ${mode === 'live' ? 'active' : ''}`;
    }
}

// -------------------------------------------------------------
// Warm Cache & Graceful Alert Banner Controller (Part 1 Items 1 & 2)
// -------------------------------------------------------------
function initWarmCacheControls() {
    const btnToggle = document.getElementById('btn-demo-mode-toggle');
    const statusText = document.getElementById('demo-mode-status-text');
    const btnRefresh = document.getElementById('btn-refresh-cluster');
    const dismissBtn = document.getElementById('btn-dismiss-alert');

    btnToggle.addEventListener('click', () => {
        demoMode = !demoMode;
        if (demoMode) {
            btnToggle.className = 'btn-demo-toggle';
            statusText.textContent = 'Demo Mode: WARM CACHE';
            btnToggle.title = 'Air-Gapped Demo Mode: Instant pre-staged database (Zero Network Risk)';
        } else {
            btnToggle.className = 'btn-demo-toggle live-mode';
            statusText.textContent = 'Mode: LIVE SCRAPER';
            btnToggle.title = 'Live Scraper Mode: Calls external endpoints (Triggers graceful rate limit alert)';
        }
    });

    btnRefresh.addEventListener('click', async () => {
        btnRefresh.classList.add('scanning');
        btnRefresh.innerHTML = 'Refreshing Cluster...';

        try {
            const res = await fetch('/api/refresh-data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ demo_mode: demoMode, simulate_live_failure: !demoMode })
            });
            const data = await res.json();

            if (data.is_fallback) {
                showBrandedAlert(data.message, 'warning');
            } else {
                showBrandedAlert(`${data.message} (${data.total_reviews} reviews loaded in ${data.elapsed_sec}s)`, 'success');
            }

            // Synchronize UI
            loadProperties();
            loadEfficiencyMetrics();
            if (tourismData) loadTourismData();
        } catch (e) {
            showBrandedAlert("Booking.com API rate limit reached. Auto-switching to locally cached community database.", 'warning');
        } finally {
            btnRefresh.classList.remove('scanning');
            btnRefresh.innerHTML = 'Refresh Cluster Data';
        }
    });

    if (dismissBtn) {
        dismissBtn.addEventListener('click', () => {
            document.getElementById('branded-alert-banner').classList.add('hidden');
        });
    }
}

function showBrandedAlert(message, type = 'warning') {
    const banner = document.getElementById('branded-alert-banner');
    const msgEl = document.getElementById('alert-message');
    msgEl.textContent = message;
    banner.classList.remove('hidden');

    if (type === 'success') {
        banner.style.background = 'linear-gradient(90deg, rgba(16, 185, 129, 0.2) 0%, rgba(14, 165, 233, 0.2) 100%)';
        banner.style.borderColor = 'rgba(16, 185, 129, 0.4)';
        msgEl.style.color = '#6ee7b7';
    } else {
        banner.style.background = 'linear-gradient(90deg, rgba(245, 158, 11, 0.18) 0%, rgba(225, 29, 72, 0.15) 100%)';
        banner.style.borderColor = 'rgba(245, 158, 11, 0.4)';
        msgEl.style.color = '#fef08a';
    }
}

// -------------------------------------------------------------
// Human vs AI Efficiency Metrics Telemetry (Part 2 Feature 1)
// -------------------------------------------------------------
async function loadEfficiencyMetrics() {
    try {
        const res = await fetch('/api/efficiency-metrics');
        const data = await res.json();

        document.getElementById('hero-hours-saved').textContent = `${data.human_reading_time_saved_hours} Hours`;
        document.getElementById('eff-word-count').textContent = data.cluster_archive_words.toLocaleString();
        document.getElementById('eff-human-speed').textContent = `${data.reading_speed_wpm} WPM`;
        document.getElementById('eff-ai-speed').textContent = `${data.ai_processing_time_sec}s`;
        document.getElementById('eff-roi').textContent = data.cost_savings_inr;
    } catch (e) {
        console.error('Failed to load efficiency metrics:', e);
    }
}

// -------------------------------------------------------------
// B2B Hotel Operator Dashboard Functions
// -------------------------------------------------------------
async function loadProperties() {
    try {
        const res = await fetch('/api/properties');
        allProperties = await res.json();
        
        const select = document.getElementById('hotel-select');
        select.innerHTML = '';
        allProperties.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.id;
            opt.textContent = `${p.name} (${p.category})`;
            select.appendChild(opt);
        });

        select.addEventListener('change', (e) => {
            currentPropertyId = e.target.value;
            loadPropertyBenchmark(currentPropertyId);
        });

        // Load initial property
        if (allProperties.length > 0) {
            currentPropertyId = allProperties[0].id;
            select.value = currentPropertyId;
            loadPropertyBenchmark(currentPropertyId);
        }
    } catch (err) {
        console.error('Failed to load properties:', err);
    }
}

async function loadPropertyBenchmark(propertyId) {
    try {
        const res = await fetch(`/api/benchmark/${propertyId}`);
        currentBenchmarkData = await res.json();
        renderHotelDashboard(currentBenchmarkData);
    } catch (err) {
        console.error(`Failed to benchmark property ${propertyId}:`, err);
    }
}

function renderHotelDashboard(data) {
    const p = data.property;
    
    // Meta Toolbar
    document.getElementById('meta-location').textContent = p.location;
    document.getElementById('meta-rooms').textContent = `${p.total_rooms} Rooms`;
    document.getElementById('meta-price').textContent = p.price_range;
    document.getElementById('meta-mall-dist').textContent = p.distance_to_mall_road_m === 0 ? 'Direct on Mall Road' : `${p.distance_to_mall_road_m}m to Mall Road`;

    // Calculate overall property sentiment score & ranking
    const rankObj = data.cluster_rankings.find(r => r.id === p.id) || { rank: 1, score: 75.0 };
    document.getElementById('kpi-score-val').textContent = `${rankObj.score > 0 ? '+' : ''}${rankObj.score}%`;
    document.getElementById('kpi-rank-val').textContent = `#${rankObj.rank}`;
    document.getElementById('kpi-rank-total').textContent = `of ${data.cluster_rankings.length} Mussoorie Cluster Hotels`;

    // Lead / Lag categories
    const sortedByGap = [...data.aspect_benchmarks].sort((a, b) => b.competitive_gap - a.competitive_gap);
    const topLead = sortedByGap[0];
    const topLag = sortedByGap[sortedByGap.length - 1];

    document.getElementById('kpi-lead-val').textContent = topLead.category;
    document.getElementById('kpi-lead-sub').textContent = `+${topLead.competitive_gap}% vs Market Baseline`;

    document.getElementById('kpi-lag-val').textContent = topLag.category;
    document.getElementById('kpi-lag-sub').textContent = `${topLag.competitive_gap}% vs Market Baseline`;

    const totalRevs = data.aspect_benchmarks.reduce((acc, x) => acc + x.total_mentions, 0);
    document.getElementById('kpi-revs-val').textContent = `${totalRevs} Points`;

    // Render Radar Chart
    renderRadarChart(data.aspect_benchmarks);

    // Render Leaderboard Table
    renderLeaderboardTable(data.aspect_benchmarks);

    // Render 4-Quadrant Opportunity Matrix
    renderOpportunityMatrix(data.aspect_benchmarks);

    // Render Changepoint Timeline
    renderTimelineChart(data.monthly_trend, p.name);

    // Render Actionable Prescriptions
    renderActionPrescriptions(data.aspect_benchmarks, p);
}

// Custom SVG Radar Chart Generator
function renderRadarChart(aspects) {
    const svg = document.getElementById('radar-svg');
    svg.innerHTML = '';

    const width = 360;
    const height = 320;
    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = 110;

    const totalAxes = aspects.length;
    const angleStep = (Math.PI * 2) / totalAxes;

    // Background Web
    const levels = [0.25, 0.5, 0.75, 1.0];
    levels.forEach(level => {
        let polyPoints = [];
        for (let i = 0; i < totalAxes; i++) {
            const angle = i * angleStep - Math.PI / 2;
            const r = maxRadius * level;
            const x = centerX + r * Math.cos(angle);
            const y = centerY + r * Math.sin(angle);
            polyPoints.push(`${x},${y}`);
        }
        const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        poly.setAttribute('points', polyPoints.join(' '));
        poly.setAttribute('fill', 'transparent');
        poly.setAttribute('stroke', 'rgba(255, 255, 255, 0.08)');
        poly.setAttribute('stroke-width', '1');
        svg.appendChild(poly);
    });

    // Draw Axes & Labels
    aspects.forEach((asp, i) => {
        const angle = i * angleStep - Math.PI / 2;
        const x = centerX + maxRadius * Math.cos(angle);
        const y = centerY + maxRadius * Math.sin(angle);

        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', centerX);
        line.setAttribute('y1', centerY);
        line.setAttribute('x2', x);
        line.setAttribute('y2', y);
        line.setAttribute('stroke', 'rgba(255, 255, 255, 0.12)');
        line.setAttribute('stroke-width', '1');
        svg.appendChild(line);

        const labelDistance = maxRadius + 22;
        const lx = centerX + labelDistance * Math.cos(angle);
        const ly = centerY + labelDistance * Math.sin(angle);

        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', lx);
        text.setAttribute('y', ly);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dominant-baseline', 'middle');
        text.setAttribute('fill', '#94a3b8');
        text.setAttribute('font-size', '11');
        text.setAttribute('font-weight', '600');
        text.textContent = asp.category;
        svg.appendChild(text);
    });

    function scoreToRadius(score) {
        const normalized = (score + 100) / 200;
        return Math.max(10, Math.min(maxRadius, maxRadius * normalized));
    }

    // Cluster Baseline Polygon (Dashed Slate)
    let clusterPoints = [];
    aspects.forEach((asp, i) => {
        const angle = i * angleStep - Math.PI / 2;
        const r = scoreToRadius(asp.cluster_baseline);
        const x = centerX + r * Math.cos(angle);
        const y = centerY + r * Math.sin(angle);
        clusterPoints.push(`${x},${y}`);
    });
    const clusterPoly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    clusterPoly.setAttribute('points', clusterPoints.join(' '));
    clusterPoly.setAttribute('fill', 'rgba(148, 163, 184, 0.18)');
    clusterPoly.setAttribute('stroke', 'rgba(148, 163, 184, 0.6)');
    clusterPoly.setAttribute('stroke-width', '1.5');
    clusterPoly.setAttribute('stroke-dasharray', '4 4');
    svg.appendChild(clusterPoly);

    // Selected Property Polygon (Glowing Cyan)
    let propPoints = [];
    aspects.forEach((asp, i) => {
        const angle = i * angleStep - Math.PI / 2;
        const r = scoreToRadius(asp.property_score);
        const x = centerX + r * Math.cos(angle);
        const y = centerY + r * Math.sin(angle);
        propPoints.push(`${x},${y}`);
    });
    const propPoly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    propPoly.setAttribute('points', propPoints.join(' '));
    propPoly.setAttribute('fill', 'rgba(14, 165, 233, 0.28)');
    propPoly.setAttribute('stroke', '#0ea5e9');
    propPoly.setAttribute('stroke-width', '2.5');
    svg.appendChild(propPoly);

    aspects.forEach((asp, i) => {
        const angle = i * angleStep - Math.PI / 2;
        const r = scoreToRadius(asp.property_score);
        const x = centerX + r * Math.cos(angle);
        const y = centerY + r * Math.sin(angle);

        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', x);
        circle.setAttribute('cy', y);
        circle.setAttribute('r', '4');
        circle.setAttribute('fill', '#0ea5e9');
        circle.setAttribute('stroke', '#fff');
        circle.setAttribute('stroke-width', '1.5');
        svg.appendChild(circle);
    });
}

function renderLeaderboardTable(aspects) {
    const tbody = document.getElementById('aspect-table-body');
    tbody.innerHTML = '';

    aspects.forEach(asp => {
        const tr = document.createElement('tr');
        const isPos = asp.competitive_gap >= 0;

        tr.innerHTML = `
            <td>
                <div class="aspect-name">
                    <span>${asp.category}</span>
                </div>
            </td>
            <td>
                <span class="badge-classification ${asp.badge_color}">${asp.classification}</span>
            </td>
            <td>
                <span style="font-weight: 700; color: ${asp.property_score >= 0 ? '#34d399' : '#fb7185'};">
                    ${asp.property_score > 0 ? '+' : ''}${asp.property_score}
                </span>
            </td>
            <td>
                <span style="color: #94a3b8;">${asp.cluster_baseline > 0 ? '+' : ''}${asp.cluster_baseline}</span>
            </td>
            <td>
                <span class="delta-badge ${isPos ? 'pos' : 'neg'}">
                    ${isPos ? '+' : ''}${asp.competitive_gap}%
                </span>
            </td>
            <td>
                <button class="btn-view-evidence" data-category="${asp.category}">
                    View Evidence (${asp.evidence_quotes.length})
                </button>
            </td>
        `;

        tr.querySelector('.btn-view-evidence').addEventListener('click', () => {
            openEvidenceDrawer(asp.category, asp.evidence_quotes);
        });

        tbody.appendChild(tr);
    });
}

function renderOpportunityMatrix(aspects) {
    const qAdvantage = document.getElementById('quadrant-advantage');
    const qWeakness = document.getElementById('quadrant-weakness');
    const qMarketProb = document.getElementById('quadrant-market-prob');
    const qOpportunity = document.getElementById('quadrant-opportunity');

    qAdvantage.innerHTML = '';
    qWeakness.innerHTML = '';
    qMarketProb.innerHTML = '';
    qOpportunity.innerHTML = '';

    aspects.forEach(asp => {
        const bubble = document.createElement('div');
        bubble.className = 'aspect-bubble';
        bubble.innerHTML = `
            <span><strong>${asp.category}</strong> (${asp.property_score > 0 ? '+' : ''}${asp.property_score})</span>
            <span style="font-size: 0.75rem; color: #94a3b8;">Gap: ${asp.competitive_gap > 0 ? '+' : ''}${asp.competitive_gap}%</span>
        `;
        bubble.addEventListener('click', () => {
            openEvidenceDrawer(asp.category, asp.evidence_quotes);
        });

        if (asp.classification === 'Competitive Advantage') {
            qAdvantage.appendChild(bubble);
        } else if (asp.classification === 'Competitive Weakness') {
            qWeakness.appendChild(bubble);
        } else if (asp.classification === 'Market-Wide Problem') {
            qMarketProb.appendChild(bubble);
        } else if (asp.classification === 'Market Opportunity') {
            qOpportunity.appendChild(bubble);
        }
    });

    [qAdvantage, qWeakness, qMarketProb, qOpportunity].forEach(q => {
        if (q.children.length === 0) {
            q.innerHTML = '<div style="font-size: 0.8rem; color: #64748b; font-style: italic;">None identified</div>';
        }
    });
}

function renderTimelineChart(monthlyTrend, propName) {
    const svg = document.getElementById('timeline-chart-svg');
    svg.innerHTML = '';

    const width = 850;
    const height = 180;
    const padding = { top: 25, right: 30, bottom: 35, left: 50 };

    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const n = monthlyTrend.length;
    const stepX = chartW / (n - 1);

    function valToY(v) {
        if (v === null || v === undefined) v = 50;
        const norm = (v - (-50)) / 150;
        return padding.top + chartH * (1 - norm);
    }

    [-50, 0, 50, 100].forEach(level => {
        const y = valToY(level);
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', padding.left);
        line.setAttribute('y1', y);
        line.setAttribute('x2', width - padding.right);
        line.setAttribute('y2', y);
        line.setAttribute('stroke', 'rgba(255, 255, 255, 0.05)');
        svg.appendChild(line);

        const lbl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        lbl.setAttribute('x', padding.left - 10);
        lbl.setAttribute('y', y + 4);
        lbl.setAttribute('text-anchor', 'end');
        lbl.setAttribute('font-size', '10');
        lbl.setAttribute('fill', '#64748b');
        lbl.textContent = `${level}`;
        svg.appendChild(lbl);
    });

    let clusterPoints = monthlyTrend.map((m, i) => `${padding.left + i * stepX},${valToY(m.cluster_sentiment)}`);
    const clusterPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    clusterPath.setAttribute('d', `M ${clusterPoints.join(' L ')}`);
    clusterPath.setAttribute('fill', 'none');
    clusterPath.setAttribute('stroke', '#64748b');
    clusterPath.setAttribute('stroke-width', '1.5');
    clusterPath.setAttribute('stroke-dasharray', '4 4');
    svg.appendChild(clusterPath);

    let validProp = monthlyTrend.map((m, i) => ({
        x: padding.left + i * stepX,
        y: valToY(m.property_sentiment),
        ann: m.annotation,
        month: m.month,
        val: m.property_sentiment
    }));

    const propPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    propPath.setAttribute('d', `M ${validProp.map(p => `${p.x},${p.y}`).join(' L ')}`);
    propPath.setAttribute('fill', 'none');
    propPath.setAttribute('stroke', '#0ea5e9');
    propPath.setAttribute('stroke-width', '2.5');
    svg.appendChild(propPath);

    validProp.forEach(p => {
        const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        dot.setAttribute('cx', p.x);
        dot.setAttribute('cy', p.y);
        dot.setAttribute('r', p.ann ? '6' : '3.5');
        dot.setAttribute('fill', p.ann ? '#f43f5e' : '#0ea5e9');
        dot.setAttribute('stroke', '#fff');
        dot.setAttribute('stroke-width', '1.5');
        svg.appendChild(dot);

        const monthLbl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        monthLbl.setAttribute('x', p.x);
        monthLbl.setAttribute('y', height - 10);
        monthLbl.setAttribute('text-anchor', 'middle');
        monthLbl.setAttribute('font-size', '9');
        monthLbl.setAttribute('fill', '#94a3b8');
        monthLbl.textContent = p.month.replace('202', "'2");
        svg.appendChild(monthLbl);

        if (p.ann) {
            const annText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            annText.setAttribute('x', p.x);
            annText.setAttribute('y', p.y - 12);
            annText.setAttribute('text-anchor', 'middle');
            annText.setAttribute('font-size', '10');
            annText.setAttribute('font-weight', '700');
            annText.textContent = p.ann;
            svg.appendChild(annText);
        }
    });
}

function renderActionPrescriptions(aspects, prop) {
    const container = document.getElementById('prescriptions-container');
    container.innerHTML = '';

    const weakAspects = aspects.filter(a => a.classification === 'Competitive Weakness');
    const oppAspects = aspects.filter(a => a.classification === 'Market Opportunity');

    if (weakAspects.length === 0 && oppAspects.length === 0) {
        container.innerHTML = '<p style="color: #94a3b8;">Operations are well balanced against competitors.</p>';
        return;
    }

    weakAspects.forEach(w => {
        const card = document.createElement('div');
        card.className = 'glass-panel';
        card.style.padding = '1.25rem';
        card.style.borderLeft = '4px solid #f43f5e';
        card.style.marginBottom = '1rem';
        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                <h4 style="font-size: 0.95rem; font-weight: 700; color: #fb7185;">Fix Internal Lag: ${w.category}</h4>
                <span class="badge-classification rose">Deficit: ${w.competitive_gap}%</span>
            </div>
            <p style="font-size: 0.85rem; color: #cbd5e1; margin-bottom: 0.75rem;">${w.action_recommendation}</p>
            <div style="font-size: 0.78rem; color: #94a3b8; background: rgba(0,0,0,0.25); padding: 0.5rem 0.75rem; border-radius: 6px;">
                <strong>Audit Insight:</strong> Competitors maintain a <strong>${w.cluster_baseline > 0 ? '+' : ''}${w.cluster_baseline}%</strong> baseline while you lag at <strong>${w.property_score}%</strong>. Inspect specific review citations in the Evidence Drawer.
            </div>
        `;
        container.appendChild(card);
    });

    oppAspects.forEach(o => {
        const card = document.createElement('div');
        card.className = 'glass-panel';
        card.style.padding = '1.25rem';
        card.style.borderLeft = '4px solid #10b981';
        card.style.marginBottom = '1rem';
        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                <h4 style="font-size: 0.95rem; font-weight: 700; color: #34d399;">Capitalize on Market Gap: ${o.category}</h4>
                <span class="badge-classification emerald">Opportunity: +${o.competitive_gap}%</span>
            </div>
            <p style="font-size: 0.85rem; color: #cbd5e1; margin-bottom: 0.75rem;">${o.action_recommendation}</p>
            <div style="font-size: 0.78rem; color: #94a3b8; background: rgba(0,0,0,0.25); padding: 0.5rem 0.75rem; border-radius: 6px;">
                <strong>Commercial Moat:</strong> While competing properties suffer repeated traveler complaints on ${o.category}, your property performs exceptionally well. Highlight this in booking portal badges.
            </div>
        `;
        container.appendChild(card);
    });
}

// -------------------------------------------------------------
// Evidence Drawer Controller (with Hinglish & Sub-Issues)
// -------------------------------------------------------------
function openEvidenceDrawer(category, quotes) {
    const backdrop = document.getElementById('drawer-backdrop');
    const drawer = document.getElementById('evidence-drawer');
    const title = document.getElementById('drawer-category-title');
    const container = document.getElementById('drawer-cards-container');

    title.textContent = `${category} - Verbatim Review Evidence (${quotes.length})`;
    container.innerHTML = '';

    if (!quotes || quotes.length === 0) {
        container.innerHTML = '<p style="color: #94a3b8;">No direct review quotes recorded for this category.</p>';
    } else {
        quotes.forEach(q => {
            const card = document.createElement('div');
            card.className = 'evidence-card';
            const isPos = q.sentiment === 'Positive';
            card.innerHTML = `
                <div class="evidence-meta">
                    <span><strong>${q.platform}</strong> • ${q.reviewer_type}</span>
                    <span>${q.date} • Rating: ${q.rating} / 5</span>
                </div>
                <div class="evidence-quote ${isPos ? '' : 'neg'}">
                    "${q.quote}"
                </div>
                <div style="font-size: 0.78rem; color: #cbd5e1; line-height: 1.4; margin-bottom: 0.5rem;">
                    <strong>Full Context:</strong> ${q.full_text}
                </div>
                <div style="display: flex; gap: 0.4rem; flex-wrap: wrap;">
                    <span class="pill-badge ${isPos ? 'positive' : 'negative'}">${q.sentiment}</span>
                    <span class="pill-badge aspect">Aspect: ${category}</span>
                </div>
            `;
            container.appendChild(card);
        });
    }

    backdrop.classList.add('open');
    drawer.classList.add('open');
}

function initDrawerClose() {
    const backdrop = document.getElementById('drawer-backdrop');
    const drawer = document.getElementById('evidence-drawer');
    const closeBtn = document.getElementById('btn-close-drawer');

    closeBtn.addEventListener('click', close);
    backdrop.addEventListener('click', close);

    function close() {
        backdrop.classList.remove('open');
        drawer.classList.remove('open');
    }
}

// -------------------------------------------------------------
// B2G Uttarakhand Tourism Board Dashboard Functions
// -------------------------------------------------------------
async function loadTourismData() {
    try {
        const res = await fetch('/api/tourism-board');
        tourismData = await res.json();
        renderTourismDashboard(tourismData);
    } catch (err) {
        console.error('Failed to load tourism data:', err);
    }
}

function renderTourismDashboard(data) {
    document.getElementById('b2g-health-score').textContent = `${data.destination_health_score} / 100`;
    document.getElementById('b2g-total-reviews').textContent = `${data.total_reviews_analyzed} Verified Reviews`;
    document.getElementById('b2g-aspect-obs').textContent = `${data.total_aspect_observations} Observations`;

    const list = document.getElementById('bottlenecks-list-container');
    list.innerHTML = '';

    data.infrastructure_issues.forEach(issue => {
        const card = document.createElement('div');
        const sevClass = issue.severity.toLowerCase();
        card.className = `glass-panel bottleneck-card ${sevClass}`;
        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
                <div>
                    <span class="severity-pill ${sevClass}">${issue.severity} Priority</span>
                    <h3 style="font-size: 1.1rem; font-weight: 700; margin-top: 0.35rem; color: #fff;">${issue.title}</h3>
                </div>
                <span style="font-size: 0.8rem; font-weight: 700; color: #fbbf24; background: rgba(245,158,11,0.15); padding: 0.25rem 0.65rem; border-radius: 4px;">
                    ${issue.impact_metric}
                </span>
            </div>
            <p style="font-size: 0.88rem; color: #cbd5e1; margin-bottom: 1rem;">${issue.description}</p>
            <div style="background: rgba(15,23,42,0.6); padding: 0.85rem 1rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.06); margin-bottom: 0.75rem;">
                <div style="font-size: 0.82rem; color: #38bdf8; font-weight: 600; margin-bottom: 0.25rem;">
                    Recommended Authority Action:
                </div>
                <div style="font-size: 0.85rem; color: #f1f5f9;">${issue.recommended_authority_action}</div>
            </div>
            <div style="font-size: 0.75rem; color: #94a3b8; display: flex; justify-content: space-between;">
                <span><strong>Corridors Affected:</strong> ${issue.affected_corridors.join(', ')}</span>
                <span><strong>Jurisdiction:</strong> ${issue.responsible_body}</span>
            </div>
        `;
        list.appendChild(card);
    });

    const feed = document.getElementById('b2g-citations-feed');
    feed.innerHTML = '';
    data.evidence_citations.forEach(c => {
        const item = document.createElement('div');
        item.className = 'glass-panel';
        item.style.padding = '1rem';
        item.style.marginBottom = '0.75rem';
        item.innerHTML = `
            <div style="font-size: 0.75rem; color: #94a3b8; margin-bottom: 0.35rem; display: flex; justify-content: space-between;">
                <span><strong>${c.hotel}</strong> • ${c.platform}</span>
                <span>${c.date}</span>
            </div>
            <div style="font-size: 0.85rem; color: #fbbf24; font-style: italic;">
                "${c.snippet}"
            </div>
        `;
        feed.appendChild(item);
    });

    document.getElementById('btn-export-brief').addEventListener('click', openPolicyBriefModal);
}

// -------------------------------------------------------------
// Policy Brief Modal Controller
// -------------------------------------------------------------
async function openPolicyBriefModal() {
    try {
        const res = await fetch('/api/export-policy-brief');
        const brief = await res.json();

        const modal = document.getElementById('modal-policy-brief');
        const body = document.getElementById('modal-brief-content');
        
        let html = brief.content_markdown
            .replace(/^# (.*$)/gim, '<h1 style="color: #fff; font-size: 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 0.5rem; margin-top: 1rem;">$1</h1>')
            .replace(/^## (.*$)/gim, '<h2 style="color: #38bdf8; font-size: 1.25rem; margin-top: 1rem;">$1</h2>')
            .replace(/^### (.*$)/gim, '<h3 style="color: #f1f5f9; font-size: 1.1rem; margin-top: 1rem;">$1</h3>')
            .replace(/^#### (.*$)/gim, '<h4 style="color: #fbbf24; font-size: 1rem; margin-top: 0.85rem;">$1</h4>')
            .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/gim, '<em>$1</em>')
            .replace(/^\* (.*$)/gim, '<li style="margin-left: 1.5rem; margin-bottom: 0.35rem;">$1</li>')
            .replace(/\n\n/gim, '<br>');

        body.innerHTML = html;
        modal.classList.add('open');
    } catch (err) {
        console.error('Failed to load policy brief:', err);
    }
}

function initModalClose() {
    const modal = document.getElementById('modal-policy-brief');
    const closeBtn = document.getElementById('btn-close-modal');

    closeBtn.addEventListener('click', () => modal.classList.remove('open'));
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('open');
    });
}

// -------------------------------------------------------------
// Live ABSA Playground Controller (Strict Sanitization & Side-by-Side Cards)
// -------------------------------------------------------------
function initLiveTester() {
    const textarea = document.getElementById('live-review-input');
    const btnAnalyze = document.getElementById('btn-run-live-absa');
    const resultsContainer = document.getElementById('live-absa-results');
    const jsonContainer = document.getElementById('live-json-preview');
    const charCounter = document.getElementById('char-counter');

    // Real-time character counter (Max 300 Characters)
    textarea.addEventListener('input', () => {
        const len = textarea.value.length;
        charCounter.textContent = `${len} / 300 characters`;
        charCounter.className = 'char-counter';
        if (len >= 250 && len < 300) {
            charCounter.classList.add('warning');
        } else if (len >= 300) {
            charCounter.classList.add('limit');
        }
    });

    // Preset buttons
    document.querySelectorAll('.preset-pill').forEach(btn => {
        btn.addEventListener('click', () => {
            textarea.value = btn.getAttribute('data-text');
            textarea.dispatchEvent(new Event('input'));
            runAnalysis();
        });
    });

    btnAnalyze.addEventListener('click', runAnalysis);

    async function runAnalysis() {
        let text = textarea.value.trim();
        if (!text) {
            showBrandedAlert('Please enter or select a review to analyze.', 'warning');
            return;
        }

        // Strict Client-Side Sanitization
        text = text.replace(/<[^>]*>/g, '').substring(0, 300);

        btnAnalyze.textContent = 'Analyzing in Real-Time...';
        btnAnalyze.disabled = true;

        try {
            const res = await fetch('/api/analyze-live', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
            });

            const data = await res.json();
            renderLiveResults(data);
        } catch (err) {
            console.error('Live analysis failed:', err);
            resultsContainer.innerHTML = '<p style="color: #fb7185;">Failed to analyze review.</p>';
        } finally {
            btnAnalyze.innerHTML = 'Analyze Review in Real-Time';
            btnAnalyze.disabled = false;
        }
    }

    function renderLiveResults(data) {
        resultsContainer.innerHTML = '';
        jsonContainer.textContent = JSON.stringify(data, null, 2);

        if (!data.aspects || data.aspects.length === 0) {
            resultsContainer.innerHTML = '<p style="color: #94a3b8; padding: 1rem;">No specific hospitality aspects identified. Heuristic baseline active.</p>';
            return;
        }

        // Render Side-by-Side Card for Each Extracted Aspect (Part 2 Feature 2)
        data.aspects.forEach(asp => {
            const card = document.createElement('div');
            card.className = 'side-by-side-card';

            const isPos = asp.sentiment === 'Positive';
            const isNeg = asp.sentiment === 'Negative';
            const sentClass = isPos ? 'positive' : (isNeg ? 'negative' : '');

            card.innerHTML = `
                <div class="raw-review-col">
                    <div>
                        <span class="review-badge-lang">Raw Localized Input (Hindi / Hinglish / English)</span>
                        <div class="raw-review-text">"${data.input_text}"</div>
                    </div>
                    <div class="translation-box">
                        <strong>AI Semantic Interpretation:</strong><br>
                        ${asp.hinglish_translation}
                    </div>
                </div>
                <div class="classification-col">
                    <div style="font-size: 0.72rem; text-transform: uppercase; color: #94a3b8; font-weight: 700; letter-spacing: 0.05em;">
                        Engine Extracted Metadata:
                    </div>
                    <div class="classification-pills-row">
                        <span class="pill-badge aspect">Aspect: ${asp.category}</span>
                        <span class="pill-badge ${sentClass}">Sentiment: ${asp.sentiment}</span>
                        <span class="pill-badge sub-issue">Sub-Issue: ${asp.sub_issue}</span>
                        <span class="pill-badge tag">Tag: ${asp.extracted_tag}</span>
                        <span class="pill-badge confidence">Conf: ${Math.round(asp.confidence * 100)}%</span>
                    </div>
                    <div style="font-size: 0.78rem; color: #cbd5e1; background: rgba(0,0,0,0.3); padding: 0.5rem 0.75rem; border-radius: 6px;">
                        <strong>Evidence Citation:</strong> "${asp.evidence_snippet}"
                    </div>
                </div>
            `;
            resultsContainer.appendChild(card);
        });
    }
}
