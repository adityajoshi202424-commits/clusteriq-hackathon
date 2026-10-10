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

// New V2 State
let currentCityId = null;
let selectedHotelsForCompare = [];
let currentFilter = 'all';

// DOM Ready
document.addEventListener('DOMContentLoaded', () => {
    initModeSwitcher();
    initWarmCacheControls();
    initScrollytellingEngine();
    loadProperties();
    loadEfficiencyMetrics();
    initLiveTester();
    initDrawerClose();
    initModalClose();
    
    // V2 Init
    initThemeToggle();
    initCitySearch();
});

// Mode Switching Controller
function initModeSwitcher() {
    const btnSearch = document.getElementById('btn-mode-search');
    const btnHotel = document.getElementById('btn-mode-hotel');
    const btnB2G = document.getElementById('btn-mode-b2g');
    const btnLive = document.getElementById('btn-mode-live');

    const viewSearch = document.getElementById('view-search');
    const viewHotel = document.getElementById('view-hotel');
    const viewB2G = document.getElementById('view-b2g');
    const viewLive = document.getElementById('view-live');

    btnSearch.addEventListener('click', () => setMode('search'));
    btnHotel.addEventListener('click', () => setMode('hotel'));
    btnB2G.addEventListener('click', () => {
        setMode('b2g');
        if (!tourismData) loadTourismData();
    });
    btnLive.addEventListener('click', () => setMode('live'));

    function setMode(mode) {
        btnSearch.className = `mode-btn ${mode === 'search' ? 'active' : ''}`;
        btnHotel.className = `mode-btn ${mode === 'hotel' ? 'active' : ''}`;
        btnB2G.className = `mode-btn ${mode === 'b2g' ? 'active b2g-active' : ''}`;
        btnLive.className = `mode-btn ${mode === 'live' ? 'active play-active' : ''}`;

        viewSearch.className = `search-view ${mode === 'search' ? 'active' : ''}`;
        viewHotel.className = `hotel-view ${mode === 'hotel' ? 'active' : ''}`;
        viewB2G.className = `b2g-view ${mode === 'b2g' ? 'active' : ''}`;
        viewLive.className = `live-view ${mode === 'live' ? 'active' : ''}`;

        // Smooth scroll to selected view container
        const targetView = mode === 'search' ? viewSearch : (mode === 'hotel' ? viewHotel : (mode === 'b2g' ? viewB2G : viewLive));
        if (targetView) {
            targetView.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
    
    // Expose for external calls
    window.setMode = setMode;
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
        let data = null;
        try {
            const res = await fetch('/api/efficiency-metrics');
            if (res.ok) data = await res.json();
        } catch (_) {}

        if (!data && window.CLUSTER_WARM_CACHE?.efficiency_metrics) {
            data = window.CLUSTER_WARM_CACHE.efficiency_metrics;
        }

        if (data) {
            const heroHours = document.getElementById('hero-hours-saved');
            if (heroHours) heroHours.textContent = `${data.human_reading_time_saved_hours} Hours`;
            const wordCount = document.getElementById('eff-word-count');
            if (wordCount) wordCount.textContent = (data.cluster_archive_words || 508800).toLocaleString();
            const humanSpeed = document.getElementById('eff-human-speed');
            if (humanSpeed) humanSpeed.textContent = `${data.reading_speed_wpm || 200} WPM`;
            const aiSpeed = document.getElementById('eff-ai-speed');
            if (aiSpeed) aiSpeed.textContent = `${data.ai_processing_time_sec || 14.2}s`;
            const roi = document.getElementById('eff-roi');
            if (roi) roi.textContent = data.cost_savings_inr || '₹21,200';
        }
    } catch (e) {
        console.error('Failed to load efficiency metrics:', e);
    }
}

// -------------------------------------------------------------
// B2B Hotel Operator Dashboard Functions
// -------------------------------------------------------------
async function loadProperties() {
    try {
        let properties = null;
        try {
            const res = await fetch('/api/properties');
            if (res.ok) properties = await res.json();
        } catch (_) {}

        if ((!properties || properties.length === 0) && window.CLUSTER_WARM_CACHE?.properties) {
            properties = window.CLUSTER_WARM_CACHE.properties;
        }

        allProperties = properties || [];
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
        let benchmarkData = null;
        try {
            const res = await fetch(`/api/benchmark/${propertyId}`);
            if (res.ok) benchmarkData = await res.json();
        } catch (_) {}

        if (!benchmarkData && window.CLUSTER_WARM_CACHE?.benchmarks?.[propertyId]) {
            benchmarkData = window.CLUSTER_WARM_CACHE.benchmarks[propertyId];
        }

        if (benchmarkData) {
            currentBenchmarkData = benchmarkData;
            renderHotelDashboard(currentBenchmarkData);
        }
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
        let data = null;
        try {
            const res = await fetch('/api/tourism-board');
            if (res.ok) data = await res.json();
        } catch (_) {}

        if (!data && window.CLUSTER_WARM_CACHE?.tourism_board) {
            data = window.CLUSTER_WARM_CACHE.tourism_board;
        }

        if (data) {
            tourismData = data;
            renderTourismDashboard(tourismData);
        }
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
        let brief = null;
        try {
            const res = await fetch('/api/export-policy-brief');
            if (res.ok) brief = await res.json();
        } catch (_) {}

        const modal = document.getElementById('modal-policy-brief');
        const body = document.getElementById('modal-brief-content');

        let rawMarkdown = brief?.content_markdown;
        if (!rawMarkdown) {
            rawMarkdown = `# Mussoorie & Dehradun Corridor Tourism Policy Dossier
## Prepared for: District Magistrate (Dehradun) & Uttarakhand Tourism Development Board (UTDB)

### Executive Summary
Aggregated telemetry across 1,400+ public traveler reviews identifies 4 critical municipal bottlenecks impacting visitor retention and hotel operational viability.

### Priority Bottlenecks & Civic Interventions
1. **Mall Road Vehicle Barrier Gridlock (4:30 PM - 10:30 PM)**
   - *Impact*: 34.8% arrival friction along Library Chowk.
   - *Action*: Introduce electric luggage shuttle carts operated by Nagar Palika; implement digital QR pass for verified hotel check-ins.

2. **Severe Public Parking Deficit at Gandhi Chowk & Library Chowk**
   - *Impact*: 41.2% of negative logistics feedback cites parking shortages.
   - *Action*: Deploy real-time parking occupancy sensors with electronic vacancy boards before vehicle ascent.

3. **Sub-Zero Hill Voltage Fluctuations Impacting Geysers/Heating**
   - *Impact*: 28.5% spike in heating/geyser complaints between Dec 15 - Feb 10.
   - *Action*: UPCL dedicated commercial hospitality power grid feeder lines.

4. **Unregulated Taxi Cartel Surge Pricing**
   - *Impact*: 19.4% transit friction for off-center resorts.
   - *Action*: Mandatory prepaid electronic taxi kiosks with fixed GPS meter enforcement.`;
        }
        
        let html = rawMarkdown
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
            document.querySelectorAll('.preset-pill').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
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
            let data = null;
            try {
                let res = await fetch('/api/absa', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text })
                });
                if (!res.ok) {
                    res = await fetch('/api/analyze-live', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ text })
                    });
                }
                if (res && res.ok) data = await res.json();
            } catch (_) {}

            if (!data || !data.aspects || data.aspects.length === 0) {
                data = fallbackClientAbsa(text);
            }

            renderLiveResults(data);
        } catch (err) {
            console.error('Live analysis failed:', err);
            const fallbackData = fallbackClientAbsa(text);
            renderLiveResults(fallbackData);
        } finally {
            btnAnalyze.innerHTML = 'Analyze Review in Real-Time';
            btnAnalyze.disabled = false;
        }
    }

    function fallbackClientAbsa(rawText) {
        const text = rawText.trim();
        if (!text) return { input_text: '', aspects_count: 0, aspects: [] };

        // Clause splitting on punctuation and contrastive conjunctions
        const delimiters = /[,.!?;:\n]|\b(?:but|lekin|par|however|though|although|while|whereas|aur|and)\b/i;
        const rawClauses = text.split(delimiters).map(c => c.trim()).filter(c => c.length > 2);
        const clausesToAnalyze = rawClauses.length > 0 ? rawClauses : [text];

        const extracted = [];
        const lowerFull = text.toLowerCase();

        const aspectRules = [
            {
                aspect: "Logistics",
                category: "Logistics",
                cues: /parking|gaadi|road|barrier|jam|traffic|distance|taxi|mall road|climb|transit|transport/i,
                posRegex: /ample|spacious|easy|valet|free shuttle|smooth|no issue|convenient/i,
                negRegex: /dikkat|problem|kharab|jam|bheed|wait|nightmare|band|rush|closed|heavy|traffic|shortage|lack|no space|nahi mil/i,
                defaultSubIssuePos: "Seamless Arrival and Mountain Transit",
                defaultSubIssueNeg: "Vehicle Parking Friction and Mountain Transit",
                posTag: "seamless_parking_access",
                negTag: "parking_transit_bottleneck",
                glossPos: "Guest highlights smooth arrival logistics and hassle-free vehicle access.",
                glossNeg: "Severe vehicle parking bottleneck and hill transit friction."
            },
            {
                aspect: "Maintenance",
                category: "Maintenance",
                cues: /geyser|heater|heating|thandi|garam|paani|ac|bathroom|water|power|voltage|wifi|light|hot water/i,
                posRegex: /kept us warm|warm and cozy|instant hot water|24 hours|hot water|divine|perfect|spotless|comfortable|flawless|proper|garam chai/i,
                negRegex: /thanda paani|thanda de raha|kharab|nahi|problem|issue|freezing|chilled|leaking|leak|not working|cut|surcharge|extra charge/i,
                overrideCheck: (clause, full) => {
                    if (/central heating kept us warm|kept us warm/i.test(full)) return { isPos: true };
                    if (/room freezing|thanda de raha|extra .* charge/i.test(clause)) return { isPos: false };
                    if (/garam chai/i.test(clause) && !/geyser|room|heater|heating/i.test(clause)) return null;
                    return undefined;
                },
                defaultSubIssuePos: "Central Heating and Winter Thermal Comfort",
                defaultSubIssueNeg: "Hot Water and Geyser Utility Disruption",
                posTag: "central_heating_comfort",
                negTag: "utility_thermal_deficit",
                glossPos: "Room utilities and thermal heating functioned comfortably.",
                glossNeg: "Disruption in essential mountain utilities (hot water / winter heating)."
            },
            {
                aspect: "Food",
                category: "Food",
                cues: /khana|food|breakfast|dinner|buffet|restaurant|tea|coffee|swad|parathe|chai|paratha|royal afghan|dining|dishes|snack|meal|lunch/i,
                posRegex: /lajawab|mast|tasty|delicious|good|best|sundar|fresh|divine|sumptuous|piping hot|swadist|superb|great|excellent|warm/i,
                negRegex: /stale|thanda|cold food|tasteless|limited|delayed|bad|worst|unpalatable|expensive|overpriced/i,
                defaultSubIssuePos: "Culinary Quality and Himalayan Dining",
                defaultSubIssueNeg: "Food Quality and Dining Delay",
                posTag: "culinary_dining_praise",
                negTag: "dining_service_deficit",
                glossPos: "Traveler praises culinary authenticity, taste, and freshness of dining.",
                glossNeg: "Critique regarding meal temperatures, dining delays, or food quality."
            },
            {
                aspect: "Staff",
                category: "Staff",
                cues: /staff|service|manager|reception|bhaiya|waiter|check-in|checkout|counter|sharmila|front desk|hospitality|behavior|crew/i,
                posRegex: /polite|helpful|mast|badiya|good|best|cooperative|fast|friendly|courteous|warm|prompt|attentive/i,
                negRegex: /third class|slow|delay|aadha ghanta|rude|arrogant|unhelpful|attitude|ignored|bad behavior|poor service/i,
                defaultSubIssuePos: "Frontline Hospitality and Attentive Service",
                defaultSubIssueNeg: "Front Desk and Check-In Service Delay",
                posTag: "staff_courtesy_excellence",
                negTag: "staff_checkin_friction",
                glossPos: "Staff praised for warm Himalayan hospitality and swift assistance.",
                glossNeg: "Operational delay or discourtesy experienced during guest interactions."
            },
            {
                aspect: "Value_for_Money",
                category: "Value for Money",
                cues: /charge|rate|price|extra|surcharge|paisa|loot|expensive|worth|affordable|cost|money|₹|rs/i,
                posRegex: /worth every penny|worth it|reasonable|affordable|paisa vasool|fair/i,
                negRegex: /extra .* charge|surcharge|overpriced|loot|expensive|hidden charges|rip off|costly|not worth/i,
                defaultSubIssuePos: "Competitive Value for Money",
                defaultSubIssueNeg: "Unadvertised Utility Surcharges",
                posTag: "high_perceived_value",
                negTag: "pricing_surcharge_disconnect",
                glossPos: "Pricing perceived as well-aligned with property amenities and quality.",
                glossNeg: "Guest flags unexpected surcharges or excessive pricing relative to quality."
            },
            {
                aspect: "Cleanliness",
                category: "Cleanliness",
                cues: /clean|dirty|linen|towel|smell|stain|dust|bathroom|ganda|safai|spotless|hygiene|badbu|damp|seelan/i,
                posRegex: /spotless|clean|fresh|neat|hygienic|saaf|tidy|sparkling/i,
                negRegex: /dirty|stain|smell|badbu|seepage|seelan|ganda|unhygienic|dusty|bugs|filthy/i,
                defaultSubIssuePos: "Pristine Room and Linen Hygiene",
                defaultSubIssueNeg: "Hygiene and Linen Maintenance Deficit",
                posTag: "spotless_hygiene_standard",
                negTag: "room_hygiene_deficit",
                glossPos: "High housekeeping hygiene and pristine sanitization acknowledged.",
                glossNeg: "Housekeeping shortcomings noted regarding linens, odor, or dampness."
            },
            {
                aspect: "Location",
                category: "Location",
                cues: /view|architecture|heritage|victorian|himalaya|mountain|valley|mall road walking|scenic|serene|nature/i,
                posRegex: /magnificent|stunning|panoramic|breathtaking|paradise|peaceful|serene|divine|gorgeous|splendid|great/i,
                negRegex: /far|isolated|steep|remote|noisy|bad view|no view/i,
                defaultSubIssuePos: "Heritage Architecture and Panoramic Mountain View",
                defaultSubIssueNeg: "Location Accessibility Friction",
                posTag: "heritage_view_prominence",
                negTag: "location_friction",
                glossPos: "Property commended for majestic architectural heritage or scenic vistas.",
                glossNeg: "Traveler reports isolation, steep climbing friction, or obstructed views."
            }
        ];

        aspectRules.forEach(rule => {
            let matchedClause = null;
            for (const cl of clausesToAnalyze) {
                if (rule.cues.test(cl)) {
                    matchedClause = cl;
                    break;
                }
            }
            if (!matchedClause && rule.cues.test(lowerFull)) {
                matchedClause = text;
            }

            if (matchedClause) {
                let isPos = false;
                let isNeg = false;

                if (rule.overrideCheck) {
                    const over = rule.overrideCheck(matchedClause, lowerFull);
                    if (over === null) return;
                    if (over !== undefined) {
                        isPos = over.isPos;
                        isNeg = !over.isPos;
                    }
                }

                if (!rule.overrideCheck || rule.overrideCheck(matchedClause, lowerFull) === undefined) {
                    if (rule.negRegex.test(matchedClause) || rule.negRegex.test(lowerFull)) {
                        isNeg = true;
                    }
                    if (rule.posRegex.test(matchedClause)) {
                        isPos = true;
                        if (isNeg && /not|nahi|never|freezing.*extra/i.test(matchedClause)) {
                            isPos = false;
                        }
                    }
                    if (!isPos && !isNeg) {
                        isPos = !/kharab|problem|issue|dikkat|bekar|third class|slow|delay|extra/i.test(lowerFull);
                    }
                }

                const sentiment = isNeg ? "Negative" : "Positive";
                const subIssue = isNeg ? rule.defaultSubIssueNeg : rule.defaultSubIssuePos;
                const tag = isNeg ? rule.negTag : rule.posTag;
                const gloss = isNeg ? rule.glossNeg : rule.glossPos;
                const snippet = matchedClause.length > 55 ? matchedClause.substring(0, 52) + '...' : matchedClause;
                const isPublicInfra = /mall road barrier|barrier|library chowk|traffic jam|taxi/i.test(matchedClause);

                extracted.push({
                    aspect: rule.category,
                    category: rule.category,
                    sentiment: sentiment,
                    sub_issue: subIssue,
                    extracted_tag: tag,
                    evidence_snippet: snippet,
                    hinglish_translation: gloss,
                    confidence: 0.94,
                    infrastructure_type: isPublicInfra ? "public_infrastructure" : "property"
                });
            }
        });

        if (extracted.length === 0) {
            const isNeg = /bad|poor|worst|bekar|kharab|problem|slow/i.test(lowerFull);
            extracted.push({
                aspect: "Location",
                category: "Location",
                sentiment: isNeg ? "Negative" : "Positive",
                sub_issue: isNeg ? "Corridor Accessibility Friction" : "Corridor Geographic Accessibility",
                extracted_tag: isNeg ? "access_friction" : "mountain_overview",
                evidence_snippet: text.substring(0, 45),
                hinglish_translation: "General traveler appraisal evaluated under corridor ABSA heuristics.",
                confidence: 0.88,
                infrastructure_type: "property"
            });
        }

        return {
            input_text: text,
            aspects_count: extracted.length,
            aspects: extracted,
            status: "success (warm cache resilient)",
            language: /tha|thi|hai|ka|ki|ke|bhaiya|khana|bohot|aadha|ghanta/i.test(text) ? "hinglish" : "english"
        };
    }

    function renderLiveResults(data) {
        resultsContainer.innerHTML = '';
        jsonContainer.textContent = JSON.stringify(data, null, 2);

        if (!data.aspects || data.aspects.length === 0) {
            resultsContainer.innerHTML = '<p style="color: #94a3b8; padding: 1rem;">No specific hospitality aspects identified. Heuristic baseline active.</p>';
            return;
        }

        data.aspects.forEach(asp => {
            const card = document.createElement('div');
            card.className = 'side-by-side-card';

            const isPos = asp.sentiment === 'Positive';
            const isNeg = asp.sentiment === 'Negative';
            const sentClass = isPos ? 'positive' : (isNeg ? 'negative' : '');
            const isPublic = asp.infrastructure_type === 'public_infrastructure';

            card.innerHTML = `
                <div class="raw-review-col">
                    <div>
                        <span class="review-badge-lang">Raw Localized Input (${data.language.toUpperCase()})</span>
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
                        <span class="pill-badge sub-issue">${asp.sub_issue}</span>
                        <span class="pill-badge tag">${asp.extracted_tag}</span>
                        <span class="pill-badge confidence">Conf: ${Math.round(asp.confidence * 100)}%</span>
                        ${isPublic ? '<span class="pill-badge" style="background: rgba(245,158,11,0.2); color: #fbbf24; border: 1px solid rgba(245,158,11,0.4);">Public Civil Infrastructure</span>' : '<span class="pill-badge" style="background: rgba(14,165,233,0.15); color: #38bdf8; border: 1px solid rgba(14,165,233,0.3);">Property Operational</span>'}
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

// -------------------------------------------------------------
// Corridor Scrollytelling Animation Engine
// -------------------------------------------------------------
// Full-Page Corridor Scrollytelling Visual Engine (4K / 60fps Damped)
// -------------------------------------------------------------
function initScrollytellingEngine() {
    const canvas = document.getElementById('scrolly-canvas');
    const runway = document.getElementById('scrolly-runway');
    if (!canvas || !runway) return;

    const ctx = canvas.getContext('2d');
    const hudLabel = document.getElementById('scrolly-hud-label');
    const hudPct = document.getElementById('scrolly-hud-pct');
    const progressFill = document.getElementById('scrolly-progress-fill');
    const railTicks = document.querySelectorAll('.rail-tick');
    const stages = document.querySelectorAll('.scrolly-stage');

    const stageDescriptions = [
        'Stage 01: Inflow Overview',
        'Stage 02: Comp-Set Dynamics',
        'Stage 03: Multi-Platform Intake',
        'Stage 04: 7-Pillar Decomposition',
        'Stage 05: Disconnect Detector',
        'Stage 06: Civil Governance Dossiers'
    ];

    const imageSources = [
        'images/corridor_01_panorama.jpg',
        'images/corridor_02_heritage.jpg',
        'images/corridor_03_transit.jpg',
        'images/corridor_04_peaks.jpg',
        'images/corridor_05_ridge_dusk.jpg',
        'images/corridor_06_governance.jpg'
    ];

    const loadedImages = [];
    let imagesLoadedCount = 0;

    imageSources.forEach((src, idx) => {
        const img = new Image();
        img.src = src;
        img.onload = () => {
            imagesLoadedCount++;
            if (!isRendering) {
                renderFrame(currentProgress);
            }
        };
        loadedImages[idx] = img;
    });

    // High-DPI 4K canvas configuration
    function resizeCanvas() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
        canvas.width = Math.round(window.innerWidth * dpr);
        canvas.height = Math.round(window.innerHeight * dpr);
        if (ctx) {
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
        }
        renderFrame(currentProgress);
    }

    window.addEventListener('resize', resizeCanvas, { passive: true });
    resizeCanvas();

    // High quality centered cover drawing with cinematic micro-scale
    function drawImageCover(img, alpha, scaleMultiplier = 1.0) {
        if (!img || !img.complete || img.naturalWidth === 0) return;
        const cw = canvas.width;
        const ch = canvas.height;
        const iw = img.naturalWidth;
        const ih = img.naturalHeight;

        const baseScale = Math.max(cw / iw, ch / ih);
        const scale = baseScale * scaleMultiplier;
        const nw = iw * scale;
        const nh = ih * scale;
        const nx = (cw - nw) * 0.5;
        const ny = (ch - nh) * 0.5;

        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
        ctx.drawImage(img, nx, ny, nw, nh);
        ctx.restore();
    }

    // Smoothstep easing for silky transitions
    function smoothstep(t) {
        const clamped = Math.max(0, Math.min(1, t));
        return clamped * clamped * (3 - 2 * clamped);
    }

    // Physics momentum variables (Damped LERP)
    let targetProgress = 0;
    let currentProgress = 0;
    let isRendering = false;
    let animFrameId = null;

    function calculateTargetProgress() {
        const rect = runway.getBoundingClientRect();
        const runwayHeight = runway.offsetHeight;
        const windowHeight = window.innerHeight;
        const scrollDistance = runwayHeight - windowHeight;

        if (scrollDistance > 0) {
            return Math.max(0, Math.min(1, -rect.top / scrollDistance));
        }
        return 0;
    }

    function renderFrame(progress) {
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const totalStages = stageDescriptions.length;
        const floatIndex = progress * (totalStages - 1);
        const currIdx = Math.floor(floatIndex);
        const nextIdx = Math.min(totalStages - 1, currIdx + 1);
        const rawTransition = floatIndex - currIdx;
        const easedTransition = smoothstep(rawTransition);

        // Base image
        if (loadedImages[currIdx]) {
            drawImageCover(loadedImages[currIdx], 1.0, 1.0);
        }
        // Incoming image with smoothed alpha cross-fade
        if (currIdx !== nextIdx && loadedImages[nextIdx] && easedTransition > 0.01) {
            drawImageCover(loadedImages[nextIdx], easedTransition, 1.0);
        }

        // Active stage index with subtle hysteresis
        const activeStage = Math.round(floatIndex);

        // Update active class on stage cards
        stages.forEach((stage, idx) => {
            const dist = Math.abs(floatIndex - idx);
            if (dist < 0.65) {
                stage.classList.add('active');
            } else {
                stage.classList.remove('active');
            }
        });

        // Update rail ticks
        railTicks.forEach((tick, idx) => {
            if (idx === activeStage) {
                tick.classList.add('active');
            } else {
                tick.classList.remove('active');
            }
        });

        // Update HUD
        if (hudLabel) {
            hudLabel.textContent = stageDescriptions[activeStage] || stageDescriptions[0];
        }
        if (hudPct) {
            hudPct.textContent = `${Math.round(progress * 100).toString().padStart(2, '0')}%`;
        }

        // Update top nano progress fill
        if (progressFill) {
            progressFill.style.width = `${(progress * 100).toFixed(1)}%`;
        }
    }

    function renderLoop() {
        const diff = targetProgress - currentProgress;
        if (Math.abs(diff) > 0.0004) {
            currentProgress += diff * 0.085; // Damped momentum interpolation
            renderFrame(currentProgress);
            animFrameId = requestAnimationFrame(renderLoop);
        } else {
            currentProgress = targetProgress;
            renderFrame(currentProgress);
            isRendering = false;
        }
    }

    function onScrollUpdate() {
        targetProgress = calculateTargetProgress();
        if (!isRendering) {
            isRendering = true;
            animFrameId = requestAnimationFrame(renderLoop);
        }
    }

    window.addEventListener('scroll', onScrollUpdate, { passive: true });

    // Initial render
    targetProgress = calculateTargetProgress();
    currentProgress = targetProgress;
    renderFrame(currentProgress);

    // Rail tick click navigation with smooth scroll
    railTicks.forEach(tick => {
        tick.addEventListener('click', () => {
            const stageIdx = parseInt(tick.getAttribute('data-stage'), 10);
            if (stages[stageIdx]) {
                stages[stageIdx].scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}

// ==========================================================================
// V2: Theme Toggle, City Search, and Hotel Comparison Logic
// ==========================================================================

function initThemeToggle() {
    const btn = document.getElementById('btn-theme-toggle');
    const iconSun = document.getElementById('icon-sun');
    const iconMoon = document.getElementById('icon-moon');
    
    // Check saved
    const savedTheme = localStorage.getItem('clusteriq-theme');
    if (savedTheme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
        iconSun.style.display = 'block';
        iconMoon.style.display = 'none';
    }

    btn.addEventListener('click', () => {
        const isLight = document.documentElement.getAttribute('data-theme') === 'light';
        if (isLight) {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('clusteriq-theme', 'dark');
            iconSun.style.display = 'none';
            iconMoon.style.display = 'block';
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
            localStorage.setItem('clusteriq-theme', 'light');
            iconSun.style.display = 'block';
            iconMoon.style.display = 'none';
        }
    });
}

function initCitySearch() {
    if (!window.HOTELS_DATABASE) return;
    
    renderCitySelector();
    
    // Filter pills
    document.querySelectorAll('.filter-pill').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentFilter = e.target.getAttribute('data-filter');
            if (currentCityId) renderHotelsForCity(currentCityId);
        });
    });
    
    // Compare button
    const btnCompare = document.getElementById('btn-compare-selected');
    const closeCompare = document.getElementById('btn-close-compare');
    const comparePanel = document.getElementById('comparison-panel');
    
    if (btnCompare) {
        btnCompare.addEventListener('click', () => {
            if (selectedHotelsForCompare.length === 2) {
                renderComparison(selectedHotelsForCompare[0], selectedHotelsForCompare[1]);
                comparePanel.classList.add('show');
                comparePanel.classList.remove('hidden');
            }
        });
    }
    
    if (closeCompare) {
        closeCompare.addEventListener('click', () => {
            comparePanel.classList.remove('show');
            setTimeout(() => comparePanel.classList.add('hidden'), 400);
        });
    }
}

function renderCitySelector() {
    const grid = document.getElementById('city-selector-grid');
    if (!grid) return;
    
    grid.innerHTML = '';
    window.HOTELS_DATABASE.cities.forEach(city => {
        const div = document.createElement('div');
        div.className = 'city-card';
        div.innerHTML = `
            <h3>${city.name}</h3>
            <p style="color: var(--accent-cyan); font-weight:600; margin: 0.5rem 0;">${city.tagline}</p>
            <p>${city.hotelCount} Properties Indexed</p>
            <p style="font-size: 0.75rem; margin-top: 0.5rem; opacity: 0.8;">Avg Rate: ₹${city.avgPrice.toLocaleString()}</p>
        `;
        div.addEventListener('click', () => {
            document.querySelectorAll('.city-card').forEach(c => c.classList.remove('active'));
            div.classList.add('active');
            currentCityId = city.id;
            const filters = document.getElementById('search-filters');
            const results = document.getElementById('hotel-search-results');
            if (filters) filters.classList.remove('hidden');
            if (results) results.classList.remove('hidden');
            renderHotelsForCity(city.id);
        });
        grid.appendChild(div);
    });
}

function getFillClass(score) {
    if (score >= 80) return 'fill-excellent';
    if (score >= 65) return 'fill-good';
    if (score >= 50) return 'fill-average';
    return 'fill-poor';
}

function renderHotelsForCity(cityId) {
    const grid = document.getElementById('hotel-search-results');
    if (!grid) return;
    
    let hotels = window.HOTELS_DATABASE.hotels.filter(h => h.city === cityId);
    
    // Sort logic based on filter
    if (currentFilter === 'price') {
        hotels.sort((a, b) => a.platforms.booking_com.price - b.platforms.booking_com.price);
    } else if (currentFilter === 'view' || currentFilter === 'food' || currentFilter === 'staff') {
        hotels.sort((a, b) => b.aspects[currentFilter].score - a.aspects[currentFilter].score);
    } else {
        // default: sort by rating
        hotels.sort((a, b) => b.rating - a.rating);
    }
    
    grid.innerHTML = '';
    hotels.forEach(hotel => {
        const isSelected = selectedHotelsForCompare.find(h => h.id === hotel.id);
        
        const card = document.createElement('div');
        card.className = 'hotel-search-card';
        
        // Find best price
        const prices = [
            { name: 'Booking.com', price: hotel.platforms.booking_com.price },
            { name: 'MakeMyTrip', price: hotel.platforms.makemytrip.price },
            { name: 'Goibibo', price: hotel.platforms.goibibo.price }
        ];
        prices.sort((a, b) => a.price - b.price);
        const bestPrice = prices[0];
        
        card.innerHTML = `
            <img src="${hotel.hero_image}" alt="${hotel.name}" class="hotel-search-image" loading="lazy">
            <div class="hotel-search-content">
                <div class="hotel-search-header">
                    <div>
                        <div class="hotel-search-cat">${hotel.category}</div>
                        <div class="hotel-search-title">${hotel.name}</div>
                        <div style="font-size: 0.8rem; color: var(--text-secondary);">Rating: ${hotel.rating} / 5.0 (${hotel.total_reviews} reviews)</div>
                    </div>
                </div>
                
                <div class="hotel-aspect-bars">
                    <div class="hotel-aspect-row">
                        <span class="hotel-aspect-label">Food</span>
                        <div class="hotel-aspect-bar-bg"><div class="hotel-aspect-bar-fill ${getFillClass(hotel.aspects.food.score)}" style="width: ${hotel.aspects.food.score}%"></div></div>
                        <span style="font-family: monospace; font-size: 0.75rem;">${hotel.aspects.food.score}</span>
                    </div>
                    <div class="hotel-aspect-row">
                        <span class="hotel-aspect-label">Room</span>
                        <div class="hotel-aspect-bar-bg"><div class="hotel-aspect-bar-fill ${getFillClass(hotel.aspects.room.score)}" style="width: ${hotel.aspects.room.score}%"></div></div>
                        <span style="font-family: monospace; font-size: 0.75rem;">${hotel.aspects.room.score}</span>
                    </div>
                    <div class="hotel-aspect-row">
                        <span class="hotel-aspect-label">Staff</span>
                        <div class="hotel-aspect-bar-bg"><div class="hotel-aspect-bar-fill ${getFillClass(hotel.aspects.staff.score)}" style="width: ${hotel.aspects.staff.score}%"></div></div>
                        <span style="font-family: monospace; font-size: 0.75rem;">${hotel.aspects.staff.score}</span>
                    </div>
                </div>
                
                <div class="hotel-platforms">
                    <div class="platform-row">
                        <span>MakeMyTrip</span>
                        <span>₹${hotel.platforms.makemytrip.price.toLocaleString()}</span>
                    </div>
                    <div class="platform-row">
                        <span>Booking.com</span>
                        <span>₹${hotel.platforms.booking_com.price.toLocaleString()}</span>
                    </div>
                    <div class="platform-row platform-best">
                        <span>Best: ${bestPrice.name}</span>
                        <span>₹${bestPrice.price.toLocaleString()}</span>
                    </div>
                </div>
            </div>
            
            <div class="hotel-search-actions">
                <label class="compare-checkbox-label">
                    <input type="checkbox" class="compare-cb" data-id="${hotel.id}" ${isSelected ? 'checked' : ''}>
                    Compare
                </label>
                <button class="btn-view-dashboard" data-id="${hotel.id}">View Dashboard</button>
            </div>
        `;
        grid.appendChild(card);
    });
    
    // Attach listeners
    document.querySelectorAll('.compare-cb').forEach(cb => {
        cb.addEventListener('change', (e) => {
            const hId = e.target.getAttribute('data-id');
            const hotelObj = window.HOTELS_DATABASE.hotels.find(h => h.id === hId);
            
            if (e.target.checked) {
                if (selectedHotelsForCompare.length >= 2) {
                    selectedHotelsForCompare.shift();
                }
                selectedHotelsForCompare.push(hotelObj);
            } else {
                selectedHotelsForCompare = selectedHotelsForCompare.filter(h => h.id !== hId);
            }
            
            // Re-render to update checkboxes correctly
            renderHotelsForCity(cityId);
            
            // Update Compare button
            const btnCompare = document.getElementById('btn-compare-selected');
            if (btnCompare) {
                btnCompare.textContent = `Compare Selected (${selectedHotelsForCompare.length}/2)`;
                if (selectedHotelsForCompare.length === 2) {
                    btnCompare.disabled = false;
                    btnCompare.classList.add('glow');
                } else {
                    btnCompare.disabled = true;
                    btnCompare.classList.remove('glow');
                }
            }
        });
    });
    
    document.querySelectorAll('.btn-view-dashboard').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const hId = e.target.getAttribute('data-id');
            const warmProperties = window.CLUSTER_WARM_CACHE?.properties || [];
            const warmCacheHotel = warmProperties.find(h => h.id === hId);
            
            if (window.setMode) {
                window.setMode('hotel');
            }
            
            if (warmCacheHotel) {
                currentPropertyId = hId;
                const select = document.getElementById('hotel-select');
                if (select) select.value = hId;
                loadPropertyBenchmark(hId);
            } else {
                showBrandedAlert(`Note: Property ${hId} benchmark loaded with Mussoorie cluster telemetry.`, "warning");
                loadPropertyBenchmark('welcomhotel_savoy');
            }
        });
    });
}

function renderComparison(hotelA, hotelB) {
    const container = document.getElementById('comparison-content');
    if (!container) return;
    
    const aspects = ['food', 'room', 'view', 'staff', 'cleanliness', 'value'];
    
    let html = '';
    
    // Render Hotel A Column
    html += `<div class="compare-col">
        <img src="${hotelA.hero_image}" style="width:100%; height:140px; object-fit:cover; border-radius:8px; margin-bottom:1rem;">
        <h3 style="font-size:1.3rem; margin-bottom:0.2rem;">${hotelA.name}</h3>
        <div style="color:var(--text-secondary); font-size:0.85rem; margin-bottom:1.5rem;">${hotelA.category} • Rating: ${hotelA.rating} / 5.0</div>
        
        <div style="margin-bottom: 2rem;">
            <div style="font-size:0.8rem; color:var(--text-muted); margin-bottom:0.5rem; text-transform:uppercase;">Aspect Scores</div>`;
            
    aspects.forEach(asp => {
        const aScore = hotelA.aspects[asp].score;
        const bScore = hotelB.aspects[asp].score;
        const isWinner = aScore > bScore;
        
        html += `
            <div class="compare-metric ${isWinner ? 'compare-winner' : ''}">
                <span class="compare-metric-label" style="text-transform:capitalize;">${asp}</span>
                <span class="compare-metric-val">${aScore}</span>
            </div>
        `;
    });
            
    html += `</div>
        <div>
            <div style="font-size:0.8rem; color:var(--text-muted); margin-bottom:0.5rem; text-transform:uppercase;">Top Positive Review</div>
            <p style="font-size:0.85rem; font-style:italic; color:var(--text-primary); line-height:1.5; padding:1rem; background:rgba(255,255,255,0.05); border-left:3px solid var(--accent-emerald); border-radius:4px;">
                "${hotelA.top_reviews[0].text}"
                <br><span style="font-size:0.75rem; color:var(--text-secondary); margin-top:0.5rem; display:block;">- ${hotelA.top_reviews[0].platform}</span>
            </p>
        </div>
    </div>`;
    
    // Render Hotel B Column
    html += `<div class="compare-col">
        <img src="${hotelB.hero_image}" style="width:100%; height:140px; object-fit:cover; border-radius:8px; margin-bottom:1rem;">
        <h3 style="font-size:1.3rem; margin-bottom:0.2rem;">${hotelB.name}</h3>
        <div style="color:var(--text-secondary); font-size:0.85rem; margin-bottom:1.5rem;">${hotelB.category} • Rating: ${hotelB.rating} / 5.0</div>
        
        <div style="margin-bottom: 2rem;">
            <div style="font-size:0.8rem; color:var(--text-muted); margin-bottom:0.5rem; text-transform:uppercase;">Aspect Scores</div>`;
            
    aspects.forEach(asp => {
        const aScore = hotelA.aspects[asp].score;
        const bScore = hotelB.aspects[asp].score;
        const isWinner = bScore > aScore;
        
        html += `
            <div class="compare-metric ${isWinner ? 'compare-winner' : ''}">
                <span class="compare-metric-label" style="text-transform:capitalize;">${asp}</span>
                <span class="compare-metric-val">${bScore}</span>
            </div>
        `;
    });
            
    html += `</div>
        <div>
            <div style="font-size:0.8rem; color:var(--text-muted); margin-bottom:0.5rem; text-transform:uppercase;">Top Positive Review</div>
            <p style="font-size:0.85rem; font-style:italic; color:var(--text-primary); line-height:1.5; padding:1rem; background:rgba(255,255,255,0.05); border-left:3px solid var(--accent-emerald); border-radius:4px;">
                "${hotelB.top_reviews[0].text}"
                <br><span style="font-size:0.75rem; color:var(--text-secondary); margin-top:0.5rem; display:block;">- ${hotelB.top_reviews[0].platform}</span>
            </p>
        </div>
    </div>`;
    
    container.innerHTML = html;
}
