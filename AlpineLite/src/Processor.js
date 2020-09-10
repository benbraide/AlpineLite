"use strict";
exports.__esModule = true;
exports.AlpineLite = void 0;
var StateScope = require("./State");
var HandlerScope = require("./Handler");
var AlpineLite;
(function (AlpineLite) {
    var Processor = /** @class */ (function () {
        function Processor(state, handler) {
            this.state_ = null;
            this.handler_ = null;
            this.state_ = state;
            this.handler_ = handler;
        }
        Processor.prototype.All = function (node, options) {
            var _this = this;
            if (!Processor.Check(node, options)) { //Check failed -- ignore
                return;
            }
            var isTemplate = (node.nodeType == 1 && node.tagName == 'TEMPLATE');
            if (!isTemplate && (options === null || options === void 0 ? void 0 : options.checkTemplate) && Processor.GetHTMLElement(node).closest('template')) { //Inside template -- ignore
                return;
            }
            this.One(node);
            if (isTemplate || node.nodeType == 3) { //Don't process template content OR node is text node (no content)
                return;
            }
            node.childNodes.forEach(function (node) {
                _this.All(node);
            });
        };
        Processor.prototype.One = function (node, options) {
            var _this = this;
            if (!Processor.Check(node, options)) { //Check failed -- ignore
                return;
            }
            var isTemplate = (node.nodeType == 1 && node.tagName == 'TEMPLATE');
            if (!isTemplate && (options === null || options === void 0 ? void 0 : options.checkTemplate) && Processor.GetHTMLElement(node).closest('template')) { //Inside template -- ignore
                return;
            }
            if (node.nodeType == 3) { //Text node
                return;
            }
            var elementNode = node;
            Processor.TraverseDirectives(elementNode, function (directive) {
                return _this.DispatchDirective(directive, elementNode);
            }, function (attribute) {
                return true;
            });
        };
        Processor.prototype.DispatchDirective = function (directive, element) {
            var result = this.handler_.HandleDirective(directive, element, this.state_);
            if (result == HandlerScope.AlpineLite.HandlerReturn.Nil) { //Not handled
                if (1 < directive.parts.length && directive.parts[0] === 'static') {
                    this.state_.PushFlag(StateScope.AlpineLite.StateFlag.StaticBind, true);
                    try {
                        var newDirective = {
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
                        this.state_.ReportError(err, "AlpineLite.Processor.DispatchDirective._Handle_." + directive.key);
                    }
                    this.state_.PopFlag(StateScope.AlpineLite.StateFlag.StaticBind);
                }
                else {
                    this.state_.ReportWarning("'" + directive.original + "': Handler not found. Skipping...", "AlpineLite.Processor.DispatchDirective._Handle_." + directive.key);
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
        };
        Processor.Check = function (node, options) {
            if (node.nodeType != 1 && node.nodeType != 3) { //Node is not an element or a text node
                return false;
            }
            if ((options === null || options === void 0 ? void 0 : options.checkDocument) && !document.contains(node)) { //Node is not contained inside the document
                return false;
            }
            return true;
        };
        Processor.GetHTMLElement = function (node) {
            return ((node.nodeType == 1) ? node : node.parentElement);
        };
        Processor.TraverseDirectives = function (element, callback, noMatchCallback) {
            var attributes = new Array();
            for (var i = 0; i < element.attributes.length; ++i) { //Duplicate attributes
                attributes.push(element.attributes[i]);
            }
            for (var i = 0; i < attributes.length; ++i) { //Traverse attributes
                var directive = Processor.GetDirective(attributes[i]);
                if (!directive && noMatchCallback && !noMatchCallback(attributes[i])) {
                    return;
                }
                if (directive && !callback(directive)) {
                    return;
                }
            }
        };
        Processor.GetDirective = function (attribute) {
            var matches = attribute.name.match(/^(data-)?x-(.+)$/);
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
        };
        Processor.GetCamelCaseDirectiveName = function (name) {
            return name.replace(/-([^-])/g, function ($0, $1) {
                return ($1.charAt(0).toUpperCase() + $1.slice(1));
            });
        };
        Processor.GetElementId = function (element, state) {
            return state.GetElementId(element);
        };
        Processor.GetIdKey = function () {
            return StateScope.AlpineLite.State.GetIdKey();
        };
        return Processor;
    }());
    AlpineLite.Processor = Processor;
})(AlpineLite = exports.AlpineLite || (exports.AlpineLite = {}));
