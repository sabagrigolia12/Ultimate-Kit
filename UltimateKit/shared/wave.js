/*  Ultimate Kit - "Flag Wave" (from the user's tutorial reel, 2026-10-25: any still image waving like a flag).
    The tutorial's set-up, made for any selected layer (a photo, a white rectangle, text ...):
      Wave Map      a precomp: a white rectangle the size of the layer with Wave World (View: Height Map; Producer 1
                    Ring, left of the picture: Height/Length 0.7, Width 0.3, Angle 20, Amplitude 0.9, Frequency 0.4)
      the layer     precomposed, over the Wave Map in Overlay mode (the waves shade it) with Displacement Map
                    (Map: the Wave Map, Red / Green, 25 / 25, Center Map, Expand Output)
    Shared by the panel preview (js/waveprev.js) and After Effects (jsx/wave.jsx), so ES3.                    */
var UK_WAVE = (function () {
    var C = {};
    C.DEF = { strength: 25, len: 0.7, width: 0.3, angle: 20, amp: 0.9, freq: 0.4, speed: 0.5 };
    C.PREROLL = 1.5;          // Wave World pre-roll (s): the cloth is already moving at the first frame
    C.PRODUCER = [-0.24, 0.14];   // Producer 1, from the picture's top-left corner, in its width / height (the tutorial's)
    return C;
})();
