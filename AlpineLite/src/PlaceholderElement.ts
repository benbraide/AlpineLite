export namespace AlpineLite{
    export class PlaceholderElement extends HTMLElement{
        public static Register(): void{
            customElements.define('x-placeholder', PlaceholderElement);
        }
    }
}
