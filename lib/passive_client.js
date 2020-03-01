/**
 * Passive-Client
 *
 * This is how we take the events that are happening
 * in the user's browser and send them to some log server
 * without interfering with the user flow.
 *
 * We want to err on the side of too much information that
 * we have to limit later rather than too little information
 * that we have to add onto later.
 */
import { v4 as uuid } from "https://unpkg.com/uuid@latest/dist/esm-browser/index.js";

const getBounds = e => {
  const b = e.target.getBoundingClientRect();

  return {
    x: b.x,
    y: b.y,
    left: b.left,
    top: b.top,
    bottom: b.bottom,
    right: b.right,
    width: b.width,
    height: b.height
  };
};

/**
 * Given an event, get the DataSet
 *  (data-* attributes)
 * of the Target element
 *
 * @param {DocumentEvent} e
 * @returns {Object<string, any>} dataset
 */
const getDataSet = e =>
  Object.entries(e.target.dataset).reduce(
    (a, c) => ({
      ...a,
      [c[0].replace("data-", "")]: c[1]
    }),
    {}
  );

/**
 * We want to have some way to say that this
 * browsing context is sending the events.
 */
const INSTANCE_ID = uuid();

/**
 * All of the values that we want to have and
 * create for each and every message we send to
 * the server
 */
const base_message = () => ({
  id: uuid(),
  instance_id: INSTANCE_ID,
  timestamp: new Date().toISOString(),
  url: window.location.href
});

/**
 * How we handle any event that we are listening
 * on but haven't set up a modifier for.
 *
 * We use this to help us mock what we haven't
 * set up yet and keep the upgrade/modify path
 * clean.
 *
 * @noop
 */
const defaultTransformer = () => {};
let passive;
/**
 * This code only works when
 * 1. We have a window global object
 * 2. We have a Worker constructor on the window
 * 3. We have a __PASSIVE_CONFIG__ on the window
 */
if (
  typeof window !== "undefined" &&
  window.Worker &&
  window.__PASSIVE_CONFIG__
) {
  const worker = new Worker(window.__PASSIVE_CONFIG__.worker_path);

  // Tell the worker that we have a configuration for them
  worker.postMessage({
    type: "CONFIG",
    // hopefully the user set this up before importing this script!
    payload: window.__PASSIVE_CONFIG__
  });

  const handlers = {
    click: e => ({
      ...base_message(),
      type: "click",
      clientX: e.clientX,
      clientY: e.clientY,
      layerX: e.layerX,
      layerY: e.layerY,
      target: {
        data: getDataSet(e),
        classes: e.target.className.split(" "),
        id: e.target.id,
        innerHTML: e.target.innerHTML,
        innerText: e.target.innerText,
        tagName: e.target.tagName,
        nodeType: e.target.nodeType,
        bounds: getBounds(e)
      }
    }),
    contextmenu: e => ({
      ...base_message(),
      type: "context_menu",
      clientX: e.clientX,
      clientY: e.clientY,
      layerX: e.layerX,
      layerY: e.layerY,
      target: {
        data: getDataSet(e),
        classes: e.target.className.split(" "),
        id: e.target.id,
        innerHTML: e.target.innerHTML,
        innerText: e.target.innerText,
        tagName: e.target.tagName,
        nodeType: e.target.nodeType,
        bounds: getBounds(e)
      }
    }),
    scroll: () => ({
      ...base_message(),
      type: "scroll",
      scrollY: window.scrollY,
      scrollX: window.scrollX
    }),
    beforeunload: () => ({
      ...base_message(),
      type: "beforeunload"
    })
  };

  const EVENTS_TO_LISTEN_TO = [
    /**
     * https://developer.mozilla.org/en-US/docs/Web/Events
     */
    ["click", defaultTransformer],
    ["error", defaultTransformer],
    ["abort", defaultTransformer],
    ["load", defaultTransformer],
    ["beforeunload", defaultTransformer],
    ["unload", defaultTransformer],
    ["online", defaultTransformer],
    ["offline", defaultTransformer],
    ["pagehide", defaultTransformer],
    ["pageshow", defaultTransformer],
    ["popstate", defaultTransformer],
    ["reset", defaultTransformer],
    ["submit", defaultTransformer],
    ["beforeprint", defaultTransformer],
    ["afterprint", defaultTransformer],
    ["fullscreenchange", defaultTransformer],
    ["resize", defaultTransformer],
    ["scroll", defaultTransformer],
    ["fullscreenerror", defaultTransformer],
    ["cut", defaultTransformer],
    ["copy", defaultTransformer],
    ["paste", defaultTransformer],
    ["contextmenu", defaultTransformer],
    ["select", defaultTransformer],
    ["waiting", defaultTransformer]
  ].map(([event, handler]) =>
    event in handlers ? [event, handlers[event]] : [event, handler]
  );

  const event_listener = transformer => e => {
    const message = transformer(e);
    if (message) {
      worker.postMessage(message);
    }
  };

  const attach_event_listeners = el => {
    for (const [eventName, transformer] of EVENTS_TO_LISTEN_TO) {
      // https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#Improving_scrolling_performance_with_passive_listeners
      el.addEventListener(eventName, event_listener(transformer), {
        passive: true
      });
    }
  };

  attach_event_listeners(document);

  passive = cb => {
    worker.addEventListener("message", e => {
      // console.dir(e);
      cb(e.data);
    });
  };
}

export default passive;

// Set this so you can do whatever you
// want with the thing in the global stuff
// in case you are doing stuff weird
window.__passive_instance = passive;
