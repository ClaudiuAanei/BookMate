window.Employee = window.Employee || {};

Employee.calendarGrid = {
  init({ canvas, rangeEl }) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.rangeEl = rangeEl;

    this.mousePos = { x: -1000, y: -1000, col: -1 };
    this.lunchPattern = null;

    this.statusColors = {
      pending:   { bg: "rgba(245, 158, 11, 0.40)", border: "#f59e0b" },
      confirmed: { bg: "rgba(16, 185, 129, 0.40)", border: "#10b981" },
      completed: { bg: "rgba(59, 130, 246, 0.40)", border: "#3b82f6" },
      noshow:    { bg: "rgba(239, 68, 68, 0.40)", border: "#ef4444" },
      declined:  { bg: "rgba(82, 82, 91, 0.20)", border: "#52525b" }
    };

    window.addEventListener("resize", () => this.render());
  },

  _createLunchPattern() {
    const pCanvas = document.createElement("canvas");
    pCanvas.width = 10; pCanvas.height = 10;
    const pCtx = pCanvas.getContext("2d");
    pCtx.strokeStyle = "rgba(255, 255, 255, 0.04)";
    pCtx.lineWidth = 1;
    pCtx.beginPath();
    pCtx.moveTo(0, 10);
    pCtx.lineTo(10, 0);
    pCtx.stroke();
    return this.ctx.createPattern(pCanvas, "repeat");
  },

  setMouse(x, y, col) {
    this.mousePos = { x, y, col };
  },

  render() {
    const C = Employee.calendarConfig;
    const S = Employee.calendarState;
    const U = Employee.calendarUtils;
    const K = Employee.calendarCompute;

    if (!S.startDate) return;
    if (!this.lunchPattern) this.lunchPattern = this._createLunchPattern();

    const ctx = this.ctx;
    const dpr = window.devicePixelRatio || 1;
    const viewWidth = window.innerWidth;
    const canvasHeight = C.headerHeight + C.emptyRowHeight + ((C.endHour - C.startHour) * C.pixelPerHour);

    // IMPORTANT: reset transform each render
    this.canvas.width = viewWidth * dpr;
    this.canvas.height = canvasHeight * dpr;
    this.canvas.style.width = `${viewWidth}px`;
    this.canvas.style.height = `${canvasHeight}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const colWidth = (viewWidth - C.timeColWidth) / C.COLUMNS;
    const gridStartY = C.headerHeight + C.emptyRowHeight;

    // bg
    ctx.fillStyle = "#09090b";
    ctx.fillRect(0, 0, viewWidth, canvasHeight);
        const drawWrappedCenter = (text, x, y, maxWidth, lineHeight) => {
      const words = String(text || "").split(/\s+/).filter(Boolean);
      if (!words.length) return;

      const lines = [];
      let line = words[0];

      for (let i = 1; i < words.length; i++) {
        const test = line + " " + words[i];
        if (ctx.measureText(test).width <= maxWidth) {
          line = test;
        } else {
          lines.push(line);
          line = words[i];
        }
      }
      lines.push(line);

      // max 2 lines: if more, merge tail
      if (lines.length > 2) {
        const first = lines[0];
        const rest = lines.slice(1).join(" ");
        lines.length = 0;
        lines.push(first, rest);
      }

      const totalH = lines.length * lineHeight;
      let yy = y - totalH / 2 + lineHeight / 2;

      for (const l of lines) {
        ctx.fillText(l, x, yy);
        yy += lineHeight;
      }
    };

    const drawVerticalWatermark = (text, centerX, centerY, maxLenPx) => {
      const t = String(text || "").trim();
      if (!t) return;

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(-Math.PI / 2);

      // center in rotated space
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // if too long, truncate with ellipsis (based on width)
      let out = t;
      while (ctx.measureText(out).width > maxLenPx && out.length > 4) {
        out = out.slice(0, -2);
      }
      if (out !== t) out = out.trim() + "…";

      ctx.fillText(out, 0, 0);
      ctx.restore();
    };

    // range label
    if (this.rangeEl) this.rangeEl.textContent = U.fmtRange(S.startDate, C.COLUMNS);

    // weekend shading
for (let i = 0; i < C.COLUMNS; i++) {
  const day = new Date(S.startDate);
  day.setDate(S.startDate.getDate() + i);

  const dayKey = U.toDateKey(day);

  const isWeekend = U.isWeekend(day);
  const isHoliday = S.blockedDays?.has(dayKey);

  if (isWeekend || isHoliday) {
    const x = C.timeColWidth + i * colWidth;

    // ✅ culoare diferită
    // weekend = gri rece
    // holiday = violet închis (ușor diferit)
    ctx.fillStyle = isHoliday ? "#120d14" : "#0b0b0f";
    ctx.fillRect(x, 0, colWidth, canvasHeight);

    // overlay (aceeași adâncime la ambele)
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(x, 0, colWidth, canvasHeight);

    // label doar pentru holiday/public holiday (NU weekend)
    if (!isWeekend && isHoliday) {
      const raw = (S.blockedDayLabels?.get(dayKey) || "HOLIDAY");
      const label = String(raw).toUpperCase();

      const gridTop = C.headerHeight + C.emptyRowHeight;
      const gridH = (C.endHour - C.startHour) * C.pixelPerHour;
      const centerY = gridTop + gridH / 2;
      const centerX = x + colWidth / 2;

      ctx.save();
      ctx.fillStyle = "rgba(161, 161, 170, 0.35)";
      ctx.font = "900 12px sans-serif";

      drawVerticalWatermark(label, centerX, centerY, gridH * 0.85);

      ctx.fillStyle = "rgba(113, 113, 122, 0.75)";
      ctx.font = "900 9px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      drawWrappedCenter(label, centerX, gridTop + 20, colWidth - 16, 10);

      ctx.restore();
    }
  }
}

    

    // lunch
    const lunchY = gridStartY + ((C.lunchStart - C.startHour) * C.pixelPerHour);
    const lunchH = (C.lunchEnd - C.lunchStart) * C.pixelPerHour;
    for (let i = 0; i < C.COLUMNS; i++) {
      const day = new Date(S.startDate);
      day.setDate(S.startDate.getDate() + i);
      const dayKey = U.toDateKey(day);
      if (!U.isWeekend(day) && !S.blockedDays?.has(dayKey)) {
        const x = C.timeColWidth + i * colWidth;
        ctx.fillStyle = "rgba(39, 39, 42, 0.3)";
        ctx.fillRect(x, lunchY, colWidth, lunchH);
        ctx.fillStyle = this.lunchPattern;
        ctx.fillRect(x, lunchY, colWidth, lunchH);

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = "900 9px sans-serif";
        ctx.fillStyle = "#52525b";
        ctx.fillText("LUNCH BREAK", x + colWidth/2, lunchY + lunchH/2);
      }
    }

    // partial holidays (like lunch blocks)
    for (let i = 0; i < C.COLUMNS; i++) {
      const day = new Date(S.startDate);
      day.setDate(S.startDate.getDate() + i);
      const dayKey = U.toDateKey(day);

      if (U.isWeekend(day) || S.blockedDays?.has(dayKey)) continue;

      const blocks = S.partialBlocked?.get(dayKey) || [];
      if (!blocks.length) continue;

      const x = C.timeColWidth + i * colWidth;

      for (const b of blocks) {
        const y1 = K.calculateYFromTime(b.start);
        const y2 = K.calculateYFromTime(b.end);
        const h = Math.max(0, y2 - y1);
        if (h <= 0) continue;

        // background (same family as full-day blocked)
        ctx.fillStyle = "#18101c";      
        ctx.fillRect(x, y1, colWidth, h);

        ctx.fillStyle = "rgba(0,0,0,0.25)";
        ctx.fillRect(x, y1, colWidth, h);


        // text watermark (same effect as full-day)
        const centerX = x + colWidth / 2;
        const centerY = y1 + h / 2;

        ctx.save();
        ctx.fillStyle = "rgba(161, 161, 170, 0.35)";
        ctx.font = "900 12px sans-serif";

        // vertical watermark, constrained by block height
        drawVerticalWatermark("HOLIDAY", centerX, centerY, h * 0.85);

        // small top label (2-line max) inside block
        ctx.fillStyle = "rgba(113, 113, 122, 0.75)";
        ctx.font = "900 9px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        drawWrappedCenter("HOLIDAY", centerX, y1 + 16, colWidth - 16, 10);

        ctx.restore();
      }
    }

    // left col + separators
    ctx.fillStyle = "#0d0d0f";
    ctx.fillRect(0, 0, C.timeColWidth, canvasHeight);

    ctx.fillStyle = "#111114";
    ctx.fillRect(C.timeColWidth, C.headerHeight, viewWidth - C.timeColWidth, C.emptyRowHeight);

    ctx.strokeStyle = "#27272a";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(C.timeColWidth, C.headerHeight); ctx.lineTo(viewWidth, C.headerHeight); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(C.timeColWidth, gridStartY); ctx.lineTo(viewWidth, gridStartY); ctx.stroke();

    // hours + program markers
    ctx.textAlign = "right";
    ctx.font = "500 10px monospace";
    for (let h = C.startHour; h <= C.endHour; h++) {
      const y = gridStartY + ((h - C.startHour) * C.pixelPerHour);
      const isLimit = (h === C.programStart || h === C.programEnd);

      ctx.fillStyle = isLimit ? "#60a5fa" : "#4b5563";
      ctx.fillText(`${String(h).padStart(2,"0")}:00`, C.timeColWidth - 10, y);

      if (h > C.startHour) {
        ctx.strokeStyle = isLimit ? "rgba(96, 165, 250, 0.5)" : "#1a1a1d";
        ctx.beginPath(); ctx.moveTo(C.timeColWidth, y); ctx.lineTo(viewWidth, y); ctx.stroke();
      }
    }

    // header days
    const today = new Date(); today.setHours(0,0,0,0);
    for (let i = 0; i < C.COLUMNS; i++) {
      const day = new Date(S.startDate);
      day.setDate(S.startDate.getDate() + i);
      const x = C.timeColWidth + i * colWidth;

      const isToday = day.getTime() === today.getTime();
      const isSel = S.selectedDate && day.getTime() === S.selectedDate.getTime();
      const dayKey = U.toDateKey(day);
      const isWK = U.isWeekend(day) || S.blockedDays?.has(dayKey);


      ctx.font = "700 10px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";
      ctx.fillStyle = isWK ? "#3f3f46" : (isToday ? "#3b82f6" : (isSel ? "#10b981" : "#4b5563"));
      ctx.fillText(U.dayName(day).toUpperCase().slice(0,3), x + colWidth/2, 35);

      ctx.font = "900 15px sans-serif";
      ctx.fillStyle = isWK ? "#52525b" : ((isToday || isSel) ? "#fff" : "#94a3b8");
      ctx.fillText(`${day.getDate()} ${U.monthName(day)}`, x + colWidth/2, 60);

      // underline today/selected
      if (!isWK && (isToday || isSel)) {
        ctx.fillStyle = isSel ? "#10b981" : "#3b82f6";
        ctx.beginPath();
        ctx.roundRect(x + colWidth/2 - 18, 72, 36, 3, 1.5);
        ctx.fill();
      }

      // column sep
      ctx.strokeStyle = "#18181b";
      ctx.beginPath(); ctx.moveTo(x + colWidth, 0); ctx.lineTo(x + colWidth, canvasHeight); ctx.stroke();
    }

    // render confirmed slots
    for (const slot of (S.confirmedSlots || [])) {
      const slotDay = new Date(slot.fullDate);
      const diff = Math.floor((slotDay - S.startDate) / 86400000);
      if (diff < 0 || diff >= C.COLUMNS) continue;

      const sCol = diff;
      const sX = C.timeColWidth + (sCol * colWidth);
      const cH = (slot.duration / 60) * C.pixelPerHour;

      const isBeingMoved = S.isMovingMode && slot.id === S.slotToMoveId;
      const style = this.statusColors[slot.status || "confirmed"] || this.statusColors.confirmed;

      ctx.save();

      if (isBeingMoved) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
        ctx.setLineDash([5, 3]);
        ctx.strokeStyle = "#f59e0b";
      } else {
        ctx.fillStyle = style.bg;
        ctx.strokeStyle = style.border;
      }

      ctx.beginPath();
      ctx.roundRect(sX + 4, slot.y, colWidth - 8, cH, 6);
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.setLineDash([]);

      if (isBeingMoved) {
        ctx.fillStyle = "#f59e0b";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = "900 10px sans-serif";
        ctx.fillText("MOVING...", sX + colWidth/2, slot.y + cH/2);
        ctx.restore();
        continue;
      }

      // declined cross
      if (slot.status === "declined") {
        ctx.strokeStyle = "rgba(255,255,255,0.4)";
        ctx.beginPath();
        ctx.moveTo(sX + 10, slot.y + 10);
        ctx.lineTo(sX + colWidth - 10, slot.y + cH - 10);
        ctx.moveTo(sX + colWidth - 10, slot.y + 10);
        ctx.lineTo(sX + 10, slot.y + cH - 10);
        ctx.stroke();
      }

      // text
      ctx.fillStyle = "#fff";
      ctx.font = "900 10px sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(slot.clientName || "Client", sX + 12, slot.y + 8);

      ctx.fillStyle = "rgba(255,255,255,0.75)";
      ctx.font = "600 9px monospace";
      ctx.textBaseline = "bottom";
      ctx.fillText(`${slot.startTime} - ${slot.endTime}`, sX + 12, slot.y + cH - 8);

      // more dots hover
      const dotX = sX + colWidth - 14;
      const dotCenterY = slot.y + 14;
      const m = this.mousePos;
      const isHoverMore = (m.x >= dotX - 12 && m.x <= dotX + 12 && m.y >= dotCenterY - 12 && m.y <= dotCenterY + 12);

      if (isHoverMore) {
        ctx.fillStyle = "rgba(255,255,255,0.15)";
        ctx.beginPath();
        ctx.arc(dotX, dotCenterY, 10, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = "#fff";
      [0, 4, 8].forEach(off => {
        ctx.beginPath();
        ctx.arc(dotX, slot.y + 10 + off, 1.2, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.restore();
    }

    // booked slot render (confirmed selection)
    if (S.bookedSlot) {
      const b = S.bookedSlot;
      const x = C.timeColWidth + b.col * colWidth;
      const cH = (b.duration / 60) * C.pixelPerHour;

      const isWarning = b.isOvertime && !S.overtimeAgreed;

      ctx.fillStyle = isWarning ? "rgba(245, 158, 11, 0.40)" : "rgba(59, 130, 246, 0.25)";
      ctx.beginPath();
      ctx.roundRect(x + 4, b.y, colWidth - 8, cH, 6);
      ctx.fill();

      ctx.strokeStyle = isWarning ? "#f59e0b" : "#3b82f6";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = "#fff";
      ctx.font = "900 10px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`${b.startTime} - ${b.endTime}`, x + colWidth/2, b.y + cH/2);
    }

    // hover preview (only when no bookedSlot)
    for (let i = 0; i < C.COLUMNS; i++) {
      const day = new Date(S.startDate);
      day.setDate(S.startDate.getDate() + i);

      const isWK = U.isWeekend(day);
      if (isWK) continue;

      const m = this.mousePos;
      if (m.col !== i) continue;

      const x = C.timeColWidth + i * colWidth;

      const dur =
        (S.isMovingMode && S.slotToMoveId)
          ? (S.confirmedSlots.find(s => s.id === S.slotToMoveId)?.duration || 0)
          : (S.durationMin || 0);

      const isGrid = (!S.bookedSlot && dur > 0 && m.x >= C.timeColWidth && m.y >= gridStartY);
      if (!isGrid) continue;

      const vTop = K.getValidPreviewPos(m.y, dur, i);
      if (vTop == null) continue;

      const cH = (dur / 60) * C.pixelPerHour;

      ctx.save();

      ctx.fillStyle = S.isMovingMode ? "rgba(245, 158, 11, 0.20)" : "rgba(59, 130, 246, 0.25)";
      ctx.beginPath();
      ctx.roundRect(x + 4, vTop, colWidth - 8, cH, 6);
      ctx.fill();

      ctx.strokeStyle = S.isMovingMode ? "#f59e0b" : "#3b82f6";
      ctx.lineWidth = 1.5;
      if (S.isMovingMode) ctx.setLineDash([4,4]);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = S.isMovingMode ? "#f59e0b" : "#fff";
      ctx.font = "900 10px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        `${K.getTimeFromY(vTop)} - ${K.getTimeFromY(vTop + cH)}`,
        x + colWidth/2,
        vTop + cH/2
      );

      ctx.restore();
    }
  }
};
