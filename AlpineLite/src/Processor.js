import * as StateScope from './State.js';
import * as HandlerScope from './Handler.js';
export var AlpineLite;
(function (AlpineLite) {
    class Processor {
        constructor(state, handler) {
            this.state_ = null;
            this.handler_ = null;
            this.state_ = state;
            this.handler_ = handler;
        }
        All(node, options) {
            if (!Processor.Check(node, options)) { //Check failed -- ignore
                return;
            }
            let isTemplate = (node.nodeType == 1 && node.tagName == 'TEMPLATE');
            if (!isTemplate && (options === null || options === void 0 ? void 0 : options.checkTemplate) && Processor.GetHTMLElement(node).closest('template')) { //Inside template -- ignore
                return;
            }
            this.One(node);
            if (isTemplate || node.nodeType == 3) { //Don't process template content OR node is text node (no content)
                return;
            }
            node.childNodes.forEach((node) => {
                this.All(node);
            });
        }
        One(node, options) {
            if (!Processor.Check(node, options)) { //Check failed -- ignore
                return;
            }
            let isTemplate = (node.nodeType == 1 && node.tagName == 'TEMPLATE');
            if (!isTemplate && (options === null || options === void 0 ? void 0 : options.checkTemplate) && Processor.GetHTMLElement(node).closest('template')) { //Inside template -- ignore
                return;
            }
            if (node.nodeType == 3) { //Text node
                return;
            }
            let elementNode = node;
            Processor.TraverseDirectives(elementNode, (directive) => {
                return this.DispatchDirective(directive, elementNode);
            }, (attribute) => {
                return true;
            });
        }
        DispatchDirective(directive, element) {
            let result;
            try {
                this.state_.PushElementContext(element);
                result = this.handler_.HandleDirective(directive, element, this.state_);
                this.state_.PopElementContext();
            }
            catch (err) {
                this.state_.PopElementContext();
                this.state_.ReportError(err, `AlpineLite.Processor.DispatchDirective._Handle_.${directive.key}`);
                return true;
            }
            if (result == HandlerScope.AlpineLite.HandlerReturn.Nil) { //Not handled
                if (1 < directive.parts.length && directive.parts[0] === 'static') {
                    this.state_.PushFlag(StateScope.AlpineLite.StateFlag.StaticBind, true);
                    try {
                        let newDirective = {
                            original: directive.original,
                            parts: directive.parts.splice(1),
                            raw: '',
                            key: '',
                            value: directive.value
                        };
                        newDirective.raw = newDirective.parts.join('-');
                        newDirective.key = Processor.GetCamelCaseDirectiveName(newDirective.raw);
                        if (this.DispatchDirective(newDirective, element)) {
                            result = HandlerScope.AlpineLite.HandlerReturn.Handled;
                        }
                        else {
                            result = HandlerScope.AlpineLite.HandlerReturn.Rejected;
                        }
                    }
                    catch (err) {
                        this.state_.ReportError(err, `AlpineLite.Processor.DispatchDirective._Handle_.${directive.key}`);
                    }
                    this.state_.PopFlag(StateScope.AlpineLite.StateFlag.StaticBind);
                }
                else {
                    this.state_.ReportWarning(`'${directive.original}': Handler not found. Skipping...`, `AlpineLite.Processor.DispatchDirective._Handle_.${directive.key}`);
                }
            }
            if (result == HandlerScope.AlpineLite.HandlerReturn.Rejected) {
                return false;
            }
            element.removeAttribute(directive.original);
            if (result == HandlerScope.AlpineLite.HandlerReturn.Handled) {
                Processor.GetElementId(element, this.state_);
            }
            return true;
        }
        static Check(node, options) {
            if (node.nodeType != 1 && node.nodeType != 3) { //Node is not an element or a text node
                return false;
            }
            if ((options === null || options === void 0 ? void 0 : options.checkDocument) && !document.contains(node)) { //Node is not contained inside the document
                return false;
            }
            return true;
        }
        static GetHTMLElement(node) {
            return ((node.nodeType == 1) ? node : node.parentElement);
        }
        static TraverseDirectives(element, callback, noMatchCallback) {
            let attributes = new Array();
            for (let i = 0; i < element.attributes.length; ++i) { //Duplicate attributes
                attributes.push(element.attributes[i]);
            }
            for (let i = 0; i < attributes.length; ++i) { //Traverse attributes
                let directive = Processor.GetDirective(attributes[i]);
                if (!directive && noMatchCallback && !noMatchCallback(attributes[i])) {
                    return;
                }
                if (directive && !callback(directive)) {
                    return;
                }
            }
        }
        static GetDirective(attribute) {
            let matches = attribute.name.match(/^(data-)?x-(.+)$/);
            if (!matches || matches.length != 3 || !matches[2]) { //Not a directive
                return null;
            }
            return {
                original: attribute.name,
                parts: matches[2].split('-'),
                raw: matches[2],
                key: Processor.GetCamelCaseDirectiveName(matches[2]),
                value: attribute.value
            };
        }
        static GetCamelCaseDirectiveName(name) {
            return name.replace(/-([^-])/g, ($0, $1) => {
                return ($1.charAt(0).toUpperCase() + $1.slice(1));
            });
        }
        static GetElementId(element, state) {
            return state.GetElementId(element);
        }
        static GetIdKey() {
            return StateScope.AlpineLite.State.GetIdKey();
        }
    }
    AlpineLite.Processor = Processor;
})(AlpineLite || (AlpineLite = {}));
