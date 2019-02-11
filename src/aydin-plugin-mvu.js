const signals = require("./signals");
const DOMDRIVER_MISSING_HANDLER = signals.DOMDRIVER_MISSING_HANDLER;

const LENS_EXPANDO = "__aydin_plugin_mvu_lens";

const FIRST = 0;
const NONE = 0;

function identity(it) {
    return it;
}

function baseExpand(tmpl, props, children) {
    return tmpl.call(null, props, children);
}

function plugin(update) {
    const init = update();
    // eslint-disable-next-line immutable/no-let
    let model = init[FIRST];

    function dispatch(msgs) {
        // eslint-disable-next-line immutable/no-let
        let newModel = model;

        msgs.forEach(function (msg) {
            const result = update(newModel, msg);
            newModel = result[FIRST];
        });

        const hasChanges = msgs.length > NONE && newModel !== model;
        model = newModel;
        return hasChanges;
    }

    function driver(next) {

        function mvu(signal) {

            function intercept(evt) {
                if (evt && evt.topic === DOMDRIVER_MISSING_HANDLER) {
                    const msgs = [evt.data.value];
                    if (dispatch(msgs)) {
                        signal(evt);
                        return;
                    }
                    return;
                }

                signal(evt);
            }

            const decoratee = next(intercept);

            function expand(tmpl, props, children) {
                if (tmpl[LENS_EXPANDO]) {
                    return tmpl.call(null, tmpl[LENS_EXPANDO](model), children);
                }
                return (decoratee.expand || baseExpand)(tmpl, props, children);
            }

            function visit(tag, props, nodeType, path) {
                return decoratee.visit(tag, props, nodeType, path);
            }

            return {
                expand: expand,
                isSpecialTag: decoratee.isSpecialTag,
                reduce: decoratee.reduce,
                visit: visit,
            };

        }

        // eslint-disable-next-line immutable/no-mutation
        mvu.dispatch = dispatch;
        return mvu;
    }

    return driver;
}

function lens(get) {
    return function connect(tmpl) {

        function connected() {
            return tmpl.apply(null, arguments);
        }

        /* eslint-disable immutable/no-mutation */
        connected[LENS_EXPANDO] = get || identity;
        /* eslint-enable immutable/no-mutation */

        return connected;
    };
}
// eslint-disable-next-line immutable/no-mutation
plugin.lens = lens;

/* eslint-disable immutable/no-mutation */
plugin.version = "0.1.0";
module.exports = plugin;
/* eslint-enable immutable/no-mutation */
