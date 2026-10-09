    // Adapter over the original Office body, face, props and Verlet renderer.
    // Only one engine is mounted; its scene RAF is stopped by the gallery.
    const gridStates = new Map();
    const gridWidth = 96;
    const gridHeight = 112;
    let gridReady = false;
    engineRuntime.grid = {
      presets() {
        return [
          { id: "default-blue", name: "Default blue", action: "bob", pixel: deepClone(DEFAULT_PIXEL) },
          ...COMPANION_JELLIES.map(c => ({
            id: `office-${c.name}`, name: c.name,
            action: COMPANION_LOOP[c.name] || "bob", pixel: deepClone(c.pixel)
          }))
        ];
      },
      normalize(value) { return normalizePixel(deepClone(value)); },
      prepare(entry) {
        const p = normalizePixel(deepClone(entry.pixel));
        const j = {
          name: entry.id, pixel: p, scale: p.scale,
          ax: gridWidth / 2, ay: 34, prevAx: gridWidth / 2, prevAy: 34,
          wakeX: gridWidth / 2, wakeY: 34, wakeChain: entry.id,
          deform: { x: 0, y: 0, grabX: 0, grabY: 0, lean: 0, leanV: 0 },
          dizzy: { start: -1e9, duration: 0 }, phase: 0,
          ropes: makeCompanionRopes(p, p.scale), seeded: false,
          loopAction: entry.action, loopPhase: 0, loopPulseAt: 0,
          act: Object.fromEntries(["talk", "zzz", "type", "listen", "smoke", "read", "game", "switchplay", "calc", "fitness"].map(key => [key, { start: -1e9, duration: 0, side: 1, seed: 0 }]))
        };
        gridStates.set(entry.id, j);
      },
      render(entries, now, steps = 1) {
        if (!gridReady) {
          engineRuntime.resizeObserver?.disconnect();
          engineRuntime.noticeResizeObserver?.disconnect();
          gridReady = true;
        }
        cols = gridWidth; rows = gridHeight;
        if (canvas.width !== cols || canvas.height !== rows) {
          canvas.width = cols; canvas.height = rows;
          imgData = ctx.createImageData(cols, rows);
          buf32 = new Uint32Array(imgData.data.buffer);
        }
        worldCamera.x = 0; worldCamera.y = 0;
        state.mouse.active = false;
        time += steps;
        for (const entry of entries) {
          const j = gridStates.get(entry.id);
          if (!j) continue;
          companionJellies = [j];
          for (let tick = 0; tick < steps; tick += 1) {
            buf32.fill(0);
            updateAndDrawCompanionJellies(now - (steps - 1 - tick) * 1000 / 60);
          }
          ctx.putImageData(imgData, 0, 0);
          const target = entry.canvas;
          const tc = target.getContext("2d");
          tc.clearRect(0, 0, target.width, target.height);
          tc.imageSmoothingEnabled = false;
          const ratio = target.width / 320;
          const zoom = 3.8 * j.pixel.scale * ratio;
          tc.drawImage(canvas, (target.width - cols * zoom) / 2, target.height * 0.35 - 34 * zoom, cols * zoom, rows * zoom);
        }
      }
    };
