// Zone.js event-patching flags — must be set before zone.js is imported.
// Unpatch high-frequency events that never need Angular change detection.
// mousemove/wheel/touchmove fire hundreds of times per second during user gestures
// and create unnecessary task overhead (contributes to TBT).
// mouseenter/mouseleave are only used in MouseHoverDirective for direct DOM class changes (no CD needed).
(window as any).__zone_symbol__UNPATCHED_EVENTS = [
  'mousemove',
  'mouseenter',
  'mouseleave',
  'wheel',
  'mousewheel',
  'touchmove',
];
