namespace AlpineLite{
    export class Overlay extends HTMLElement{
        constructor(){
            super();

            let shadowRoot = this.attachShadow({
                mode: 'open'
            });

            let tmpl = document.createElement('template');
            let prefix: string = this.getAttribute('prfix');

            if (prefix){
                prefix += '_';
            }
            
            tmpl.innerHTML = `
                <style>
                    :host {
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 0;
                        height: 100vh;
                        background-color: #000000;
                        z-index; 1000;
                        transition: opacity 0.25s ease;
                    }
                </style>
                <template data-id="${prefix}alpine_overlay" x-data="__AlpineOverlayStorage__[${prefix}alpine_overlay]"></template>
            `;

            let overlayStorage = (window['__AlpineOverlayStorage__'] = (window['__AlpineOverlayStorage__'] || {}));
            overlayStorage[`${prefix}alpine_overlay`] = {
                open_: false,
                open(){
                    this.open_ = true;
                    document.body.classList.add('overlay');
                },
                close(){
                    document.body.classList.remove('overlay');
                    this.open_ = false;
                },
            };

            shadowRoot.appendChild(tmpl.content.cloneNode(true));
        }
        
        public static Register(prefix: string = 'x'): void{
            customElements.define(`${prefix}-overlay`, Overlay);
        }
    }
}
