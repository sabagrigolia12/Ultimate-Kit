Dev-only test harness (not needed by users).
run-ae.ps1 -Jsx <file.jsx>   runs a script inside After Effects 2025 (starts AE if needed) and waits for it.
t_reset.jsx                  new empty project (run it as a separate step before building).
t_all.jsx                    full regression: every preset/API + expression-error sweep -> out\t_all_out.txt
t_render.jsx                 renders frames for comps named by out\render_cfg.txt ("prefix|folder|t1,t2")
sheet.ps1                    contact sheets / mid-frame coverage check of rendered PNGs
cdp.ps1                      drives the real panel inside AE via a .debug port (8099); e2e*.js are UI flows
