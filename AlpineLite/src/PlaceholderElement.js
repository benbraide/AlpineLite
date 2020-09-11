export var AlpineLite;
(function (AlpineLite) {
    class PlaceholderElement extends HTMLElement {
        static Register() {
            customElements.define('x-placeholder', PlaceholderElement);
        }
    }
    AlpineLite.PlaceholderElement = PlaceholderElement;
})(AlpineLite || (AlpineLite = {}));
