/* charts.js
   ROI and Recovery canvas charts separated for clarity.
*/
(function initCharts() {
  const roiCanvas = document.getElementById('roiChart');
  if (roiCanvas && roiCanvas.getContext) {
    const ctx = roiCanvas.getContext('2d');
    const DPR = window.devicePixelRatio || 1;
    function resize() {
      const rect = roiCanvas.getBoundingClientRect();
      roiCanvas.width = rect.width * DPR;
      roiCanvas.height = rect.height * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    const points = 60;
    const scenarioA = Array.from({length: points}, (_,i) => 0.4 + 0.45 * Math.sin((i/points)*Math.PI*1.2 + 0.2));
    const scenarioB = Array.from({length: points}, (_,i) => 0.3 + 0.35 * Math.sin((i/points)*Math.PI*1.1 + 0.5));
    const scenarioC = Array.from({length: points}, (_,i) => 0.2 + 0.18 * Math.sin((i/points)*Math.PI*0.9 + 0.9));

    let t = 0;
    function draw() {
      const W = roiCanvas.width / DPR;
      const H = roiCanvas.height / DPR;
      ctx.clearRect(0,0,W,H);
      ctx.save();
      ctx.fillStyle = 'rgba(5,12,22,0.45)';
      ctx.fillRect(0,0,W,H);
      ctx.strokeStyle = 'rgba(255,255,255,0.02)';
      ctx.lineWidth = 1;
      for (let i=0;i<6;i++){ const y = H - (i/5)*H; ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }
      ctx.restore();

      function drawScenario(data, gradientColors, glowStrength) {
        const grad = ctx.createLinearGradient(0,0,W,0);
        grad.addColorStop(0, gradientColors[0]);
        grad.addColorStop(1, gradientColors[1]);
        ctx.lineWidth = 3;
        ctx.strokeStyle = grad;
        ctx.shadowColor = gradientColors[1];
        ctx.shadowBlur = 14 * glowStrength * (0.8 + 0.2*Math.sin(t/16));
        ctx.beginPath();
        data.forEach((val, idx) => {
          const x = (idx/(data.length-1)) * W * 0.98 + W*0.01;
          const y = H - val * (H*0.75) - H*0.12;
          if (idx===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
        });
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 0.06;
        ctx.fillStyle = grad;
        ctx.beginPath();
        data.forEach((val, idx) => {
          const x = (idx/(data.length-1)) * W * 0.98 + W*0.01;
          const y = H - val * (H*0.75) - H*0.12;
          if (idx===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
        });
        ctx.lineTo(W,H); ctx.lineTo(0,H); ctx.closePath(); ctx.fill();
        ctx.globalAlpha = 1;
      }

      drawScenario(scenarioA.map((v,i)=>v*(0.9+0.06*Math.sin(t/14 + i/10))), ['#ff8c42', '#ffd38a'], 1.0);
      drawScenario(scenarioB.map((v,i)=>v*(0.92+0.04*Math.cos(t/18 + i/12))), ['#7be3ff', '#00a8c5'], 0.8);
      drawScenario(scenarioC.map((v,i)=>v*(0.96+0.03*Math.sin(t/20 + i/14))), ['#9eff9e', '#00a8c5'], 0.6);

      const latestX = W * 0.98;
      const pulse = 1 + 0.12 * Math.sin(t/6);
      [['#ff8c42', scenarioA[points-1]], ['#00a8c5', scenarioB[points-1]], ['#7be87b', scenarioC[points-1]]].forEach((item, idx) => {
        const color = item[0]; const val = item[1];
        const x = latestX - idx*8; const y = H - val * (H*0.75) - H*0.12;
        ctx.beginPath(); ctx.fillStyle = color; ctx.globalAlpha = 0.14 * pulse; ctx.arc(x, y, 22 * pulse * (1 - idx*0.12), 0, Math.PI*2); ctx.fill();
        ctx.globalAlpha = 1; ctx.beginPath(); ctx.fillStyle = color; ctx.arc(x, y, 6 * (1 - idx*0.08), 0, Math.PI*2); ctx.fill();
      });

      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = '12px Cairo, sans-serif';
      // localized axis label
      const siteLang = (localStorage.getItem('site-lang') || document.documentElement.lang || (document.body.getAttribute('dir') === 'ltr' ? 'en' : 'ar')) || 'ar';
      const yearLabel = siteLang === 'en' ? 'Project Year →' : 'سنة المشروع →';
      ctx.fillText(yearLabel, W - 120, H - 10);
      t += 1;
      requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
  }

  const recCanvas = document.getElementById('recoveryMetricsChart');
  if (recCanvas && recCanvas.getContext) {
    const ctxR = recCanvas.getContext('2d');
    const DPR = window.devicePixelRatio || 1;
    function resizeR() {
      const rect = recCanvas.getBoundingClientRect();
      recCanvas.width = rect.width * DPR;
      recCanvas.height = rect.height * DPR;
      ctxR.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    resizeR();
    window.addEventListener('resize', resizeR);

    let angle = 0;
    const targetPercent = 0.62;
    function drawRadial() {
      const W = recCanvas.width / DPR; const H = recCanvas.height / DPR;
      const cx = W/2, cy = H/2, r = Math.min(W,H)/2 - 10;
      ctxR.clearRect(0,0,W,H);
      ctxR.beginPath(); ctxR.arc(cx, cy, r, 0, Math.PI*2); ctxR.fillStyle = 'rgba(0,0,0,0.02)'; ctxR.fill();

      ctxR.beginPath(); ctxR.lineWidth = 10; ctxR.strokeStyle = 'rgba(255,255,255,0.06)';
      ctxR.arc(cx, cy, r, Math.PI*1.1, Math.PI*1.9); ctxR.stroke();

      const endAngle = Math.PI*1.1 + (Math.PI*0.8) * targetPercent * (0.92 + 0.06*Math.sin(angle/12));
      const grad = ctxR.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
      grad.addColorStop(0, '#ff8c42'); grad.addColorStop(1, '#00a8c5');
      ctxR.beginPath(); ctxR.lineCap = 'round'; ctxR.strokeStyle = grad; ctxR.lineWidth = 12; ctxR.shadowBlur = 14; ctxR.shadowColor = '#ff8c42';
      ctxR.arc(cx, cy, r, Math.PI*1.1, endAngle); ctxR.stroke(); ctxR.shadowBlur = 0;

      ctxR.fillStyle = '#00a8c5'; ctxR.font = '700 18px Cairo, sans-serif';
      const percentText = Math.round(targetPercent*100) + '%'; const textW = ctxR.measureText(percentText).width;
      ctxR.fillText(percentText, cx - textW/2, cy + 6);
      ctxR.font = '12px Cairo, sans-serif'; ctxR.fillStyle = 'rgba(255,255,255,0.88)'; const cap = 'سرعة الاسترداد'; const capW = ctxR.measureText(cap).width;
      ctxR.fillText(cap, cx - capW/2, cy + 28);

      const knobAngle = endAngle + 0.08 * Math.sin(angle/8);
      const knobX = cx + Math.cos(knobAngle) * r; const knobY = cy + Math.sin(knobAngle) * r;
      ctxR.beginPath(); ctxR.fillStyle = '#fff'; ctxR.globalAlpha = 0.95; ctxR.arc(knobX, knobY, 4.5, 0, Math.PI*2); ctxR.fill(); ctxR.globalAlpha = 1;

      angle += 0.9;
      requestAnimationFrame(drawRadial);
    }
    requestAnimationFrame(drawRadial);
  }
})();