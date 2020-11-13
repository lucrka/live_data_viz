
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function destroy_block(block, lookup) {
        block.d(1);
        lookup.delete(block.key);
    }
    function outro_and_destroy_block(block, lookup) {
        transition_out(block, 1, 1, () => {
            lookup.delete(block.key);
        });
    }
    function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
        let o = old_blocks.length;
        let n = list.length;
        let i = o;
        const old_indexes = {};
        while (i--)
            old_indexes[old_blocks[i].key] = i;
        const new_blocks = [];
        const new_lookup = new Map();
        const deltas = new Map();
        i = n;
        while (i--) {
            const child_ctx = get_context(ctx, list, i);
            const key = get_key(child_ctx);
            let block = lookup.get(key);
            if (!block) {
                block = create_each_block(key, child_ctx);
                block.c();
            }
            else if (dynamic) {
                block.p(child_ctx, dirty);
            }
            new_lookup.set(key, new_blocks[i] = block);
            if (key in old_indexes)
                deltas.set(key, Math.abs(i - old_indexes[key]));
        }
        const will_move = new Set();
        const did_move = new Set();
        function insert(block) {
            transition_in(block, 1);
            block.m(node, next);
            lookup.set(block.key, block);
            next = block.first;
            n--;
        }
        while (o && n) {
            const new_block = new_blocks[n - 1];
            const old_block = old_blocks[o - 1];
            const new_key = new_block.key;
            const old_key = old_block.key;
            if (new_block === old_block) {
                // do nothing
                next = new_block.first;
                o--;
                n--;
            }
            else if (!new_lookup.has(old_key)) {
                // remove old block
                destroy(old_block, lookup);
                o--;
            }
            else if (!lookup.has(new_key) || will_move.has(new_key)) {
                insert(new_block);
            }
            else if (did_move.has(old_key)) {
                o--;
            }
            else if (deltas.get(new_key) > deltas.get(old_key)) {
                did_move.add(new_key);
                insert(new_block);
            }
            else {
                will_move.add(old_key);
                o--;
            }
        }
        while (o--) {
            const old_block = old_blocks[o];
            if (!new_lookup.has(old_block.key))
                destroy(old_block, lookup);
        }
        while (n)
            insert(new_blocks[n - 1]);
        return new_blocks;
    }
    function validate_each_keys(ctx, list, get_context, get_key) {
        const keys = new Set();
        for (let i = 0; i < list.length; i++) {
            const key = get_key(get_context(ctx, list, i));
            if (keys.has(key)) {
                throw new Error('Cannot have duplicate keys in a keyed each');
            }
            keys.add(key);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.29.4' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }
    function derived(stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single
            ? [stores]
            : stores;
        const auto = fn.length < 2;
        return readable(initial_value, (set) => {
            let inited = false;
            const values = [];
            let pending = 0;
            let cleanup = noop;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup();
                const result = fn(single ? values[0] : values, set);
                if (auto) {
                    set(result);
                }
                else {
                    cleanup = is_function(result) ? result : noop;
                }
            };
            const unsubscribers = stores_array.map((store, i) => subscribe(store, (value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (inited) {
                    sync();
                }
            }, () => {
                pending |= (1 << i);
            }));
            inited = true;
            sync();
            return function stop() {
                run_all(unsubscribers);
                cleanup();
            };
        });
    }

    const appActive = writable(true);

    let uid = 0;
    const dataLatest = writable({}, function start(set) {
    	let ws = new WebSocket("ws://localhost:1880/ws/receive");
    	
    	ws.onopen = function(e) {
    		console.log("Opened websocket connection");
    		// console.log(e);
    	};

    	ws.onmessage = function(e) {
    		let obj = JSON.parse(e.data);
    		obj.timestamp = Date.now();
    		obj.uid = uid++;
    		set(obj);
    	};
    });



    let dataByTimeMaxCount = 10;
    let dataByTimeArray = [];
    const dataByTime = derived(
    	dataLatest,
    	$dataLatest => {
    		if (Object.keys($dataLatest).length > 0) dataByTimeArray.push($dataLatest);
    		if (dataByTimeArray.length > dataByTimeMaxCount) dataByTimeArray.shift();
    		return dataByTimeArray;
    	}
    );


    // let dataByUserMaxTime = 5000;   // in milliseconds
    let dataByUserMaxCount = 100;
    let dataByUserObject = {};
    const dataByUser = derived(
    	dataLatest,
    	$dataLatest => {
    		if (Object.keys($dataLatest).length > 0) {
    			if (!dataByUserObject[$dataLatest.user]) dataByUserObject[$dataLatest.user] = []; 
    			dataByUserObject[$dataLatest.user].push($dataLatest);

    			// dataByUserObject[$dataLatest.user]
    			// let now = Date.now();
    			// while (dataByUserObject[$dataLatest.user][0].timestamp < now - dataByUserObject) &&  {
    			// 	dataByUserObject[$dataLatest.user].shift();
    			// }
    			if (dataByUserObject[$dataLatest.user].length > dataByUserMaxCount) dataByUserObject[$dataLatest.user].shift();
    		}
    		return dataByUserObject;
    	}
    );



    // export const data = writable([], function start(set) {
    // 	let ws = new WebSocket("ws://localhost:1880/ws/receive");

    // 	ws.onopen = function(e) {
    // 		console.log(e);
    // 	}

    // 	ws.onmessage = function(e) {
    // 		data.update(d => {
    // 			let dat = JSON.parse(e.data);
    // 			d = d.concat(dat);
    // 			if (d.length > 10) d.shift();
    // 			return d;
    // 		});
    // 	}
      
    // });

    /* src/Timeline.svelte generated by Svelte v3.29.4 */
    const file = "src/Timeline.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	return child_ctx;
    }

    // (54:4) {#each rects as rect (rect.uid)}
    function create_each_block(key_1, ctx) {
    	let rect0;
    	let rect0_x_value;
    	let rect0_y_value;
    	let rect0_width_value;
    	let rect0_visibility_value;
    	let rect1;
    	let rect1_x_value;
    	let rect1_y_value;
    	let rect1_width_value;
    	let rect1_visibility_value;

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			rect0 = svg_element("rect");
    			rect1 = svg_element("rect");
    			attr_dev(rect0, "x", rect0_x_value = /*rect*/ ctx[7].x);
    			attr_dev(rect0, "y", rect0_y_value = 0);
    			attr_dev(rect0, "width", rect0_width_value = 2);
    			attr_dev(rect0, "height", /*height*/ ctx[1]);
    			attr_dev(rect0, "visibility", rect0_visibility_value = /*rect*/ ctx[7].visibility);
    			add_location(rect0, file, 54, 6, 1435);
    			attr_dev(rect1, "x", rect1_x_value = /*rect*/ ctx[7].x - /*width*/ ctx[0]);
    			attr_dev(rect1, "y", rect1_y_value = 0);
    			attr_dev(rect1, "width", rect1_width_value = 2);
    			attr_dev(rect1, "height", /*height*/ ctx[1]);
    			attr_dev(rect1, "visibility", rect1_visibility_value = /*rect*/ ctx[7].visibility);
    			add_location(rect1, file, 55, 6, 1522);
    			this.first = rect0;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, rect0, anchor);
    			insert_dev(target, rect1, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*rects*/ 8 && rect0_x_value !== (rect0_x_value = /*rect*/ ctx[7].x)) {
    				attr_dev(rect0, "x", rect0_x_value);
    			}

    			if (dirty & /*height*/ 2) {
    				attr_dev(rect0, "height", /*height*/ ctx[1]);
    			}

    			if (dirty & /*rects*/ 8 && rect0_visibility_value !== (rect0_visibility_value = /*rect*/ ctx[7].visibility)) {
    				attr_dev(rect0, "visibility", rect0_visibility_value);
    			}

    			if (dirty & /*rects, width*/ 9 && rect1_x_value !== (rect1_x_value = /*rect*/ ctx[7].x - /*width*/ ctx[0])) {
    				attr_dev(rect1, "x", rect1_x_value);
    			}

    			if (dirty & /*height*/ 2) {
    				attr_dev(rect1, "height", /*height*/ ctx[1]);
    			}

    			if (dirty & /*rects*/ 8 && rect1_visibility_value !== (rect1_visibility_value = /*rect*/ ctx[7].visibility)) {
    				attr_dev(rect1, "visibility", rect1_visibility_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(rect0);
    			if (detaching) detach_dev(rect1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(54:4) {#each rects as rect (rect.uid)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let svg;
    	let g;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let g_transform_value;
    	let each_value = /*rects*/ ctx[3];
    	validate_each_argument(each_value);
    	const get_key = ctx => /*rect*/ ctx[7].uid;
    	validate_each_keys(ctx, each_value, get_each_context, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			g = svg_element("g");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(g, "id", "mover");
    			attr_dev(g, "transform", g_transform_value = "translate(" + /*animationPosition*/ ctx[2] + " 0)");
    			add_location(g, file, 52, 2, 1332);
    			attr_dev(svg, "width", /*width*/ ctx[0]);
    			attr_dev(svg, "height", /*height*/ ctx[1]);
    			add_location(svg, file, 51, 0, 1307);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, g);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(g, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*rects, width, height*/ 11) {
    				const each_value = /*rects*/ ctx[3];
    				validate_each_argument(each_value);
    				validate_each_keys(ctx, each_value, get_each_context, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, g, destroy_block, create_each_block, null, get_each_context);
    			}

    			if (dirty & /*animationPosition*/ 4 && g_transform_value !== (g_transform_value = "translate(" + /*animationPosition*/ ctx[2] + " 0)")) {
    				attr_dev(g, "transform", g_transform_value);
    			}

    			if (dirty & /*width*/ 1) {
    				attr_dev(svg, "width", /*width*/ ctx[0]);
    			}

    			if (dirty & /*height*/ 2) {
    				attr_dev(svg, "height", /*height*/ ctx[1]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Timeline", slots, []);
    	let { data = [] } = $$props;
    	let { width = 300 } = $$props;
    	let { height = 50 } = $$props;
    	let mountTime = Date.now();
    	let animationDuration = 5; // in seconds
    	let animationPosition = 0;

    	// implement a loop when component is mounted
    	onMount(() => {
    		let frame;
    		$$invalidate(5, mountTime = Date.now());

    		function loop() {
    			frame = requestAnimationFrame(loop);
    			let now = Date.now();
    			$$invalidate(2, animationPosition = -((now - mountTime) / (animationDuration * 1000) % 1) * width);
    		}

    		loop();
    		return () => cancelAnimationFrame(frame);
    	});

    	// update rects when data changes
    	let rects = [];

    	const writable_props = ["data", "width", "height"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Timeline> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("data" in $$props) $$invalidate(4, data = $$props.data);
    		if ("width" in $$props) $$invalidate(0, width = $$props.width);
    		if ("height" in $$props) $$invalidate(1, height = $$props.height);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		appActive,
    		data,
    		width,
    		height,
    		mountTime,
    		animationDuration,
    		animationPosition,
    		rects
    	});

    	$$self.$inject_state = $$props => {
    		if ("data" in $$props) $$invalidate(4, data = $$props.data);
    		if ("width" in $$props) $$invalidate(0, width = $$props.width);
    		if ("height" in $$props) $$invalidate(1, height = $$props.height);
    		if ("mountTime" in $$props) $$invalidate(5, mountTime = $$props.mountTime);
    		if ("animationDuration" in $$props) $$invalidate(6, animationDuration = $$props.animationDuration);
    		if ("animationPosition" in $$props) $$invalidate(2, animationPosition = $$props.animationPosition);
    		if ("rects" in $$props) $$invalidate(3, rects = $$props.rects);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*data, width, mountTime, rects*/ 57) {
    			 {
    				let now = Date.now();
    				$$invalidate(3, rects = []);

    				for (let i = 0; i < data.length; i++) {
    					let rect = {
    						uid: data[i].uid,
    						timestamp: data[i].timestamp,
    						x: width - 2 + (data[i].timestamp - mountTime) / (animationDuration * 1000) % 1 * width,
    						opacity: i / data.length,
    						visibility: now - data[i].timestamp > animationDuration * 1000 - 200
    						? "hidden"
    						: "visible"
    					};

    					rects.push(rect);
    				}
    			}
    		}
    	};

    	return [width, height, animationPosition, rects, data];
    }

    class Timeline extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { data: 4, width: 0, height: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Timeline",
    			options,
    			id: create_fragment.name
    		});
    	}

    	get data() {
    		throw new Error("<Timeline>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<Timeline>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get width() {
    		throw new Error("<Timeline>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set width(value) {
    		throw new Error("<Timeline>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get height() {
    		throw new Error("<Timeline>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set height(value) {
    		throw new Error("<Timeline>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/ValueGraph.svelte generated by Svelte v3.29.4 */
    const file$1 = "src/ValueGraph.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[11] = list[i];
    	return child_ctx;
    }

    // (75:4) {#each elements as element}
    function create_each_block$1(ctx) {
    	let circle0;
    	let circle0_cx_value;
    	let circle0_cy_value;
    	let circle0_visibility_value;
    	let circle0_fill_value;
    	let circle1;
    	let circle1_cx_value;
    	let circle1_cy_value;
    	let circle1_visibility_value;
    	let circle1_fill_value;

    	const block = {
    		c: function create() {
    			circle0 = svg_element("circle");
    			circle1 = svg_element("circle");
    			attr_dev(circle0, "cx", circle0_cx_value = /*element*/ ctx[11].x);
    			attr_dev(circle0, "cy", circle0_cy_value = /*element*/ ctx[11].y);
    			attr_dev(circle0, "r", "2");
    			attr_dev(circle0, "visibility", circle0_visibility_value = /*element*/ ctx[11].visibility);
    			attr_dev(circle0, "fill", circle0_fill_value = /*element*/ ctx[11].color);
    			add_location(circle0, file$1, 75, 6, 2121);
    			attr_dev(circle1, "cx", circle1_cx_value = /*element*/ ctx[11].x - /*width*/ ctx[0]);
    			attr_dev(circle1, "cy", circle1_cy_value = /*element*/ ctx[11].y);
    			attr_dev(circle1, "r", "2");
    			attr_dev(circle1, "visibility", circle1_visibility_value = /*element*/ ctx[11].visibility);
    			attr_dev(circle1, "fill", circle1_fill_value = /*element*/ ctx[11].color);
    			add_location(circle1, file$1, 76, 6, 2227);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, circle0, anchor);
    			insert_dev(target, circle1, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*elements*/ 8 && circle0_cx_value !== (circle0_cx_value = /*element*/ ctx[11].x)) {
    				attr_dev(circle0, "cx", circle0_cx_value);
    			}

    			if (dirty & /*elements*/ 8 && circle0_cy_value !== (circle0_cy_value = /*element*/ ctx[11].y)) {
    				attr_dev(circle0, "cy", circle0_cy_value);
    			}

    			if (dirty & /*elements*/ 8 && circle0_visibility_value !== (circle0_visibility_value = /*element*/ ctx[11].visibility)) {
    				attr_dev(circle0, "visibility", circle0_visibility_value);
    			}

    			if (dirty & /*elements*/ 8 && circle0_fill_value !== (circle0_fill_value = /*element*/ ctx[11].color)) {
    				attr_dev(circle0, "fill", circle0_fill_value);
    			}

    			if (dirty & /*elements, width*/ 9 && circle1_cx_value !== (circle1_cx_value = /*element*/ ctx[11].x - /*width*/ ctx[0])) {
    				attr_dev(circle1, "cx", circle1_cx_value);
    			}

    			if (dirty & /*elements*/ 8 && circle1_cy_value !== (circle1_cy_value = /*element*/ ctx[11].y)) {
    				attr_dev(circle1, "cy", circle1_cy_value);
    			}

    			if (dirty & /*elements*/ 8 && circle1_visibility_value !== (circle1_visibility_value = /*element*/ ctx[11].visibility)) {
    				attr_dev(circle1, "visibility", circle1_visibility_value);
    			}

    			if (dirty & /*elements*/ 8 && circle1_fill_value !== (circle1_fill_value = /*element*/ ctx[11].color)) {
    				attr_dev(circle1, "fill", circle1_fill_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(circle0);
    			if (detaching) detach_dev(circle1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(75:4) {#each elements as element}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let svg;
    	let g;
    	let g_transform_value;
    	let each_value = /*elements*/ ctx[3];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			g = svg_element("g");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(g, "id", "mover");
    			attr_dev(g, "transform", g_transform_value = "translate(" + /*animationPosition*/ ctx[2] + " 0)");
    			add_location(g, file$1, 73, 2, 2023);
    			attr_dev(svg, "width", /*width*/ ctx[0]);
    			attr_dev(svg, "height", /*height*/ ctx[1]);
    			add_location(svg, file$1, 72, 0, 1998);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, g);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(g, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*elements, width*/ 9) {
    				each_value = /*elements*/ ctx[3];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(g, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*animationPosition*/ 4 && g_transform_value !== (g_transform_value = "translate(" + /*animationPosition*/ ctx[2] + " 0)")) {
    				attr_dev(g, "transform", g_transform_value);
    			}

    			if (dirty & /*width*/ 1) {
    				attr_dev(svg, "width", /*width*/ ctx[0]);
    			}

    			if (dirty & /*height*/ 2) {
    				attr_dev(svg, "height", /*height*/ ctx[1]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("ValueGraph", slots, []);
    	let { data = [] } = $$props;
    	let { width = 300 } = $$props;
    	let { height = 50 } = $$props;
    	let mountTime = Date.now();
    	let animationDuration = 5; // in seconds
    	let animationPosition = 0;
    	let minValue = Number.MAX_VALUE;
    	let maxValue = -Number.MAX_VALUE;
    	let alltimeMinValue = minValue;
    	let alltimeMaxValue = maxValue;

    	// implement a loop when component is mounted
    	onMount(() => {
    		let frame;
    		$$invalidate(5, mountTime = Date.now());

    		function loop() {
    			frame = requestAnimationFrame(loop);
    			let now = Date.now();
    			$$invalidate(2, animationPosition = -((now - mountTime) / (animationDuration * 1000) % 1) * width);
    		}

    		loop();
    		return () => cancelAnimationFrame(frame);
    	});

    	// update elements when data changes
    	let elements = [];

    	const writable_props = ["data", "width", "height"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ValueGraph> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("data" in $$props) $$invalidate(4, data = $$props.data);
    		if ("width" in $$props) $$invalidate(0, width = $$props.width);
    		if ("height" in $$props) $$invalidate(1, height = $$props.height);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		data,
    		width,
    		height,
    		mountTime,
    		animationDuration,
    		animationPosition,
    		minValue,
    		maxValue,
    		alltimeMinValue,
    		alltimeMaxValue,
    		elements
    	});

    	$$self.$inject_state = $$props => {
    		if ("data" in $$props) $$invalidate(4, data = $$props.data);
    		if ("width" in $$props) $$invalidate(0, width = $$props.width);
    		if ("height" in $$props) $$invalidate(1, height = $$props.height);
    		if ("mountTime" in $$props) $$invalidate(5, mountTime = $$props.mountTime);
    		if ("animationDuration" in $$props) $$invalidate(10, animationDuration = $$props.animationDuration);
    		if ("animationPosition" in $$props) $$invalidate(2, animationPosition = $$props.animationPosition);
    		if ("minValue" in $$props) $$invalidate(6, minValue = $$props.minValue);
    		if ("maxValue" in $$props) $$invalidate(7, maxValue = $$props.maxValue);
    		if ("alltimeMinValue" in $$props) $$invalidate(8, alltimeMinValue = $$props.alltimeMinValue);
    		if ("alltimeMaxValue" in $$props) $$invalidate(9, alltimeMaxValue = $$props.alltimeMaxValue);
    		if ("elements" in $$props) $$invalidate(3, elements = $$props.elements);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*data, width, mountTime, minValue, maxValue, height, alltimeMinValue, alltimeMaxValue, elements*/ 1019) {
    			 {
    				let now = Date.now();
    				$$invalidate(3, elements = []);
    				$$invalidate(6, minValue = Number.MAX_VALUE);
    				$$invalidate(7, maxValue = -Number.MAX_VALUE);

    				for (let i = 0; i < data.length - 1; i++) {
    					let x1 = width - 2 + (data[i].timestamp - mountTime) / (animationDuration * 1000) % 1 * width;

    					// let x2 = width - 2 + ((data[i+1].timestamp - mountTime) / (animationDuration * 1000) % 1) * width;
    					// let y2 = height - data[i+1].value;    
    					$$invalidate(6, minValue = Math.min(data[i].value - 0.1, minValue));

    					$$invalidate(7, maxValue = Math.max(data[i].value * 1 + 0.1, maxValue));
    					let y1 = height - 2 - (data[i].value - alltimeMinValue) / (alltimeMaxValue - alltimeMinValue) * (height - 4);

    					let element = {
    						uid: data[i].uid,
    						timestamp: data[i].timestamp,
    						x: x1,
    						y: y1,
    						color: data[i].color,
    						visibility: now - data[i].timestamp > animationDuration * 1000 - 100
    						? "hidden"
    						: "visible"
    					};

    					elements.push(element);
    				}

    				$$invalidate(8, alltimeMinValue = Math.min(alltimeMinValue, minValue));
    				$$invalidate(9, alltimeMaxValue = Math.max(alltimeMaxValue, maxValue));
    			} // console.log(minValue, maxValue);
    		}
    	};

    	return [width, height, animationPosition, elements, data];
    }

    class ValueGraph extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { data: 4, width: 0, height: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ValueGraph",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get data() {
    		throw new Error("<ValueGraph>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<ValueGraph>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get width() {
    		throw new Error("<ValueGraph>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set width(value) {
    		throw new Error("<ValueGraph>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get height() {
    		throw new Error("<ValueGraph>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set height(value) {
    		throw new Error("<ValueGraph>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/ValueBox.svelte generated by Svelte v3.29.4 */
    const file$2 = "src/ValueBox.svelte";

    // (19:2) {#if showGraph}
    function create_if_block(ctx) {
    	let div;
    	let valuegraph;
    	let current;

    	valuegraph = new ValueGraph({
    			props: { data: /*dataStream*/ ctx[1], height: 40 },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(valuegraph.$$.fragment);
    			attr_dev(div, "class", "value-graph svelte-1x9y64s");
    			add_location(div, file$2, 19, 4, 489);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(valuegraph, div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const valuegraph_changes = {};
    			if (dirty & /*dataStream*/ 2) valuegraph_changes.data = /*dataStream*/ ctx[1];
    			valuegraph.$set(valuegraph_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(valuegraph.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(valuegraph.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(valuegraph);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(19:2) {#if showGraph}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div1;
    	let div0;
    	let span0;
    	let t0_value = /*dataLatest*/ ctx[0].key + "";
    	let t0;
    	let t1;
    	let span1;
    	let t2_value = /*dataLatest*/ ctx[0].value + "";
    	let t2;
    	let t3;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block = /*showGraph*/ ctx[2] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			span0 = element("span");
    			t0 = text(t0_value);
    			t1 = space();
    			span1 = element("span");
    			t2 = text(t2_value);
    			t3 = space();
    			if (if_block) if_block.c();
    			attr_dev(span0, "class", "param-key svelte-1x9y64s");
    			set_style(span0, "color", /*dataLatest*/ ctx[0].color);
    			add_location(span0, file$2, 15, 4, 321);
    			attr_dev(span1, "class", "param-value svelte-1x9y64s");
    			add_location(span1, file$2, 16, 4, 406);
    			attr_dev(div0, "class", "key-value-box svelte-1x9y64s");
    			add_location(div0, file$2, 14, 2, 289);
    			attr_dev(div1, "class", "payload-param svelte-1x9y64s");
    			add_location(div1, file$2, 13, 0, 225);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, span0);
    			append_dev(span0, t0);
    			append_dev(div0, t1);
    			append_dev(div0, span1);
    			append_dev(span1, t2);
    			append_dev(div1, t3);
    			if (if_block) if_block.m(div1, null);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(
    					div1,
    					"click",
    					function () {
    						if (is_function(/*showGraph*/ ctx[2] = !/*showGraph*/ ctx[2])) (/*showGraph*/ ctx[2] = !/*showGraph*/ ctx[2]).apply(this, arguments);
    					},
    					false,
    					false,
    					false
    				);

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;
    			if ((!current || dirty & /*dataLatest*/ 1) && t0_value !== (t0_value = /*dataLatest*/ ctx[0].key + "")) set_data_dev(t0, t0_value);

    			if (!current || dirty & /*dataLatest*/ 1) {
    				set_style(span0, "color", /*dataLatest*/ ctx[0].color);
    			}

    			if ((!current || dirty & /*dataLatest*/ 1) && t2_value !== (t2_value = /*dataLatest*/ ctx[0].value + "")) set_data_dev(t2, t2_value);

    			if (/*showGraph*/ ctx[2]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*showGraph*/ 4) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div1, null);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (if_block) if_block.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("ValueBox", slots, []);
    	let { dataLatest } = $$props;
    	let { dataStream } = $$props;
    	let { showGraph = false } = $$props;
    	const writable_props = ["dataLatest", "dataStream", "showGraph"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ValueBox> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("dataLatest" in $$props) $$invalidate(0, dataLatest = $$props.dataLatest);
    		if ("dataStream" in $$props) $$invalidate(1, dataStream = $$props.dataStream);
    		if ("showGraph" in $$props) $$invalidate(2, showGraph = $$props.showGraph);
    	};

    	$$self.$capture_state = () => ({
    		ValueGraph,
    		dataLatest,
    		dataStream,
    		showGraph
    	});

    	$$self.$inject_state = $$props => {
    		if ("dataLatest" in $$props) $$invalidate(0, dataLatest = $$props.dataLatest);
    		if ("dataStream" in $$props) $$invalidate(1, dataStream = $$props.dataStream);
    		if ("showGraph" in $$props) $$invalidate(2, showGraph = $$props.showGraph);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [dataLatest, dataStream, showGraph];
    }

    class ValueBox extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {
    			dataLatest: 0,
    			dataStream: 1,
    			showGraph: 2
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ValueBox",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*dataLatest*/ ctx[0] === undefined && !("dataLatest" in props)) {
    			console.warn("<ValueBox> was created without expected prop 'dataLatest'");
    		}

    		if (/*dataStream*/ ctx[1] === undefined && !("dataStream" in props)) {
    			console.warn("<ValueBox> was created without expected prop 'dataStream'");
    		}
    	}

    	get dataLatest() {
    		throw new Error("<ValueBox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set dataLatest(value) {
    		throw new Error("<ValueBox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get dataStream() {
    		throw new Error("<ValueBox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set dataStream(value) {
    		throw new Error("<ValueBox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get showGraph() {
    		throw new Error("<ValueBox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set showGraph(value) {
    		throw new Error("<ValueBox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/WidgetUser.svelte generated by Svelte v3.29.4 */
    const file$3 = "src/WidgetUser.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	return child_ctx;
    }

    // (113:6) {#each dataLatestPayloadArray as dat}
    function create_each_block$2(ctx) {
    	let valuebox;
    	let current;

    	valuebox = new ValueBox({
    			props: {
    				dataLatest: /*dat*/ ctx[7],
    				dataStream: /*dataByKey*/ ctx[2][/*dat*/ ctx[7].key]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(valuebox.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(valuebox, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const valuebox_changes = {};
    			if (dirty & /*dataLatestPayloadArray*/ 2) valuebox_changes.dataLatest = /*dat*/ ctx[7];
    			if (dirty & /*dataByKey, dataLatestPayloadArray*/ 6) valuebox_changes.dataStream = /*dataByKey*/ ctx[2][/*dat*/ ctx[7].key];
    			valuebox.$set(valuebox_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(valuebox.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(valuebox.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(valuebox, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(113:6) {#each dataLatestPayloadArray as dat}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let div4;
    	let div3;
    	let div0;
    	let t0_value = /*data*/ ctx[0][0].toUpperCase() + "";
    	let t0;
    	let t1;
    	let div1;
    	let timeline;
    	let t2;
    	let div2;
    	let current;

    	timeline = new Timeline({
    			props: { data: /*data*/ ctx[0][1], height: 10 },
    			$$inline: true
    		});

    	let each_value = /*dataLatestPayloadArray*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			div3 = element("div");
    			div0 = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			div1 = element("div");
    			create_component(timeline.$$.fragment);
    			t2 = space();
    			div2 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div0, "id", "head");
    			attr_dev(div0, "class", "flex-item svelte-1w4vss9");
    			add_location(div0, file$3, 102, 4, 2725);
    			attr_dev(div1, "class", "timeline flex-item svelte-1w4vss9");
    			add_location(div1, file$3, 106, 4, 2807);
    			attr_dev(div2, "id", "body");
    			attr_dev(div2, "class", "flex-item svelte-1w4vss9");
    			add_location(div2, file$3, 110, 4, 2903);
    			attr_dev(div3, "class", "flex-container svelte-1w4vss9");
    			add_location(div3, file$3, 100, 2, 2691);
    			attr_dev(div4, "class", "widget-box svelte-1w4vss9");
    			add_location(div4, file$3, 99, 0, 2664);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div3);
    			append_dev(div3, div0);
    			append_dev(div0, t0);
    			append_dev(div3, t1);
    			append_dev(div3, div1);
    			mount_component(timeline, div1, null);
    			append_dev(div3, t2);
    			append_dev(div3, div2);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div2, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if ((!current || dirty & /*data*/ 1) && t0_value !== (t0_value = /*data*/ ctx[0][0].toUpperCase() + "")) set_data_dev(t0, t0_value);
    			const timeline_changes = {};
    			if (dirty & /*data*/ 1) timeline_changes.data = /*data*/ ctx[0][1];
    			timeline.$set(timeline_changes);

    			if (dirty & /*dataLatestPayloadArray, dataByKey*/ 6) {
    				each_value = /*dataLatestPayloadArray*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div2, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(timeline.$$.fragment, local);

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(timeline.$$.fragment, local);
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    			destroy_component(timeline);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function removeOldEntries(arr, millis) {
    	let now = Date.now();

    	if (arr[0]) {
    		while (arr[0].timestamp < now - millis) {
    			arr.shift();
    			if (!arr[0]) break;
    		}
    	}
    }

    function clean(str) {
    	let result = str.match(/[\d\w\.\-]+/);
    	if (result) return result[0];
    	return false;
    }

    function flattenObject(obj, prefix) {
    	if (!prefix) prefix = "";
    	let res = {};

    	for (let k in obj) {
    		switch (typeof obj[k]) {
    			case "object":
    				let tmp = flattenObject(obj[k], k + "_");
    				for (let kk in tmp) {
    					res[kk] = tmp[kk];
    				}
    				break;
    			default:
    				res[prefix + k] = obj[k];
    		}
    	}

    	return res;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("WidgetUser", slots, []);

    	let colorTable = {
    		red: "Red",
    		r: "Red",
    		green: "LimeGreen",
    		g: "LimeGreen",
    		blue: "DodgerBlue",
    		b: "DodgerBlue",
    		yellow: "#EEc700",
    		orange: "DarkOrange",
    		violet: "MediumOrchid",
    		palette: [
    			"MediumVioletRed",
    			"OliveDrab",
    			"DeepSkyBlue",
    			"Chocolate",
    			"SlateBlue",
    			"Tomato",
    			"LightSeaGreen"
    		]
    	};

    	let { data = [] } = $$props;
    	let { showGraphs = true } = $$props;
    	let dataLatest;
    	let dataLatestPayload;
    	let dataLatestPayloadArray = []; // try to split up the string in values or key-value-pairs
    	let dataByKey = {};
    	const writable_props = ["data", "showGraphs"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<WidgetUser> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("data" in $$props) $$invalidate(0, data = $$props.data);
    		if ("showGraphs" in $$props) $$invalidate(3, showGraphs = $$props.showGraphs);
    	};

    	$$self.$capture_state = () => ({
    		Timeline,
    		ValueBox,
    		colorTable,
    		data,
    		showGraphs,
    		dataLatest,
    		dataLatestPayload,
    		dataLatestPayloadArray,
    		dataByKey,
    		removeOldEntries,
    		clean,
    		flattenObject
    	});

    	$$self.$inject_state = $$props => {
    		if ("colorTable" in $$props) $$invalidate(6, colorTable = $$props.colorTable);
    		if ("data" in $$props) $$invalidate(0, data = $$props.data);
    		if ("showGraphs" in $$props) $$invalidate(3, showGraphs = $$props.showGraphs);
    		if ("dataLatest" in $$props) $$invalidate(4, dataLatest = $$props.dataLatest);
    		if ("dataLatestPayload" in $$props) $$invalidate(5, dataLatestPayload = $$props.dataLatestPayload);
    		if ("dataLatestPayloadArray" in $$props) $$invalidate(1, dataLatestPayloadArray = $$props.dataLatestPayloadArray);
    		if ("dataByKey" in $$props) $$invalidate(2, dataByKey = $$props.dataByKey);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*data, dataLatest, dataLatestPayload, dataLatestPayloadArray, dataByKey*/ 55) {
    			 {
    				$$invalidate(4, dataLatest = data[1][data[1].length - 1]);

    				//console.log(dataLatest);
    				$$invalidate(5, dataLatestPayload = dataLatest.origPayload);

    				try {
    					$$invalidate(5, dataLatestPayload = JSON.parse(dataLatest.origPayload));
    					$$invalidate(5, dataLatestPayload = flattenObject(dataLatestPayload));
    				} catch(error) {
    					
    				}

    				$$invalidate(1, dataLatestPayloadArray = JSON.stringify(dataLatestPayload).split(","));
    				let paletteIndex = 0;

    				for (let i = 0; i < dataLatestPayloadArray.length; i++) {
    					let dat = dataLatestPayloadArray[i];
    					dat = dat.split(":");
    					let key, value;

    					if (dat.length == 2) {
    						key = clean(dat[0]);
    						value = clean(dat[1]);
    					} else {
    						key = "value_" + i;
    						value = clean(dat[0]);
    					}

    					let color = colorTable[key.toLowerCase()]
    					? colorTable[key.toLowerCase()]
    					: colorTable.palette[paletteIndex++ % colorTable.palette.length];

    					$$invalidate(1, dataLatestPayloadArray[i] = { key, value, color }, dataLatestPayloadArray);
    					if (!dataByKey[key]) $$invalidate(2, dataByKey[key] = [], dataByKey);

    					dataByKey[key].push({
    						timestamp: dataLatest.timestamp,
    						value,
    						color
    					});

    					removeOldEntries(dataByKey[key], 5000);
    				}
    			} // console.log(dataByKey);
    		}
    	};

    	return [data, dataLatestPayloadArray, dataByKey, showGraphs];
    }

    class WidgetUser extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { data: 0, showGraphs: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "WidgetUser",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get data() {
    		throw new Error("<WidgetUser>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<WidgetUser>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get showGraphs() {
    		throw new Error("<WidgetUser>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set showGraphs(value) {
    		throw new Error("<WidgetUser>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.29.4 */

    const { Object: Object_1 } = globals;
    const file$4 = "src/App.svelte";

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	return child_ctx;
    }

    // (45:2) {#each userdataArray as userdata (userdata[0])}
    function create_each_block$3(key_1, ctx) {
    	let first;
    	let widgetuser;
    	let current;

    	widgetuser = new WidgetUser({
    			props: {
    				data: /*userdata*/ ctx[4],
    				showGraphs: /*showGraphs*/ ctx[0]
    			},
    			$$inline: true
    		});

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			first = empty();
    			create_component(widgetuser.$$.fragment);
    			this.first = first;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, first, anchor);
    			mount_component(widgetuser, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const widgetuser_changes = {};
    			if (dirty & /*userdataArray*/ 2) widgetuser_changes.data = /*userdata*/ ctx[4];
    			if (dirty & /*showGraphs*/ 1) widgetuser_changes.showGraphs = /*showGraphs*/ ctx[0];
    			widgetuser.$set(widgetuser_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(widgetuser.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(widgetuser.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(first);
    			destroy_component(widgetuser, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$3.name,
    		type: "each",
    		source: "(45:2) {#each userdataArray as userdata (userdata[0])}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let div1;
    	let div0;
    	let h2;
    	let t1;
    	let div2;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let current;
    	let each_value = /*userdataArray*/ ctx[1];
    	validate_each_argument(each_value);
    	const get_key = ctx => /*userdata*/ ctx[4][0];
    	validate_each_keys(ctx, each_value, get_each_context$3, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context$3(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block$3(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			h2 = element("h2");
    			h2.textContent = "Laborwoche Dashboard";
    			t1 = space();
    			div2 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(h2, file$4, 25, 4, 517);
    			set_style(div0, "flex-grow", "1");
    			add_location(div0, file$4, 24, 2, 486);
    			attr_dev(div1, "id", "head");
    			attr_dev(div1, "class", "svelte-as6vko");
    			add_location(div1, file$4, 22, 0, 467);
    			attr_dev(div2, "id", "user-widgets");
    			add_location(div2, file$4, 40, 0, 736);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, h2);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div2, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div2, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*userdataArray, showGraphs*/ 3) {
    				const each_value = /*userdataArray*/ ctx[1];
    				validate_each_argument(each_value);
    				group_outros();
    				validate_each_keys(ctx, each_value, get_each_context$3, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, div2, outro_and_destroy_block, create_each_block$3, null, get_each_context$3);
    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div2);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let $dataByUser;
    	validate_store(dataByUser, "dataByUser");
    	component_subscribe($$self, dataByUser, $$value => $$invalidate(2, $dataByUser = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	let showGraphs = true;

    	function toggleShowGraphs() {
    		$$invalidate(0, showGraphs = !showGraphs);
    	}

    	const writable_props = [];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		appActive,
    		dataLatest,
    		dataByTime,
    		dataByUser,
    		WidgetUser,
    		showGraphs,
    		toggleShowGraphs,
    		userdataArray,
    		$dataByUser
    	});

    	$$self.$inject_state = $$props => {
    		if ("showGraphs" in $$props) $$invalidate(0, showGraphs = $$props.showGraphs);
    		if ("userdataArray" in $$props) $$invalidate(1, userdataArray = $$props.userdataArray);
    	};

    	let userdataArray;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$dataByUser*/ 4) {
    			 $$invalidate(1, userdataArray = Object.entries($dataByUser));
    		}
    	};

    	return [showGraphs, userdataArray];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    var app = new App({
    	target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
