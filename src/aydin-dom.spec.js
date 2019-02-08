const Aydin = require("./aydin");
const AydinDom = require("./aydin-dom");

const { html, makeRoot, tracable } = require("./testUtils");

const ELEMENT_NODE = 1;
const TEXT_NODE = 3;

describe("aydin-dom", () => {
    const { configureRenderer } = Aydin;
    const driver = AydinDom;
    const baseRender = configureRenderer();
    const render = (root, it) => baseRender(driver, it, root);
    const traceRender = (root, log, it) => {
        return baseRender(tracable(driver, log), it, root);
    };

    describe("the 'aydin-dom' driver", () => {

        it("should be a function with arity 2", () => {
            expect(typeof driver).toBe("function");
            expect(driver).toHaveLength(1);
        });

    });

    describe("simple examples", () => {

        it("should check that the given 'root' has an 'ownerDocument' property", () => {
            expect(() => render(null, [])).toThrow();
            expect(() => render({}, [])).toThrow();
            expect(() => render({ ownerDocument: {} }, [])).toThrow();
            expect(() => render({ ownerDocument: { createElement: 1 } }, ["div"]))
                .toThrow(TypeError);
            expect(() => render({ ownerDocument: { createElement: jest.fn() } }, []))
                .toThrow();
        });

        it("should check that the given 'expr' is valid", () => {
            expect(() => render(
                { ownerDocument: { createElement: jest.fn() } }
            )).toThrow();
            expect(() => render(
                { ownerDocument: { createElement: jest.fn() } },
                {}
            )).toThrow();
            expect(() => render(
                { ownerDocument: { createElement: jest.fn() } },
                () => {}
            )).toThrow();
        });

        it("should use 'ownerDocument' of the 'root'", () => {
            const minimalRoot = {
                appendChild: jest.fn(),
                ownerDocument: {
                    createElement: jest.fn(() => ({
                        appendChild: jest.fn(),
                    })),
                    createTextNode: jest.fn(),
                },
            };

            render(minimalRoot, ["div", "Hello, World!"]);

            expect(minimalRoot.ownerDocument.createElement).toHaveBeenCalled();
        });

    });

    describe("render using a minimal DOM document mock", () => {

        describe("simple examples rendering into an empty node", () => {

            it("should support rendering a plain string", () => {
                const root = makeRoot();

                render(root, "Simple String");

                expect(root.innerHTML).toBe(html([
                    "Simple String",
                ]));
            });

            it("should append a simple <div> into the given 'root'", () => {
                const root = makeRoot();
                render(root, ["div", "Hello, World!"]);
                expect(root.innerHTML).toBe(html([
                    "<div>",
                    "  Hello, World!",
                    "</div>",
                ]));
            });

            it("should append a simple <span> into the given 'root'", () => {
                const root = makeRoot();
                render(root, ["span", "Simple"]);
                expect(root.innerHTML).toBe(html([
                    "<span>",
                    "  Simple",
                    "</span>",
                ]));
            });

            it("should append a another <b> into the given 'root'", () => {
                const root = makeRoot();
                render(root, ["b", "Bold"]);
                expect(root.innerHTML).toBe(html([
                    "<b>",
                    "  Bold",
                    "</b>",
                ]));
            });

        });

        describe("rendering flat expressions", () => {

            it("should be able to render shallow trees of expressions", () => {
                const root = makeRoot();
                const log = [];

                traceRender(root, log,
                    ["div", "One", "Two", ["b", "Bold!"], "Four", "Five"]
                );

                expect(log).toEqual([
                    "0000: [0] ELEMENT_NODE(1) <div>",
                    "0001: [0,0] TEXT_NODE(3) 'One'",
                    "0002: [0,1] TEXT_NODE(3) 'Two'",
                    "0003: [0,2] ELEMENT_NODE(1) <b>",
                    "0004: [0,2,0] TEXT_NODE(3) 'Bold!'",
                    "0005: [0,3] TEXT_NODE(3) 'Four'",
                    "0006: [0,4] TEXT_NODE(3) 'Five'",
                ]);

                expect(root.innerHTML).toBe(html([
                    "<div>",
                    "  One",
                    "  Two",
                    "  <b>Bold!</b>",
                    "  Four",
                    "  Five",
                    "</div>",
                ]));
            });

        });

    });

});

